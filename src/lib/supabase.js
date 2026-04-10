import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY

// Falls back gracefully if env vars not set (demo mode)
export const supabase = (url && key && !url.includes('your-project'))
  ? createClient(url, key)
  : null

export const isLive = !!supabase
