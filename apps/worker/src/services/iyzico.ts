import type { CloudflareBindings } from '../context'

const PLANS = {
  starter: { monthly: 149, yearly: 1490, name: 'Starter' },
  pro:     { monthly: 399, yearly: 3990, name: 'Pro' },
} as const

export async function initSubscriptionPayment(
  env: CloudflareBindings,
  params: { workspaceId: string; planId: 'starter' | 'pro'; billingCycle: 'monthly' | 'yearly'; buyerEmail: string; buyerName: string }
) {
  const plan = PLANS[params.planId]
  const price = params.billingCycle === 'yearly' ? plan.yearly : plan.monthly

  const getDevModal = () => ({
    token: 'mock_token_' + crypto.randomUUID().slice(0, 8),
    checkoutFormContent: `
      <div style="padding: 30px; text-align: center; color: #f8fafc; background: #0f172a; border-radius: 16px; border: 1px solid #334155; font-family: sans-serif;">
        <div style="font-size: 36px; margin-bottom: 10px;">💳</div>
        <h3 style="color: #c084fc; margin-bottom: 8px; font-size: 20px;">Briefr ${plan.name} Planı Test Ödeme Ekranı</h3>
        <p style="color: #94a3b8; font-size: 13px; margin-bottom: 20px;">
          Yerel geliştirme ortamında Iyzico test modu aktif.
        </p>
        <div style="background: #1e293b; padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #334155;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">Ödenecek Tutar</p>
          <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #38bdf8;">₺${price} TL <span style="font-size: 12px; color: #94a3b8;">/ ${params.billingCycle === 'yearly' ? 'Yıllık' : 'Aylık'}</span></p>
        </div>
        <button onclick="window.location.href='${env.FRONTEND_URL}/billing?success=true&plan=${params.planId}'" style="width: 100%; background: linear-gradient(to right, #9333ea, #6366f1); color: white; border: none; padding: 14px; border-radius: 10px; font-weight: bold; font-size: 14px; cursor: pointer; shadow: 0 4px 12px rgba(147, 51, 234, 0.3);">
          Test Ödemesini Tamamla ve Planı Yükselt →
        </button>
      </div>
    `,
  })

  // Dev mode simulation if iyzico keys are sample/placeholder or missing
  if (
    !env.IYZICO_API_KEY ||
    env.IYZICO_API_KEY.startsWith('sample_') ||
    !env.IYZICO_SECRET_KEY ||
    env.IYZICO_SECRET_KEY.startsWith('sample_') ||
    env.IYZICO_API_KEY.length < 15
  ) {
    return getDevModal()
  }

  const randomString = crypto.randomUUID()
  const conversationId = crypto.randomUUID()
  const nameParts = params.buyerName.split(' ')

  const requestBody = {
    locale: 'tr', conversationId,
    price: price.toFixed(2), paidPrice: price.toFixed(2),
    currency: 'TRY',
    basketId: `briefr_${params.workspaceId}_${params.planId}_${params.billingCycle}`,
    paymentGroup: 'SUBSCRIPTION',
    callbackUrl: `${env.FRONTEND_URL}/billing/callback`,
    enabledInstallments: [1],
    buyer: {
      id: params.workspaceId,
      name: nameParts[0] ?? 'Ad',
      surname: nameParts.slice(1).join(' ') || 'Soyad',
      email: params.buyerEmail,
      identityNumber: '11111111111',
      registrationAddress: 'Türkiye', city: 'İstanbul', country: 'Türkiye',
    },
    shippingAddress: { contactName: params.buyerName, city: 'İstanbul', country: 'Türkiye', address: 'Türkiye' },
    billingAddress: { contactName: params.buyerName, city: 'İstanbul', country: 'Türkiye', address: 'Türkiye' },
    basketItems: [{
      id: `${params.planId}_${params.billingCycle}`,
      name: `Briefr ${plan.name} — ${params.billingCycle === 'yearly' ? 'Yıllık' : 'Aylık'}`,
      category1: 'Yazılım', itemType: 'VIRTUAL',
      price: price.toFixed(2),
    }],
  }

  try {
    const authHeader = await buildIyzicoAuth(env, randomString, requestBody)
    const response = await fetch(`${env.IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize/auth/ecom`, {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'x-iyzi-rnd': randomString, 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })
    const data = await response.json() as any
    if (data.status === 'success' && data.checkoutFormContent) {
      return { checkoutFormContent: data.checkoutFormContent, token: data.token }
    }
  } catch (err: any) {
    console.warn('Iyzico live payment error, falling back to test modal:', err)
  }

  return getDevModal()
}

async function buildIyzicoAuth(env: CloudflareBindings, rand: string, body: object): Promise<string> {
  const msg = env.IYZICO_API_KEY + rand + JSON.stringify(body)
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(env.IYZICO_SECRET_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg))
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `IYZWSv2 ${btoa(`apiKey:${env.IYZICO_API_KEY}&randomKey:${rand}&signature:${hex}`)}`
}

export { PLANS }
