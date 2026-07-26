import type { Context } from 'hono'
import type { CloudflareBindings } from '../context'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { workspaces } from '@briefr/db'
import { eq } from 'drizzle-orm'
import { encryptField } from '../utils/crypto'

export async function gmailOAuthHandler(c: Context<{ Bindings: CloudflareBindings }>) {
  const code = c.req.query('code')
  const state = c.req.query('state') // workspaceId
  if (!code || !state) return c.redirect(`${c.env.FRONTEND_URL}/settings?error=oauth_failed`)

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: c.env.GMAIL_CLIENT_ID, client_secret: c.env.GMAIL_CLIENT_SECRET,
      redirect_uri: `${c.env.FRONTEND_URL}/oauth/gmail/callback`,
      grant_type: 'authorization_code',
    }),
  })
  const tokens = await tokenResponse.json() as any
  if (tokens.error) return c.redirect(`${c.env.FRONTEND_URL}/settings?error=${tokens.error}`)

  const db = drizzle(neon(c.env.DATABASE_URL))
  await db.update(workspaces).set({
    gmailAccessToken: await encryptField(tokens.access_token, c.env.ENCRYPTION_KEY),
    gmailRefreshToken: tokens.refresh_token ? await encryptField(tokens.refresh_token, c.env.ENCRYPTION_KEY) : undefined,
    updatedAt: new Date(),
  }).where(eq(workspaces.id, state))

  return c.redirect(`${c.env.FRONTEND_URL}/settings/integrations?connected=gmail`)
}
