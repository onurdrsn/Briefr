import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { router, protectedProcedure } from './trpc'
import { workspaces, workspaceMembers, users } from '@briefr/db'
import { InviteMemberSchema } from '@briefr/types'
import { sendInviteEmail } from '../services/resend'

export const workspaceRouter = router({
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [ws] = await ctx.db.select().from(workspaces).where(eq(workspaces.id, input.id)).limit(1)
      if (!ws) throw new Error('Çalışma alanı bulunamadı')
      await assertMember(ctx, input.id)
      return ws
    }),

  getOAuthKeys: protectedProcedure.query(({ ctx }) => {
    return {
      slackClientId: ctx.env.SLACK_CLIENT_ID || '10721985566021.11657543855522',
      gmailClientId: ctx.env.GMAIL_CLIENT_ID || '200357330982-doqb41pgv495671df5jivermcigtbspq.apps.googleusercontent.com',
      notionClientId: ctx.env.NOTION_CLIENT_ID || 'sample_notion_client_id',
    }
  }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(2).optional(),
      logoUrl: z.string().url().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await assertMember(ctx, input.id, ['owner', 'admin'])
      const [updated] = await ctx.db.update(workspaces)
        .set({
          ...(input.name ? { name: input.name } : {}),
          ...(input.logoUrl ? { logoUrl: input.logoUrl } : {}),
          updatedAt: new Date(),
        })
        .where(eq(workspaces.id, input.id))
        .returning()
      return updated
    }),

  listMembers: protectedProcedure
    .input(z.object({ workspaceId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await assertMember(ctx, input.workspaceId)
      return ctx.db.select({
        id: workspaceMembers.id,
        role: workspaceMembers.role,
        acceptedAt: workspaceMembers.acceptedAt,
        user: {
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, input.workspaceId))
    }),

  inviteMember: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      data: InviteMemberSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      await assertMember(ctx, input.workspaceId, ['owner', 'admin'])
      const [ws] = await ctx.db.select().from(workspaces).where(eq(workspaces.id, input.workspaceId)).limit(1)
      if (!ws) throw new Error('Çalışma alanı bulunamadı')

      const [invitedUser] = await ctx.db.select().from(users).where(eq(users.email, input.data.email)).limit(1)
      if (invitedUser) {
        const [existingMember] = await ctx.db.select().from(workspaceMembers)
          .where(and(eq(workspaceMembers.workspaceId, input.workspaceId), eq(workspaceMembers.userId, invitedUser.id)))
          .limit(1)
        if (existingMember) throw new Error('Kullanıcı zaten bu çalışma alanında üye')

        await ctx.db.insert(workspaceMembers).values({
          workspaceId: input.workspaceId,
          userId: invitedUser.id,
          role: input.data.role,
          invitedBy: ctx.user.id,
          acceptedAt: new Date(),
        })
      }

      if (ctx.env.RESEND_API_KEY) {
        try {
          await sendInviteEmail(ctx.env.RESEND_API_KEY, input.data.email, ws.name, ctx.user.fullName, ctx.env.FRONTEND_URL)
        } catch { /* optional */ }
      }

      return { ok: true }
    }),

  removeMember: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      memberId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      await assertMember(ctx, input.workspaceId, ['owner', 'admin'])
      await ctx.db.delete(workspaceMembers).where(eq(workspaceMembers.id, input.memberId))
      return { ok: true }
    }),
})

async function assertMember(ctx: any, workspaceId: string, allowedRoles = ['owner', 'admin', 'member', 'viewer']) {
  const [member] = await ctx.db.select().from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, ctx.user.id)))
    .limit(1)
  if (!member || !allowedRoles.includes(member.role)) {
    throw new Error('Yetkisiz erişim')
  }
  return member
}
