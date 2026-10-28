// Wiser OS service worker: web push + notification taps. No caching, so the app always loads fresh.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('push', event => {
  let d = {}
  try { d = event.data ? event.data.json() : {} } catch { d = { title: 'Wiser OS', body: event.data?.text() } }
  event.waitUntil((async () => {
    await self.registration.showNotification(d.title || 'Wiser OS', {
      body: d.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: d.tag,
      renotify: !!d.urgent,
      requireInteraction: !!d.urgent,
      data: { url: d.url || '/' },
    })
    if (self.navigator.setAppBadge && typeof d.badge === 'number') {
      try { d.badge > 0 ? await self.navigator.setAppBadge(d.badge) : await self.navigator.clearAppBadge() } catch {}
    }
  })())
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const c of all) {
      if ('focus' in c) { await c.focus(); c.postMessage({ type: 'open-content' }); return }
    }
    await self.clients.openWindow(url)
  })())
})
