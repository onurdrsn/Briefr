import { Calendar, User, FileText, Sparkles } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { formatDate } from '../../lib/utils'

interface MemoryChunkProps {
  chunk: {
    chunkId: string
    score?: number
    content: string
    sourceType?: string
    sourceName?: string
    author?: string
    originalDate?: string
  }
}

export function MemoryViewer({ chunk }: MemoryChunkProps) {
  const matchPercent = chunk.score ? Math.round(chunk.score * 100) : null

  return (
    <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="purple">{chunk.sourceType || 'kaynak'}</Badge>
          <span className="text-xs font-semibold text-slate-200">{chunk.sourceName}</span>
        </div>

        {matchPercent && (
          <div className="flex items-center gap-1 text-xs text-purple-400 font-medium bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3" />
            <span>%{matchPercent} Eşleşme</span>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
        {chunk.content}
      </p>

      <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
        {chunk.author && (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>{chunk.author}</span>
          </div>
        )}
        {chunk.originalDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(chunk.originalDate)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
