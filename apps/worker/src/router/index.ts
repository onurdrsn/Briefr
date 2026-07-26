import { router } from './trpc'
import { authRouter } from './auth'
import { workspaceRouter } from './workspace'
import { projectRouter } from './project'
import { sourceRouter } from './source'
import { chatRouter } from './chat'
import { memoryRouter } from './memory'
import { billingRouter } from './billing'
import { analyticsRouter } from './analytics'

export * from './trpc'

export const appRouter = router({
  auth: authRouter,
  workspace: workspaceRouter,
  project: projectRouter,
  source: sourceRouter,
  chat: chatRouter,
  memory: memoryRouter,
  billing: billingRouter,
  analytics: analyticsRouter,
})

export type AppRouter = typeof appRouter
