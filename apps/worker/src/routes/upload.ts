import type { Context } from 'hono'
import type { CloudflareBindings } from '../context'

export async function uploadHandler(c: Context<{ Bindings: CloudflareBindings }>) {
  const body = await c.req.parseBody()
  const file = body['file'] as File
  const workspaceId = body['workspaceId'] as string
  const projectId = body['projectId'] as string

  if (!file || !workspaceId || !projectId) {
    return c.json({ error: 'Missing file or workspaceId or projectId' }, 400)
  }

  const ext = file.name.split('.').pop() || 'bin'
  const r2Key = `uploads/${workspaceId}/${projectId}/${crypto.randomUUID()}.${ext}`

  const buffer = await file.arrayBuffer()
  await c.env.BRIEFR_R2.put(r2Key, buffer, {
    httpMetadata: { contentType: file.type },
  })

  return c.json({
    r2Key,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  })
}
