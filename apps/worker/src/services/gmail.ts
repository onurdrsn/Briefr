export async function fetchGmailThreads(
  accessToken: string,
  labelId: string,
  maxResults = 50,
  pageToken?: string
) {
  const params = new URLSearchParams({
    labelIds: labelId,
    maxResults: String(maxResults),
    ...(pageToken ? { pageToken } : {}),
  })
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads?${params}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })
  const data = await response.json() as any
  return { threads: data.threads ?? [], nextPageToken: data.nextPageToken }
}

export async function fetchGmailThread(accessToken: string, threadId: string) {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  )
  return response.json()
}

export function extractEmailText(thread: any): {
  subject: string; participants: string[]; date: string; content: string
} {
  const messages = thread.messages ?? []
  const firstMsg = messages[0]
  const headers = firstMsg?.payload?.headers ?? []
  const subject = headers.find((h: any) => h.name === 'Subject')?.value ?? ''
  const dateStr = headers.find((h: any) => h.name === 'Date')?.value ?? ''
  const participants = messages.flatMap((m: any) =>
    (m.payload?.headers ?? [])
      .filter((h: any) => h.name === 'From' || h.name === 'To')
      .map((h: any) => h.value)
  )

  const bodies: string[] = []
  for (const msg of messages) {
    const body = extractBody(msg.payload)
    if (body) bodies.push(body)
  }

  const dateISO = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString()
  const uniqueParticipants = [...new Set(participants)] as string[]

  return {
    subject,
    participants: uniqueParticipants,
    date: dateISO,
    content: `Subject: ${subject}\nParticipants: ${uniqueParticipants.join(', ')}\n\n${bodies.join('\n---\n')}`,
  }
}

function extractBody(payload: any): string {
  if (!payload) return ''
  if (payload.body?.data) {
    try {
      const decoded = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
      return decoded.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    } catch {
      return ''
    }
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBody(part)
      if (text) return text
    }
  }
  return ''
}
