import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { sources, chunks, ingestionJobs, projects } from '@briefr/db'
import { eq, and, sql } from 'drizzle-orm'
import { embedAndStore } from '../../worker/src/services/vectorize'
import { fetchSlackChannel, chunkSlackMessages } from '../../worker/src/services/slack'
import { fetchGmailThreads, fetchGmailThread, extractEmailText } from '../../worker/src/services/gmail'
import { fetchNotionPage, extractNotionText, chunkText } from '../../worker/src/services/notion'
import { parseWhatsAppExport, chunkWaMessages } from '../../worker/src/services/whatsapp'
import { decryptField } from '../../worker/src/utils/crypto'

export type IngestionBindings = {
  DATABASE_URL: string
  ENCRYPTION_KEY: string
  BRIEFR_VECTORIZE: VectorizeIndex
  BRIEFR_AI: Ai
  BRIEFR_R2: R2Bucket
  INGESTION_QUEUE: Queue
}

interface QueueMsg { sourceId: string; projectId: string; triggeredBy: string }

export default {
  async queue(batch: MessageBatch<QueueMsg>, env: IngestionBindings) {
    const db = drizzle(neon(env.DATABASE_URL))
    for (const msg of batch.messages) {
      try {
        await processIngestion(db, env, msg.body)
        msg.ack()
      } catch (err) {
        console.error(`Ingestion error for source ${msg.body.sourceId}:`, err)
        msg.retry()
      }
    }
  }
}

async function processIngestion(db: any, env: IngestionBindings, msg: QueueMsg) {
  const { sourceId, projectId, triggeredBy } = msg

  const [source] = await db.select().from(sources).where(eq(sources.id, sourceId)).limit(1)
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!source || !project) return

  const [job] = await db.insert(ingestionJobs).values({
    sourceId, projectId, status: 'running', triggeredBy, startedAt: new Date(),
  }).returning()

  await db.update(sources).set({ status: 'syncing', updatedAt: new Date() }).where(eq(sources.id, sourceId))

  let chunksCreated = 0
  let chunksSkipped = 0

  try {
    const config = source.config as any
    const rawChunks = await extractChunks(db, env, source, config)

    for (const raw of rawChunks) {
      // SHA-256 deduplication
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

      await embedAndStore({
        env: env as any,
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

      await db.update(chunks).set({ status: 'embedded', embeddingModel: '@cf/baai/bge-m3' })
        .where(eq(chunks.id, chunkId))

      chunksCreated++
    }

    await db.update(sources).set({
      status: 'ready',
      chunkCount: sql`${sources.chunkCount} + ${chunksCreated}`,
      lastSyncAt: new Date(),
      nextSyncAt: new Date(Date.now() + source.syncIntervalHours * 60 * 60 * 1000),
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
    await db.update(sources).set({
      status: 'error', lastError: err.message, lastErrorAt: new Date(), updatedAt: new Date(),
    }).where(eq(sources.id, sourceId))
    await db.update(ingestionJobs).set({
      status: 'failed', errorMessage: err.message, completedAt: new Date(),
    }).where(eq(ingestionJobs.id, job.id))
    throw err
  }
}

async function extractChunks(db: any, env: IngestionBindings, source: any, config: any) {
  const dk = (val: string) => decryptField(val, env.ENCRYPTION_KEY)

  switch (source.type) {
    case 'slack_channel': {
      const token = await dk(config.accessToken)
      const msgs = await fetchSlackChannel(token, config.channelId)
      return chunkSlackMessages(msgs, config.channelName)
    }
    case 'gmail_label': {
      const token = await dk(config.accessToken)
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
      const blocks = await fetchNotionPage(token, config.pageId)
      const text = extractNotionText(blocks)
      return chunkText(text, 600, 80).map(c => ({ content: c, date: new Date().toISOString(), authors: [] as string[] }))
    }
    case 'file_upload':
    case 'whatsapp_export': {
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
      return chunkText(config.content, 600, 80).map(c => ({ content: c, date: new Date().toISOString(), authors: [] as string[] }))
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
