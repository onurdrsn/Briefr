import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  FileText,
  MessageSquare,
  Webhook,
  Mail,
  Database,
  ChevronDown,
  Check,
  X,
  FileCode,
  FileCheck
} from 'lucide-react'
import { trpc } from '../../lib/trpc'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Alert } from '../ui/Alert'
import { formatErrorMessage } from '../../lib/error-formatter'
import { cn } from '../../lib/utils'

interface AddSourceModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onSuccess: () => void
}

const SOURCE_TYPES = [
  {
    id: 'file_upload',
    name: 'PDF / Doküman Dosyası Yükle',
    description: 'PDF, TXT, DOCX veya Markdown dosyası yükleyin',
    icon: UploadCloud,
    badge: 'Popüler',
    color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  },
  {
    id: 'manual_note',
    name: 'Manuel Not / Brief Metni',
    description: 'Toplantı notlarını veya brief metnini doğrudan yapıştırın',
    icon: FileText,
    badge: 'Hızlı',
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
  {
    id: 'whatsapp_export',
    name: 'WhatsApp Export (.txt)',
    description: 'WhatsApp sohbet döküm dosyasını aktarın',
    icon: MessageSquare,
    badge: 'Sohbet',
    color: 'text-green-400 border-green-500/30 bg-green-500/10',
  },
  {
    id: 'make_webhook',
    name: 'Make.com Webhook Trigger',
    description: 'Make.com / Zapier otomasyonları için webhook URL',
    icon: Webhook,
    badge: 'Otomasyon',
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  {
    id: 'slack_channel',
    name: 'Slack Kanalı',
    description: 'Slack kanal geçmişini indeksleyin (OAuth)',
    icon: MessageSquare,
    badge: 'OAuth',
    color: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
  },
  {
    id: 'gmail_label',
    name: 'Gmail Label',
    description: 'E-posta yazışmalarını otomatik aktarın (OAuth)',
    icon: Mail,
    badge: 'OAuth',
    color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  },
  {
    id: 'notion_page',
    name: 'Notion Sayfası',
    description: 'Notion veritabanlarını ve sayfalarını bağlayın (OAuth)',
    icon: Database,
    badge: 'OAuth',
    color: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  },
]

export function AddSourceModal({ isOpen, onClose, projectId, onSuccess }: AddSourceModalProps) {
  const [sourceType, setSourceType] = useState('file_upload')
  const [sourceName, setSourceName] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const createSourceMutation = trpc.source.create.useMutation({
    onSuccess: () => {
      resetForm()
      onSuccess()
      onClose()
    },
  })

  const resetForm = () => {
    setSourceName('')
    setNoteContent('')
    setSelectedFile(null)
    setFileContent('')
    setIsDropdownOpen(false)
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    if (!sourceName.trim()) {
      setSourceName(file.name.replace(/\.[^/.]+$/, ''))
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setFileContent(text || '')
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sourceName.trim() || !projectId) return

    let config: Record<string, unknown> = {}
    if (sourceType === 'manual_note') {
      config = { content: noteContent }
    } else if (sourceType === 'file_upload' || sourceType === 'whatsapp_export') {
      config = {
        fileName: selectedFile?.name || sourceName,
        content: fileContent || noteContent || 'Dosya yüklendi.',
        sizeBytes: selectedFile?.size || 0,
        mimeType: selectedFile?.type || 'application/pdf',
      }
    } else if (sourceType === 'make_webhook') {
      config = { webhookSecret: crypto.randomUUID() }
    }

    await createSourceMutation.mutateAsync({
      projectId,
      type: sourceType as any,
      name: sourceName,
      config,
    })
  }

  const currentSourceTypeObj = SOURCE_TYPES.find((s) => s.id === sourceType) || SOURCE_TYPES[0]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Veri Kaynağı Ekle">
      <form onSubmit={handleSubmit} className="space-y-5">
        {createSourceMutation.isError && (
          <Alert variant="danger" title="Kaynak Eklenemedi" onClose={() => createSourceMutation.reset()}>
            {formatErrorMessage(createSourceMutation.error)}
          </Alert>
        )}

        {/* Custom Source Type Dropdown Selector */}
        <div className="space-y-1.5 relative">
          <label className="block text-xs font-semibold text-slate-300">Kaynak Tipi Seçin</label>

          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-slate-950 border border-slate-800 hover:border-purple-500/50 rounded-xl p-3 flex items-center justify-between text-left transition-all"
          >
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg border', currentSourceTypeObj.color)}>
                <currentSourceTypeObj.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-100">{currentSourceTypeObj.name}</h4>
                <p className="text-xs text-slate-400">{currentSourceTypeObj.description}</p>
              </div>
            </div>
            <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', isDropdownOpen && 'rotate-180')} />
          </button>

          {/* Dropdown Menu Options */}
          {isDropdownOpen && (
            <div className="absolute z-50 left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto space-y-1 p-1">
              {SOURCE_TYPES.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSourceType(item.id)
                    setIsDropdownOpen(false)
                  }}
                  className={cn(
                    'p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors',
                    sourceType === item.id
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 font-medium'
                      : 'hover:bg-slate-800/80 text-slate-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn('w-4 h-4 shrink-0', item.color.split(' ')[0])} />
                    <div>
                      <span className="text-xs font-semibold block text-slate-100">{item.name}</span>
                      <span className="text-[10px] text-slate-400 block">{item.description}</span>
                    </div>
                  </div>
                  {sourceType === item.id && <Check className="w-4 h-4 text-purple-400 shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PDF & File Drag and Drop Zone */}
        {(sourceType === 'file_upload' || sourceType === 'whatsapp_export') && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              {sourceType === 'file_upload' ? 'PDF veya Doküman Dosyası Yükleyin' : 'WhatsApp Sohbet Dökümü (.txt)'}
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.txt,.docx,.md"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2',
                  isDragging
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-800 hover:border-purple-500/40 bg-slate-950/60 hover:bg-slate-900/60'
                )}
              >
                <div className="w-12 h-12 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    PDF, TXT, DOCX veya MD dosyasını buraya sürükleyin
                  </p>
                  <p className="text-xs text-slate-500 mt-1">veya bilgisayarınızdan dosya seçmek için tıklayın</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-slate-100 truncate max-w-xs">{selectedFile.name}</h5>
                    <p className="text-[10px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB • Hazır</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null)
                    setFileContent('')
                  }}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Source Name Field */}
        <Input
          label="Kaynak İsmi"
          placeholder="Örn: Müşteri Toplantı Notları veya Trendyol_Strateji_Brief.pdf"
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
          required
        />

        {/* Manual Note Content Textarea */}
        {sourceType === 'manual_note' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Not / Brief İçeriği</label>
            <textarea
              rows={5}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Toplantı kararlarını, strateji notlarını veya metni yapıştırın..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-all"
              required
            />
          </div>
        )}

        {sourceType === 'make_webhook' && (
          <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
            Kaydı oluşturduktan sonra Make.com veya Zapier üzerinden veri aktarabileceğiniz özel webhook URL'si oluşturulacaktır.
          </p>
        )}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" isLoading={createSourceMutation.isPending}>
            Kaynağı Bağla →
          </Button>
        </div>
      </form>
    </Modal>
  )
}
