// Quick tests for simpleMarkdownToHtml and markdownToPlainText logic
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function inline(text) {
  let t = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>')
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
  t = t.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  return t
}
function simpleMarkdownToHtml(md) {
  const escaped = escapeHtml(md)
  const lines = escaped.split(/\r?\n/)
  const out = []
  let inList = false
  let inOl = false
  const closeLists = () => { if (inList) { out.push('</ul>'); inList = false } if (inOl) { out.push('</ol>'); inOl = false } }
  for (let raw of lines) {
    const line = raw.trimEnd()
    if (line.trim() === '') { closeLists(); out.push(''); continue }
    const h = line.match(/^(#{1,3})\s+(.*)$/)
    if (h) { closeLists(); const level = h[1].length; const text = h[2]; out.push(`<h${level}>${inline(text)}</h${level}>`); continue }
    const ol = line.match(/^\d+\.\s+(.*)$/)
    if (ol) { if (!inOl) { closeLists(); out.push('<ol>'); inOl = true } out.push(`<li>${inline(ol[1])}</li>`); continue }
    const ul = line.match(/^[-*]\s+(.*)$/)
    if (ul) { if (!inList) { closeLists(); out.push('<ul>'); inList = true } out.push(`<li>${inline(ul[1])}</li>`); continue }
    closeLists(); out.push(`<p>${inline(line)}</p>`)
  }
  closeLists();
  return out.join('\n')
}
function markdownToPlainText(md) {
  const html = simpleMarkdownToHtml(md)
  const withBreaks = html.replace(/<br\s*\/?>/gi, '\n')
  const text = withBreaks.replace(/<[^>]+>/g, '')
  return text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
}

const sample = '# Title\n\nSome **bold** and *italic* and a [link](https://example.com).\n\n- one\n- two\n1. first\n2. second\n\nCode: `x=1`'

const html = simpleMarkdownToHtml(sample)
console.log('HTML:\n', html)
const text = markdownToPlainText(sample)
console.log('\nPlain text:\n', text)

if (!html.includes('<h1>Title</h1>')) throw new Error('Heading missing')
if (!html.includes('<strong>bold</strong>')) throw new Error('Bold missing')
if (!html.includes('<em>italic</em>')) throw new Error('Italic missing')
if (!html.includes('<a href="https://example.com"')) throw new Error('Link missing')
if (!html.includes('<ul>') || !html.includes('<ol>')) throw new Error('Lists missing')
if (!html.includes('<code>x=1</code>')) throw new Error('Code missing')
if (!text.includes('Title') || !text.includes('bold') || !text.includes('x=1')) throw new Error('Plain text missing content')

console.log('\nAll markdown tests passed.')
