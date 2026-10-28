import { neon } from '@neondatabase/serverless'
import webpush from 'web-push'

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
