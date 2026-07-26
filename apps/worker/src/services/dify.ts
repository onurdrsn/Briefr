import type { CloudflareBindings } from '../context'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { messages, threads } from '@briefr/db'
import { eq, sql } from 'drizzle-orm'

export async function streamDifyChat(
  env: CloudflareBindings,
  params: {
    userMessage: string
    systemPrompt: string
    threadId: string
    projectId: string
    pendingMsgId: string
    usedChunkIds: string[]
    difyConversationId?: string
  }
): Promise<void> {
  const db = drizzle(neon(env.DATABASE_URL))
  const startTime = Date.now()

  // If Dify key is missing or sample, notify clearly
  if (!env.DIFY_API_KEY || env.DIFY_API_KEY.startsWith('sample_')) {
    const doId = env.CHAT_STREAM_DO.idFromName(params.threadId)
    const stub = env.CHAT_STREAM_DO.get(doId)

    const notice = `⚠️ Dify API anahtarınız henüz tanımlanmamış. Lütfen wrangler.json veya .dev.vars dosyasına geçerli DIFY_API_KEY değerinizi girin.`

    await stub.fetch(new Request('https://do/chunk', {
      method: 'POST',
      body: JSON.stringify({ pendingMsgId: params.pendingMsgId, chunk: notice }),
    }))

    const [savedMsg] = await db.insert(messages).values({
      threadId: params.threadId,
      projectId: params.projectId,
      role: 'assistant',
      content: notice,
      usedChunkIds: params.usedChunkIds,
      durationMs: Date.now() - startTime,
    }).returning()

    await db.update(threads)
      .set({ messageCount: sql`${threads.messageCount} + 2`, lastMessageAt: new Date() })
      .where(eq(threads.id, params.threadId))

    await stub.fetch(new Request('https://do/done', {
      method: 'POST',
      body: JSON.stringify({ pendingMsgId: params.pendingMsgId, messageId: savedMsg.id }),
    }))
    return
  }

  try {
    const response = await fetch(`${env.DIFY_API_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: { system_prompt: params.systemPrompt },
        query: params.userMessage,
        response_mode: 'streaming',
        conversation_id: params.difyConversationId ?? '',
        user: params.threadId,
      }),
    })

    if (!response.ok || !response.body) {
      throw new Error(`Dify API HTTP ${response.status}`)
    }

    const doId = env.CHAT_STREAM_DO.idFromName(params.threadId)
    const stub = env.CHAT_STREAM_DO.get(doId)

    let fullContent = ''
    let difyMessageId = ''
    let difyConversationId = params.difyConversationId ?? ''
    let inputTokens = 0
    let outputTokens = 0
    let difyMetrics: Record<string, any> = {}

    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const jsonRes = (await response.json()) as any
      fullContent =
        jsonRes.answer ||
        jsonRes.text ||
        (typeof jsonRes.outputs === 'string' ? jsonRes.outputs : null) ||
        jsonRes.outputs?.text ||
        jsonRes.outputs?.answer ||
        jsonRes.data?.outputs?.text ||
        ''
      difyMessageId = jsonRes.message_id || jsonRes.id || ''
      difyConversationId = jsonRes.conversation_id || ''

      const usage = jsonRes.metadata?.usage ?? jsonRes.usage ?? {}
      inputTokens = usage.prompt_tokens ?? 0
      outputTokens = usage.completion_tokens ?? 0
      difyMetrics = {
        prompt_tokens: usage.prompt_tokens ?? 0,
        completion_tokens: usage.completion_tokens ?? 0,
        total_tokens: usage.total_tokens ?? 0,
        total_price: usage.total_price ?? '0.0000',
        currency: usage.currency ?? 'USD',
        latency: usage.latency ?? (Date.now() - startTime) / 1000,
        time_to_first_token: usage.time_to_first_token ?? 0,
        time_to_generate: usage.time_to_generate ?? 0,
      }

      if (fullContent) {
        await stub.fetch(
          new Request('https://do/chunk', {
            method: 'POST',
            body: JSON.stringify({ pendingMsgId: params.pendingMsgId, chunk: fullContent }),
          })
        )
      }
    } else {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let streamBuffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        streamBuffer += decoder.decode(value, { stream: true })
        const lines = streamBuffer.split('\n')
        // Keep incomplete line chunk in streamBuffer for next iteration
        streamBuffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const dataStr = trimmed.slice(5).trim()
          if (!dataStr || dataStr === '[DONE]') continue

          try {
            const event = JSON.parse(dataStr)
            difyMessageId = event.message_id ?? event.data?.id ?? difyMessageId
            difyConversationId = event.conversation_id ?? event.data?.conversation_id ?? difyConversationId

            if (event.event === 'message_end' || event.event === 'workflow_finished') {
              const usage = event.metadata?.usage ?? event.data?.usage ?? event.metadata ?? {}
              inputTokens = usage.prompt_tokens ?? inputTokens
              outputTokens = usage.completion_tokens ?? outputTokens

              difyMetrics = {
                prompt_tokens: usage.prompt_tokens ?? inputTokens,
                completion_tokens: usage.completion_tokens ?? outputTokens,
                total_tokens: usage.total_tokens ?? (inputTokens + outputTokens),
                total_price: usage.total_price ?? usage.prompt_price ?? '0.0000',
                currency: usage.currency ?? 'USD',
                latency: usage.latency ?? (Date.now() - startTime) / 1000,
                time_to_first_token: usage.time_to_first_token ?? 0,
                time_to_generate: usage.time_to_generate ?? 0,
              }

              // If no streaming chunks were captured, use workflow outputs as fallback
              if (!fullContent && event.data?.outputs) {
                const finalOutput = typeof event.data.outputs === 'string'
                  ? event.data.outputs
                  : event.data.outputs.answer || event.data.outputs.text || event.data.outputs.result || ''
                if (typeof finalOutput === 'string' && finalOutput.trim()) {
                  fullContent = finalOutput
                  await stub.fetch(
                    new Request('https://do/chunk', {
                      method: 'POST',
                      body: JSON.stringify({ pendingMsgId: params.pendingMsgId, chunk: finalOutput }),
                    })
                  )
                }
              }
            } else if (event.event === 'message' || event.event === 'agent_message' || event.event === 'text_chunk') {
              const textChunk =
                event.answer ||
                event.text ||
                event.delta ||
                event.data?.text ||
                ''

              if (typeof textChunk === 'string' && textChunk) {
                fullContent += textChunk
                await stub.fetch(
                  new Request('https://do/chunk', {
                    method: 'POST',
                    body: JSON.stringify({ pendingMsgId: params.pendingMsgId, chunk: textChunk }),
                  })
                )
              }
            }
          } catch (jsonErr) {
            /* ignore JSON parse errors */
          }
        }
      }

      // Tail buffer check only if fullContent is empty
      if (!fullContent && streamBuffer.trim().startsWith('data:')) {
        const dataStr = streamBuffer.trim().slice(5).trim()
        if (dataStr && dataStr !== '[DONE]') {
          try {
            const event = JSON.parse(dataStr)
            const textChunk = event.answer || event.text || event.data?.text || ''
            if (typeof textChunk === 'string' && textChunk) {
              fullContent += textChunk
            }
          } catch { /* tail ignore */ }
        }
      }
    }

    if (fullContent) {
      // Strip any raw token metrics JSON block before saving to DB
      const cleanContent = fullContent
        .replace(/\{\s*"prompt_tokens"[\s\S]*?\}/g, '')
        .replace(/\{\s*"prompt_unit_price"[\s\S]*?\}/g, '')
        .trim()

      const [savedMsg] = await db
        .insert(messages)
        .values({
          threadId: params.threadId,
          projectId: params.projectId,
          role: 'assistant',
          content: cleanContent || fullContent,
          usedChunkIds: params.usedChunkIds,
          difyMessageId,
          difyConversationId,
          inputTokens,
          outputTokens,
          durationMs: Math.round(difyMetrics.latency ? Number(difyMetrics.latency) * 1000 : Date.now() - startTime),
          difyMetrics,
        })
        .returning()

      await db
        .update(threads)
        .set({ messageCount: sql`${threads.messageCount} + 2`, lastMessageAt: new Date() })
        .where(eq(threads.id, params.threadId))

      await stub.fetch(
        new Request('https://do/done', {
          method: 'POST',
          body: JSON.stringify({ pendingMsgId: params.pendingMsgId, messageId: savedMsg.id }),
        })
      )
    }
  } catch (err: any) {
    console.error('Dify streaming error:', err?.message || err)
    const doId = env.CHAT_STREAM_DO.idFromName(params.threadId)
    const stub = env.CHAT_STREAM_DO.get(doId)
    await stub.fetch(
      new Request('https://do/error', {
        method: 'POST',
        body: JSON.stringify({ pendingMsgId: params.pendingMsgId, error: err.message }),
      })
    )
  }
}
