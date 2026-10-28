import { useState, useEffect, useCallback } from 'react'
import { isLive } from '../lib/api'

// Content hub data: dashboard snapshots + notification feed, refreshed every 60 s and when the app regains focus.
export function useContent() {
  const [data, setData] = useState({ snapshots: {}, feed: [], unread: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    if (!isLive) { setLoading(false); return }
    try {
      const res = await fetch('/api/content')
      if (!res.ok) throw new Error(res.status)
      setData(await res.json())
      setError(false)
    } catch { setError(true) }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 60000)
    const vis = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', vis)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis) }
  }, [load])

  const markRead = useCallback(async (id) => {
    await fetch('/api/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(id ? { action: 'read', id } : { action: 'read_all' }) })
    load()
    if (!id && navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {})
  }, [load])

  return { ...data, loading, error, reload: load, markRead }
}
