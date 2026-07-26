import { initTRPC, TRPCError } from '@trpc/server'
import type { AppContext } from '../context'

const t = initTRPC.context<AppContext>().create()

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Giriş yapmanız gerekiyor' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})
