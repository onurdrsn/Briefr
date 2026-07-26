import type { Context } from 'hono'
import type { CloudflareBindings } from '../context'

export async function slackWebhookHandler(c: Context<{ Bindings: CloudflareBindings }>) {
  const body = await c.req.json() as any

  // Handle URL verification challenge
  if (body.type === 'url_verification') {
    return c.json({ challenge: body.challenge })
  }

  // Handle events
  if (body.event && body.event.type === 'message') {
    // Process slack message push event if needed
  }

  return c.json({ ok: true })
}
