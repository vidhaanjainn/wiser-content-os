import { useState } from 'react'

// 4-digit PIN gate. The server checks it and sets an HttpOnly cookie; nothing secret lives in the bundle.
export default function Login({ onDone }) {
  const [pin, setPin] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(p) {
    setBusy(true)
    try {
      const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: p }) })
      const j = await res.json().catch(() => ({}))
      if (res.ok) return onDone()
      setMsg(res.status === 429 ? `Too many tries. Wait ${j.retryInMin || 15} min.` : `Wrong PIN${j.left != null ? ` · ${j.left} left` : ''}`)
    } catch { setMsg('Can’t reach the server') }
    setPin(''); setBusy(false)
  }
  const press = d => {
    if (busy || pin.length >= 4) return
    const next = pin + d
    setPin(next); setMsg('')
    if (next.length === 4) submit(next)
  }

  return (
    <div className="login">
      <div className="login-mark">w</div>
      <div className="login-title">Enter PIN</div>
      <div className="login-dots">{[0, 1, 2, 3].map(i => <i key={i} className={i < pin.length ? 'on' : ''} />)}</div>
      <div className="login-msg">{msg}&nbsp;</div>
      <div className="login-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => (
          k === '' ? <span key={i} /> :
          <button key={i} disabled={busy} onClick={() => k === '⌫' ? setPin(pin.slice(0, -1)) : press(k)}>{k}</button>
        ))}
      </div>
    </div>
  )
}
