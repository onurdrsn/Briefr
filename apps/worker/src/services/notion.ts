export async function fetchNotionPage(accessToken: string, pageId: string) {
  const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': '2022-06-28',
    },
  })
  return response.json()
}

export function extractNotionText(blocks: any): string {
  const lines: string[] = []
  for (const block of blocks?.results ?? []) {
    const type = block.type
    const richText = block[type]?.rich_text ?? []
    const text = richText.map((t: any) => t.plain_text).join('')
    if (text.trim()) {
      if (type === 'heading_1') lines.push(`# ${text}`)
      else if (type === 'heading_2') lines.push(`## ${text}`)
      else if (type === 'heading_3') lines.push(`### ${text}`)
      else if (type === 'bulleted_list_item') lines.push(`• ${text}`)
      else if (type === 'numbered_list_item') lines.push(`${text}`)
      else if (type === 'to_do') lines.push(`[${block.to_do?.checked ? 'x' : ' '}] ${text}`)
      else lines.push(text)
    }
  }
  return lines.join('\n')
}

// Sliding window chunking for long text documents
export function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let i = 0
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim().length > 50) chunks.push(chunk)
    i += chunkSize - overlap
  }
  return chunks
}
