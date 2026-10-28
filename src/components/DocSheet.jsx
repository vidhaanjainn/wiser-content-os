import { useState, useEffect, useMemo } from 'react'
import { Markdown } from '../lib/md'
import { Badge } from './UI'

// Full-screen sheet: opens a document directly (docKey), or the searchable library. Bodies load only when tapped.
const STATUS = [['to record', 'To record'], ['recorded', 'Recorded'], ['idea', 'Ideas'], ['all', 'All']]
const TOPIC_ORDER = ['Luck', 'Mysteries', 'Old Wisdom', 'Book Rules', 'This Week', 'Daily menu', 'Banks', 'Docs', 'Reports']
// Which tab a document lives under: scripts by series, everything else by kind
function topicOf(d) {
  if (d.kind === 'bank') return 'Banks'
  if (d.kind === 'doc') return 'Docs'
  if (d.kind === 'report') return 'Reports'
  const s = d.series || ''
  if (s.startsWith('Luck')) return 'Luck'
  if (s.startsWith('Manageable')) return 'Mysteries'
  if (s.startsWith('Old Wisdom')) return 'Old Wisdom'
  if (s.startsWith('Book Rules')) return 'Book Rules'
  if (s.startsWith('Menu')) return 'Daily menu'
  return s || 'Other'
}
const STATUS_BADGE = { 'to record': 'amber', recorded: 'green', idea: 'blue', menu: 'lime' }

export default function DocSheet({ docKey, onClose, showToast }) {
  const [open, setOpen] = useState(docKey || null)   // key of the doc being read
  const [list, setList] = useState(null)
  const [doc, setDoc] = useState(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('to record')
  const [topic, setTopic] = useState('all')
  const fromLibrary = useMemo(() => !docKey, [docKey])

  useEffect(() => {
    if (!fromLibrary) return
    fetch('/api/docs').then(r => r.json()).then(setList).catch(() => setList([]))
  }, [fromLibrary])

  useEffect(() => {
    if (!open) { setDoc(null); return }
    let live = true
    setDoc(null)
    fetch('/api/docs?key=' + encodeURIComponent(open)).then(r => (r.ok ? r.json() : Promise.reject())).then(d => live && setDoc(d))
      .catch(() => live && setDoc({ title: 'Not available yet', body: 'This document has not been synced to Wiser OS. It will appear after the next sync.' }))
    return () => { live = false }
  }, [open])

  const tabs = useMemo(() => {
    const n = {}
    ;(list || []).forEach(d => { const k = topicOf(d); n[k] = (n[k] || 0) + 1 })
    const keys = [...TOPIC_ORDER.filter(k => n[k]), ...Object.keys(n).filter(k => !TOPIC_ORDER.includes(k))]
    return [['all', 'All', (list || []).length], ...keys.map(k => [k, k, n[k]])]
  }, [list])

  const shown = useMemo(() => {
    if (!list) return []
    const s = q.trim().toLowerCase()
    return list.filter(d => {
      const byTopic = topic === 'all' || topicOf(d) === topic
      const byStatus = filter === 'all' || !['to record', 'recorded', 'idea'].includes(d.status) || d.status === filter
      return byTopic && byStatus && (!s || `${d.code || ''} ${d.title} ${d.series || ''}`.toLowerCase().includes(s))
    })
  }, [list, q, filter, topic])

  async function copy() {
    try { await navigator.clipboard.writeText(doc?.body || ''); showToast?.('Copied') } catch { showToast?.('Copy failed') }
  }
  function back() { if (docKey || !open) onClose(); else setOpen(null) }

  return (
    <div className="sheet" role="dialog" aria-modal="true">
      <div className="sheet-bar">
        <button className="sheet-x" onClick={back} aria-label="Back">{open && !docKey ? '‹' : '✕'}</button>
        <div className="sheet-title">{open ? (doc?.title || 'Loading…') : 'Scripts & docs'}</div>
        {open && doc?.body ? <button className="sheet-act" onClick={copy}>Copy</button> : <span style={{ width: 52 }} />}
      </div>

      {open ? (
        <div className="sheet-body">
          {doc && <div className="sheet-meta">{doc.code && <Badge type="lime">{doc.code}</Badge>} {doc.status && <Badge type={STATUS_BADGE[doc.status] || 'neutral'}>{doc.status}</Badge>} {doc.series && <span>{doc.series}</span>}</div>}
          {doc ? <Markdown text={doc.body} /> : <div className="today-missing">Loading…</div>}
        </div>
      ) : (
        <div className="sheet-body">
          <input className="sheet-search" placeholder="Search scripts, codes, docs…" value={q} onChange={e => setQ(e.target.value)} />
          <div className="sheet-chips">
            {tabs.map(([k, label, n]) => <button key={k} className={topic === k ? 'on' : ''} onClick={() => setTopic(k)}>{label} {n}</button>)}
          </div>
          <div className="sheet-chips">
            {STATUS.map(([k, label]) => <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{label}</button>)}
          </div>
          {!list ? <div className="today-missing">Loading…</div> : !shown.length ? <div className="today-missing">Nothing here{list.length ? '' : ' yet — docs sync with the next morning push.'}</div> : shown.map(d => (
            <button key={d.key} className="sheet-row" onClick={() => setOpen(d.key)}>
              <div><b>{d.code ? `${d.code} · ` : ''}{d.title}</b><div className="today-sub">{d.series || d.kind}</div></div>
              {d.status && <Badge type={STATUS_BADGE[d.status] || 'neutral'}>{d.status}</Badge>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
