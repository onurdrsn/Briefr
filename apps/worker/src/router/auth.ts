import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { router, publicProcedure, protectedProcedure } from './trpc'
import { users, sessions, workspaces, workspaceMembers } from '@briefr/db'
import { RegisterSchema, LoginSchema } from '@briefr/types'
import { sendVerificationCodeEmail, sendWelcomeEmail } from '../services/resend'
import { nanoid } from 'nanoid'

// PBKDF2 hashing (Cloudflare Workers compatible — bcrypt forbidden)
export async function hashPassword(pw: string): Promise<string> {
  const enc = new TextEncoder()
  const km = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits'])
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, km, 256)
  return `${Array.from(salt).join(',')};${Array.from(new Uint8Array(bits)).join(',')}`
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [sp, hp] = stored.split(';')
  if (!sp || !hp) return false
  const salt = new Uint8Array(sp.split(',').map(Number))
  const expected = hp.split(',').map(Number)
  const enc = new TextEncoder()
  const km = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, km, 256)
  return Array.from(new Uint8Array(bits)).every((b, i) => b === expected[i])
}

function generateSlug(name: string): string {
  return name.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + nanoid(4)
}

export const authRouter = router({
  register: publicProcedure.input(RegisterSchema).mutation(async ({ input, ctx }) => {
    const [existing] = await ctx.db.select().from(users).where(eq(users.email, input.email)).limit(1)
    if (existing) throw new Error('Bu e-posta zaten kayıtlı')

    const passwordHash = await hashPassword(input.password)
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString()

    const [user] = await ctx.db.insert(users).values({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      emailVerified: false,
      emailVerifyToken: verifyCode,
      kvkkConsentAt: new Date(),
    }).returning()

    const slug = generateSlug(input.workspaceName)
    const [workspace] = await ctx.db.insert(workspaces).values({
      name: input.workspaceName,
      slug,
      ownerId: user.id,
    }).returning()

    await ctx.db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: user.id,
      role: 'owner',
      acceptedAt: new Date(),
    })

    if (ctx.env.RESEND_API_KEY) {
      try {
        await sendVerificationCodeEmail(ctx.env.RESEND_API_KEY, input.email, verifyCode)
      } catch { /* optional email sending */ }
    }

    const token = nanoid(48)
    await ctx.db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        emailVerified: false,
      },
      workspace,
    }
  }),

  login: publicProcedure.input(LoginSchema).mutation(async ({ input, ctx }) => {
    const [user] = await ctx.db.select().from(users).where(eq(users.email, input.email)).limit(1)
    if (!user) throw new Error('Geçersiz e-posta veya şifre')
    if (!(await verifyPassword(input.password, user.passwordHash))) throw new Error('Geçersiz e-posta veya şifre')

    const token = nanoid(48)
    await ctx.db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    const [wsMember] = await ctx.db.select({ workspace: workspaces })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, user.id))
      .limit(1)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl ?? undefined,
        emailVerified: user.emailVerified,
      },
      workspace: wsMember?.workspace ?? null,
    }
  }),

  verifyEmail: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ input, ctx }) => {
      const [user] = await ctx.db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1)
      if (!user) throw new Error('Kullanıcı bulunamadı')
      if (user.emailVerified) return { ok: true, emailVerified: true }

      const tokenInDb = user.emailVerifyToken ? String(user.emailVerifyToken).trim() : ''
      if (tokenInDb !== input.code.trim()) {
        throw new Error('Geçersiz doğrulama kodu. Lütfen e-postanıza gelen 6 haneli kodu kontrol edip tekrar deneyin.')
      }

      await ctx.db.update(users).set({
        emailVerified: true,
        emailVerifyToken: null,
      }).where(eq(users.id, ctx.user.id))

      if (ctx.env.RESEND_API_KEY) {
        try {
          await sendWelcomeEmail(ctx.env.RESEND_API_KEY, user.email, user.fullName, ctx.env.FRONTEND_URL)
        } catch { /* optional */ }
      }

      return { ok: true, emailVerified: true }
    }),

  resendVerificationCode: protectedProcedure.mutation(async ({ ctx }) => {
    const [user] = await ctx.db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1)
    if (!user) throw new Error('Kullanıcı bulunamadı')
    if (user.emailVerified) return { ok: true, alreadyVerified: true }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString()
    await ctx.db.update(users).set({ emailVerifyToken: newCode }).where(eq(users.id, ctx.user.id))

    if (ctx.env.RESEND_API_KEY) {
      try {
        await sendVerificationCodeEmail(ctx.env.RESEND_API_KEY, user.email, newCode)
      } catch (err: any) {
        console.error('Failed to resend verification email:', err)
        throw new Error(err?.message || 'E-posta gönderimi başarısız oldu. Lütfen Resend API anahtarınızı kontrol edin.')
      }
    } else {
      throw new Error('E-posta servisi yapılandırılmamış (RESEND_API_KEY eksik).')
    }

    return { ok: true }
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const authHeader = ctx.req.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      await ctx.db.delete(sessions).where(eq(sessions.token, token))
    }
    return { ok: true }
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const [wsMember] = await ctx.db.select({ workspace: workspaces })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, ctx.user.id))
      .limit(1)

    return {
      id: ctx.user.id,
      email: ctx.user.email,
      fullName: ctx.user.fullName,
      avatarUrl: ctx.user.avatarUrl ?? undefined,
      emailVerified: ctx.user.emailVerified,
      workspace: wsMember?.workspace ?? null,
    }
  }),

  deleteAccount: protectedProcedure
    .input(z.object({ confirmPassword: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!(await verifyPassword(input.confirmPassword, ctx.user.passwordHash)))
        throw new Error('Şifre doğrulaması başarısız')
      await ctx.db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, ctx.user.id))
      return { ok: true }
    }),
})
