import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { router, protectedProcedure } from './trpc'
import { workspaces } from '@briefr/db'
import { TopUpSchema } from '@briefr/types'
import { initSubscriptionPayment, PLANS } from '../services/iyzico'

export const billingRouter = router({
  currentPlan: protectedProcedure
    .input(z.object({ workspaceId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [ws] = await ctx.db.select().from(workspaces)
        .where(eq(workspaces.id, input.workspaceId)).limit(1)
      if (!ws) throw new Error('Çalışma alanı bulunamadı')

      return {
        plan: ws.plan,
        chunksThisMonth: ws.chunksThisMonth,
        chatsThisMonth: ws.chatsThisMonth,
        storageBytes: ws.storageBytes,
        subscriptionEndsAt: ws.subscriptionEndsAt,
      }
    }),

  initPayment: protectedProcedure
    .input(TopUpSchema)
    .mutation(async ({ input, ctx }) => {
      const [ws] = await ctx.db.select().from(workspaces)
        .where(eq(workspaces.id, input.workspaceId)).limit(1)
      if (!ws) throw new Error('Çalışma alanı bulunamadı')

      const result = await initSubscriptionPayment(ctx.env, {
        workspaceId: input.workspaceId,
        planId: input.planId,
        billingCycle: input.billingCycle,
        buyerEmail: ctx.user?.email || 'user@briefr.app',
        buyerName: ctx.user?.fullName || 'Briefr Kullanıcısı',
      })

      return result
    }),

  upgradePlan: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      planId: z.enum(['free', 'starter', 'pro']),
    }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.update(workspaces)
        .set({ plan: input.planId, updatedAt: new Date() })
        .where(eq(workspaces.id, input.workspaceId))
      return { ok: true, plan: input.planId }
    }),

  plansInfo: protectedProcedure.query(() => {
    return PLANS
  }),
})
