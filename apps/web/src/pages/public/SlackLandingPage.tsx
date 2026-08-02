import { Link } from 'react-router-dom'
import { Sparkles, ShieldCheck, ArrowRight, CheckCircle2, Bot, Layers } from 'lucide-react'
import { useLanguage, LanguageToggle } from '../../context/LanguageContext'

export function SlackLandingPage() {
  const { lang } = useLanguage()

  const handleAddToSlack = () => {
    window.location.href = '/login?next=/settings/integrations'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-purple-500/30">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              B
            </div>
            <span className="font-bold text-lg text-slate-100 tracking-tight">Briefr for Slack</span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Link to="/login" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              {lang === 'en' ? 'Log In' : 'Giriş Yap'}
            </Link>
            <button
              onClick={handleAddToSlack}
              className="inline-flex items-center gap-2 bg-[#4A154B] hover:bg-[#611B65] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-[#4A154B]/30 border border-purple-400/20"
            >
              <SlackLogoIcon className="w-4 h-4" />
              <span>{lang === 'en' ? 'Add to Slack' : 'Slack’e Ekle'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex-1 w-full space-y-20">
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>{lang === 'en' ? 'Official Slack App Integration' : 'Resmi Slack Entegrasyon Uygulaması'}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            {lang === 'en' ? (
              <>
                Turn Your Slack Channel Memory <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-emerald-400">
                  Into An Instant AI Knowledge Base
                </span>
              </>
            ) : (
              <>
                Slack Kanal Hafızanızı <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-emerald-400">
                  Yapay Zeka Asistanına Dönüştürün
                </span>
              </>
            )}
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {lang === 'en'
              ? 'Stop searching endlessly through channels and threads. Briefr indexes your Slack conversations, Gmail, and Notion pages so your team gets instant, context-aware answers to any question.'
              : 'Slack kanallarınızdaki eski konuşmaları, kararları ve dosyaları aramakla zaman kaybetmeyin. Briefr ekibinizin hafızasını indeksler ve sorularınıza saniyeler içinde cevap verir.'}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleAddToSlack}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#4A154B] hover:bg-[#611B65] text-white text-sm font-bold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-[#4A154B]/40 hover:scale-105"
            >
              <SlackLogoIcon className="w-5 h-5" />
              <span>{lang === 'en' ? 'Add to Slack — Free Trial' : 'Slack’e Ücretsiz Ekle'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <Link
              to="/support"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm font-semibold px-6 py-4 rounded-2xl border border-slate-800 transition-all"
            >
              <span>{lang === 'en' ? 'Documentation & Support' : 'Canlı Demo & Destek'}</span>
            </Link>
          </div>

          <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {lang === 'en' ? '2-Minute Setup' : 'Kurulum 2 dakika sürer'}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {lang === 'en' ? 'No DM Access Required' : 'DM erişimi gerektirmez'}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {lang === 'en' ? 'GDPR & KVKK Compliant' : 'KVKK & GDPR Uyumlu'}
            </span>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl space-y-4 hover:border-purple-500/30 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {lang === 'en' ? 'Instant Semantic Search' : 'Anlık Semantik Yanıtlar'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'en'
                ? 'Powered by BGE-M3 (768-dim) vector embeddings. Finds past decisions and conversations even if the exact keywords differ.'
                : 'BGE-M3 (768-dim) vektör modeli ile mesajlarınızın anlamsal özetini çıkarır. Birebir kelime eşleşmesi olmasa bile aradığınız kararları bulur.'}
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl space-y-4 hover:border-indigo-500/30 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {lang === 'en' ? 'Multi-Channel Syncing' : 'Çoklu Kanal Senkronizasyonu'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'en'
                ? 'Periodically syncs your selected Slack channels. Automatically ingests new messages so your team memory is always up to date.'
                : 'Seçtiğiniz Slack kanallarını periyodik olarak senkronize eder. Yeni bir mesaj paylaşıldığında otomatik hafızaya dahil eder.'}
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl space-y-4 hover:border-emerald-500/30 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {lang === 'en' ? 'Enterprise Data Security' : 'Kurumsal Veri Güvenliği'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'en'
                ? 'Your data is encrypted end-to-end with Cloudflare Workers and Neon PostgreSQL. We never use your data to train public models.'
                : 'Verileriniz Cloudflare Workers ve Neon PostgreSQL ile uçtan uca şifrelenir. Asla kamuya açık modellerin eğitimi için kullanılmaz.'}
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-10 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-white">
              {lang === 'en' ? 'How It Works (3 Easy Steps)' : 'Nasıl Çalışır? (3 Kolay Adım)'}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'en'
                ? 'Connect your Slack workspace and start querying team memory in minutes.'
                : 'Slack alanınızı Briefr’a bağlamak ve sorulara yanıt almak çok basittir.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            <div className="space-y-3 text-center">
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-black text-sm flex items-center justify-center mx-auto shadow-lg shadow-purple-600/30">
                1
              </div>
              <h4 className="font-bold text-white text-sm">{lang === 'en' ? 'Authorize Slack' : 'Slack’e Yetki Verin'}</h4>
              <p className="text-xs text-slate-400">
                {lang === 'en' ? 'Click "Add to Slack" to authorize your workspace.' : '\'Add to Slack\' butonuna tıklayarak çalışma alanınızı bağlayın.'}
              </p>
            </div>

            <div className="space-y-3 text-center">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
                2
              </div>
              <h4 className="font-bold text-white text-sm">{lang === 'en' ? 'Select Channels' : 'Kanalları Seçin'}</h4>
              <p className="text-xs text-slate-400">
                {lang === 'en' ? 'Choose which channels you want Briefr to index.' : 'İndekslenmesini istediğiniz kanalları seçin.'}
              </p>
            </div>

            <div className="space-y-3 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                3
              </div>
              <h4 className="font-bold text-white text-sm">{lang === 'en' ? 'Ask AI Anything' : 'AI Sohbeti Başlatın'}</h4>
              <p className="text-xs text-slate-400">
                {lang === 'en' ? 'Ask questions in natural language and get instant grounded answers.' : 'Sorularınızı doğal dille sorun, yanıtlar saniyeler içinde belirsin.'}
              </p>
            </div>
          </div>
        </section>

        {/* CTA Bottom Banner */}
        <section className="bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900 border border-purple-500/20 rounded-3xl p-10 text-center space-y-6">
          <h2 className="text-3xl font-extrabold text-white">
            {lang === 'en' ? 'Supercharge Your Team Memory' : 'Ekip Hafızanızı Canlandırın'}
          </h2>
          <p className="text-xs text-slate-300 max-w-xl mx-auto">
            {lang === 'en'
              ? 'Start your free trial today. Manage your Slack channels and team knowledge base in one unified dashboard.'
              : 'Hemen ücretsiz denemeye başlayın. Slack kanallarınızı ve ekibinizin veri kaynaklarını tek ekrandan yönetin.'}
          </p>
          <button
            onClick={handleAddToSlack}
            className="inline-flex items-center gap-3 bg-[#4A154B] hover:bg-[#611B65] text-white text-sm font-bold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-[#4A154B]/40"
          >
            <SlackLogoIcon className="w-5 h-5" />
            <span>{lang === 'en' ? 'Add to Slack Now' : 'Slack Uygulamasını Yükle'}</span>
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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

function SlackLogoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 122.8 122.8" fill="currentColor">
      <path fill="#E01E5A" d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z"/>
      <path fill="#36C5F0" d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z"/>
      <path fill="#2EB67D" d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z"/>
      <path fill="#ECB22E" d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z"/>
    </svg>
  )
}
