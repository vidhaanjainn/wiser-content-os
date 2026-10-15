import { useState, useEffect, useCallback } from 'react'
import { api, isLive } from '../lib/api'
import { DEMO_CAL } from '../lib/demo'

export function useCalendar() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!isLive) { setItems(DEMO_CAL); setLoading(false); return }
      try { setItems(await api.list('calendar') || []) } catch (e) { console.error(e) }
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
    try {
      const data = await api.create('calendar', item)
      setItems(prev => [...prev, data])
      return data
    } catch (e) { console.error(e) }
  }, [])

  const deleteItem = useCallback(async (id) => {
    if (isLive) {
      try { await api.remove('calendar', id) } catch (e) { console.error(e); return }
    }
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  return { items, loading, addItem, deleteItem }
}
