import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '../../../worker/src/router'

export const trpc = createTRPCReact<AppRouter>()
