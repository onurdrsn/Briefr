import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { router, protectedProcedure } from './trpc'
import { threads, messages, projects, sources } from '@briefr/db'
import { CreateThreadSchema, SendMessageSchema } from '@briefr/types'
import { searchMemory } from '../services/vectorize'
import { streamDifyChat } from '../services/dify'

export const chatRouter = router({
  listThreads: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.select().from(threads)
        .where(eq(threads.projectId, input.projectId))
        .orderBy(desc(threads.lastMessageAt))
        .limit(50)
    }),

  createThread: protectedProcedure
    .input(CreateThreadSchema)
    .mutation(async ({ input, ctx }) => {
      const [thread] = await ctx.db.insert(threads).values({
        projectId: input.projectId,
        userId: ctx.user.id,
        title: input.title ?? 'Yeni Sohbet',
      }).returning()
      return thread
    }),

  getMessages: protectedProcedure
    .input(z.object({ threadId: z.string().uuid(), limit: z.number().int().max(100).default(50) }))
    .query(async ({ input, ctx }) => {
      const rows = await ctx.db.select().from(messages)
        .where(eq(messages.threadId, input.threadId))
        .orderBy(messages.createdAt)
        .limit(input.limit)

      return rows.filter((m) => m.content && m.content.trim().length > 0)
    }),

  sendMessage: protectedProcedure
    .input(SendMessageSchema)
    .mutation(async ({ input, ctx }) => {
      const [thread] = await ctx.db.select().from(threads)
        .where(eq(threads.id, input.threadId)).limit(1)
      if (!thread) throw new Error('Thread bulunamadı')

      const [project] = await ctx.db.select().from(projects)
        .where(eq(projects.id, thread.projectId)).limit(1)
      if (!project) throw new Error('Proje bulunamadı')

      await ctx.db.insert(messages).values({
        threadId: input.threadId,
        projectId: thread.projectId,
        role: 'user',
        content: input.content,
      })

      let relevantChunks: any[] = []
      try {
        if (ctx.env.BRIEFR_AI && ctx.env.BRIEFR_VECTORIZE) {
          relevantChunks = await searchMemory(ctx.env, {
            namespace: project.vectorNamespace,
            query: input.content,
            topK: 8,
          })
        }
      } catch (searchErr) {
        console.error('Vector memory search warning:', searchErr)
      }

      // Fallback: If vector search returned 0 items, load active sources directly from PostgreSQL
      if (relevantChunks.length === 0) {
        const projectSources = await ctx.db.select().from(sources)
          .where(eq(sources.projectId, thread.projectId))
          .limit(10)

        for (const s of projectSources) {
          const cfg = (s.config as any) || {}
          const text = cfg.content || cfg.text || cfg.fileName || s.name || ''
          if (text) {
            relevantChunks.push({
              id: s.id,
              metadata: {
                sourceType: s.type,
                sourceName: s.name,
                originalDate: s.updatedAt?.toISOString() || new Date().toISOString(),
                content: text,
              }
            })
          }
        }
      }

      const context = relevantChunks
        .map((c: any) => `[${(c.metadata as any)?.sourceType ?? 'note'}] ${(c.metadata as any)?.sourceName ?? ''} (${(c.metadata as any)?.originalDate ?? ''})\n${(c.metadata as any)?.content ?? ''}`)
        .join('\n\n---\n\n')

      const systemPrompt = buildSystemPrompt(project.name, project.language ?? 'auto', context)
      const pendingMsgId = crypto.randomUUID()

      const streamTask = streamDifyChat(ctx.env, {
        userMessage: input.content,
        systemPrompt,
        threadId: input.threadId,
        projectId: thread.projectId,
        pendingMsgId,
        usedChunkIds: relevantChunks.map((c: any) => c.id),
        difyConversationId: await getOrCreateDifyConversation(ctx, thread.id),
      })

      if (ctx.executionCtx?.waitUntil) {
        ctx.executionCtx.waitUntil(streamTask)
      } else {
        streamTask.catch((err) => console.error('Background Dify error:', err))
      }

      return { pendingMsgId, chunksUsed: relevantChunks.length }
    }),

  renameThread: protectedProcedure
    .input(z.object({ threadId: z.string().uuid(), title: z.string().min(1).max(200) }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.update(threads)
        .set({ title: input.title })
        .where(eq(threads.id, input.threadId))
      return { ok: true }
    }),

  deleteThread: protectedProcedure
    .input(z.object({ threadId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.delete(messages).where(eq(messages.threadId, input.threadId))
      await ctx.db.delete(threads).where(eq(threads.id, input.threadId))
      return { ok: true }
    }),
})

function buildSystemPrompt(projectName: string, language: string, context: string): string {
  return `PROJE KAYNAKLARI ("${projectName}" Projesi):
==================================================
${context || 'Bu projeye henüz veri kaynağı yüklenmedi.'}
==================================================

Kullanıcı sorularını doğrudan yukarıdaki PROJE KAYNAKLARI'na dayanarak açık, akıcı ve eksiksiz yanıtla.`
}

async function getOrCreateDifyConversation(ctx: any, threadId: string): Promise<string | undefined> {
  const [lastMsg] = await ctx.db.select({ difyConversationId: messages.difyConversationId })
    .from(messages)
    .where(and(eq(messages.threadId, threadId), eq(messages.role, 'assistant')))
    .orderBy(desc(messages.createdAt))
    .limit(1)
  return lastMsg?.difyConversationId ?? undefined
}
