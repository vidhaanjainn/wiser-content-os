import { sql, pushAll, unreadCount, requireAuth } from './_lib.js'

// Device side of web push: public key, subscribe, unsubscribe, and a test push to the caller's own device.
export default async function handler(req, res) {
  if (!requireAuth(req, res)) return
  try {
    if (req.method === 'GET') {
      return res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY || null })
    }
    const body = req.body || {}
    if (req.method === 'POST' && body.action === 'test') {
      const n = await pushAll({
        title: 'Wiser OS notifications are on',
        body: 'You will get updates and urgent alerts here.',
        url: '/', tag: 'wiser-test', urgent: false, badge: await unreadCount(),
      }, 'update')
      return res.status(200).json({ sent: n })
    }
    if (req.method === 'POST') {
      const s = body.subscription
      if (!s?.endpoint || !s.keys?.p256dh || !s.keys?.auth) return res.status(400).json({ error: 'Bad subscription' })
      await sql().query(
        `insert into push_subscriptions (endpoint, p256dh, auth, device) values ($1, $2, $3, $4)
         on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, device = excluded.device`,
        [s.endpoint, s.keys.p256dh, s.keys.auth, String(body.device || '').slice(0, 120)],
      )
      return res.status(200).json({ ok: true })
    }
    if (req.method === 'DELETE') {
      if (body.endpoint) await sql().query('delete from push_subscriptions where endpoint = $1', [body.endpoint])
      return res.status(200).json({ ok: true })
    }
    res.setHeader('Allow', 'GET, POST, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[api/push]', err)
    return res.status(500).json({ error: 'Push error' })
  }
}
