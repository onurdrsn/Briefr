import type { Context } from 'hono'
import type { CloudflareBindings } from '../context'

export async function notionWebhookHandler(c: Context<{ Bindings: CloudflareBindings }>) {
  // Notion webhook event handler
  return c.json({ ok: true })
}
