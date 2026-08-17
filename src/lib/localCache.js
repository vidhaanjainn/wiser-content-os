// Per-resource localStorage cache — lets the PWA render instantly from the
// phone's own storage while the Sheet is fetched/reconciled in the background.
const PREFIX = 'wiser_cache_'

export function loadCache(key, fallback = []) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function saveCache(key, data) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(data)) } catch { /* storage unavailable */ }
}
