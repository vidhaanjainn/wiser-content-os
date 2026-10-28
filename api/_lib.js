import { neon } from '@neondatabase/serverless'
import webpush from 'web-push'
import { createHmac, timingSafeEqual } from 'node:crypto'

let _sql
export const sql = () => (_sql ??= neon(process.env.DATABASE_URL))

let _vapid = false
function vapid() {
  if (_vapid) return
  webpush.setVapidDetails('https://wiser-content-os.vercel.app', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)
  _vapid = true
}

// Sends one payload to every stored subscription; prunes the ones the push service says are gone.
// Returns how many devices accepted it.
export async function pushAll(payload, urgency = 'update') {
  vapid()
  const subs = await sql().query('select endpoint, p256dh, auth from push_subscriptions')
  let ok = 0
  await Promise.all(subs.map(async s => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
        { TTL: urgency === 'urgent' ? 86400 : 21600, urgency: urgency === 'urgent' ? 'high' : 'normal' },
      )
      ok++
      await sql().query('update push_subscriptions set last_ok_at = now() where endpoint = $1', [s.endpoint])
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        await sql().query('delete from push_subscriptions where endpoint = $1', [s.endpoint])
      } else {
        console.error('[push]', e.statusCode, e.body?.slice?.(0, 120))
      }
    }
  }))
  return ok
}

export async function unreadCount() {
  const r = await sql().query('select count(*)::int as n from content_feed where read = false')
  return r[0].n
}

// ── PIN login ────────────────────────────────────────────────
// Cookie = "<expiryMs>.<hmac>" signed with AUTH_SECRET. No APP_PIN / AUTH_SECRET configured => everything stays locked.
const COOKIE = 'wiser_session'
const DAYS = 90
const sign = exp => createHmac('sha256', process.env.AUTH_SECRET || '').update(String(exp)).digest('hex')
const safeEq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y) }

export function isAuthed(req) {
  if (!process.env.AUTH_SECRET || !process.env.APP_PIN) return false
  const m = (req.headers.cookie || '').match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`))
  if (!m) return false
  const [exp, sig] = decodeURIComponent(m[1]).split('.')
  return Number(exp) > Date.now() && !!sig && safeEq(sig, sign(exp))
}

export function requireAuth(req, res) {
  if (isAuthed(req)) return true
  res.status(401).json({ error: 'Login required' })
  return false
}

export function sessionCookie() {
  const exp = Date.now() + DAYS * 864e5
  return `${COOKIE}=${encodeURIComponent(`${exp}.${sign(exp)}`)}; Path=/; Max-Age=${DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`
}
export const clearCookie = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
export const pinOk = pin => !!process.env.APP_PIN && safeEq(String(pin || ''), process.env.APP_PIN)
