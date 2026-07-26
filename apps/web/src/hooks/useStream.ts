import { useCallback, useRef, useState } from 'react'

export function useChatStream(workerUrl: string = '') {
  const [streaming, setStreaming] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const eventSourceRef = useRef<EventSource | null>(null)
  const timeoutRef = useRef<any>(null)

  const startStream = useCallback((threadId: string, pendingMsgId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setStreaming(true)
    setStreamContent('')

    const baseUrl = workerUrl || window.location.origin
    const url = `${baseUrl}/chat/stream/${threadId}?msgId=${pendingMsgId}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    // Safety timeout: stop streaming after 12 seconds max if SSE disconnects
    timeoutRef.current = setTimeout(() => {
      setStreaming(false)
      es.close()
    }, 12000)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'chunk') {
          setStreamContent((prev) => prev + data.content)
        } else if (data.type === 'done' || data.type === 'error') {
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          setStreaming(false)
          es.close()
        }
      } catch { /* empty */ }
    }

    es.onerror = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setStreaming(false)
      es.close()
    }
  }, [workerUrl])

  const cancelStream = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    eventSourceRef.current?.close()
    setStreaming(false)
  }, [])

  return { streaming, streamContent, startStream, cancelStream }
}
