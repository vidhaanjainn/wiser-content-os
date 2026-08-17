import { useState, useEffect, useCallback } from 'react'
import { isLive, fetchRows, insertRow, deleteRow, flushPendingWrites } from '../lib/sheets'
import { loadCache, saveCache } from '../lib/localCache'
import { DEMO_CAL } from '../lib/demo'

const SHEET = 'Calendar'
const CACHE_KEY = 'calendar'

export function useCalendar() {
  const [items, setItems] = useState(() => (isLive ? loadCache(CACHE_KEY, []) : DEMO_CAL))
  const [loading, setLoading] = useState(() => isLive && loadCache(CACHE_KEY, []).length === 0)

  useEffect(() => {
    async function load() {
      if (!isLive) { setItems(DEMO_CAL); setLoading(false); return }
      try {
        await flushPendingWrites()
        const data = await fetchRows(SHEET)
        const sorted = [...data].sort((a, b) => (a.item_date || '').localeCompare(b.item_date || ''))
        setItems(sorted)
        saveCache(CACHE_KEY, sorted)
      } catch {
        // Sheet unreachable — keep showing the cached copy
      }
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
    const id = crypto.randomUUID()
    const it = { ...item, id }
    setItems(prev => { const next = [...prev, it]; saveCache(CACHE_KEY, next); return next })
    insertRow(SHEET, id, item)
    return it
  }, [])

  const deleteItem = useCallback(async (id) => {
    if (!isLive) { setItems(prev => prev.filter(i => i.id !== id)); return }
    setItems(prev => {
      const next = prev.filter(i => i.id !== id)
      saveCache(CACHE_KEY, next)
      return next
    })
    deleteRow(SHEET, id)
  }, [])

  return { items, loading, addItem, deleteItem }
}
