import type { Context } from 'hono'
import type { CloudflareBindings } from '../context'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { workspaces } from '@briefr/db'
import { eq } from 'drizzle-orm'

export async function iyzicoCallbackHandler(c: Context<{ Bindings: CloudflareBindings }>) {
  let token = c.req.query('token')
  if (!token && c.req.method === 'POST') {
    try {
      const body = await c.req.parseBody()
      token = body['token'] as string
    } catch { /* empty */ }
  }

  if (!token) {
    return c.redirect(`${c.env.FRONTEND_URL}/billing?error=payment_failed`)
  }

  // Verify payment token with iyzico
  try {
    const authHeader = await buildIyzicoRetrieveAuth(c.env, token)
    const res = await fetch(`${c.env.IYZICO_BASE_URL}/payment/iyzipos/checkoutform/auth/ecom/detail`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ locale: 'tr', token }),
    })
    const data = await res.json() as any

    if (data.status === 'success' && data.paymentStatus === 'SUCCESS') {
      const basketId = data.basketId as string // Format: briefr_{workspaceId}_{planId}_{billingCycle}
      const parts = basketId.split('_')
      if (parts.length >= 3) {
        const workspaceId = parts[1]
        const planId = parts[2] as 'starter' | 'pro'
        const cycle = parts[3] || 'monthly'

        const db = drizzle(neon(c.env.DATABASE_URL))
        const endsAt = new Date(Date.now() + (cycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)

        await db.update(workspaces).set({
          plan: planId,
          subscriptionId: data.paymentId || token,
          subscriptionEndsAt: endsAt,
          updatedAt: new Date(),
        }).where(eq(workspaces.id, workspaceId))

        return c.redirect(`${c.env.FRONTEND_URL}/billing?success=true&plan=${planId}`)
      }
    }
  } catch {
    /* fallback to redirect error */
  }

  return c.redirect(`${c.env.FRONTEND_URL}/billing?error=payment_unverified`)
}

async function buildIyzicoRetrieveAuth(env: CloudflareBindings, token: string): Promise<string> {
  const rand = crypto.randomUUID()
  const body = { locale: 'tr', token }
  const msg = env.IYZICO_API_KEY + rand + JSON.stringify(body)
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(env.IYZICO_SECRET_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg))
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `IYZWSv2 ${btoa(`apiKey:${env.IYZICO_API_KEY}&randomKey:${rand}&signature:${hex}`)}`
}
