import { useState, useEffect, useCallback } from 'react'
import { isLive, fetchRows, insertRow, updateRow, deleteRow, flushPendingWrites } from '../lib/sheets'
import { loadCache, saveCache } from '../lib/localCache'
import { DEMO_DEALS } from '../lib/demo'

const SHEET = 'Deals'
const CACHE_KEY = 'deals'

export function useDeals() {
  const [deals, setDeals] = useState(() => (isLive ? loadCache(CACHE_KEY, []) : DEMO_DEALS))
  const [loading, setLoading] = useState(() => isLive && loadCache(CACHE_KEY, []).length === 0)

  const load = useCallback(async () => {
    if (!isLive) { setDeals(DEMO_DEALS); setLoading(false); return }
    try {
      await flushPendingWrites()
      const data = await fetchRows(SHEET)
      const sorted = [...data].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      setDeals(sorted)
      saveCache(CACHE_KEY, sorted)
    } catch {
      // Sheet unreachable — keep showing the cached copy
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const addDeal = useCallback(async (deal) => {
    if (!isLive) {
      const newDeal = { ...deal, id: Date.now().toString(), created_at: new Date().toISOString() }
      setDeals(prev => [newDeal, ...prev])
      return newDeal
    }
    const id = crypto.randomUUID()
    const newDeal = { ...deal, id, created_at: new Date().toISOString() }
    setDeals(prev => { const next = [newDeal, ...prev]; saveCache(CACHE_KEY, next); return next })
    insertRow(SHEET, id, deal)
    return newDeal
  }, [])

  const updateDeal = useCallback(async (id, updates) => {
    if (!isLive) {
      setDeals(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
      return
    }
    setDeals(prev => {
      const next = prev.map(d => d.id === id ? { ...d, ...updates } : d)
      saveCache(CACHE_KEY, next)
      return next
    })
    updateRow(SHEET, id, updates)
  }, [])

  const deleteDeal = useCallback(async (id) => {
    if (!isLive) { setDeals(prev => prev.filter(d => d.id !== id)); return }
    setDeals(prev => {
      const next = prev.filter(d => d.id !== id)
      saveCache(CACHE_KEY, next)
      return next
    })
    deleteRow(SHEET, id)
  }, [])

  return { deals, loading, addDeal, updateDeal, deleteDeal, reload: load }
}
