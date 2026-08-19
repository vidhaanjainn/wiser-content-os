import { useState, useEffect, useCallback } from 'react'
import { supabase, isLive } from '../lib/supabase'
import { DEMO_DEALS } from '../lib/demo'

export function useDeals() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!isLive) { setDeals(DEMO_DEALS); setLoading(false); return }
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setDeals(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const addDeal = useCallback(async (deal) => {
    if (!isLive) {
      const newDeal = { ...deal, id: Date.now().toString(), created_at: new Date().toISOString() }
      setDeals(prev => [newDeal, ...prev])
      return newDeal
    }
    const { data, error } = await supabase.from('deals').insert(deal).select().single()
    if (!error) setDeals(prev => [data, ...prev])
    return data
  }, [])

  const updateDeal = useCallback(async (id, updates) => {
    if (!isLive) {
      setDeals(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
      return
    }
    const { error } = await supabase.from('deals').update(updates).eq('id', id)
    if (!error) setDeals(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
  }, [])

  const deleteDeal = useCallback(async (id) => {
    if (!isLive) { setDeals(prev => prev.filter(d => d.id !== id)); return }
    const { error } = await supabase.from('deals').delete().eq('id', id)
    if (!error) setDeals(prev => prev.filter(d => d.id !== id))
  }, [])

  return { deals, loading, addDeal, updateDeal, deleteDeal, reload: load }
}
