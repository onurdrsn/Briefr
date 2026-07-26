import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { trpc } from './lib/trpc'
import { useAuthStore } from './lib/store'
import { App } from './App'
import './app.css'

function Root() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5000,
        refetchOnWindowFocus: false,
      },
    },
  }))

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/trpc',
          async fetch(url, options) {
            const res = await fetch(url, options)
            const contentType = res.headers.get('content-type') || ''
            if (!res.ok && !contentType.includes('application/json')) {
              const text = await res.text()
              return new Response(
                JSON.stringify([
                  {
                    error: {
                      message: text || `Sunucu yanıt vermedi (${res.status})`,
                      code: -32603,
                      data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: res.status },
                    },
                  },
                ]),
                {
                  status: res.status,
                  headers: { 'content-type': 'application/json' },
                }
              )
            }
            return res
          },
          headers: () => {
            const token = useAuthStore.getState().token
            return token ? { Authorization: `Bearer ${token}` } : {}
          },
        }),
      ],
    })
  )

  return (
    <React.StrictMode>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </trpc.Provider>
    </React.StrictMode>
  )
}

const container = document.getElementById('root')!
const root = (container as any)._reactRoot || ReactDOM.createRoot(container)
;(container as any)._reactRoot = root

root.render(<Root />)
