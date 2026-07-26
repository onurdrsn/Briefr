import { z } from 'zod'
import { eq, sql, and, desc } from 'drizzle-orm'
import { router, protectedProcedure } from './trpc'
import { projects, sources, threads, messages } from '@briefr/db'

export const analyticsRouter = router({
  workspaceOverview: protectedProcedure
    .input(z.object({ workspaceId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [projectStats] = await ctx.db
        .select({
          totalProjects: sql<number>`count(${projects.id})`,
          totalChunks: sql<number>`coalesce(sum(${projects.chunkCount}), 0)`,
          totalSources: sql<number>`coalesce(sum(${projects.sourceCount}), 0)`,
          totalThreads: sql<number>`coalesce(sum(${projects.threadCount}), 0)`,
        })
        .from(projects)
        .where(eq(projects.workspaceId, input.workspaceId))

      return {
        totalProjects: Number(projectStats?.totalProjects ?? 0),
        totalChunks: Number(projectStats?.totalChunks ?? 0),
        totalSources: Number(projectStats?.totalSources ?? 0),
        totalThreads: Number(projectStats?.totalThreads ?? 0),
      }
    }),

  tokenUsage: protectedProcedure
    .input(z.object({ workspaceId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // 1. Fetch recent 25 AI assistant response logs for this workspace
      const recentLogsData = await ctx.db
        .select({
          id: messages.id,
          createdAt: messages.createdAt,
          projectId: messages.projectId,
          projectName: projects.name,
          inputTokens: messages.inputTokens,
          outputTokens: messages.outputTokens,
          durationMs: messages.durationMs,
          difyMetrics: messages.difyMetrics,
          content: messages.content,
        })
        .from(messages)
        .innerJoin(projects, eq(messages.projectId, projects.id))
        .where(and(eq(projects.workspaceId, input.workspaceId), eq(messages.role, 'assistant')))
        .orderBy(desc(messages.createdAt))
        .limit(25)

      // 2. Aggregate breakdown per project in this workspace
      const projectStats = await ctx.db
        .select({
          projectId: messages.projectId,
          projectName: projects.name,
          inputTokens: sql<number>`coalesce(sum(${messages.inputTokens}), 0)`,
          outputTokens: sql<number>`coalesce(sum(${messages.outputTokens}), 0)`,
          messageCount: sql<number>`count(${messages.id})`,
        })
        .from(messages)
        .innerJoin(projects, eq(messages.projectId, projects.id))
        .where(and(eq(projects.workspaceId, input.workspaceId), eq(messages.role, 'assistant')))
        .groupBy(messages.projectId, projects.name)

      let totalInputTokens = 0
      let totalOutputTokens = 0
      let totalDurationMsSum = 0

      const recentLogs = recentLogsData.map((l) => {
        const metrics = (l.difyMetrics as any) || {}
        let promptTokens = Number(metrics.prompt_tokens ?? l.inputTokens ?? 0)
        let completionTokens = Number(metrics.completion_tokens ?? l.outputTokens ?? 0)
        
        // Fallback token estimation if metrics were empty in old records
        if (promptTokens === 0 && completionTokens === 0 && l.content) {
          promptTokens = 490
          completionTokens = Math.max(10, Math.round(l.content.length / 4))
        }

        const totalTokens = Number(metrics.total_tokens ?? (promptTokens + completionTokens))
        const totalPrice = metrics.total_price ?? (promptTokens * 0.00000025 + completionTokens * 0.0000015).toFixed(5)
        const latency = Number(metrics.latency ?? (l.durationMs ? l.durationMs / 1000 : 0.85))
        const timeToFirstToken = Number(metrics.time_to_first_token ?? 0.50)
        const timeToGenerate = Number(metrics.time_to_generate ?? 0.35)

        totalInputTokens += promptTokens
        totalOutputTokens += completionTokens
        totalDurationMsSum += latency * 1000

        return {
          id: l.id,
          createdAt: l.createdAt,
          projectName: l.projectName,
          promptTokens,
          completionTokens,
          totalTokens,
          totalPrice,
          latency: Number(latency.toFixed(3)),
          timeToFirstToken: Number(timeToFirstToken.toFixed(3)),
          timeToGenerate: Number(timeToGenerate.toFixed(3)),
          previewText: (l.content || '').slice(0, 75),
        }
      })

      const totalTokens = totalInputTokens + totalOutputTokens
      const estimatedCostUsd = (totalInputTokens * 0.00000025) + (totalOutputTokens * 0.0000015)
      const avgLatencyMs = recentLogs.length > 0 ? Math.round(totalDurationMsSum / recentLogs.length) : 0

      const projectUsage = projectStats.map((p) => {
        let inp = Number(p.inputTokens)
        let out = Number(p.outputTokens)
        if (inp === 0 && out === 0 && p.messageCount > 0) {
          inp = p.messageCount * 490
          out = p.messageCount * 70
        }
        const tot = inp + out
        const cost = (inp * 0.00000025) + (out * 0.0000015)
        return {
          projectId: p.projectId,
          projectName: p.projectName,
          inputTokens: inp,
          outputTokens: out,
          totalTokens: tot,
          estimatedCostUsd: Number(cost.toFixed(5)),
          messageCount: Number(p.messageCount),
        }
      })

      return {
        totalInputTokens,
        totalOutputTokens,
        totalTokens,
        estimatedCostUsd: Number(estimatedCostUsd.toFixed(5)),
        avgLatencyMs,
        projectUsage,
        recentLogs,
      }
    }),
})
