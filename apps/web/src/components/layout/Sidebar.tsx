import { NavLink } from 'react-router-dom'
import { FolderKanban, Sliders, CreditCard, LogOut, ChevronRight, Plus, Sparkles, User, Zap } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { trpc } from '../../lib/trpc'
import { useAppStore } from '../../lib/store'
import { cn } from '../../lib/utils'

export function Sidebar() {
  const { workspace, logout } = useAuth()
  const { activeProjectId, setActiveProject } = useAppStore()

  const projectsQuery = trpc.project.list.useQuery(
    { workspaceId: workspace?.id! },
    { enabled: !!workspace?.id }
  )

  const navItems = [
    { label: 'Projeler', icon: FolderKanban, path: '/dashboard' },
    { label: 'Entegrasyonlar', icon: Sliders, path: '/settings/integrations' },
    { label: 'Çalışma Alanı', icon: Sparkles, path: '/settings/workspace' },
    { label: 'Hesap Ayarları', icon: User, path: '/settings/account' },
    { label: 'Plan & Fatura', icon: CreditCard, path: '/billing' },
    { label: 'AI & Token Kullanımı', icon: Zap, path: '/usage' },
  ]

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div className="p-4 space-y-6">
        {/* Brand logo */}
        <div className="flex items-center gap-3 px-2">
          <img src="/logo-icon.png" alt="Briefr Logo" className="w-9 h-9 rounded-xl object-contain shadow-lg shadow-purple-600/30 border border-purple-500/20" />
          <div>
            <h1 className="font-bold text-slate-100 text-lg leading-tight tracking-tight">Briefr</h1>
            <p className="text-xs text-purple-400 font-medium truncate max-w-[120px]">{workspace?.name || 'Workspace'}</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Project List section */}
        <div className="space-y-2 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-400 tracking-wider uppercase">
            <span>Projeler</span>
            <NavLink to="/dashboard" className="hover:text-purple-400 transition-colors">
              <Plus className="w-4 h-4" />
            </NavLink>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {projectsQuery.data?.map((project) => (
              <NavLink
                key={project.id}
                to={`/projects/${project.id}`}
                onClick={() => setActiveProject(project.id)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group',
                    isActive || activeProjectId === project.id
                      ? 'bg-slate-800 text-purple-300 font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  )
                }
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-base">{project.emoji}</span>
                  <span className="truncate">{project.name}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* Clean Logout Footer */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/40">
        <span className="text-xs text-slate-500 font-medium">Briefr v1.0.0</span>
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20 font-medium"
          title="Çıkış Yap"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  )
}
