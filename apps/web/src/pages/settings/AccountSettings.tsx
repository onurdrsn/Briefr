import React, { useState } from 'react'
import { User, KeyRound, Bell, ShieldAlert, Check, Camera, ShieldCheck, Trash2, Save } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Header } from '../../components/layout/Header'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'

export function AccountSettings() {
  const { user } = useAuth()

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [title, setTitle] = useState('Kurucu / Yönetici')
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('')

  // Password State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Notification Toggles
  const [emailDigest, setEmailDigest] = useState(true)
  const [syncAlerts, setSyncAlerts] = useState(true)
  const [securityAlerts, setSecurityAlerts] = useState(true)

  // Delete Account Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSuccessMsg('Profil bilgileriniz güncellendi.')
    setTimeout(() => setProfileSuccessMsg(''), 3000)
  }

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccessMsg('')

    if (newPassword.length < 8) {
      setPasswordError('Yeni şifre en az 8 karakter olmalıdır.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Yeni şifreler birbiriyle eşleşmiyor.')
      return
    }

    setPasswordSuccessMsg('Şifreniz başarıyla güncellendi.')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPasswordSuccessMsg(''), 3000)
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Header title="Hesap ve Profil Ayarları" />

      <main className="p-8 space-y-8 max-w-4xl mx-auto w-full">
        {/* Profile Card */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Profil Bilgileri</h3>
                <p className="text-xs text-slate-400">Kişisel bilgilerinizi ve profil avatarınızı yönetin</p>
              </div>
            </div>
            {profileSuccessMsg && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-medium">
                <Check className="w-3.5 h-3.5" /> {profileSuccessMsg}
              </span>
            )}
          </div>

          {/* Avatar Upload Preview */}
          <div className="flex items-center gap-5 p-4 bg-slate-950 border border-slate-800/80 rounded-xl">
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold text-xl flex items-center justify-center shadow-lg">
                {fullName?.slice(0, 2).toUpperCase() || 'ON'}
              </div>
              <button
                type="button"
                className="absolute inset-0 bg-slate-950/70 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                title="Fotoğraf Değiştir"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-slate-200">{fullName || 'Kullanıcı'}</h4>
              <p className="text-xs text-slate-400">{email}</p>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="purple">Doğrulanmış Hesap</Badge>
                <span className="text-[11px] text-slate-500">JPG, PNG (max 2MB)</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Ad Soyad"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label="Unvan / Pozisyon"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Kurucu, Ürün Yöneticisi"
              />
            </div>

            <Input
              label="E-posta Adresi"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="flex justify-end pt-2">
              <Button type="submit">
                <Save className="w-4 h-4" />
                <span>Profili Kaydet</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Security & Password Card */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Şifre ve Güvenlik</h3>
                <p className="text-xs text-slate-400">Hesap şifrenizi güncelleyin ve güvenlik ayarlarınızı yönetin</p>
              </div>
            </div>

            {passwordSuccessMsg && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-medium">
                <Check className="w-3.5 h-3.5" /> {passwordSuccessMsg}
              </span>
            )}
          </div>

          {passwordError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
              {passwordError}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <Input
              label="Mevcut Şifre"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Yeni Şifre"
                type="password"
                placeholder="En az 8 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                label="Yeni Şifre (Tekrar)"
                type="password"
                placeholder="En az 8 karakter"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="secondary">
                <span>Şifreyi Değiştir</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Notification Preferences */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Bildirim Tercihleri</h3>
              <p className="text-xs text-slate-400">E-posta ve sistem bildirimlerinizi özelleştirin</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800/80 rounded-xl cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-semibold text-sm text-slate-200">Haftalık Proje Özeti Bülteni</span>
                <p className="text-xs text-slate-400">Projenizdeki yeni eklenen verilerin ve yapay zeka özetlerinin haftalık e-posta raporu.</p>
              </div>
              <input
                type="checkbox"
                checked={emailDigest}
                onChange={(e) => setEmailDigest(e.target.checked)}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800/80 rounded-xl cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-semibold text-sm text-slate-200">Entegrasyon Senkronizasyon Uvarıları</span>
                <p className="text-xs text-slate-400">Slack, Gmail veya Notion senkronizasyon hatası olduğunda anında e-posta al.</p>
              </div>
              <input
                type="checkbox"
                checked={syncAlerts}
                onChange={(e) => setSyncAlerts(e.target.checked)}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800/80 rounded-xl cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-semibold text-sm text-slate-200">Güvenlik ve Oturum Uyarıları</span>
                <p className="text-xs text-slate-400">Yeni bir cihazdan giriş yapıldığında güvenlik uyarısı al.</p>
              </div>
              <input
                type="checkbox"
                checked={securityAlerts}
                onChange={(e) => setSecurityAlerts(e.target.checked)}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* KVKK & Danger Zone */}
        <div className="p-6 bg-slate-900 border border-rose-950/60 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Gizlilik ve Tehlikeli Bölge</h3>
                <p className="text-xs text-slate-400">KVKK veri hakları ve hesap silme işlemleri</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-medium">
              <ShieldCheck className="w-4 h-4" /> KVKK Onaylı
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-semibold text-sm text-slate-200">Kişisel Verileri ve Hesabı Kalıcı Sil</h4>
              <p className="text-xs text-slate-400">
                Hesabınızı, projelerinizi ve tüm vektör indekslerinizi sistemlerimizden kalıcı olarak temizler.
              </p>
            </div>
            <Button variant="outline" className="text-rose-400 hover:bg-rose-500/10 border-rose-500/20" onClick={() => setIsDeleteModalOpen(true)}>
              <Trash2 className="w-4 h-4" />
              <span>Hesabı Sil</span>
            </Button>
          </div>
        </div>
      </main>

      {/* Delete Account Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Hesabı Kalıcı Olarak Sil">
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Bu işlem geri alınamaz. Hesabınız, projeleriniz, entegrasyonlarınız ve Cloudflare Vectorize üzerindeki tüm veri hafızanız kalıcı olarak silinecektir.
          </p>

          <Input
            label='Onaylamak için "SIL" yazın'
            placeholder="SIL"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />

          <div className="pt-3 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              İptal
            </Button>
            <Button variant="primary" className="bg-rose-600 hover:bg-rose-500" disabled={deleteConfirmText !== 'SIL'}>
              Kalıcı Olarak Sil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
