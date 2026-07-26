import { useState, useEffect } from 'react'
import { MessageSquare, Mail, Database, Webhook, CheckCircle2, Copy, ExternalLink, Lock } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { trpc } from '../../lib/trpc'
import { Header } from '../../components/layout/Header'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Link } from 'react-router-dom'

export function Integrations() {
  const { workspace } = useAuth()
  const [copied, setCopied] = useState(false)
  const [slackOAuthUrl, setSlackOAuthUrl] = useState('')

  const workspaceQuery = trpc.workspace.get.useQuery(
    { id: workspace?.id! },
    { enabled: !!workspace?.id }
  )

  const keysQuery = trpc.workspace.getOAuthKeys.useQuery()

  const ws: any = workspaceQuery.data || workspace
  const isFreePlan = !ws?.plan || ws?.plan === 'free'

  const slackClientId = keysQuery.data?.slackClientId || '10721985566021.11657543855522'
  const gmailClientId = keysQuery.data?.gmailClientId || '200357330982-doqb41pgv495671df5jivermcigtbspq.apps.googleusercontent.com'
  const notionClientId = keysQuery.data?.notionClientId || 'sample_notion_client_id'

  useEffect(() => {
    async function prepareSlackUrl() {
      try {
        const verifier = 'briefr_slack_pkce_verifier_0123456789abcdef'
        const enc = new TextEncoder()
        const digest = await crypto.subtle.digest('SHA-256', enc.encode(verifier))
        const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

        const redirectUri = encodeURIComponent(window.location.origin + '/oauth/slack/callback')
        const scope = encodeURIComponent('app_mentions:read,channels:read,channels:history,chat:write,incoming-webhook')

        const url = `https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${ws?.id || ''}&code_challenge=${challenge}&code_challenge_method=S256`
        setSlackOAuthUrl(url)
      } catch {
        const redirectUri = encodeURIComponent(window.location.origin + '/oauth/slack/callback')
        setSlackOAuthUrl(`https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&scope=app_mentions:read,channels:read,channels:history,chat:write,incoming-webhook&redirect_uri=${redirectUri}&state=${ws?.id || ''}`)
      }
    }
    prepareSlackUrl()
  }, [slackClientId, ws?.id])

  const handleCopyWebhook = () => {
    const url = `${window.location.origin}/webhooks/make/PROJECT_ID/SECRET`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const integrations = [
    {
      id: 'slack',
      name: 'Slack Integration',
      description: 'Slack kanallarınızdaki tüm iletişimi proje hafızasına aktarın.',
      icon: MessageSquare,
      iconColor: 'text-emerald-400',
      connected: !!ws?.slackAccessToken,
      oauthUrl: slackOAuthUrl || '#',
    },
    {
      id: 'gmail',
      name: 'Gmail Integration',
      description: 'Belirli Gmail label\'ları altındaki e-posta yazışmalarını otomatik senkronize edin.',
      icon: Mail,
      iconColor: 'text-rose-400',
      connected: !!ws?.gmailAccessToken,
      oauthUrl: gmailClientId
        ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${gmailClientId}&redirect_uri=${window.location.origin}/oauth/gmail/callback&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&state=${ws?.id}`
        : '#',
    },
    {
      id: 'notion',
      name: 'Notion Integration',
      description: 'Notion çalışma alanınızdaki sayfaları ve veritabanlarını indeksleyin.',
      icon: Database,
      iconColor: 'text-sky-400',
      connected: !!ws?.notionAccessToken,
      oauthUrl: notionClientId
        ? `https://api.notion.com/v1/oauth/authorize?client_id=${notionClientId}&response_type=code&owner=user&redirect_uri=${window.location.origin}/oauth/notion/callback&state=${ws?.id}`
        : '#',
    },
  ]

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Header title="Entegrasyonlar" />

      <main className="p-8 space-y-8 max-w-5xl mx-auto w-full">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-100">Bağlantılar ve OAuth Entegrasyonları</h3>
            <p className="text-sm text-slate-400">
              Hesabınızı harici platformlara bağlayarak otomatik veri akışı sağlayın.
            </p>
          </div>
          {isFreePlan && (
            <Link to="/billing">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs">
                Planı Yükselt →
              </Button>
            </Link>
          )}
        </div>

        {isFreePlan && (
          <Alert variant="warning" title="Starter & Pro Planlara Özel Özellik">
            Hesabınız şu anda Free plandadır. Slack, Gmail ve Notion OAuth entegrasyonları Starter ve Pro planlarımıza özeldir. Bağlantıları aktif etmek için lütfen{' '}
            <Link to="/billing" className="underline font-bold text-amber-300">
              Plan & Fatura sayfasından planınızı yükseltin.
            </Link>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((item) => (
            <div key={item.id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between relative overflow-hidden">
              {isFreePlan && (
                <div className="absolute top-3 right-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Kilitli</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                    <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                  </div>
                  {!isFreePlan && (
                    item.connected ? (
                      <Badge variant="success">Bağlı</Badge>
                    ) : (
                      <Badge variant="default">Bağlı Değil</Badge>
                    )
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-100 text-lg">{item.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              </div>

              <div>
                {isFreePlan ? (
                  <Button
                    variant="outline"
                    disabled={true}
                    className="w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950 disabled:border-slate-800 disabled:text-slate-500"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Starter & Pro Plana Özel (Kilitli)</span>
                  </Button>
                ) : (
                  <a href={item.oauthUrl} target={item.oauthUrl !== '#' ? '_blank' : undefined} rel="noopener noreferrer">
                    <Button variant={item.connected ? 'outline' : 'primary'} className="w-full justify-center">
                      <span>{item.connected ? 'Yeniden Bağlan' : 'OAuth ile Bağlan'}</span>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          ))}

          {/* Make.com Webhook Card */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                  <Webhook className="w-6 h-6 text-amber-400" />
                </div>
                <Badge variant="purple">Webhook API</Badge>
              </div>

              <div>
                <h4 className="font-bold text-slate-100 text-lg">Make.com / Zapier Webhook</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Make.com otomasyon senaryolarınızdan Briefr'a doğrudan veri göndermek için webhook URL kullanın.
                </p>
              </div>
            </div>

            <Button variant="secondary" onClick={handleCopyWebhook} className="w-full justify-center">
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Kopyalandı!' : 'Webhook Formatını Kopyala'}</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
