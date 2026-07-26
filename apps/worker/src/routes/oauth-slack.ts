import type { Context } from 'hono'
import type { CloudflareBindings } from '../context'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { workspaces } from '@briefr/db'
import { eq } from 'drizzle-orm'
import { encryptField } from '../utils/crypto'

export async function slackOAuthHandler(c: Context<{ Bindings: CloudflareBindings }>) {
  const code = c.req.query('code')
  const state = c.req.query('state') // workspaceId
  if (!code || !state) return c.redirect(`${c.env.FRONTEND_URL}/settings?error=oauth_failed`)

  const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: c.env.SLACK_CLIENT_ID, client_secret: c.env.SLACK_CLIENT_SECRET,
      redirect_uri: `${c.env.FRONTEND_URL}/oauth/slack/callback`,
    }),
  })
  const data = await tokenResponse.json() as any
  if (!data.ok) return c.redirect(`${c.env.FRONTEND_URL}/settings?error=${data.error}`)

  const db = drizzle(neon(c.env.DATABASE_URL))
  await db.update(workspaces).set({
    slackAccessToken: await encryptField(data.access_token, c.env.ENCRYPTION_KEY),
    slackTeamId: data.team?.id,
    updatedAt: new Date(),
  }).where(eq(workspaces.id, state))

  return c.redirect(`${c.env.FRONTEND_URL}/settings/integrations?connected=slack`)
}
