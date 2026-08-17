import { useState, useEffect, useCallback } from 'react'
import { isLive, fetchRows, upsertRow, flushPendingWrites } from '../lib/sheets'
import { loadCache, saveCache } from '../lib/localCache'
import { DEMO_STATS } from '../lib/demo'

const SHEET = 'Stats'
const CACHE_KEY = 'stats'

function topTen(rows) {
  return [...rows]
    .sort((a, b) => (b.stat_date || '').localeCompare(a.stat_date || ''))
    .slice(0, 10)
}

export function useStats() {
  const [stats, setStats] = useState(() => (isLive ? loadCache(CACHE_KEY, []) : DEMO_STATS))
  const [loading, setLoading] = useState(() => isLive && loadCache(CACHE_KEY, []).length === 0)

  useEffect(() => {
    async function load() {
      if (!isLive) { setStats(DEMO_STATS); setLoading(false); return }
      try {
        await flushPendingWrites()
        const data = topTen(await fetchRows(SHEET))
        setStats(data)
        saveCache(CACHE_KEY, data)
      } catch {
        // Sheet unreachable — keep showing the cached copy
      }
      setLoading(false)
    }
    load()
  }, [])

  const upsertStat = useCallback(async (entry) => {
    if (!isLive) {
      setStats(prev => topTen([{ ...entry, id: Date.now().toString() }, ...prev.filter(s => s.stat_date !== entry.stat_date)]))
      return
    }
    const optimistic = { ...entry, id: crypto.randomUUID() }
    setStats(prev => {
      const next = topTen([optimistic, ...prev.filter(s => s.stat_date !== entry.stat_date)])
      saveCache(CACHE_KEY, next)
      return next
    })
    upsertRow(SHEET, 'stat_date', entry)
  }, [])

  return { stats, loading, upsertStat }
}
