import { useAuth } from '../hooks/useAuth'
import { trpc } from '../lib/trpc'
import { Header } from '../components/layout/Header'
import { Zap, TrendingUp, DollarSign, Clock, Activity, FolderKanban } from 'lucide-react'

const METRICS = [
  { key: 'promptTokens',      label: 'Girdi (Soru) Token',    unit: 'token' },
  { key: 'completionTokens',  label: 'Çıktı (Yanıt) Token',   unit: 'token' },
  { key: 'totalTokens',       label: 'Toplam Token',           unit: 'token' },
  { key: 'totalPrice',        label: 'Maliyet ($ USD)',        unit: '$' },
  { key: 'latency',           label: 'Toplam Süre',            unit: 'sn' },
  { key: 'timeToFirstToken',  label: 'İlk Yanıt Hızı',        unit: 'sn' },
  { key: 'timeToGenerate',    label: 'Üretim Süresi',          unit: 'sn' },
]

export function AIUsagePage() {
  const { workspace } = useAuth()
  const workspaceId = workspace?.id ?? ''

  const usageQuery = trpc.analytics.tokenUsage.useQuery(
    { workspaceId },
    { enabled: !!workspaceId }
  )

  const data = usageQuery.data

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Header title="⚡ Yapay Zeka & Token Kullanımı" />

      <main className="p-8 space-y-8 max-w-6xl mx-auto w-full">
        <p className="text-sm text-slate-400">
          Dify ve LLM modellerinizin harcadığı token miktarları, harcama tutarları ve yanıt performansı raporları.
        </p>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Activity className="w-5 h-5 text-purple-400" />}
            label="Toplam Token Kullanımı"
            value={data ? `${(data.totalTokens ?? 0).toLocaleString('tr-TR')}` : '0'}
            sub="Girdi + Çıktı Toplamı"
            color="purple"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
            label="Girdi vs Çıktı Token"
            value={data ? `↑ ${data.totalInputTokens}  ↗ ${data.totalOutputTokens}` : '↑ 0  ↗ 0'}
            sub="Soru Tokeni / Yanıt Tokeni"
            color="blue"
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
            label="Toplam Maliyet"
            value={data ? `$${Number(data.estimatedCostUsd ?? 0).toFixed(5)} USD` : '$0.00000 USD'}
            sub="Dify Model Harcama Tutarı"
            color="emerald"
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-400" />}
            label="Ortalama Yanıt Süresi"
            value={data ? `${((data.avgLatencyMs ?? 0) / 1000).toFixed(2)} sn` : '0.00 sn'}
            sub="Sohbet Başına Toplam Gecikme"
            color="amber"
          />
        </div>

        {/* Project Breakdown */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-purple-400" />
              Proje Bazlı Token Dağılımı
            </h3>
            <span className="text-xs text-slate-500">Toplam {data?.projectUsage?.length ?? 0} Proje</span>
          </div>

          {(!data?.projectUsage || data.projectUsage.length === 0) ? (
            <p className="text-sm text-slate-500 text-center py-8">
              Henüz yapay zeka sohbeti gerçekleştirilmiş bir proje bulunmuyor.
            </p>
          ) : (
            <div className="space-y-3">
              {data.projectUsage.map((p) => (
                <div key={p.projectId} className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{p.projectName}</p>
                    <p className="text-xs text-slate-400">{p.messageCount} yanıt · {p.totalTokens.toLocaleString('tr-TR')} token</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">${Number(p.estimatedCostUsd).toFixed(5)}</p>
                    <p className="text-xs text-slate-500">harcama</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Logs Table */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Detaylı Yanıt Performansı & İşlem Günlüğü
            </h3>
            <span className="text-xs text-slate-500">Son 25 İşlem Metriği</span>
          </div>

          {(!data?.recentLogs || data.recentLogs.length === 0) ? (
            <p className="text-sm text-slate-500 text-center py-8">
              Kayıtlı yapay zeka işlem günlüğü bulunmuyor.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="pb-2 pr-4 font-medium">Proje</th>
                    <th className="pb-2 pr-4 font-medium">Girdi Token</th>
                    <th className="pb-2 pr-4 font-medium">Çıktı Token</th>
                    <th className="pb-2 pr-4 font-medium">Toplam Token</th>
                    <th className="pb-2 pr-4 font-medium">Maliyet $</th>
                    <th className="pb-2 pr-4 font-medium">Toplam Süre</th>
                    <th className="pb-2 pr-4 font-medium">İlk Yanıt</th>
                    <th className="pb-2 font-medium">Üretim Süresi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 pr-4 text-slate-300 font-medium">{log.projectName}</td>
                      <td className="py-2 pr-4 text-blue-400">{log.promptTokens}</td>
                      <td className="py-2 pr-4 text-purple-400">{log.completionTokens}</td>
                      <td className="py-2 pr-4 text-slate-200">{log.totalTokens}</td>
                      <td className="py-2 pr-4 text-emerald-400">${Number(log.totalPrice).toFixed(5)}</td>
                      <td className="py-2 pr-4 text-amber-400">{log.latency} sn</td>
                      <td className="py-2 pr-4 text-cyan-400">{log.timeToFirstToken} sn</td>
                      <td className="py-2 text-rose-400">{log.timeToGenerate} sn</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: 'purple' | 'blue' | 'emerald' | 'amber'
}) {
  const colors = {
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  }
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <p className={`text-lg font-bold ${colors[color].split(' ')[0]}`}>{value}</p>
        <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}
