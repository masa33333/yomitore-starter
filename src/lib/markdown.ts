// Very small Markdown-to-HTML converter for headings, bold/italic, lists, paragraphs.
// Not full spec; safe-ish by escaping HTML first.

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function simpleMarkdownToHtml(md: string): string {
  const escaped = escapeHtml(md)
  const lines = escaped.split(/\r?\n/)
  const out: string[] = []
  let inList = false
  let inOl = false

  const closeLists = () => {
    if (inList) { out.push('</ul>'); inList = false }
    if (inOl) { out.push('</ol>'); inOl = false }
  }

  for (let raw of lines) {
    const line = raw.trimEnd()
    if (line.trim() === '') { closeLists(); out.push('') ; continue }

    // Headings #, ##, ###
    const h = line.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      closeLists()
      const level = h[1].length
      const text = h[2]
      out.push(`<h${level}>${inline(text)}</h${level}>`)
      continue
    }

    // Ordered list: "1. text"
    const ol = line.match(/^\d+\.\s+(.*)$/)
    if (ol) {
      if (!inOl) { closeLists(); out.push('<ol>'); inOl = true }
      out.push(`<li>${inline(ol[1])}</li>`)
      continue
    }

    // Unordered list: "- text"
    const ul = line.match(/^[-*]\s+(.*)$/)
    if (ul) {
      if (!inList) { closeLists(); out.push('<ul>'); inList = true }
      out.push(`<li>${inline(ul[1])}</li>`)
      continue
    }

    // Paragraph
    closeLists()
    out.push(`<p>${inline(line)}</p>`)
  }

  closeLists()
  return out.join('\n')
}

function inline(text: string): string {
  // bold **text**
  let t = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // italic *text*
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // code `code`
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
  // links [text](url)
  t = t.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  return t
}

export function markdownToPlainText(md: string): string {
  // Convert to HTML then strip tags for a quick approximation
  const html = simpleMarkdownToHtml(md)
  // Replace <br> with newline first
  const withBreaks = html.replace(/<br\s*\/?>/gi, '\n')
  const text = withBreaks.replace(/<[^>]+>/g, '')
  // Decode minimal entities
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}
