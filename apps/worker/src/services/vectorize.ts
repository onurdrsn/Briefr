import type { CloudflareBindings } from '../context'

interface EmbedAndStoreParams {
  env: CloudflareBindings
  chunkId: string
  content: string
  namespace: string
  metadata: {
    sourceId: string
    sourceType: string
    sourceName: string
    projectId: string
    content: string          // preview text (first 500 chars)
    originalDate?: string
    author?: string
    language?: string
  }
}

export async function embedAndStore(params: EmbedAndStoreParams): Promise<void> {
  const { env, chunkId, content, namespace, metadata } = params

  // BGE-M3 embedding (768 dim, multilingual)
  const embedResult = await env.BRIEFR_AI.run('@cf/baai/bge-m3', {
    text: [content],
  }) as { data: number[][] }

  const vector = embedResult.data[0]

  await env.BRIEFR_VECTORIZE.upsert([{
    id: chunkId,
    values: vector,
    namespace,
    metadata: {
      sourceId: metadata.sourceId,
      sourceType: metadata.sourceType,
      sourceName: metadata.sourceName,
      projectId: metadata.projectId,
      content: metadata.content.substring(0, 500),
      originalDate: metadata.originalDate ?? '',
      author: metadata.author ?? '',
    } as Record<string, string>,
  }])
}

export async function searchMemory(
  env: CloudflareBindings,
  params: {
    namespace: string
    query: string
    topK: number
    filter?: Record<string, unknown>
  }
) {
  const embedResult = await env.BRIEFR_AI.run('@cf/baai/bge-m3', {
    text: [params.query],
  }) as { data: number[][] }

  const queryVector = embedResult.data[0]

  const results = await env.BRIEFR_VECTORIZE.query(queryVector, {
    topK: params.topK,
    namespace: params.namespace,
    returnMetadata: 'all',
    filter: params.filter as any,
  })

  return results?.matches ?? []
}

export async function deleteSourceChunks(
  env: CloudflareBindings,
  sourceId: string,
  projectId: string
): Promise<number> {
  const { drizzle } = await import('drizzle-orm/neon-http')
  const { neon } = await import('@neondatabase/serverless')
  const { chunks } = await import('@briefr/db')
  const { eq } = await import('drizzle-orm')

  const db = drizzle(neon(env.DATABASE_URL))
  const chunkIds = await db.select({ id: chunks.id }).from(chunks)
    .where(eq(chunks.sourceId, sourceId))

  if (chunkIds.length === 0) return 0

  for (let i = 0; i < chunkIds.length; i += 1000) {
    await env.BRIEFR_VECTORIZE.deleteByIds(chunkIds.slice(i, i + 1000).map(c => c.id))
  }

  return chunkIds.length
}
