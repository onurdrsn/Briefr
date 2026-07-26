import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plus, Search, FileText, Settings, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react'
import { trpc } from '../../lib/trpc'
import { Header } from '../../components/layout/Header'
import { Button } from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { SourceCard } from '../../components/source-cards/SourceCard'
import { ChatInterface } from '../../components/chat/ChatInterface'
import { AddSourceModal } from '../../components/sources/AddSourceModal'

export function ProjectDetail() {
  const { id: projectId } = useParams<{ id: string }>()
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false)

  const projectQuery = trpc.project.get.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  )

  const sourcesQuery = trpc.source.list.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId, refetchInterval: 5000 }
  )

  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null)

  const deleteSourceMutation = trpc.source.delete.useMutation({
    onSuccess: () => {
      setDeletingSourceId(null)
      sourcesQuery.refetch()
    },
  })

  const handleConfirmDeleteSource = () => {
    if (deletingSourceId) {
      deleteSourceMutation.mutate({ id: deletingSourceId })
    }
  }

  const resyncSourceMutation = trpc.source.resync.useMutation({
    onSuccess: () => sourcesQuery.refetch(),
  })

  if (!projectId || projectQuery.isLoading) {
    return (
      <div className="flex-1 bg-slate-950 p-8 flex items-center justify-center text-slate-400">
        Yükleniyor...
      </div>
    )
  }

  const project = projectQuery.data

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Header title={`${project?.emoji} ${project?.name}`} />

      {/* Sub-header with action buttons */}
      <div className="border-b border-slate-800 bg-slate-900/40 px-6 py-2 flex items-center gap-2">
        <Link
          to={`/projects/${projectId}/memory`}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Semantik Arama</span>
        </Link>
      </div>

      <main className="flex-1 p-6 flex gap-6 overflow-hidden max-w-[1600px] w-full mx-auto">
        {/* Left Panel: Sources */}
        <div className="w-96 flex flex-col gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100 text-base">Veri Kaynakları</h3>
              <p className="text-xs text-slate-400">{sourcesQuery.data?.length || 0} bağlı kaynak</p>
            </div>
            <Button size="sm" onClick={() => setIsAddSourceOpen(true)}>
              <Plus className="w-4 h-4" />
              <span>Kaynak Ekle</span>
            </Button>
          </div>

          {/* Sources List */}
          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            {sourcesQuery.data?.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-3">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Henüz bu projeye kaynak eklenmedi. Brief veya not eklemek için yukarıdaki butona tıklayın.
                </p>
              </div>
            ) : (
              sourcesQuery.data?.map((source) => (
                <SourceCard
                  key={source.id}
                  source={source as any}
                  onResync={() => resyncSourceMutation.mutate({ id: source.id })}
                  onDelete={() => setDeletingSourceId(source.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Panel: AI Memory Chat Interface */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatInterface projectId={projectId} />
        </div>
      </main>

      {/* Add Source Modal Component */}
      <AddSourceModal
        isOpen={isAddSourceOpen}
        onClose={() => setIsAddSourceOpen(false)}
        projectId={projectId}
        onSuccess={() => sourcesQuery.refetch()}
      />

      {/* Delete Source Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingSourceId}
        onClose={() => setDeletingSourceId(null)}
        onConfirm={handleConfirmDeleteSource}
        isLoading={deleteSourceMutation.isPending}
        title="Veri Kaynağını Sil"
        description="Bu veri kaynağını ve kaynağa ait tüm indekslenmiş vektör verilerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Kaynağı Sil"
      />
    </div>
  )
}
