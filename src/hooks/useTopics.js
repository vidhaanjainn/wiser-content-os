import { useState, useEffect, useCallback } from 'react'
import { api, isLive } from '../lib/api'
import { DEMO_TOPICS } from '../lib/demo'

export function useTopics() {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!isLive) { setTopics(DEMO_TOPICS); setLoading(false); return }
      try { setTopics(await api.list('topics') || []) } catch (e) { console.error(e) }
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
    try {
      const data = await api.create('topics', withOrder)
      setTopics(prev => [...prev, data])
      return data
    } catch (e) { console.error(e) }
  }, [topics.length])

  const updateTopic = useCallback(async (id, updates) => {
    if (isLive) {
      try { await api.update('topics', id, updates) } catch (e) { console.error(e); return }
    }
    setTopics(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])

  const deleteTopic = useCallback(async (id) => {
    if (isLive) {
      try { await api.remove('topics', id) } catch (e) { console.error(e); return }
    }
    setTopics(prev => prev.filter(t => t.id !== id))
  }, [])

  return { topics, loading, addTopic, updateTopic, deleteTopic }
}
