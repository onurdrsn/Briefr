import React, { useState, useRef, useEffect } from 'react'
import { Mail, CheckCircle2, RefreshCw, LogOut, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAuthStore } from '../../lib/store'
import { trpc } from '../../lib/trpc'
import { Button } from '../../components/ui/Button'

export function VerifyEmailScreen() {
  const { user, logout } = useAuth()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setSuccessMsg('E-posta adresiniz başarıyla doğrulandı! Uygulama açılıyor...')
      const currentState = useAuthStore.getState()
      if (currentState.token && currentState.user) {
        currentState.setAuth(currentState.token, { ...currentState.user, emailVerified: true }, currentState.workspace)
      }
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)
    },
    onError: (err) => {
      setError(err.message || 'Geçersiz doğrulama kodu. Lütfen tekrar deneyin.')
    },
  })

  const resendMutation = trpc.auth.resendVerificationCode.useMutation({
    onSuccess: () => {
      setSuccessMsg('Yeni doğrulama kodu e-posta adresinize gönderildi!')
      setCooldown(60)
      setTimeout(() => setSuccessMsg(''), 4000)
    },
    onError: (err) => {
      setError(err.message || 'Kod gönderilemedi. Lütfen biraz sonra tekrar deneyin.')
    },
  })

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    setError('')

    // Auto advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').trim()
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('')
      setCode(digits)
      inputRefs.current[5]?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError('Lütfen 6 haneli doğrulama kodunu eksiksiz girin.')
      return
    }
    verifyMutation.mutate({ code: fullCode })
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 mx-auto flex items-center justify-center shadow-lg shadow-purple-600/20">
            <Mail className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">E-Posta Adresinizi Doğrulayın</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hesabınızı kullanabilmek için <strong className="text-purple-300">{user?.email}</strong> adresine gönderdiğimiz 6 haneli güvenlik kodunu girin.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 6 Digit Input Boxes */}
          <div className="flex items-center justify-between gap-2">
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-xl font-bold text-slate-100 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          <Button type="submit" className="w-full justify-center" isLoading={verifyMutation.isPending}>
            Doğrula ve Hesabı Aç →
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            disabled={cooldown > 0 || resendMutation.isPending}
            onClick={() => resendMutation.mutate()}
            className="text-purple-400 hover:underline flex items-center gap-1.5 disabled:opacity-50 disabled:no-underline font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resendMutation.isPending ? 'animate-spin' : ''}`} />
            <span>{cooldown > 0 ? `Yeniden Gönder (${cooldown}s)` : 'Kodu Tekrar Gönder'}</span>
          </button>

          <button
            type="button"
            onClick={() => logout()}
            className="text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </div>
    </div>
  )
}
