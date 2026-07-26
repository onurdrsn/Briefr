import { trpc } from '../lib/trpc'

export function useIngestion(sourceId?: string) {
  const historyQuery = trpc.source.ingestionHistory.useQuery(
    { sourceId: sourceId!, limit: 5 },
    { enabled: !!sourceId, refetchInterval: 3000 }
  )

  const resyncMutation = trpc.source.resync.useMutation()

  return {
    history: historyQuery.data ?? [],
    isLoading: historyQuery.isLoading,
    resync: (id: string) => resyncMutation.mutateAsync({ id }),
    isResyncing: resyncMutation.isPending,
  }
}
