import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  user: { id: string; email: string; fullName: string; avatarUrl?: string; emailVerified?: boolean } | null
  workspace: { id: string; name: string; slug: string; plan: string } | null
  setAuth: (token: string, user: AuthState['user'], workspace: AuthState['workspace']) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null, user: null, workspace: null,
      setAuth: (token, user, workspace) => set({ token, user, workspace }),
      clearAuth: () => set({ token: null, user: null, workspace: null }),
    }),
    { name: 'briefr-auth' }
  )
)

interface AppState {
  activeProjectId: string | null
  activeThreadId: string | null
  sidebarOpen: boolean
  setActiveProject: (id: string | null) => void
  setActiveThread: (id: string | null) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeProjectId: null,
  activeThreadId: null,
  sidebarOpen: true,
  setActiveProject: (activeProjectId) => set({ activeProjectId }),
  setActiveThread: (activeThreadId) => set({ activeThreadId }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
