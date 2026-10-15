import { useState, useEffect, useCallback } from 'react'
import { api, isLive } from '../lib/api'
import { DEMO_DEALS } from '../lib/demo'

export function useDeals() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!isLive) { setDeals(DEMO_DEALS); setLoading(false); return }
    try { setDeals(await api.list('deals') || []) } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const addDeal = useCallback(async (deal) => {
    if (!isLive) {
      const newDeal = { ...deal, id: Date.now().toString(), created_at: new Date().toISOString() }
      setDeals(prev => [newDeal, ...prev])
      return newDeal
    }
    try {
      const data = await api.create('deals', deal)
      setDeals(prev => [data, ...prev])
      return data
    } catch (e) { console.error(e) }
  }, [])

  const updateDeal = useCallback(async (id, updates) => {
    if (isLive) {
      try { await api.update('deals', id, updates) } catch (e) { console.error(e); return false }
    }
    setDeals(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
    return true
  }, [])

  const deleteDeal = useCallback(async (id) => {
    if (isLive) {
      try { await api.remove('deals', id) } catch (e) { console.error(e); return }
    }
    setDeals(prev => prev.filter(d => d.id !== id))
  }, [])

  return { deals, loading, addDeal, updateDeal, deleteDeal, reload: load }
}
