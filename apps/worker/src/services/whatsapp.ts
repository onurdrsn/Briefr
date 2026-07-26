// WhatsApp text export format: "DD.MM.YYYY HH:mm - Name: Message"
interface WaMessage { date: string; author: string; content: string }

export function parseWhatsAppExport(rawText: string): WaMessage[] {
  const lineRegex = /^(\d{1,2}\.\d{1,2}\.\d{4})[, ]+(\d{2}:\d{2})\s*-\s*([^:]+):\s*(.+)$/
  const messages: WaMessage[] = []

  for (const line of rawText.split('\n')) {
    const match = line.match(lineRegex)
    if (match) {
      const [, dateStr, time, author, content] = match
      const [day, month, year] = dateStr.split('.')
      messages.push({
        date: new Date(`${year}-${month}-${day}T${time}:00`).toISOString(),
        author: author.trim(),
        content: content.trim(),
      })
    }
  }
  return messages
}

export function chunkWaMessages(messages: WaMessage[], windowSize = 15) {
  const chunks = []
  for (let i = 0; i < messages.length; i += windowSize) {
    const window = messages.slice(i, i + windowSize)
    const authors = [...new Set(window.map(m => m.author))]
    const content = window.map(m => `${m.author}: ${m.content}`).join('\n')
    chunks.push({ content, date: window[0]?.date ?? new Date().toISOString(), authors })
  }
  return chunks
}
