import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LifeBuoy, Mail, MessageSquare, HelpCircle, CheckCircle2, ArrowLeft, Send } from 'lucide-react'
import { useLanguage, LanguageToggle } from '../../context/LanguageContext'

export function SupportPage() {
  const { lang } = useLanguage()
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'slack_integration',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-purple-500/30">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              B
            </div>
            <span className="font-bold text-slate-100 tracking-tight text-lg">Briefr</span>
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
      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full space-y-12">
        {/* Hero Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium">
            <LifeBuoy className="w-4 h-4" />
            <span>{lang === 'en' ? 'Briefr Customer & Technical Support' : 'Briefr Müşteri & Teknik Destek'}</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            {lang === 'en' ? 'How Can We Help You?' : 'Size Nasıl Yardımcı Olabiliriz?'}
          </h1>
          <p className="text-sm text-slate-400">
            {lang === 'en'
              ? 'Contact our team for Slack integration help, account issues, or technical inquiries.'
              : 'Slack entegrasyonu, veri kaynakları veya teknik sorularınız için ekibimize ulaşabilirsiniz.'}
          </p>
        </div>

        {/* Support Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">{lang === 'en' ? 'Email Support' : 'E-posta Destek'}</h3>
            <p className="text-xs text-slate-400">
              {lang === 'en'
                ? 'Reach out directly for technical questions and enterprise inquiry.'
                : 'Teknik sorularınız ve destek talepleriniz için doğrudan yazın.'}
            </p>
            <a href="mailto:support@onurd.com.tr" className="inline-block text-xs font-semibold text-purple-400 hover:underline">
              support@onurd.com.tr →
            </a>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">{lang === 'en' ? 'Slack App Landing' : 'Slack Uygulaması'}</h3>
            <p className="text-xs text-slate-400">
              {lang === 'en'
                ? 'Install Briefr Slack App or view workspace settings.'
                : 'Slack entegrasyon kurulum kılavuzu ve canlı destek.'}
            </p>
            <Link to="/superserviceco" className="inline-block text-xs font-semibold text-emerald-400 hover:underline">
              {lang === 'en' ? 'Slack App Page →' : 'Slack Sayfası →'}
            </Link>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">{lang === 'en' ? 'Frequently Asked Questions' : 'Sıkça Sorulan Sorular'}</h3>
            <p className="text-xs text-slate-400">
              {lang === 'en' ? 'Quick answers regarding permissions, security, and setup.' : 'Kurulum ve veri güvenliği hakkında hızlı yanıtlar.'}
            </p>
            <a href="#faq" className="inline-block text-xs font-semibold text-amber-400 hover:underline">
              {lang === 'en' ? 'View FAQ ↓' : 'SSS İnceleyin ↓'}
            </a>
          </div>
        </div>

        {/* Form Section */}
        <section className="bg-slate-900 border border-slate-800/90 rounded-3xl p-8 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white">
              {lang === 'en' ? 'Submit a Support Ticket' : 'Destek Talebi Gönderin'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'en'
                ? 'Fill out the form below and our team will get back to you within 24 hours.'
                : 'Formu doldurun, ekibimiz en kısa sürede dönüş yapsın.'}
            </p>
          </div>

          {submitted ? (
            <div className="p-8 text-center bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-white text-lg">
                {lang === 'en' ? 'Ticket Submitted Successfully!' : 'Talebiniz Alındı!'}
              </h3>
              <p className="text-xs text-slate-300">
                {lang === 'en' ? 'We have received your ticket and will respond to ' : 'En kısa sürede '}
                <span className="text-white font-semibold">{formData.email}</span>.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 text-xs font-medium text-purple-400 hover:underline"
              >
                {lang === 'en' ? 'Submit another ticket' : 'Yeni talep oluştur'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">{lang === 'en' ? 'Full Name *' : 'Adınız Soyadınız *'}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Onur Dursun"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">{lang === 'en' ? 'Email Address *' : 'E-posta Adresiniz *'}</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="onur@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">{lang === 'en' ? 'Category' : 'Kategori'}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    <option value="slack_integration">Slack Integration & Permissions</option>
                    <option value="ai_memory">Semantic Memory & Search</option>
                    <option value="account_billing">Account & Billing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">{lang === 'en' ? 'Subject' : 'Konu'}</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Issue connecting Slack channel"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">{lang === 'en' ? 'Message *' : 'Mesajınız *'}</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={lang === 'en' ? 'Describe your issue or feedback in detail...' : 'Destek talebinizi yazabilirsiniz...'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-purple-500/25"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Send Support Ticket' : 'Talebi Gönder'}</span>
              </button>
            </form>
          )}
        </section>

        {/* FAQ Section */}
        <section id="faq" className="space-y-6 pt-4">
          <h2 className="text-2xl font-bold text-white text-center">
            {lang === 'en' ? 'Frequently Asked Questions' : 'Sıkça Sorulan Sorular'}
          </h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            <FaqItem
              question={lang === 'en' ? 'What data does Briefr access in Slack?' : 'Briefr Slack kanalındaki hangi verilere erişir?'}
              answer={
                lang === 'en'
                  ? 'Briefr only reads messages in public or private channels that you explicitly select. It does not access your DMs and never trains public AI models with your data.'
                  : 'Briefr yalnızca izin verdiğiniz kanallardaki mesajları okur. DM mesajlarınıza erişmez ve verilerinizi AI eğitimi için kullanmaz.'
              }
            />
            <FaqItem
              question={lang === 'en' ? 'How do I uninstall the Slack Integration?' : 'Slack entegrasyonunu nasıl kaldırabilirim?'}
              answer={
                lang === 'en'
                  ? 'You can remove Briefr at any time from Slack Workspace Settings (App Directory -> Managed Apps) or from the Integrations tab inside the Briefr dashboard.'
                  : 'Slack uygulamasını Slack Çalışma Alanı Ayarları altından veya Briefr panelindeki Entegrasyonlar sekmesinden dilediğiniz an kaldırabilirsiniz.'
              }
            />
            <FaqItem
              question={lang === 'en' ? 'Where is my data stored?' : 'Verilerim nerede depolanıyor?'}
              answer={
                lang === 'en'
                  ? 'Data is encrypted in transit (TLS 1.3) and stored securely in Neon PostgreSQL and Cloudflare Vectorize isolated namespaces.'
                  : 'Verileriniz uçtan uca şifrelenmiş olarak Neon PostgreSQL ve Cloudflare Vectorize üzerinde saklanır.'
              }
            />
          </div>
        </section>
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

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-slate-100">{question}</h4>
        <span className="text-purple-400 text-lg font-bold">{isOpen ? '−' : '+'}</span>
      </div>
      {isOpen && <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800/60">{answer}</p>}
    </div>
  )
}
