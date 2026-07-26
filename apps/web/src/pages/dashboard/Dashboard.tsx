import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, Plus, Layers, Database, MessageSquare, ArrowUpRight, Search } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { trpc } from '../../lib/trpc'
import { Header } from '../../components/layout/Header'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'

export function Dashboard() {
  const { workspace } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [emoji, setEmoji] = useState('📁')
  const [description, setDescription] = useState('')

  const projectsQuery = trpc.project.list.useQuery(
    { workspaceId: workspace?.id! },
    { enabled: !!workspace?.id }
  )

  const analyticsQuery = trpc.analytics.workspaceOverview.useQuery(
    { workspaceId: workspace?.id! },
    { enabled: !!workspace?.id }
  )

  const createProjectMutation = trpc.project.create.useMutation({
    onSuccess: () => {
      setIsModalOpen(false)
      setName('')
      setClientName('')
      setDescription('')
      projectsQuery.refetch()
      analyticsQuery.refetch()
    },
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !workspace?.id) return
    await createProjectMutation.mutateAsync({
      workspaceId: workspace.id,
      name,
      clientName: clientName || undefined,
      description: description || undefined,
      emoji,
    })
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Header title="Proje Panosu" />

      <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Workspace Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Aktif Projeler</p>
              <h3 className="text-2xl font-bold text-slate-100">{analyticsQuery.data?.totalProjects ?? 0}</h3>
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Bağlı Kaynaklar</p>
              <h3 className="text-2xl font-bold text-slate-100">{analyticsQuery.data?.totalSources ?? 0}</h3>
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">İndekslenen Chunk</p>
              <h3 className="text-2xl font-bold text-slate-100">{analyticsQuery.data?.totalChunks ?? 0}</h3>
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Sohbet Oturumları</p>
              <h3 className="text-2xl font-bold text-slate-100">{analyticsQuery.data?.totalThreads ?? 0}</h3>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-100">Projeleriniz</h3>
            <p className="text-sm text-slate-400">Ajans veya müşteri bazlı tüm hafıza alanları</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Yeni Proje Oluştur</span>
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectsQuery.data?.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="p-6 bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl transition-all group hover:shadow-xl hover:shadow-purple-500/5 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl p-2 bg-slate-950 rounded-xl border border-slate-800">
                    {project.emoji}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-purple-600 group-hover:text-white text-slate-400 flex items-center justify-center transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-100 text-lg group-hover:text-purple-300 transition-colors">
                    {project.name}
                  </h4>
                  {project.clientName && (
                    <p className="text-xs text-purple-400 font-medium">{project.clientName}</p>
                  )}
                </div>

                {project.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span>{project.sourceCount} Kaynak</span>
                  <span>•</span>
                  <span>{project.chunkCount} Chunk</span>
                </div>
                <span>{project.lastActivityAt ? formatDate(project.lastActivityAt) : 'Yeni'}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* New Project Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Proje Oluştur">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex gap-3">
            <div className="w-20">
              <Input
                label="Emoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={4}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Proje Adı"
                placeholder="Örn: Mobil Uygulama V2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <Input
            label="Müşteri Adı (Opsiyonel)"
            placeholder="Örn: Trendyol"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Açıklama</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Proje hedefleri ve kısa özet..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              İptal
            </Button>
            <Button type="submit" isLoading={createProjectMutation.isPending}>
              Proje Oluştur →
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
