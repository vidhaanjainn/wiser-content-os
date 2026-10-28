import { timingSafeEqual } from 'node:crypto'
import { sql, pushAll, unreadCount } from './_lib.js'

// Called by the Mac-side tools (tools/wiser_push.py) with a bearer token.
//   { sections: { stats: {...}, menu: {...}, ... }, events: [{ key, kind, urgency, title, body, url, source }] }
// Sections replace the dashboard snapshot for that key. Events go to the feed; each NEW event (by key) is pushed to every device.
function authed(req) {
  const want = Buffer.from(process.env.WISER_INGEST_TOKEN || '')
  const got = Buffer.from((req.headers.authorization || '').replace(/^Bearer\s+/i, ''))
  return want.length > 0 && want.length === got.length && timingSafeEqual(want, got)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  if (!authed(req)) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const { sections = {}, events = [] } = req.body || {}
    const out = { sections: 0, events: 0, pushed: 0, skipped: 0 }

    for (const [key, data] of Object.entries(sections)) {
      await sql().query(
        `insert into content_snapshots (key, data, updated_at) values ($1, $2::jsonb, now())
         on conflict (key) do update set data = excluded.data, updated_at = now()`,
        [key, JSON.stringify(data)],
      )
      out.sections++
    }

    const fresh = []
    for (const e of events) {
      if (!e?.title) continue
      const rows = await sql().query(
        `insert into content_feed (dedupe_key, kind, urgency, title, body, url, source)
         values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (dedupe_key) do nothing returning id`,
        [e.key || null, e.kind || 'update', e.urgency || 'update', e.title, e.body || null, e.url || '/', e.source || null],
      )
      if (!rows.length) { out.skipped++; continue }
      out.events++
      fresh.push({ ...e, id: rows[0].id })
    }

    if (fresh.length) {
      const badge = await unreadCount()
      for (const e of fresh) {
        if (e.urgency === 'silent') continue
        const n = await pushAll({
          title: (e.urgency === 'urgent' ? '🔴 ' : '') + e.title,
          body: e.body || '',
          url: e.url || '/',
          tag: e.key || e.id,
          urgent: e.urgency === 'urgent',
          badge,
        }, e.urgency)
        out.pushed += n
        await sql().query('update content_feed set pushed = $1 where id = $2', [n, e.id])
      }
    }
    return res.status(200).json(out)
  } catch (err) {
    console.error('[api/ingest]', err)
    return res.status(500).json({ error: 'Ingest failed' })
  }
}
