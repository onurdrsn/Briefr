import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, CheckCircle2, ShieldCheck, ArrowDown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'

export function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [kvkkConsent, setKvkkConsent] = useState(false)
  const [error, setError] = useState('')

  // KVKK Modal State
  const [isKvkkModalOpen, setIsKvkkModalOpen] = useState(false)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const { register, isLoading } = useAuth()
  const navigate = useNavigate()

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    if (scrollHeight - scrollTop <= clientHeight + 20) {
      setHasScrolledToBottom(true)
    }
  }

  const handleOpenKvkkModal = () => {
    setIsKvkkModalOpen(true)
  }

  const handleAcceptKvkk = () => {
    setKvkkConsent(true)
    setIsKvkkModalOpen(false)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!kvkkConsent) {
      setError('Lütfen KVKK Aydınlatma Metnini okuyup onaylayın.')
      setIsKvkkModalOpen(true)
      return
    }

    try {
      await register({
        fullName,
        email,
        password,
        workspaceName,
      })
      navigate('/onboarding')
    } catch (err: any) {
      setError(err.message || 'Kayıt başarısız oldu. Lütfen bilgilerinizi kontrol edin.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 mx-auto flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-600/30">
            <img src="/logo-icon.png" alt="Briefr" className="w-8 h-8 object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Briefr Hesabı Oluştur</h2>
          <p className="text-sm text-slate-400">Ücretsiz başlayın, tüm proje hafızanızı birleştirin</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Ad Soyad"
            placeholder="Adınız ve Soyadınız"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            label="E-posta Adresi"
            type="email"
            placeholder="adiniz@sirketiniz.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Şifre"
            type="password"
            placeholder="En az 8 karakterli güvenli şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            label="Çalışma Alanı / Ajans Adı"
            placeholder="Şirket, Takım veya Ajans Adı"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            required
          />

          {/* KVKK Consent Box */}
          <div
            onClick={handleOpenKvkkModal}
            className={`p-3.5 border rounded-xl cursor-pointer transition-all flex items-start gap-3 ${
              kvkkConsent
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-purple-500/40'
            }`}
          >
            <div className="mt-0.5">
              {kvkkConsent ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
              )}
            </div>
            <div className="flex-1 text-xs leading-relaxed space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">
                  {kvkkConsent ? 'KVKK Metni Okundu ve Onaylandı' : 'KVKK Aydınlatma Metni ve Açık Rıza'}
                </span>
                <span className="text-[10px] text-purple-400 underline font-medium">Metni İncele</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                {kvkkConsent
                  ? 'Kişisel verilerinizin işlenmesine ilişkin aydınlatma metni okundu ve onaylandı.'
                  : 'Kaydolmadan önce KVKK penceresini açıp metnin tamamını okumanız gerekmektedir.'}
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Hesap Oluştur ve Başla →
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          Zaten hesabınız var mı?{' '}
          <Link to="/login" className="text-purple-400 hover:underline font-medium">
            Giriş Yapın
          </Link>
        </div>
      </div>

      {/* KVKK Modal */}
      <Modal
        isOpen={isKvkkModalOpen}
        onClose={() => setIsKvkkModalOpen(false)}
        title="Kişisel Verilerin Korunması Aydınlatma Metni ve Açık Rıza"
      >
        <div className="space-y-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center gap-2 text-xs text-purple-300">
            <FileText className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Onay butonunun aktifleşmesi için lütfen metnin en altına kadar kaydırın.</span>
          </div>

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="max-h-[55vh] overflow-y-auto p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-5 leading-relaxed pr-3 custom-scrollbar"
          >
            <div className="text-center space-y-1 pb-2 border-b border-slate-800">
              <h4 className="font-bold text-slate-100 text-sm">
                BRIEFR PLATFORMU KİŞİSEL VERİLERİN İŞLENMESİNE İLİŞKİN AYDINLATMA METNİ VE AÇIK RIZA BEYANI
              </h4>
              <p className="text-[11px] text-slate-400">
                (6698 Sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") m. 10 Kapsamında Bilgilendirme)
              </p>
            </div>

            <section className="space-y-1.5">
              <h5 className="font-semibold text-purple-400 text-xs">1. Veri Sorumlusunun Kimliği</h5>
              <p className="text-slate-400">
                6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, Briefr ("Şirket" veya "Platform") olarak, veri sorumlusu sıfatıyla; kullanıcılarımızın, müşterilerimizin ve iş ortaklarımızın kişisel verilerini aşağıda belirtilen şartlar, amaçlar ve hukuki sebepler çerçevesinde işlemekteyiz.
              </p>
            </section>

            <section className="space-y-1.5">
              <h5 className="font-semibold text-purple-400 text-xs">2. İşlenen Kişisel Veri Kategorileri</h5>
              <p className="text-slate-400">
                Briefr platformuna üye olmanız ve entegrasyon kaynakları bağlamanız durumunda aşağıdaki veri kategorileriniz işlenmektedir:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li><strong className="text-slate-200">Kimlik ve Hesap Bilgileri:</strong> Adınız, soyadınız, kullanıcı kimlik numaranız (UUID).</li>
                <li><strong className="text-slate-200">İletişim Bilgileri:</strong> E-posta adresiniz, şirket veya çalışma alanı (workspace) adınız.</li>
                <li><strong className="text-slate-200">Proje ve Entegrasyon Verileri:</strong> Bağladığınız Slack kanalları, Gmail iletileri, Notion sayfaları, WhatsApp sohbet dışa aktarımları, yüklenen PDF/metin dokümanları ve doğrudan girilen proje notları.</li>
                <li><strong className="text-slate-200">Yapay Zeka ve Vektör İndeks Verileri:</strong> Metinlerinizi temsil eden 768 boyutlu vektör gömmeleri (embeddings), anlamsal arama verileri ve sohbet geçmişi.</li>
                <li><strong className="text-slate-200">İşlem ve Ödeme Verileri:</strong> İyzico ödeme altyapısı üzerinden işlenen abonelik ve ödeme onay bilgileri (kredi kartı bilgileriniz hiçbir şekilde sunucularımızda saklanmaz).</li>
              </ul>
            </section>

            <section className="space-y-1.5">
              <h5 className="font-semibold text-purple-400 text-xs">3. Kişisel Verilerin İşlenme Amaçları</h5>
              <p className="text-slate-400">
                Kişisel verileriniz aşağıdaki amaçlar doğrultusunda işlenmektedir:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Platform hesaplarının oluşturulması ve kimlik doğrulama süreçlerinin yürütülmesi,</li>
                <li>Farklı kanallardan (Slack, Gmail, Notion vb.) gelen proje verilerinin temizlenmesi, bölümlenmesi (chunking) ve vektör veritabanına indekslenmesi,</li>
                <li>DIFY RAG yapay zeka altyapısı ile proje sorularınıza anlık, anlamsal ve doğru yanıtlar üretilmesi,</li>
                <li>Platform güvenliğinin ve erişim kontrolünün sağlanması,</li>
                <li>Abonelik, faturalandırma ve KVKK mevzuatından kaynaklanan yasal yükümlülüklerin yerine getirilmesi.</li>
              </ul>
            </section>

            <section className="space-y-1.5">
              <h5 className="font-semibold text-purple-400 text-xs">4. Veri Aktarımı ve Üçüncü Taraflar</h5>
              <p className="text-slate-400">
                Verileriniz yalnızca hizmetin sorunsuz sunulması için gerekli olan ve yüksek güvenlik standartlarına sahip teknik altyapı sağlayıcıları ile KVKK m. 8 ve m. 9 hükümlerine uygun olarak paylaşılır:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li><strong className="text-slate-200">Cloudflare Workers & Vectorize:</strong> Güvenli sunucusuz kod yürütme ve vektör indeks veritabanı.</li>
                <li><strong className="text-slate-200">Neon PostgreSQL:</strong> Şifrelenmiş ilişkisel veritabanı sunucusu.</li>
                <li><strong className="text-slate-200">Resend & İyzico:</strong> E-posta iletimi ve BDDK onaylı güvenli ödeme altyapısı.</li>
              </ul>
            </section>

            <section className="space-y-1.5">
              <h5 className="font-semibold text-purple-400 text-xs">5. Veri Güvenliği ve Şifreleme</h5>
              <p className="text-slate-400">
                Tüm harici platform erişim anahtarları (Slack OAuth tokens, Gmail tokens, Notion tokens) veritabanımızda düz metin olarak saklanmaz. Web Crypto API vasıtasıyla **AES-256-GCM** alan bazlı şifreleme algoritması ile şifrelenerek korunur. Şifreleriniz ise tek yönlü PBKDF2 algoritması ile karma yapılır (hashed).
              </p>
            </section>

            <section className="space-y-1.5">
              <h5 className="font-semibold text-purple-400 text-xs">6. KVKK Kapsamındaki Haklarınız (m. 11)</h5>
              <p className="text-slate-400">
                KVKK m. 11 uyarınca Şirketimize başvurarak; kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, işlenme amacını öğrenme, verilerinizin silinmesini isteme ve otomatik sistemler vasıtasıyla aleyhinize bir sonucun ortaya çıkmasına itiraz etme haklarına sahipsiniz.
              </p>
            </section>

            <section className="space-y-1.5">
              <h5 className="font-semibold text-purple-400 text-xs">7. Tam Veri Silme ve Hesabı Kapatma Garantisi</h5>
              <p className="text-slate-400">
                Briefr kullanıcılarına tam veri mülkiyeti sunar. Dilediğiniz an <strong>Ayarlar ➔ Plan & Fatura</strong> sayfasındaki <strong>"Tüm Verilerimi ve Hesabımı Sil"</strong> butonunu kullanarak, projenize ait tüm vektör indekslerini, sohbet geçmişinizi ve üyelik verilerinizi sistemlerimizden kalıcı ve geri döndürülemez şekilde silebilirsiniz.
              </p>
            </section>

            <div className="pt-2 text-center text-slate-500 font-medium border-t border-slate-800">
              --- Aydınlatma Metninin Sonu ---
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            {!hasScrolledToBottom ? (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
                <ArrowDown className="w-4 h-4 animate-bounce" />
                <span>Onaylamak için metni en aşağı kaydırın</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Metin okundu, onaylayabilirsiniz</span>
              </div>
            )}

            <Button
              onClick={handleAcceptKvkk}
              disabled={!hasScrolledToBottom}
              variant={hasScrolledToBottom ? 'primary' : 'secondary'}
            >
              Okudum ve Onaylıyorum
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
