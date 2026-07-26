import { z } from 'zod'
import { eq, desc, sql } from 'drizzle-orm'
import { router, protectedProcedure } from './trpc'
import { sources, projects, ingestionJobs, workspaces } from '@briefr/db'
import { CreateSourceSchema } from '@briefr/types'
import { encryptField } from '../utils/crypto'
import { processIngestionDirectly } from '../services/ingest-runner'

export const sourceRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.select({
        id: sources.id, name: sources.name, type: sources.type,
        status: sources.status, chunkCount: sources.chunkCount,
        lastSyncAt: sources.lastSyncAt, lastError: sources.lastError,
        syncEnabled: sources.syncEnabled, createdAt: sources.createdAt,
      }).from(sources)
        .where(eq(sources.projectId, input.projectId))
        .orderBy(desc(sources.createdAt))
    }),

  create: protectedProcedure
    .input(CreateSourceSchema)
    .mutation(async ({ input, ctx }) => {
      const [project] = await ctx.db.select().from(projects)
        .where(eq(projects.id, input.projectId)).limit(1)
      if (!project) throw new Error('Proje bulunamadı')

      // Workspace plan check
      const oauthTypes = ['slack_channel', 'gmail_label', 'notion_page', 'notion_database']
      if (oauthTypes.includes(input.type)) {
        const [ws] = await ctx.db.select().from(workspaces).where(eq(workspaces.id, project.workspaceId)).limit(1)
        if (ws && ws.plan === 'free') {
          throw new Error('Slack, Gmail ve Notion OAuth entegrasyonları Starter ve Pro planlara özeldir. Lütfen planınızı yükseltin.')
        }
      }

      const encryptedConfig = await encryptSensitiveFields(input.config, ctx.env.ENCRYPTION_KEY)

      const [source] = await ctx.db.insert(sources).values({
        projectId: input.projectId,
        workspaceId: project.workspaceId,
        type: input.type,
        name: input.name,
        config: encryptedConfig,
        syncEnabled: input.syncEnabled,
        syncIntervalHours: input.syncIntervalHours,
        nextSyncAt: new Date(),
      }).returning()

      if (ctx.env.INGESTION_QUEUE) {
        try {
          await ctx.env.INGESTION_QUEUE.send({
            sourceId: source.id,
            projectId: input.projectId,
            triggeredBy: 'manual',
          })
        } catch { /* optional queue */ }
      }

      // Execute ingestion directly for instant processing and immediate status update
      try {
        await processIngestionDirectly(ctx, source.id, input.projectId)
      } catch (err) {
        console.error('Direct ingestion error:', err)
      }

      await ctx.db.update(projects).set({
        sourceCount: sql`${projects.sourceCount} + 1`,
        updatedAt: new Date(),
      }).where(eq(projects.id, input.projectId))

      return { id: source.id, name: source.name, type: source.type, status: source.status }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const [source] = await ctx.db.select().from(sources)
        .where(eq(sources.id, input.id)).limit(1)
      if (!source) throw new Error('Kaynak bulunamadı')

      const { deleteSourceChunks } = await import('../services/vectorize')
      await deleteSourceChunks(ctx.env, source.id, source.projectId)

      await ctx.db.delete(sources).where(eq(sources.id, input.id))

      await ctx.db.update(projects).set({
        sourceCount: sql`${projects.sourceCount} - 1`,
        updatedAt: new Date(),
      }).where(eq(projects.id, source.projectId))

      return { ok: true }
    }),

  resync: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const [source] = await ctx.db.select().from(sources)
        .where(eq(sources.id, input.id)).limit(1)
      if (!source) throw new Error('Kaynak bulunamadı')

      if (ctx.env.INGESTION_QUEUE) {
        try {
          await ctx.env.INGESTION_QUEUE.send({
            sourceId: source.id, projectId: source.projectId, triggeredBy: 'manual',
          })
        } catch { /* optional queue */ }
      }

      await ctx.db.update(sources)
        .set({ status: 'syncing', updatedAt: new Date() })
        .where(eq(sources.id, input.id))

      // Execute ingestion directly for instant processing and immediate status update
      try {
        await processIngestionDirectly(ctx, source.id, source.projectId)
      } catch (err) {
        console.error('Direct resync ingestion error:', err)
      }

      return { ok: true }
    }),

  ingestionHistory: protectedProcedure
    .input(z.object({ sourceId: z.string().uuid(), limit: z.number().int().max(20).default(10) }))
    .query(async ({ input, ctx }) => {
      return ctx.db.select().from(ingestionJobs)
        .where(eq(ingestionJobs.sourceId, input.sourceId))
        .orderBy(desc(ingestionJobs.createdAt))
        .limit(input.limit)
    }),
})

async function encryptSensitiveFields(config: Record<string, unknown>, key: string) {
  const sensitiveKeys = ['accessToken', 'refreshToken', 'webhookSecret']
  const result = { ...config }
  for (const k of sensitiveKeys) {
    if (typeof result[k] === 'string') {
      result[k] = await encryptField(result[k] as string, key)
    }
  }
  return result
}
