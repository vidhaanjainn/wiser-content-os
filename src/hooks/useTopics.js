import { useState, useEffect, useCallback } from 'react'
import { isLive, fetchRows, insertRow, updateRow, deleteRow, flushPendingWrites } from '../lib/sheets'
import { loadCache, saveCache } from '../lib/localCache'
import { DEMO_TOPICS } from '../lib/demo'

const SHEET = 'Topics'
const CACHE_KEY = 'topics'

export function useTopics() {
  const [topics, setTopics] = useState(() => (isLive ? loadCache(CACHE_KEY, []) : DEMO_TOPICS))
  const [loading, setLoading] = useState(() => isLive && loadCache(CACHE_KEY, []).length === 0)

  useEffect(() => {
    async function load() {
      if (!isLive) { setTopics(DEMO_TOPICS); setLoading(false); return }
      try {
        await flushPendingWrites()
        const data = await fetchRows(SHEET)
        const sorted = [...data].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        setTopics(sorted)
        saveCache(CACHE_KEY, sorted)
      } catch {
        // Sheet unreachable — keep showing the cached copy
      }
      setLoading(false)
    }
    load()
  }, [])

  const addTopic = useCallback(async (topic) => {
    const withOrder = { ...topic, sort_order: topics.length }
    if (!isLive) {
      const t = { ...withOrder, id: Date.now().toString(), created_at: new Date().toISOString() }
      setTopics(prev => [...prev, t])
      return t
    }
    const id = crypto.randomUUID()
    const t = { ...withOrder, id, created_at: new Date().toISOString() }
    setTopics(prev => { const next = [...prev, t]; saveCache(CACHE_KEY, next); return next })
    insertRow(SHEET, id, withOrder)
    return t
  }, [topics.length])

  const updateTopic = useCallback(async (id, updates) => {
    if (!isLive) {
      setTopics(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
      return
    }
    setTopics(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updates } : t)
      saveCache(CACHE_KEY, next)
      return next
    })
    updateRow(SHEET, id, updates)
  }, [])

  const deleteTopic = useCallback(async (id) => {
    if (!isLive) { setTopics(prev => prev.filter(t => t.id !== id)); return }
    setTopics(prev => {
      const next = prev.filter(t => t.id !== id)
      saveCache(CACHE_KEY, next)
      return next
    })
    deleteRow(SHEET, id)
  }, [])

  return { topics, loading, addTopic, updateTopic, deleteTopic }
}
