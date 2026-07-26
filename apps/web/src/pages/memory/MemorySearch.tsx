import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Search, ArrowLeft, Database, Sparkles, Filter } from 'lucide-react'
import { trpc } from '../../lib/trpc'
import { Header } from '../../components/layout/Header'
import { Button } from '../../components/ui/Button'
import { MemoryViewer } from '../../components/memory-viewer/MemoryViewer'

export function MemorySearch() {
  const { id: projectId } = useParams<{ id: string }>()
  const [query, setQuery] = useState('')
  const [searchTriggered, setSearchTriggered] = useState(false)

  const projectQuery = trpc.project.get.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  )

  const memorySearchQuery = trpc.memory.search.useQuery(
    { projectId: projectId!, query, topK: 15 },
    { enabled: !!projectId && searchTriggered && query.trim().length > 0 }
  )

  const statsQuery = trpc.memory.stats.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setSearchTriggered(true)
      memorySearchQuery.refetch()
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Header title={`${projectQuery.data?.name || 'Proje'} — Semantik Hafıza Aşaması`} />

      <main className="p-8 space-y-6 max-w-5xl mx-auto w-full">
        {/* Back Link */}
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-purple-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Proje Detayına Dön</span>
        </Link>

        {/* Search Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-100">Semantik Hafıza Arama</h3>
              <p className="text-xs text-slate-400">
                BGE-M3 (768-dim) vektör indeksi üzerinden doğrudan kaynak metinlerinde arama yapın.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-slate-400">Toplam İndeks</span>
              <p className="text-lg font-bold text-purple-400">{statsQuery.data?.totalChunks ?? 0} Chunk</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSearchTriggered(false)
                }}
                placeholder="Aramak istediğiniz kavram veya cümleyi yazın..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <Button type="submit" isLoading={memorySearchQuery.isFetching}>
              <Sparkles className="w-4 h-4" />
              <span>Semantik Ara</span>
            </Button>
          </form>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {memorySearchQuery.isFetching ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
              <p className="text-sm">Vektör veritabanında semantik arama yapılıyor...</p>
            </div>
          ) : memorySearchQuery.data && memorySearchQuery.data.length > 0 ? (
            memorySearchQuery.data.map((result: any) => (
              <MemoryViewer key={result.chunkId} chunk={result} />
            ))
          ) : searchTriggered ? (
            <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-2">
              <Database className="w-8 h-8 text-slate-700 mx-auto" />
              <p className="text-sm">Eşleşen sonuç bulunamadı.</p>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 border border-slate-900 rounded-xl">
              Arama başlatmak için yukarıdaki alana sorgunuzu girin.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
