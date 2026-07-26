import { RefreshCw, Trash2, FileText, MessageSquare, Mail, Database, Webhook, PhoneCall } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { formatDate } from '../../lib/utils'

interface SourceCardProps {
  source: {
    id: string
    name: string
    type: string
    status: string
    chunkCount: number
    lastSyncAt?: string | null
    lastError?: string | null
  }
  onResync: (id: string) => void
  onDelete: (id: string) => void
  isResyncing?: boolean
}

export function SourceCard({ source, onResync, onDelete, isResyncing }: SourceCardProps) {
  const getIcon = () => {
    switch (source.type) {
      case 'slack_channel':
        return <MessageSquare className="w-5 h-5 text-emerald-400" />
      case 'gmail_label':
        return <Mail className="w-5 h-5 text-rose-400" />
      case 'notion_page':
      case 'notion_database':
        return <Database className="w-5 h-5 text-sky-400" />
      case 'file_upload':
        return <FileText className="w-5 h-5 text-purple-400" />
      case 'whatsapp_export':
        return <PhoneCall className="w-5 h-5 text-green-400" />
      case 'make_webhook':
        return <Webhook className="w-5 h-5 text-amber-400" />
      default:
        return <FileText className="w-5 h-5 text-slate-400" />
    }
  }

  const getStatusBadge = () => {
    switch (source.status) {
      case 'ready':
        return <Badge variant="success">Hazır ({source.chunkCount} chunk)</Badge>
      case 'syncing':
        return <Badge variant="info">Senkronize Ediliyor...</Badge>
      case 'pending':
        return <Badge variant="warning">Kuyrukta</Badge>
      case 'error':
        return <Badge variant="danger">Hata</Badge>
      default:
        return <Badge variant="default">{source.status}</Badge>
    }
  }

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-all group">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700/60">
          {getIcon()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm text-slate-100">{source.name}</h4>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Son sync: {source.lastSyncAt ? formatDate(source.lastSyncAt) : 'Henüz yapılmadı'}
          </p>
          {source.lastError && (
            <p className="text-xs text-rose-400 mt-1 truncate max-w-xs">{source.lastError}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onResync(source.id)}
          disabled={isResyncing || source.status === 'syncing'}
          className="p-2 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          title="Yeniden Senkronize Et"
        >
          <RefreshCw className={`w-4 h-4 ${isResyncing || source.status === 'syncing' ? 'animate-spin text-purple-400' : ''}`} />
        </button>
        <button
          onClick={() => onDelete(source.id)}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          title="Kaynağı Sil"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
