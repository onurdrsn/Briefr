import { useEffect } from 'react'
import { useAuthStore } from '../lib/store'
import { trpc } from '../lib/trpc'

export function useAuth() {
  const { token, user, workspace, setAuth, clearAuth } = useAuthStore()

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !!token,
    staleTime: 5000,
  })

  useEffect(() => {
    if (meQuery.data && token) {
      setAuth(
        token,
        {
          id: meQuery.data.id,
          email: meQuery.data.email,
          fullName: meQuery.data.fullName,
          avatarUrl: meQuery.data.avatarUrl,
          emailVerified: meQuery.data.emailVerified,
        },
        meQuery.data.workspace
      )
    }
  }, [meQuery.data, token])

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setAuth(data.token, data.user, data.workspace)
    },
  })

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setAuth(data.token, data.user, data.workspace)
    },
  })

  const logoutMutation = trpc.auth.logout.useMutation({
    onSettled: () => {
      clearAuth()
    },
  })

  return {
    token,
    user,
    workspace,
    isAuthenticated: !!token && !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoading: loginMutation.isPending || registerMutation.isPending,
  }
}
