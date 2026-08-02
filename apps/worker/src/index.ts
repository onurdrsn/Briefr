import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { trpcServer } from '@hono/trpc-server'
import { appRouter } from './router/index'
import { createContext } from './context'
import type { CloudflareBindings } from './context'
import { slackWebhookHandler } from './routes/slack-webhook'
import { notionWebhookHandler } from './routes/notion-webhook'
import { makeWebhookHandler } from './routes/make-webhook'
import { gmailOAuthHandler } from './routes/oauth-gmail'
import { slackOAuthHandler } from './routes/oauth-slack'
import { notionOAuthHandler } from './routes/oauth-notion'
import { iyzicoCallbackHandler } from './routes/iyzico-callback'
import { uploadHandler } from './routes/upload'

export { ChatStreamDO } from './durable-objects/chat-stream'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.use('*', logger())
app.use('*', cors({
  origin: (origin, c) => {
    const allowed = [c.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'].filter(Boolean)
    return allowed.includes(origin) ? origin : ''
  },
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))
app.use('*', prettyJSON())

app.onError((err, c) => {
  console.error('Worker global error:', err)
  if (c.req.path.startsWith('/trpc')) {
    return c.json([
      {
        error: {
          message: err?.message || 'Sunucu hatası oluştu',
          code: -32603,
          data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 },
        },
      },
    ], 500)
  }
  return c.json({ error: err?.message || 'Sunucu hatası oluştu' }, 500)
})

// OAuth callbacks
app.get('/oauth/gmail/callback',  gmailOAuthHandler)
app.get('/oauth/slack/callback',  slackOAuthHandler)
app.get('/oauth/notion/callback', notionOAuthHandler)

// Webhook ingestion (public, secret verified)
app.post('/webhooks/slack',   slackWebhookHandler)
app.post('/webhooks/notion',  notionWebhookHandler)
app.post('/webhooks/make/:projectId/:secret', makeWebhookHandler)

// iyzico callback
app.post('/billing/callback', iyzicoCallbackHandler)
app.get('/billing/callback',  iyzicoCallbackHandler)

// File upload
app.post('/upload', uploadHandler)

// Chat SSE stream
app.get('/chat/stream/:threadId', async (c) => {
  const threadId = c.req.param('threadId')
  const doId = c.env.CHAT_STREAM_DO.idFromName(threadId)
  const stub = c.env.CHAT_STREAM_DO.get(doId)
  const streamUrl = new URL(c.req.url)
  streamUrl.pathname = '/stream'
  return stub.fetch(new Request(streamUrl.toString(), c.req.raw))
})

// tRPC
app.use('/trpc/*', trpcServer({
  router: appRouter,
  createContext: (opts, c) => createContext(opts, c.env, c.executionCtx),
}))

app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }))

export default app
