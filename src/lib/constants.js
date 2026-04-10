// ── DEAL STATUSES ──────────────────────────────────────────
export const DEAL_STATUSES = {
  negotiating: { label: 'Negotiating', color: '#5b9cf6', bg: 'rgba(91,156,246,0.1)' },
  confirmed:   { label: 'Confirmed',   color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  pending:     { label: 'Pending pmt', color: '#f0a030', bg: 'rgba(240,160,48,0.1)' },
  overdue:     { label: 'Overdue',     color: '#f05252', bg: 'rgba(240,82,82,0.1)'  },
}

// ── TOPIC CATEGORIES ────────────────────────────────────────
export const CATEGORIES = {
  finance: { label: 'Finance',    color: '#5b9cf6', bg: 'rgba(91,156,246,0.1)'  },
  psych:   { label: 'Psychology', color: '#c5f135', bg: 'rgba(197,241,53,0.08)' },
  macro:   { label: 'Macro',      color: '#f0a030', bg: 'rgba(240,160,48,0.1)'  },
  collab:  { label: 'Collab',     color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
}

// ── TOPIC STAGES ────────────────────────────────────────────
export const STAGES = ['ideas', 'scripting', 'shooting', 'editing', 'posted']
export const STAGE_LABELS = {
  ideas:     'Ideas',
  scripting: 'Scripting',
  shooting:  'Shooting',
  editing:   'Editing',
  posted:    'Posted',
}

// ── CALENDAR TYPES ──────────────────────────────────────────
export const CAL_TYPES = {
  reel:     { label: 'Reel',     color: '#7baaff', bg: 'rgba(91,156,246,0.15)'  },
  carousel: { label: 'Carousel', color: '#c5f135', bg: 'rgba(197,241,53,0.1)'  },
  collab:   { label: 'Collab',   color: '#f0a030', bg: 'rgba(240,160,48,0.12)' },
  shoot:    { label: 'Shoot',    color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
}

// ── AI TOOLS ────────────────────────────────────────────────
export const AI_TOOLS = [
  {
    key: 'script', icon: '✍️', name: 'Script Generator',
    desc: 'Full Hinglish reel script in your voice',
    prompt: "Run the Script Generator skill. I'll give you a topic/angle — write a full shoot-ready Hinglish reel script in my voice.",
  },
  {
    key: 'hooks', icon: '🎯', name: 'Hook Lab',
    desc: '5 hooks scored for any topic or angle',
    prompt: "Run the Hook Concept skill. I'll give you a topic — generate 5 hook options scored against scroll-stop criteria.",
  },
  {
    key: 'trend', icon: '📡', name: 'Trend Harvest',
    desc: "Today's signals ranked for your audience",
    prompt: "Run the Trend Signal Harvester skill. Give me today's top signals ranked by virality and audience fit for Wiser With Vidhaan.",
  },
  {
    key: 'repurpose', icon: '♻️', name: 'Repurpose',
    desc: 'Script → carousel + caption + YT Short',
    prompt: "Run the Repurpose Engine skill. I'll paste a finished reel script — give me: carousel brief, Instagram caption, YT Short description.",
  },
  {
    key: 'email', icon: '📩', name: 'Brand Reply',
    desc: 'Paste collab email → rate-card reply drafted',
    prompt: "Run the Collab Email Reply skill. I'll paste an inbound brand collaboration email — draft a professional reply using my rate card.",
  },
  {
    key: 'pov', icon: '🧠', name: 'POV Engine',
    desc: 'Deep evergreen takes from books & ideas',
    prompt: "Run the POV Engine skill in Mode 1 (Harvest). Surface 5 POV-worthy signals from books, psychology, or evergreen ideas.",
  },
  {
    key: 'factcheck', icon: '✅', name: 'Fact Check',
    desc: 'Verify every stat before you shoot',
    prompt: "Run the Fact Checker skill in Full Mode. I'll paste a script — verify every factual claim before I shoot.",
  },
  {
    key: 'macro', icon: '🌍', name: 'Macro Signals',
    desc: 'Deep underreported stories worth covering',
    prompt: "Run the Macro Economic Signals skill. Excavate 5 deep underreported macro stories worth covering.",
  },
]

// ── NUMBER FORMATTERS ───────────────────────────────────────
export function fmtINR(n) {
  const num = Math.round(Number(n) || 0)
  if (num >= 100000) return '₹' + (num / 100000).toFixed(1) + 'L'
  if (num >= 1000)   return '₹' + (num / 1000).toFixed(0) + 'k'
  return '₹' + num
}

export function fmtINRFull(n) {
  return '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN')
}

export function fmtCount(n) {
  const num = Number(n) || 0
  if (num >= 100000) return (num / 100000).toFixed(1) + 'L'
  if (num >= 1000)   return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

export function today() {
  return new Date().toISOString().split('T')[0]
}

export function daysUntil(dateStr) {
  if (!dateStr) return null
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target - now) / 86400000)
}

// Calculate payment due date from go_live_date + payment_days
export function calcPaymentDue(goLiveDate, paymentDays) {
  if (!goLiveDate || !paymentDays) return null
  const d = new Date(goLiveDate)
  d.setDate(d.getDate() + (paymentDays || 30))
  return d.toISOString().split('T')[0]
}

// Payment days options matched to common agency terms
export const PAYMENT_TERMS = [
  { value: 30,  label: '30 days' },
  { value: 45,  label: '30-45 days' },
  { value: 60,  label: '60 days' },
  { value: 90,  label: '90 working days' },
]
