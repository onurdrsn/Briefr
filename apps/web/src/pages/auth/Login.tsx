import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const { login, isLoading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login({ email, password })
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 mx-auto flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-600/30">
            <img src="/logo-icon.png" alt="Briefr" className="w-8 h-8 object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Briefr'a Giriş Yap</h2>
          <p className="text-sm text-slate-400">Proje hafızanıza erişmek için giriş yapın</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Giriş Yap →
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400 space-y-2">
          <p>
            Hesabınız yok mu?{' '}
            <Link to="/register" className="text-purple-400 hover:underline font-medium">
              Hemen Kaydolun
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
