import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowLeft } from 'lucide-react'
import { useLanguage, LanguageToggle } from '../../context/LanguageContext'

export function PrivacyPolicy() {
  const { lang } = useLanguage()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-purple-500/30">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              B
            </div>
            <span className="font-bold text-lg text-slate-100 tracking-tight">Briefr</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-4 py-2 rounded-xl border border-slate-700/50 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Back to Login' : 'Girişe Dön'}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full space-y-8">
        <div className="space-y-3 border-b border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Data Protection & Privacy (GDPR & KVKK)' : 'Gizlilik Politikası ve Veri Koruma (KVKK & GDPR)'}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {lang === 'en' ? 'Privacy Policy' : 'Gizlilik Politikası'}
          </h1>
          <p className="text-sm text-slate-400">
            {lang === 'en'
              ? 'Last updated: August 2, 2026 · At Briefr, we treat your personal and workplace data with the highest security standards.'
              : 'Son Güncelleme: 2 Ağustos 2026 · Briefr olarak kişisel ve kurumsal verilerinizin güvenliğine yüksek hassasiyet gösteriyoruz.'}
          </p>
        </div>

        {lang === 'en' ? (
          /* ENGLISH CONTENT */
          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-emerald-400 font-mono">01.</span> Data We Collect
              </h2>
              <p>When you register and connect workspace integrations, Briefr may collect:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li><strong>Account Information:</strong> Name, email address, salted password hash.</li>
                <li><strong>Integration Data:</strong> Messages, thread titles, timestamps, and author names from connected Slack channels.</li>
                <li><strong>Uploaded Content:</strong> PDF documents, text notes, Notion databases, and Gmail labels selected by your team.</li>
                <li><strong>Usage Metrics:</strong> AI token usage, latency performance logs, and billing history.</li>
              </ul>
            </section>

            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-emerald-400 font-mono">02.</span> How We Use Your Data
              </h2>
              <p>Your data is processed strictly for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>Creating semantic vector embeddings (BGE-M3 768-dim) for fast knowledge retrieval.</li>
                <li>Answering natural language queries submitted by authorized users in your workspace.</li>
                <li>Providing token usage metrics and account billing.</li>
              </ul>
              <p className="text-xs text-emerald-400 font-medium pt-2">
                * We NEVER sell your data or use your private Slack messages to train public AI models.
              </p>
            </section>

            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-emerald-400 font-mono">03.</span> Security & Storage Infrastructure
              </h2>
              <p>
                All data transmission is encrypted via TLS 1.3/HTTPS. Relational data is stored in encrypted Neon PostgreSQL databases, and vector embeddings are stored in isolated Cloudflare Vectorize namespaces.
              </p>
            </section>

            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-emerald-400 font-mono">04.</span> User Rights & Data Deletion
              </h2>
              <p>
                Under GDPR and KVKK, you have the right to inspect, export, or permanently delete your data. Removing a project or disconnecting the Slack app immediately deletes all associated vector indices and messages from our servers.
              </p>
            </section>

            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-emerald-400 font-mono">05.</span> Contact Privacy Team
              </h2>
              <p>
                For privacy inquiries or data requests, please contact us at:{' '}
                <a href="mailto:privacy@onurd.com.tr" className="text-emerald-400 hover:underline">
                  privacy@onurd.com.tr
                </a>
              </p>
            </section>
          </div>
        ) : (
          /* TURKISH CONTENT */
          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-emerald-400 font-mono">01.</span> Toplanan Veriler
              </h2>
              <p>
                Briefr platformunu ve Slack uygulamasını kullandığınızda ad, e-posta, Slack kanal mesajları ve yüklenen dokümanlar toplanabilir.
              </p>
            </section>

            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-emerald-400 font-mono">02.</span> Verilerin Kullanım Amacı
              </h2>
              <p>
                Veriler yalnızca ekibinizin semantik hafızasını oluşturmak ve sorularınıza doğru yanıt üretmek amacıyla işlenir.
              </p>
            </section>

            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-emerald-400 font-mono">03.</span> İletişim
              </h2>
              <p>
                Gizlilik konularında:{' '}
                <a href="mailto:privacy@onurd.com.tr" className="text-emerald-400 hover:underline">
                  privacy@onurd.com.tr
                </a>
              </p>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 Briefr. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link to="/tos" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link to="/support" className="hover:text-slate-300 transition-colors">Support</Link>
            <Link to="/superserviceco" className="hover:text-slate-300 transition-colors">Slack App</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
