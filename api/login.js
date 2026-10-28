import { sql, isAuthed, pinOk, sessionCookie, clearCookie } from './_lib.js'

// GET -> { authed }, POST { pin } -> sets the session cookie, DELETE -> logs out.
// Brute-force guard: 5 wrong PINs lock logins for 15 minutes (counter kept in content_snapshots).
const MAX = 5, LOCK_MS = 15 * 60 * 1000

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ authed: isAuthed(req) })
  if (req.method === 'DELETE') { res.setHeader('Set-Cookie', clearCookie()); return res.status(200).json({ ok: true }) }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const row = (await sql().query(`select data from content_snapshots where key = 'auth_guard'`))[0]?.data || { fails: 0, until: 0 }
    if (row.until > Date.now()) {
      return res.status(429).json({ error: 'Too many tries', retryInMin: Math.ceil((row.until - Date.now()) / 60000) })
    }
    if (pinOk(req.body?.pin)) {
      await sql().query(`delete from content_snapshots where key = 'auth_guard'`)
      res.setHeader('Set-Cookie', sessionCookie())
      return res.status(200).json({ authed: true })
    }
    const fails = (row.fails || 0) + 1
    const guard = fails >= MAX ? { fails: 0, until: Date.now() + LOCK_MS } : { fails, until: 0 }
    await sql().query(
      `insert into content_snapshots (key, data, updated_at) values ('auth_guard', $1::jsonb, now())
       on conflict (key) do update set data = excluded.data, updated_at = now()`, [JSON.stringify(guard)])
    return res.status(401).json({ error: 'Wrong PIN', left: fails >= MAX ? 0 : MAX - fails })
  } catch (err) {
    console.error('[api/login]', err)
    return res.status(500).json({ error: 'Login error' })
  }
}
