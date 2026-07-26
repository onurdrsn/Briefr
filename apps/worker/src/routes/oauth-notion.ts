import type { Context } from 'hono'
import type { CloudflareBindings } from '../context'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { workspaces } from '@briefr/db'
import { eq } from 'drizzle-orm'
import { encryptField } from '../utils/crypto'

export async function notionOAuthHandler(c: Context<{ Bindings: CloudflareBindings }>) {
  const code = c.req.query('code')
  const state = c.req.query('state')
  if (!code || !state) return c.redirect(`${c.env.FRONTEND_URL}/settings?error=oauth_failed`)

  const credentials = btoa(`${c.env.NOTION_CLIENT_ID}:${c.env.NOTION_CLIENT_SECRET}`)
  const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code', code,
      redirect_uri: `${c.env.FRONTEND_URL}/oauth/notion/callback`,
    }),
  })
  const data = await tokenResponse.json() as any
  if (data.error) return c.redirect(`${c.env.FRONTEND_URL}/settings?error=${data.error}`)

  const db = drizzle(neon(c.env.DATABASE_URL))
  await db.update(workspaces).set({
    notionAccessToken: await encryptField(data.access_token, c.env.ENCRYPTION_KEY),
    updatedAt: new Date(),
  }).where(eq(workspaces.id, state))

  return c.redirect(`${c.env.FRONTEND_URL}/settings/integrations?connected=notion`)
}
