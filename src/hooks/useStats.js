import { useState, useEffect, useCallback } from 'react'
import { api, isLive } from '../lib/api'
import { DEMO_STATS } from '../lib/demo'

export function useStats() {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!isLive) { setStats(DEMO_STATS); setLoading(false); return }
      try { setStats(await api.list('stats') || []) } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [])

  const upsertStat = useCallback(async (entry) => {
    if (!isLive) {
      setStats(prev => {
        const filtered = prev.filter(s => s.stat_date !== entry.stat_date)
        return [{ ...entry, id: Date.now().toString() }, ...filtered]
          .sort((a, b) => b.stat_date.localeCompare(a.stat_date))
          .slice(0, 10)
      })
      return
    }
    try {
      await api.create('stats', entry) // server upserts on stat_date
      setStats(await api.list('stats') || [])
    } catch (e) { console.error(e) }
  }, [])

  return { stats, loading, upsertStat }
}
