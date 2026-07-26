import { useAuth } from '../../hooks/useAuth'
import { Sparkles, ShieldCheck } from 'lucide-react'

export function Header({ title }: { title?: string }) {
  const { user, workspace } = useAuth()

  const planName = workspace?.plan ? (workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1)) : 'Free'

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <h2 className="text-lg font-semibold text-slate-100">{title || 'Dashboard'}</h2>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-medium text-purple-300">BGE-M3 Embedding Ready</span>
        </div>

        {/* Dynamic User & Plan Info */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800/80 px-3 py-1.5 rounded-xl shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-md shrink-0">
            {user?.fullName?.slice(0, 2).toUpperCase() || 'ON'}
          </div>
          <div className="flex flex-col text-left leading-tight">
            <span className="text-xs font-bold text-slate-100">{user?.fullName || 'Kullanıcı'}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-medium text-purple-300 uppercase tracking-wider">
                {planName} Plan
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
