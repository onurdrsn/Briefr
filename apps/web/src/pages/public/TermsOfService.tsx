import { Link } from 'react-router-dom'
import { FileText, ArrowLeft } from 'lucide-react'
import { useLanguage, LanguageToggle } from '../../context/LanguageContext'

export function TermsOfService() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium">
            <FileText className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Legal & Service Agreement' : 'Hizmet Şartları ve Kullanım Koşulları'}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {lang === 'en' ? 'Terms of Service' : 'Hizmet Şartları'}
          </h1>
          <p className="text-sm text-slate-400">
            {lang === 'en'
              ? 'Last updated: August 2, 2026 · Please read these terms carefully before using Briefr and the Slack integration.'
              : 'Son Güncelleme: 2 Ağustos 2026 · Lütfen Briefr platformunu ve Slack entegrasyonunu kullanmadan önce bu şartları okuyunuz.'}
          </p>
        </div>

        {lang === 'en' ? (
          /* ENGLISH CONTENT */
          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-purple-400 font-mono">01.</span> Description of Service
              </h2>
              <p>
                Briefr ("Service") is a SaaS knowledge platform enabling teams to unify data from Slack channels, Gmail, Notion, and uploaded documents into a searchable AI memory. The Service operates on Cloudflare Workers, Neon PostgreSQL, Cloudflare Vectorize, and Dify LLM orchestration.
              </p>
            </section>

            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-purple-400 font-mono">02.</span> Account Registration & Security
              </h2>
              <p>
                To access the Service, you must register with a valid email address. Users are responsible for maintaining the confidentiality of their account credentials and authorization tokens. You are fully responsible for all activities that occur under your account.
              </p>
            </section>

            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-purple-400 font-mono">03.</span> User Data & Ownership
              </h2>
              <p>
                All messages, text, documents, and content ingested via Slack integration, file uploads, or connected sources ("User Content") remain the exclusive property of the User/Organization. Briefr does not sell User Content, share it with third parties, or use it to train public AI models.
              </p>
            </section>

            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-purple-400 font-mono">04.</span> Slack Integration & Permissions
              </h2>
              <p>
                When installing the Briefr Slack App, you grant permission for Briefr to read public/private channel messages that you explicitly select. You can revoke access at any time via Slack Workspace App Settings or by removing the integration from the Briefr panel.
              </p>
            </section>

            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-purple-400 font-mono">05.</span> AI Responses & Limitations
              </h2>
              <p>
                AI responses generated by the Service are based on semantic search of your ingested documents. Briefr does not guarantee 100% accuracy of AI-generated answers. Users should verify critical information before taking business actions.
              </p>
            </section>

            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-purple-400 font-mono">06.</span> Contact & Support
              </h2>
              <p>
                For questions regarding these Terms of Service, please contact our support team at{' '}
                <a href="mailto:support@onurd.com.tr" className="text-purple-400 hover:underline">
                  support@onurd.com.tr
                </a>.
              </p>
            </section>
          </div>
        ) : (
          /* TURKISH CONTENT */
          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-purple-400 font-mono">01.</span> Hizmetin Tanımı
              </h2>
              <p>
                Briefr ("Hizmet"), kullanıcıların Slack kanalları, Gmail, Notion ve yüklenen dosyalar gibi farklı veri kaynaklarını tek bir yapay zeka destekli hafızada birleştirmelerini ve doğal dille sorgulamalarını sağlayan bir SaaS platformudur.
              </p>
            </section>

            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-purple-400 font-mono">02.</span> Hesap Oluşturma ve Güvenlik
              </h2>
              <p>
                Hizmeti kullanabilmek için geçerli bir e-posta adresi ile hesap oluşturmanız gerekmektedir. Kullanıcılar hesap şifrelerinin ve yetkilendirme token’larının gizliliğinden sorumludur.
              </p>
            </section>

            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-purple-400 font-mono">03.</span> Kullanıcı Verileri ve Mülkiyet
              </h2>
              <p>
                Slack entegrasyonu veya dosya yüklemeleri aracılığıyla aktarılan tüm veriler tamamen kullanıcının/kurumun mülkiyetindedir. Verileriniz halka açık AI modellerinin eğitimi için kullanılmaz.
              </p>
            </section>

            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-purple-400 font-mono">04.</span> Slack Entegrasyonu ve İzinler
              </h2>
              <p>
                Slack uygulamasını eklediğinizde seçtiğiniz kanallardaki mesajları indeksleme izni verilir. İzinleri Slack Çalışma Alanı Ayarları üzerinden dilediğiniz an kaldırabilirsiniz.
              </p>
            </section>

            <section className="space-y-3 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-purple-400 font-mono">05.</span> İletişim
              </h2>
              <p>
                Sorularınız için{' '}
                <a href="mailto:support@onurd.com.tr" className="text-purple-400 hover:underline">
                  support@onurd.com.tr
                </a>{' '}
                adresi üzerinden bizimle iletişime geçebilirsiniz.
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
