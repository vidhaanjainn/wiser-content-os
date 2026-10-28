// Tiny markdown renderer for scripts and notes: headings, **bold**, *italic*, bullets, ``` blocks (scripts), tables, rules.
// Plain JSX, no dependency, no HTML injection (text only).
const inline = (t, k) => {
  const parts = t.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g).filter(Boolean)
  return parts.map((p, i) =>
    p.startsWith('**') ? <b key={k + i}>{p.slice(2, -2)}</b>
    : p.startsWith('`') ? <code key={k + i}>{p.slice(1, -1)}</code>
    : p.startsWith('*') && p.length > 2 ? <em key={k + i}>{p.slice(1, -1)}</em>
    : p)
}

export function Markdown({ text }) {
  const lines = String(text || '').replace(/<!--[\s\S]*?-->/g, '').split('\n')
  const out = []
  let i = 0
  while (i < lines.length) {
    const ln = lines[i]
    if (ln.startsWith('```')) {
      const buf = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++])
      i++
      out.push(<pre key={out.length} className="md-script">{buf.join('\n')}</pre>)
    } else if (ln.startsWith('|')) {
      const buf = []
      while (i < lines.length && lines[i].startsWith('|')) buf.push(lines[i++])
      out.push(<pre key={out.length} className="md-table">{buf.filter(l => !/^\|[-\s|:]+\|?$/.test(l)).map(l => l.replace(/^\||\|$/g, '').split('|').map(c => c.trim()).join('  ·  ')).join('\n')}</pre>)
    } else if (/^#{1,4}\s/.test(ln)) {
      const lvl = ln.match(/^#+/)[0].length
      out.push(<div key={out.length} className={`md-h md-h${Math.min(lvl, 3)}`}>{inline(ln.replace(/^#+\s*/, ''), out.length)}</div>)
      i++
    } else if (/^\s*([-*]|\d+[.)])\s+/.test(ln)) {
      out.push(<div key={out.length} className="md-li">{inline(ln.replace(/^\s*([-*]|\d+[.)])\s+/, '• '), out.length)}</div>)
      i++
    } else if (/^---+$/.test(ln.trim())) {
      out.push(<hr key={out.length} className="md-hr" />); i++
    } else if (!ln.trim()) {
      i++
    } else {
      out.push(<p key={out.length} className="md-p">{inline(ln, out.length)}</p>); i++
    }
  }
  return <div className="md">{out}</div>
}
