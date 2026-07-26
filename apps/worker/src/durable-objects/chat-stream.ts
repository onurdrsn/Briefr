import { DurableObject } from 'cloudflare:workers'

export class ChatStreamDO extends DurableObject {
  private clients = new Map<string, { enqueue: (data: string) => void }>()

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // Client SSE connection endpoint
    if (url.pathname.endsWith('/stream')) {
      const pendingMsgId = url.searchParams.get('msgId')
      if (!pendingMsgId) return new Response('msgId required', { status: 400 })

      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter()
      const encoder = new TextEncoder()

      const controller = {
        enqueue: (data: string) => {
          writer.write(encoder.encode(data)).catch(() => {})
        }
      }
      this.clients.set(pendingMsgId, controller)

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    if (url.pathname === '/chunk') {
      const { pendingMsgId, chunk } = await request.json() as any
      const ctrl = this.clients.get(pendingMsgId)
      if (ctrl) ctrl.enqueue(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
      return new Response('ok')
    }

    if (url.pathname === '/done') {
      const { pendingMsgId, messageId } = await request.json() as any
      const ctrl = this.clients.get(pendingMsgId)
      if (ctrl) {
        ctrl.enqueue(`data: ${JSON.stringify({ type: 'done', messageId })}\n\n`)
        this.clients.delete(pendingMsgId)
      }
      return new Response('ok')
    }

    if (url.pathname === '/error') {
      const { pendingMsgId, error } = await request.json() as any
      const ctrl = this.clients.get(pendingMsgId)
      if (ctrl) {
        ctrl.enqueue(`data: ${JSON.stringify({ type: 'error', error })}\n\n`)
        this.clients.delete(pendingMsgId)
      }
      return new Response('ok')
    }

    return new Response('Not Found', { status: 404 })
  }
}
