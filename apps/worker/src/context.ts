import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { sessions, users } from '@briefr/db'
import { eq } from 'drizzle-orm'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

export type CloudflareBindings = {
  DATABASE_URL: string
  RESEND_API_KEY: string
  DIFY_API_KEY: string
  DIFY_API_URL: string
  DIFY_CHAT_APP_ID: string
  IYZICO_API_KEY: string
  IYZICO_SECRET_KEY: string
  IYZICO_BASE_URL: string
  FRONTEND_URL: string
  SLACK_WEBHOOK_URL?: string
  SLACK_BOT_TOKEN?: string
  SLACK_CLIENT_ID: string
  SLACK_CLIENT_SECRET: string
  GMAIL_CLIENT_ID: string
  GMAIL_CLIENT_SECRET: string
  NOTION_CLIENT_ID: string
  NOTION_CLIENT_SECRET: string
  ENCRYPTION_KEY: string
  CHAT_STREAM_DO: DurableObjectNamespace
  BRIEFR_VECTORIZE: VectorizeIndex
  BRIEFR_AI: Ai
  INGESTION_QUEUE: Queue
  BRIEFR_KV: KVNamespace
  BRIEFR_R2: R2Bucket
}

export type AppContext = Awaited<ReturnType<typeof createContext>>

export async function createContext(
  opts: FetchCreateContextFnOptions,
  env: CloudflareBindings,
  executionCtx?: { waitUntil: (promise: Promise<any>) => void }
) {
  const sql = neon(env.DATABASE_URL)
  const db = drizzle(sql)
  let user: typeof users.$inferSelect | null = null

  const authHeader = opts.req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const [row] = await db
      .select({ user: users })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1)
    if (row) user = row.user
  }

  return { db, env, user, req: opts.req, executionCtx }
}
