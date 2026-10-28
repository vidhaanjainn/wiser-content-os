import { sql, requireAuth } from './_lib.js'

// GET /api/docs          -> list (no bodies), so the library opens instantly
// GET /api/docs?key=S1   -> one document with its body (fetched only when you tap it)
export default async function handler(req, res) {
  if (!requireAuth(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' })
  try {
    if (req.query.key) {
      const r = await sql().query(
        'select key, title, kind, code, series, status, body, updated_at from content_docs where key = $1', [req.query.key])
      return r[0] ? res.status(200).json(r[0]) : res.status(404).json({ error: 'Not found' })
    }
    const rows = await sql().query(
      `select key, title, kind, code, series, status, updated_at, length(body)::int as size
       from content_docs order by kind, status, code nulls last, title`)
    return res.status(200).json(rows)
  } catch (err) {
    console.error('[api/docs]', err)
    return res.status(500).json({ error: 'Database error' })
  }
}
