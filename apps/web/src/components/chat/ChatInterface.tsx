import React, { useState, useEffect, useRef } from 'react'
import { Send, Plus, Bot, User, Sparkles, MessageSquare, Trash2, Edit2 } from 'lucide-react'
import { trpc } from '../../lib/trpc'
import { useChatStream } from '../../hooks/useStream'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { ConfirmModal } from '../ui/ConfirmModal'
import { cn } from '../../lib/utils'

interface ChatInterfaceProps {
  projectId: string
}

export function ChatInterface({ projectId }: ChatInterfaceProps) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [optimisticUserMsg, setOptimisticUserMsg] = useState<{ id: string; role: 'user'; content: string } | null>(null)
  const [optimisticAssistantMsg, setOptimisticAssistantMsg] = useState<{ id: string; role: 'assistant'; content: string; isThinking?: boolean } | null>(null)
  
  // Thread Renaming State
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  
  // Delete Thread Confirmation State
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const threadsQuery = trpc.chat.listThreads.useQuery({ projectId })

  const createThreadMutation = trpc.chat.createThread.useMutation({
    onSuccess: (newThread) => {
      setActiveThreadId(newThread.id)
      threadsQuery.refetch()
    },
  })

  const renameThreadMutation = trpc.chat.renameThread.useMutation({
    onSuccess: () => {
      setEditingThreadId(null)
      threadsQuery.refetch()
    },
  })

  const deleteThreadMutation = trpc.chat.deleteThread.useMutation({
    onSuccess: () => {
      setDeletingThreadId(null)
      setActiveThreadId(null)
      setOptimisticUserMsg(null)
      setOptimisticAssistantMsg(null)
      threadsQuery.refetch()
    },
  })

  const messagesQuery = trpc.chat.getMessages.useQuery(
    { threadId: activeThreadId! },
    { enabled: !!activeThreadId }
  )

  const { streaming, streamContent, startStream } = useChatStream()

  // Update optimistic assistant message content in real time as Dify streams
  useEffect(() => {
    if (streamContent) {
      setOptimisticAssistantMsg({
        id: 'opt-assistant-stream',
        role: 'assistant',
        content: streamContent,
        isThinking: false,
      })
    }
  }, [streamContent])

  // Auto-select first thread if available and no thread currently active
  useEffect(() => {
    if (threadsQuery.data && threadsQuery.data.length > 0 && !activeThreadId) {
      setActiveThreadId(threadsQuery.data[0].id)
    }
  }, [threadsQuery.data, activeThreadId])

  // Clear optimistic state when stream finishes AND messages query has completed
  useEffect(() => {
    if (!streaming && messagesQuery.data && messagesQuery.data.length > 0) {
      const hasRecentAssistantMsg = messagesQuery.data.some(
        (m) => m.role === 'assistant' && m.content && !m.content.includes('taranıyor')
      )
      if (hasRecentAssistantMsg) {
        setOptimisticUserMsg(null)
        setOptimisticAssistantMsg(null)
      }
    }
  }, [streaming, messagesQuery.data])

  // When streaming ends, force refetch from database
  useEffect(() => {
    if (!streaming && activeThreadId) {
      messagesQuery.refetch()
    }
  }, [streaming, activeThreadId])

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (res, variables) => {
      const targetId = variables.threadId || activeThreadId
      if (targetId) {
        startStream(targetId, res.pendingMsgId)
      }
      messagesQuery.refetch()
      setTimeout(() => messagesQuery.refetch(), 1000)
      setTimeout(() => messagesQuery.refetch(), 2500)
      setTimeout(() => messagesQuery.refetch(), 4500)
    },
  })

  // Fast, lag-free new thread creation
  const handleCreateThread = () => {
    setOptimisticUserMsg(null)
    setOptimisticAssistantMsg(null)
    createThreadMutation.mutate({
      projectId,
      title: 'Yeni Sohbet',
    })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || sendMessageMutation.isPending || streaming) return

    const text = inputMessage
    setInputMessage('')

    let targetThreadId = activeThreadId

    // Automatically create a new thread if user sends message without selecting a thread
    if (!targetThreadId) {
      try {
        const newThread = await createThreadMutation.mutateAsync({
          projectId,
          title: text.slice(0, 35) || 'Yeni Sohbet',
        })
        targetThreadId = newThread.id
        setActiveThreadId(newThread.id)
      } catch (err) {
        console.error('Failed to auto-create thread:', err)
        return
      }
    }

    // Instantly set optimistic User & Assistant messages (< 5ms)
    setOptimisticUserMsg({ id: 'opt-user-' + Date.now(), role: 'user', content: text })
    setOptimisticAssistantMsg({
      id: 'opt-assistant-' + Date.now(),
      role: 'assistant',
      content: 'Proje hafızası taranıyor ve yanıt üretiliyor...',
      isThinking: true,
    })

    await sendMessageMutation.mutateAsync({
      threadId: targetThreadId,
      content: text,
    })
  }

  const handleStartRename = (thread: { id: string; title: string | null }) => {
    setEditingThreadId(thread.id)
    setEditingTitle(thread.title || 'Sohbet')
  }

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingThreadId || !editingTitle.trim()) return
    renameThreadMutation.mutate({
      threadId: editingThreadId,
      title: editingTitle.trim(),
    })
  }

  const handleConfirmDeleteThread = () => {
    if (deletingThreadId) {
      deleteThreadMutation.mutate({ threadId: deletingThreadId })
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesQuery.data, optimisticUserMsg, optimisticAssistantMsg, streamContent])

  // Prepare combined messages list
  const serverMessages = activeThreadId
    ? (messagesQuery.data || []).filter((m) => m.content && m.content.trim().length > 0)
    : []

  const allDisplayMessages = [...serverMessages]

  if (optimisticUserMsg && !serverMessages.some((m) => m.content === optimisticUserMsg.content && m.role === 'user')) {
    allDisplayMessages.push(optimisticUserMsg as any)
  }

  if (
    optimisticAssistantMsg &&
    !serverMessages.some(
      (m) => m.id === optimisticAssistantMsg.id || (m.role === 'assistant' && m.content === optimisticAssistantMsg.content)
    )
  ) {
    allDisplayMessages.push(optimisticAssistantMsg as any)
  }

  const activeThread = threadsQuery.data?.find((t) => t.id === activeThreadId)

  return (
    <div className="flex h-full bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden">
      {/* Threads Sidebar */}
      <div className="w-64 border-r border-slate-800 p-4 flex flex-col justify-between bg-slate-900/60 shrink-0">
        <div className="space-y-4">
          <Button
            onClick={handleCreateThread}
            isLoading={createThreadMutation.isPending && !activeThreadId}
            className="w-full justify-center"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Sohbet</span>
          </Button>

          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            {threadsQuery.data?.map((thread) => (
              <div
                key={thread.id}
                onClick={() => {
                  setActiveThreadId(thread.id)
                  setOptimisticUserMsg(null)
                  setOptimisticAssistantMsg(null)
                }}
                className={cn(
                  'flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer group transition-colors relative',
                  activeThreadId === thread.id
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                )}
              >
                <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-2">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{thread.title || 'Sohbet'}</span>
                </div>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartRename(thread)
                    }}
                    className="text-slate-400 hover:text-purple-300 p-1 rounded hover:bg-slate-800"
                    title="Sohbeti Yeniden İsimlendir"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeletingThreadId(thread.id)
                    }}
                    className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800"
                    title="Sohbeti Sil"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Flow */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        {/* Active Thread Header */}
        {activeThread && (
          <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-semibold text-slate-100">{activeThread.title}</h4>
            </div>
            <button
              onClick={() => handleStartRename(activeThread)}
              className="text-xs text-slate-400 hover:text-purple-300 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-purple-500/40 bg-slate-950 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              <span>İsmi Değiştir</span>
            </button>
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[calc(100vh-280px)]">
          {!activeThreadId && allDisplayMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
              <Bot className="w-12 h-12 text-slate-700" />
              <p className="text-sm">Aşağıdaki mesaj kutusuna yazarak sohbet başlatın veya soldan sohbet seçin.</p>
            </div>
          ) : (
            <>
              {allDisplayMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3 max-w-2xl',
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0',
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    )}
                  >
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={cn(
                      'p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm',
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white rounded-tr-none'
                        : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-none'
                    )}
                  >
                    {(msg as any).isThinking ? (
                      <div className="flex items-center gap-2 text-purple-300 font-medium">
                        <Sparkles className="w-4 h-4 animate-pulse text-purple-400" />
                        <span>{msg.content}</span>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input Form - Always Enabled for Auto Thread Creation */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-900/60 flex gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={streaming || sendMessageMutation.isPending || createThreadMutation.isPending}
            placeholder="Proje hafızasıyla sohbet edin... (örn: Geçen toplantıda ne kararlaştırıldı?)"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={!inputMessage.trim() || streaming || sendMessageMutation.isPending || createThreadMutation.isPending}
            isLoading={sendMessageMutation.isPending || createThreadMutation.isPending}
            className="rounded-xl px-5 bg-purple-600 hover:bg-purple-500 text-white font-bold"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Rename Thread Modal */}
      <Modal isOpen={!!editingThreadId} onClose={() => setEditingThreadId(null)} title="Sohbet İsmini Değiştir">
        <form onSubmit={handleSaveRename} className="space-y-4">
          <Input
            label="Sohbet Başlığı"
            placeholder="Örn: Trendyol Q4 Pazarlama Stratejisi"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            required
            autoFocus
          />

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setEditingThreadId(null)}>
              İptal
            </Button>
            <Button type="submit" isLoading={renameThreadMutation.isPending}>
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Thread Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingThreadId}
        onClose={() => setDeletingThreadId(null)}
        onConfirm={handleConfirmDeleteThread}
        isLoading={deleteThreadMutation.isPending}
        title="Sohbeti Sil"
        description="Bu sohbet oturumunu ve oturuma ait tüm mesaj geçmişini silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Sohbeti Sil"
      />
    </div>
  )
}
