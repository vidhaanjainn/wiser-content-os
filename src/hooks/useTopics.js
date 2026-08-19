import { useState, useEffect, useCallback } from 'react'
import { supabase, isLive } from '../lib/supabase'
import { DEMO_TOPICS } from '../lib/demo'

export function useTopics() {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!isLive) { setTopics(DEMO_TOPICS); setLoading(false); return }
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('sort_order')
      if (!error) setTopics(data || [])
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
    const { data, error } = await supabase.from('topics').insert(withOrder).select().single()
    if (!error) setTopics(prev => [...prev, data])
    return data
  }, [topics.length])

  const updateTopic = useCallback(async (id, updates) => {
    if (!isLive) {
      setTopics(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
      return
    }
    const { error } = await supabase.from('topics').update(updates).eq('id', id)
    if (!error) setTopics(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])

  const deleteTopic = useCallback(async (id) => {
    if (!isLive) { setTopics(prev => prev.filter(t => t.id !== id)); return }
    await supabase.from('topics').delete().eq('id', id)
    setTopics(prev => prev.filter(t => t.id !== id))
  }, [])

  return { topics, loading, addTopic, updateTopic, deleteTopic }
}
