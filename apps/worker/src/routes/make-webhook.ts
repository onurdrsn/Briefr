import type { Context } from 'hono'
import type { CloudflareBindings } from '../context'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { sources } from '@briefr/db'
import { eq, and } from 'drizzle-orm'

export async function makeWebhookHandler(c: Context<{ Bindings: CloudflareBindings }>) {
  const projectId = c.req.param('projectId')
  const secret = c.req.param('secret')
  if (!projectId || !secret) return c.json({ error: 'Missing parameter' }, 400)

  const db = drizzle(neon(c.env.DATABASE_URL))

  // Find source for this make webhook
  const sourceList = await db.select().from(sources)
    .where(and(eq(sources.projectId, projectId), eq(sources.type, 'make_webhook')))

  const matchedSource = sourceList.find((s) => {
    const cfg = s.config as any
    return cfg.webhookSecret === secret
  })

  if (!matchedSource) return c.json({ error: 'Unauthorized webhook' }, 401)

  const body = await c.req.text()

  // Update source with pendingContent and enqueue ingestion
  const updatedConfig = { ...(matchedSource.config as object), pendingContent: body }
  await db.update(sources).set({ config: updatedConfig, status: 'pending' }).where(eq(sources.id, matchedSource.id))

  await c.env.INGESTION_QUEUE.send({
    sourceId: matchedSource.id,
    projectId,
    triggeredBy: 'webhook',
  })

  return c.json({ ok: true, sourceId: matchedSource.id })
}
