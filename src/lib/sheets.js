const API_URL = import.meta.env.VITE_SHEETS_API_URL
const API_TOKEN = import.meta.env.VITE_SHEETS_API_TOKEN

// Falls back gracefully if env vars not set (demo mode)
export const isLive = !!(API_URL && API_TOKEN && !API_URL.includes('YOUR_'))

const QUEUE_KEY = 'wiser_pending_writes'

function loadQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch { return [] }
}

function saveQueue(queue) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)) } catch { /* storage unavailable */ }
}

async function send(op) {
  const res = await fetch(API_URL, {
    method: 'POST',
    // text/plain avoids a CORS preflight against the Apps Script endpoint
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: API_TOKEN, ...op }),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.data
}

export async function fetchRows(sheet) {
  const url = `${API_URL}?token=${encodeURIComponent(API_TOKEN)}&sheet=${encodeURIComponent(sheet)}`
  const res = await fetch(url)
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.data || []
}

// Writes are optimistic: if the Sheet is unreachable (asleep, offline, etc.)
// the op is queued and retried on the next load or when the browser comes
// back online — the caller's local/optimistic state is the source of truth
// in the meantime, so nothing is lost.
async function writeOrQueue(op) {
  try {
    return await send(op)
  } catch {
    saveQueue([...loadQueue(), op])
    return null
  }
}

export const insertRow = (sheet, id, data) => writeOrQueue({ sheet, action: 'insert', id, data })
export const updateRow = (sheet, id, data) => writeOrQueue({ sheet, action: 'update', id, data })
export const deleteRow = (sheet, id) => writeOrQueue({ sheet, action: 'delete', id })
export const upsertRow = (sheet, keyField, data) => writeOrQueue({ sheet, action: 'upsert', keyField, data })

export async function flushPendingWrites() {
  const queue = loadQueue()
  if (!queue.length) return
  const remaining = []
  for (const op of queue) {
    try { await send(op) } catch { remaining.push(op) }
  }
  saveQueue(remaining)
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', flushPendingWrites)
}
