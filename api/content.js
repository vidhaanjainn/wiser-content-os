import { sql, unreadCount } from './_lib.js'

// Dashboard feed for the Content page: latest snapshot per section + recent notifications.
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const snaps = await sql().query('select key, data, updated_at from content_snapshots')
      const feed = await sql().query(
        `select id, kind, urgency, title, body, url, source, read, created_at
         from content_feed order by created_at desc limit 60`,
      )
      const snapshots = Object.fromEntries(snaps.map(s => [s.key, { data: s.data, updated_at: s.updated_at }]))
      return res.status(200).json({ snapshots, feed, unread: await unreadCount() })
    }
    if (req.method === 'POST' && req.body?.action === 'read_all') {
      await sql().query('update content_feed set read = true where read = false')
      return res.status(200).json({ ok: true })
    }
    if (req.method === 'POST' && req.body?.action === 'read' && req.body.id) {
      await sql().query('update content_feed set read = true where id = $1', [req.body.id])
      return res.status(200).json({ ok: true })
    }
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[api/content]', err)
    return res.status(500).json({ error: 'Database error' })
  }
}
