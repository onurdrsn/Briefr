interface SlackMessage {
  ts: string
  text: string
  user: string
  username?: string
  files?: Array<{ name: string; mimetype: string; url_private: string }>
}

export async function fetchSlackChannel(
  accessToken: string,
  channelId: string,
  oldestTs?: string
): Promise<SlackMessage[]> {
  const params = new URLSearchParams({
    channel: channelId,
    limit: '200',
    ...(oldestTs ? { oldest: oldestTs } : {}),
  })

  const response = await fetch(`https://slack.com/api/conversations.history?${params}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })
  const data = await response.json() as any
  if (!data.ok) throw new Error(`Slack API error: ${data.error}`)
  return data.messages ?? []
}

export function chunkSlackMessages(
  messages: SlackMessage[],
  channelName: string,
  windowSize = 10
): Array<{ content: string; date: string; authors: string[] }> {
  const chunks: Array<{ content: string; date: string; authors: string[] }> = []
  for (let i = 0; i < messages.length; i += windowSize) {
    const window = messages.slice(i, i + windowSize)
    const authors = [...new Set(window.map(m => m.username ?? m.user).filter(Boolean))]
    const content = window
      .map(m => `${m.username ?? m.user}: ${m.text}`)
      .join('\n')
    const date = window[0]?.ts ? new Date(parseFloat(window[0].ts) * 1000).toISOString() : new Date().toISOString()
    if (content.trim().length > 20) {
      chunks.push({ content: `#${channelName}\n${content}`, date, authors })
    }
  }
  return chunks
}

export async function sendSlackWebhookMessage(
  webhookUrl: string,
  payload: { text: string; blocks?: any[] }
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Slack Webhook error (${response.status}): ${text}`)
  }
}
