import { useState, useEffect, useCallback } from 'react'
import { supabase, isLive } from '../lib/supabase'
import { DEMO_STATS } from '../lib/demo'

export function useStats() {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!isLive) { setStats(DEMO_STATS); setLoading(false); return }
      const { data, error } = await supabase
        .from('perf_stats')
        .select('*')
        .order('stat_date', { ascending: false })
        .limit(10)
      if (!error) setStats(data || [])
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
    await supabase.from('perf_stats').upsert(entry, { onConflict: 'stat_date' })
    const { data } = await supabase
      .from('perf_stats')
      .select('*')
      .order('stat_date', { ascending: false })
      .limit(10)
    if (data) setStats(data)
  }, [])

  return { stats, loading, upsertStat }
}
