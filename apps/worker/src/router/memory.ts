import { z } from 'zod'
import { eq, and, desc, ilike, or } from 'drizzle-orm'
import { router, protectedProcedure } from './trpc'
import { chunks, sources, projects } from '@briefr/db'
import { SearchMemorySchema } from '@briefr/types'
import { searchMemory } from '../services/vectorize'

export const memoryRouter = router({
  search: protectedProcedure
    .input(SearchMemorySchema)
    .query(async ({ input, ctx }) => {
      const [project] = await ctx.db.select().from(projects)
        .where(eq(projects.id, input.projectId)).limit(1)
      if (!project) throw new Error('Proje bulunamadı')

      // Try Cloudflare Vectorize first, fall back to PostgreSQL full-text search
      try {
        if (ctx.env.BRIEFR_AI && ctx.env.BRIEFR_VECTORIZE) {
          const results = await searchMemory(ctx.env, {
            namespace: project.vectorNamespace,
            query: input.query,
            topK: input.topK ?? 10,
            filter: input.sourceTypes
              ? { sourceType: { $in: input.sourceTypes } }
              : undefined,
          })

          if (results.length > 0) {
            return results.map((r: any) => ({
              chunkId: r.id,
              score: r.score,
              content: (r.metadata as any)?.content ?? '',
              sourceType: (r.metadata as any)?.sourceType,
              sourceName: (r.metadata as any)?.sourceName,
              author: (r.metadata as any)?.author,
              originalDate: (r.metadata as any)?.originalDate,
            }))
          }
        }
      } catch (vectorErr) {
        console.warn('Vectorize unavailable, falling back to PostgreSQL:', vectorErr)
      }

      // PostgreSQL full-text fallback — search chunks by ILIKE on content
      const terms = input.query.trim().split(/\s+/).filter(Boolean)
      const conditions = terms.map((t) => ilike(chunks.content, `%${t}%`))

      const pgResults = await ctx.db
        .select({
          id: chunks.id,
          content: chunks.content,
          sourceType: chunks.sourceType,
          sourceName: chunks.sourceName,
          author: chunks.author,
          originalDate: chunks.originalDate,
        })
        .from(chunks)
        .where(and(
          eq(chunks.projectId, input.projectId),
          eq(chunks.status, 'embedded'),
          or(...conditions),
        ))
        .orderBy(desc(chunks.createdAt))
        .limit(input.topK ?? 10)

      return pgResults.map((r) => ({
        chunkId: r.id,
        score: 1.0,
        content: r.content,
        sourceType: r.sourceType,
        sourceName: r.sourceName,
        author: r.author,
        originalDate: r.originalDate?.toISOString(),
      }))
    }),

  stats: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [project] = await ctx.db.select().from(projects)
        .where(eq(projects.id, input.projectId)).limit(1)
      if (!project) throw new Error('Proje bulunamadı')

      const sourceStats = await ctx.db
        .select({ type: sources.type, count: sources.chunkCount, name: sources.name })
        .from(sources)
        .where(eq(sources.projectId, input.projectId))

      return {
        totalChunks: project.chunkCount,
        sources: sourceStats,
        namespace: project.vectorNamespace,
      }
    }),

  recentChunks: protectedProcedure
    .input(z.object({ projectId: z.string().uuid(), limit: z.number().int().max(50).default(20) }))
    .query(async ({ input, ctx }) => {
      return ctx.db.select({
        id: chunks.id, content: chunks.content, sourceType: chunks.sourceType,
        sourceName: chunks.sourceName, originalDate: chunks.originalDate, author: chunks.author,
        createdAt: chunks.createdAt,
      }).from(chunks)
        .where(and(eq(chunks.projectId, input.projectId), eq(chunks.status, 'embedded')))
        .orderBy(desc(chunks.createdAt))
        .limit(input.limit)
    }),
})
