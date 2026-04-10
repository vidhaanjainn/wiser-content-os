import { useState, useEffect, useCallback } from 'react'
import { supabase, isLive } from '../lib/supabase'
import { DEMO_CAL } from '../lib/demo'

export function useCalendar() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!isLive) { setItems(DEMO_CAL); setLoading(false); return }
      const { data, error } = await supabase
        .from('calendar_items')
        .select('*')
        .order('item_date')
      if (!error) setItems(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const addItem = useCallback(async (item) => {
    if (!isLive) {
      const it = { ...item, id: Date.now().toString() }
      setItems(prev => [...prev, it])
      return it
    }
    const { data, error } = await supabase.from('calendar_items').insert(item).select().single()
    if (!error) setItems(prev => [...prev, data])
    return data
  }, [])

  const deleteItem = useCallback(async (id) => {
    if (!isLive) { setItems(prev => prev.filter(i => i.id !== id)); return }
    await supabase.from('calendar_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  return { items, loading, addItem, deleteItem }
}
