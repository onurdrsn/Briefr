import { sources, chunks, ingestionJobs, projects } from '@briefr/db'
import { eq, and, sql } from 'drizzle-orm'
import { embedAndStore } from './vectorize'
import { fetchSlackChannel, chunkSlackMessages } from './slack'
import { fetchGmailThreads, fetchGmailThread, extractEmailText } from './gmail'
import { fetchNotionPage, extractNotionText, chunkText } from './notion'
import { parseWhatsAppExport, chunkWaMessages } from './whatsapp'
import { decryptField } from '../utils/crypto'

export async function processIngestionDirectly(ctx: any, sourceId: string, projectId: string) {
  const db = ctx.db
  const env = ctx.env

  const [source] = await db.select().from(sources).where(eq(sources.id, sourceId)).limit(1)
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!source || !project) return

  const [job] = await db.insert(ingestionJobs).values({
    sourceId, projectId, status: 'running', triggeredBy: 'manual', startedAt: new Date(),
  }).returning()

  await db.update(sources).set({ status: 'syncing', updatedAt: new Date() }).where(eq(sources.id, sourceId))

  let chunksCreated = 0
  let chunksSkipped = 0

  try {
    const config = source.config as any
    const rawChunks = await extractChunks(db, env, source, config)

    if (!rawChunks || rawChunks.length === 0) {
      await db.update(sources).set({
        status: 'ready',
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(sources.id, sourceId))

      await db.update(ingestionJobs).set({
        status: 'done', chunksCreated: 0, chunksSkipped: 0, completedAt: new Date(),
      }).where(eq(ingestionJobs.id, job.id))
      return
    }

    for (const raw of rawChunks) {
      if (!raw.content || raw.content.trim().length === 0) continue

      const enc = new TextEncoder()
      const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(projectId + raw.content))
      const contentHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')

      const [existing] = await db.select({ id: chunks.id }).from(chunks)
        .where(and(eq(chunks.contentHash, contentHash), eq(chunks.projectId, projectId))).limit(1)

      if (existing) { chunksSkipped++; continue }

      const chunkId = crypto.randomUUID()

      await db.insert(chunks).values({
        id: chunkId, sourceId, projectId,
        content: raw.content, contentHash,
        status: 'pending',
        sourceType: source.type,
        sourceName: source.name,
        originalDate: raw.date ? new Date(raw.date) : null,
        author: raw.authors?.join(', ') ?? null,
      })

      if (env.BRIEFR_AI && env.BRIEFR_VECTORIZE) {
        try {
          await embedAndStore({
            env,
            chunkId,
            content: raw.content,
            namespace: project.vectorNamespace,
            metadata: {
              sourceId,
              sourceType: source.type,
              sourceName: source.name,
              projectId,
              content: raw.content.substring(0, 500),
              originalDate: raw.date,
              author: raw.authors?.join(', '),
            },
          })
          await db.update(chunks).set({ status: 'embedded', embeddingModel: '@cf/baai/bge-m3' }).where(eq(chunks.id, chunkId))
        } catch (embedErr) {
          console.error('Vector embedding failed:', embedErr)
          // Status remains 'pending' — re-throw so the job is marked failed
          throw embedErr
        }
      }

      chunksCreated++
    }

    await db.update(sources).set({
      status: 'ready',
      chunkCount: sql`${sources.chunkCount} + ${chunksCreated}`,
      lastSyncAt: new Date(),
      nextSyncAt: new Date(Date.now() + (source.syncIntervalHours || 6) * 60 * 60 * 1000),
      lastError: null, lastErrorAt: null, updatedAt: new Date(),
    }).where(eq(sources.id, sourceId))

    await db.update(projects).set({
      chunkCount: sql`${projects.chunkCount} + ${chunksCreated}`,
      lastActivityAt: new Date(), updatedAt: new Date(),
    }).where(eq(projects.id, projectId))

    await db.update(ingestionJobs).set({
      status: 'done', chunksCreated, chunksSkipped, completedAt: new Date(),
    }).where(eq(ingestionJobs.id, job.id))

  } catch (err: any) {
    const errorMsg = err?.message || String(err) || 'Senkronizasyon hatası'
    await db.update(sources).set({
      status: 'error', lastError: errorMsg, lastErrorAt: new Date(), updatedAt: new Date(),
    }).where(eq(sources.id, sourceId))

    if (job?.id) {
      await db.update(ingestionJobs).set({
        status: 'failed', errorMessage: errorMsg, completedAt: new Date(),
      }).where(eq(ingestionJobs.id, job.id))
    }
  }
}

async function extractChunks(db: any, env: any, source: any, config: any) {
  const dk = async (val?: string) => val ? await decryptField(val, env.ENCRYPTION_KEY) : ''

  switch (source.type) {
    case 'slack_channel': {
      const token = await dk(config.accessToken)
      if (!token) return []
      const msgs = await fetchSlackChannel(token, config.channelId)
      return chunkSlackMessages(msgs, config.channelName)
    }
    case 'gmail_label': {
      const token = await dk(config.accessToken)
      if (!token) return []
      const { threads } = await fetchGmailThreads(token, config.labelId, 30)
      const results = []
      for (const t of threads) {
        const full = await fetchGmailThread(token, t.id)
        const extracted = extractEmailText(full)
        results.push({ content: extracted.content, date: extracted.date, authors: extracted.participants })
      }
      return results
    }
    case 'notion_page':
    case 'notion_database': {
      const token = await dk(config.accessToken)
      if (!token) return []
      const blocks = await fetchNotionPage(token, config.pageId)
      const text = extractNotionText(blocks)
      return chunkText(text, 600, 80).map(c => ({ content: c, date: new Date().toISOString(), authors: [] as string[] }))
    }
    case 'file_upload':
    case 'whatsapp_export': {
      if (!env.BRIEFR_R2 || !config.r2Key) return []
      const r2Object = await env.BRIEFR_R2.get(config.r2Key)
      if (!r2Object) return []
      const rawText = await r2Object.text()
      if (source.type === 'whatsapp_export') {
        const msgs = parseWhatsAppExport(rawText)
        return chunkWaMessages(msgs)
      }
      return chunkText(rawText, 600, 80).map(c => ({ content: c, date: new Date().toISOString(), authors: [] as string[] }))
    }
    case 'manual_note': {
      return chunkText(config.content || '', 600, 80).map(c => ({ content: c, date: new Date().toISOString(), authors: [] as string[] }))
    }
    case 'make_webhook': {
      return config.pendingContent
        ? [{ content: config.pendingContent, date: new Date().toISOString(), authors: ['Make.com'] }]
        : []
    }
    default:
      return []
  }
}
