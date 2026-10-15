// Thin client for the /api serverless routes (Neon Postgres behind them).
// Local `vite dev` has no /api, so it runs in demo mode unless VITE_LIVE=true
// (use `vercel dev` for a live local run).
export const isLive = import.meta.env.PROD || import.meta.env.VITE_LIVE === 'true'

async function call(path, method = 'GET', body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${method} ${path} failed (${res.status})`)
  return res.json()
}

export const api = {
  list:   resource => call(`/api/${resource}`),
  create: (resource, body) => call(`/api/${resource}`, 'POST', body),
  update: (resource, id, body) => call(`/api/${resource}?id=${encodeURIComponent(id)}`, 'PATCH', body),
  remove: (resource, id) => call(`/api/${resource}?id=${encodeURIComponent(id)}`, 'DELETE'),
}
