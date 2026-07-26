import React, { useState } from 'react'
import { Check, Zap, ShieldAlert, CreditCard, Sparkles, Lock, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAuthStore } from '../../lib/store'
import { trpc } from '../../lib/trpc'
import { Header } from '../../components/layout/Header'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Alert } from '../../components/ui/Alert'
import { formatErrorMessage } from '../../lib/error-formatter'

export function Billing() {
  const { workspace, user, logout } = useAuth()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | null>(null)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [cardError, setCardError] = useState('')

  // Credit Card Form State
  const [cardName, setCardName] = useState(user?.fullName || '')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')

  const planQuery = trpc.billing.currentPlan.useQuery(
    { workspaceId: workspace?.id! },
    { enabled: !!workspace?.id }
  )

  const upgradePlanMutation = trpc.billing.upgradePlan.useMutation({
    onSuccess: (data) => {
      planQuery.refetch()
      const currentState = useAuthStore.getState()
      if (currentState.token && currentState.user && currentState.workspace) {
        currentState.setAuth(currentState.token, currentState.user, {
          ...currentState.workspace,
          plan: data.plan,
        })
      }
      const planName = data.plan === 'pro' ? 'Pro' : 'Starter'
      setSuccessMessage(`Tebrikler! Ödemeniz alındı ve planınız başarıyla ${planName} Plan olarak aktifleştirildi! 🎉`)
      setIsCardModalOpen(false)
      window.history.replaceState({}, document.title, window.location.pathname)
    },
    onError: (err) => {
      setCardError(err.message || 'Ödeme tamamlanamadı. Lütfen kart bilgilerinizi kontrol edin.')
    },
  })

  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => {
      logout()
    },
    onError: (err) => {
      setDeleteError(err.message || 'Şifre doğrulanamadı.')
    },
  })

  const handleOpenPaymentModal = (planId: 'starter' | 'pro') => {
    setSelectedPlan(planId)
    setCardError('')
    setIsCardModalOpen(true)
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim()
    setCardNumber(formatted)
  }

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2)
    }
    setCardExpiry(raw)
  }

  const handleCardCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))
  }

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setCardError('')

    const cleanCard = cardNumber.replace(/\s/g, '')
    if (cleanCard.length < 16) {
      setCardError('Lütfen 16 haneli kart numaranızı eksiksiz girin.')
      return
    }
    if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
      setCardError('Lütfen son kullanma tarihini AA/YY formatında girin.')
      return
    }
    if (cardCvc.length < 3) {
      setCardError('Lütfen 3 haneli güvenlik kodunu (CVC) girin.')
      return
    }

    if (!workspace?.id || !selectedPlan) return

    await upgradePlanMutation.mutateAsync({
      workspaceId: workspace.id,
      planId: selectedPlan,
    })
  }

  const handleDeleteAccount = (e: React.FormEvent) => {
    e.preventDefault()
    setDeleteError('')
    deleteAccountMutation.mutate({ confirmPassword })
  }

  const currentPlan = planQuery.data?.plan || 'free'
  const chunksUsed = planQuery.data?.chunksThisMonth || 0

  const planPrices = {
    starter: billingCycle === 'yearly' ? 1490 : 149,
    pro: billingCycle === 'yearly' ? 3990 : 399,
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Header title="Plan & Abonelik Yönetimi" />

      <main className="p-8 space-y-10 max-w-6xl mx-auto w-full">
        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {upgradePlanMutation.isError && (
          <Alert variant="danger" title="Plan Yükseltilemedi" onClose={() => upgradePlanMutation.reset()}>
            {formatErrorMessage(upgradePlanMutation.error)}
          </Alert>
        )}

        {/* Usage Progress Overview */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-slate-100">Mevcut Kullanım</h3>
              <Badge variant="purple" className="capitalize">{currentPlan} Plan</Badge>
            </div>
            <span className="text-xs text-slate-400">Bu ay sıfırlanma tarihi: 30 gün içinde</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-300">
              <span>İndekslenen Chunk Limiti</span>
              <span>
                {chunksUsed} / {currentPlan === 'free' ? 500 : currentPlan === 'starter' ? 5000 : 50000} chunk
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (chunksUsed / (currentPlan === 'free' ? 500 : currentPlan === 'starter' ? 5000 : 50000)) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex flex-col items-center space-y-3">
          <div className="inline-flex items-center bg-slate-900 border border-slate-800 p-1.5 rounded-xl gap-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                billingCycle === 'monthly' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Aylık Ödeme
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                billingCycle === 'yearly' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Yıllık Ödeme</span>
              <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[10px]">%17 İndirim</span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-100 text-lg">Free</h4>
                <p className="text-xs text-slate-400">Deneme ve küçük projeler için</p>
              </div>

              <div className="text-3xl font-extrabold text-slate-100">
                ₺0 <span className="text-xs font-normal text-slate-400">/ ay</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> 3 Aktif Proje
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> 500 Chunk / ay
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> BGE-M3 Vektör Arama
                </li>
              </ul>
            </div>

            <Button
              variant="outline"
              disabled={currentPlan === 'free'}
              className="w-full disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-900 disabled:text-slate-400 disabled:border-slate-800"
            >
              {currentPlan === 'free' ? 'Mevcut Planınız' : 'Free Plana Geç'}
            </Button>
          </div>

          {/* Starter Plan */}
          <div className="p-6 bg-slate-900 border-2 border-purple-500/60 rounded-2xl flex flex-col justify-between space-y-6 relative shadow-xl shadow-purple-600/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Popüler
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-100 text-lg">Starter</h4>
                <p className="text-xs text-slate-400">Freelancer ve küçük ajanslar</p>
              </div>

              <div className="text-3xl font-extrabold text-slate-100">
                {billingCycle === 'yearly' ? '₺1,490' : '₺149'}{' '}
                <span className="text-xs font-normal text-slate-400">/ {billingCycle === 'yearly' ? 'yıl' : 'ay'}</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> 20 Aktif Proje
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> 5,000 Chunk / ay
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Slack, Gmail, Notion OAuth
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> DIFY streaming RAG
                </li>
              </ul>
            </div>

            <Button
              onClick={() => handleOpenPaymentModal('starter')}
              disabled={currentPlan === 'starter'}
              className="w-full disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-purple-950 disabled:text-purple-300 disabled:border-purple-800"
            >
              {currentPlan === 'starter' ? 'Mevcut Planınız' : 'Starter Planı Seç'}
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-100 text-lg">Pro</h4>
                <p className="text-xs text-slate-400">Büyüyen ajanslar ve ekipler</p>
              </div>

              <div className="text-3xl font-extrabold text-slate-100">
                {billingCycle === 'yearly' ? '₺3,990' : '₺399'}{' '}
                <span className="text-xs font-normal text-slate-400">/ {billingCycle === 'yearly' ? 'yıl' : 'ay'}</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Sınırsız Proje
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> 50,000 Chunk / ay
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Öncelikli Ingestion Kuyruğu
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Özel İyzico ve Resend Desteği
                </li>
              </ul>
            </div>

            <Button
              onClick={() => handleOpenPaymentModal('pro')}
              disabled={currentPlan === 'pro'}
              className="w-full disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-purple-950 disabled:text-purple-300 disabled:border-purple-800"
            >
              {currentPlan === 'pro' ? 'Mevcut Planınız' : 'Pro Planı Seç'}
            </Button>
          </div>
        </div>

        {/* KVKK & Account Deletion Section */}
        <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <ShieldAlert className="w-4 h-4" />
              <span>KVKK Hakları & Veri Silme</span>
            </div>
            <p className="text-xs text-slate-400">
              KVKK uyarınca hesabınızı ve projelerinize ait tüm vektör hafızasını kalıcı olarak silebilirsiniz.
            </p>
          </div>

          <Button variant="danger" size="sm" onClick={() => setIsDeleteModalOpen(true)}>
            Verilerimi Kalıcı Olarak Sil
          </Button>
        </div>
      </main>

      {/* Credit Card Payment Modal */}
      <Modal isOpen={isCardModalOpen} onClose={() => setIsCardModalOpen(false)} title="Kredi / Banka Kartı ile Güvenli Ödeme">
        <form onSubmit={handleProcessPayment} className="space-y-5">
          {/* Plan Summary Badge */}
          <div className="p-4 bg-purple-950/60 border border-purple-800/60 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100 capitalize">
                  Briefr {selectedPlan || 'Starter'} Planı
                </p>
                <p className="text-xs text-slate-400">
                  {billingCycle === 'yearly' ? 'Yıllık Abonelik Paket' : 'Aylık Abonelik Paket'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-purple-300">
                ₺{selectedPlan ? planPrices[selectedPlan] : 149} TL
              </p>
              <p className="text-[10px] text-slate-400">/ {billingCycle === 'yearly' ? 'yıl' : 'ay'}</p>
            </div>
          </div>

          {/* Visual Interactive Credit Card Mockup */}
          <div className="p-5 bg-gradient-to-tr from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 rounded-2xl shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold tracking-widest text-purple-300 uppercase">BRIEFR SECURE CARD</span>
              <div className="flex gap-1.5">
                <div className="w-6 h-4 bg-rose-500/80 rounded-sm"></div>
                <div className="w-6 h-4 bg-amber-500/80 rounded-sm"></div>
              </div>
            </div>

            <div className="text-lg font-mono tracking-widest text-slate-100 font-bold">
              {cardNumber || '•••• •••• •••• ••••'}
            </div>

            <div className="flex justify-between items-end text-xs font-mono">
              <div>
                <p className="text-[9px] text-slate-400 uppercase">KART SAHİBİ</p>
                <p className="font-bold text-slate-200 uppercase">{cardName || 'AD SOYAD'}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase">SON KULL.</p>
                <p className="font-bold text-slate-200">{cardExpiry || 'MM/YY'}</p>
              </div>
            </div>
          </div>

          {cardError && (
            <Alert variant="danger" title="Kart Hatası" onClose={() => setCardError('')}>
              {cardError}
            </Alert>
          )}

          {/* Form Inputs */}
          <div className="space-y-3.5">
            <Input
              label="Kart Üzerindeki İsim"
              placeholder="Ahmet Yılmaz"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              required
            />

            <Input
              label="Kart Numarası"
              placeholder="4543 6012 3456 7890"
              value={cardNumber}
              onChange={handleCardNumberChange}
              maxLength={19}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Son Kullanma Tarihi"
                placeholder="12/28"
                value={cardExpiry}
                onChange={handleCardExpiryChange}
                maxLength={5}
                required
              />

              <Input
                label="Güvenlik Kodu (CVC)"
                placeholder="123"
                type="password"
                value={cardCvc}
                onChange={handleCardCvcChange}
                maxLength={4}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Ödemeniz 256-bit SSL ve 3D Secure altyapısı ile güvence altındadır.</span>
          </div>

          <div className="pt-2 flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setIsCardModalOpen(false)}>
              İptal
            </Button>
            <Button type="submit" isLoading={upgradePlanMutation.isPending} className="bg-purple-600 hover:bg-purple-500 text-white font-bold">
              ₺{selectedPlan ? planPrices[selectedPlan] : 149} TL Öde ve Aktifleştir →
            </Button>
          </div>
        </form>
      </Modal>

      {/* KVKK Delete Account Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Hesabı Kalıcı Olarak Sil">
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <p className="text-sm text-slate-300">
            Bu işlem geri alınamaz. Hesabınız, projeleriniz ve tüm hafıza chunk'larınız silinecektir.
          </p>

          {deleteError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">
              {deleteError}
            </div>
          )}

          <Input
            label="Doğrulama için mevcut şifrenizi girin"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              İptal
            </Button>
            <Button type="submit" variant="danger" isLoading={deleteAccountMutation.isPending}>
              Şifreyi Onayla ve Sil
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
