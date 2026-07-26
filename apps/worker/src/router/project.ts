import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { router, protectedProcedure } from './trpc'
import { projects, workspaceMembers, sources, chunks } from '@briefr/db'
import { CreateProjectSchema, UpdateProjectSchema } from '@briefr/types'

export const projectRouter = router({
  list: protectedProcedure
    .input(z.object({ workspaceId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await assertWorkspaceMember(ctx, input.workspaceId)
      return ctx.db.select().from(projects)
        .where(and(eq(projects.workspaceId, input.workspaceId), eq(projects.archived, false)))
        .orderBy(desc(projects.lastActivityAt))
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [project] = await ctx.db.select().from(projects)
        .where(eq(projects.id, input.id)).limit(1)
      if (!project) throw new Error('Proje bulunamadı')
      await assertWorkspaceMember(ctx, project.workspaceId)
      return project
    }),

  create: protectedProcedure
    .input(CreateProjectSchema)
    .mutation(async ({ input, ctx }) => {
      await assertWorkspaceMember(ctx, input.workspaceId, ['owner', 'admin', 'member'])
      const namespace = `prj_${input.workspaceId.replace(/-/g, '')}_${Date.now()}`
      const [project] = await ctx.db.insert(projects).values({
        workspaceId: input.workspaceId,
        createdBy: ctx.user.id,
        name: input.name,
        description: input.description,
        clientName: input.clientName,
        emoji: input.emoji ?? '📁',
        language: input.language ?? 'auto',
        vectorNamespace: namespace,
      }).returning()
      return project
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), data: UpdateProjectSchema }))
    .mutation(async ({ input, ctx }) => {
      const [project] = await ctx.db.select().from(projects)
        .where(eq(projects.id, input.id)).limit(1)
      if (!project) throw new Error('Proje bulunamadı')
      await assertWorkspaceMember(ctx, project.workspaceId, ['owner', 'admin', 'member'])
      const [updated] = await ctx.db.update(projects)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(projects.id, input.id)).returning()
      return updated
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const [project] = await ctx.db.select().from(projects)
        .where(eq(projects.id, input.id)).limit(1)
      if (!project) throw new Error('Proje bulunamadı')
      await assertWorkspaceMember(ctx, project.workspaceId, ['owner', 'admin'])
      await ctx.db.update(projects).set({ archived: true }).where(eq(projects.id, input.id))
      return { ok: true }
    }),

  purgeMemory: protectedProcedure
    .input(z.object({ id: z.string().uuid(), confirmName: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [project] = await ctx.db.select().from(projects)
        .where(eq(projects.id, input.id)).limit(1)
      if (!project) throw new Error('Proje bulunamadı')
      if (input.confirmName !== project.name) throw new Error('Proje adı doğrulaması başarısız')
      await assertWorkspaceMember(ctx, project.workspaceId, ['owner'])

      const projectChunks = await ctx.db.select({ id: chunks.id }).from(chunks)
        .where(eq(chunks.projectId, input.id))
      if (projectChunks.length > 0) {
        const ids = projectChunks.map(c => c.id)
        for (let i = 0; i < ids.length; i += 1000) {
          await ctx.env.BRIEFR_VECTORIZE.deleteByIds(ids.slice(i, i + 1000))
        }
      }

      await ctx.db.delete(chunks).where(eq(chunks.projectId, input.id))
      await ctx.db.delete(sources).where(eq(sources.projectId, input.id))
      await ctx.db.update(projects)
        .set({ chunkCount: 0, sourceCount: 0, updatedAt: new Date() })
        .where(eq(projects.id, input.id))

      return { ok: true, chunksDeleted: projectChunks.length }
    }),
})

async function assertWorkspaceMember(
  ctx: any,
  workspaceId: string,
  allowedRoles: string[] = ['owner', 'admin', 'member', 'viewer']
) {
  const [member] = await ctx.db.select().from(workspaceMembers)
    .where(and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, ctx.user.id),
    )).limit(1)
  if (!member || !allowedRoles.includes(member.role)) throw new Error('Erişim reddedildi')
  return member
}
