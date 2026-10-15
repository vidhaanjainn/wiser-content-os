import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// ── Subtle "cha-ching": synthesized with Web Audio (no asset, ~0.9s) ──
let ctx
export function playCoin() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const t0 = ctx.currentTime
    const master = ctx.createGain()
    master.gain.value = 0.14
    master.connect(ctx.destination)
    // two bright bell partials, second one slightly later = "cha-ching"
    ;[[1567.98, 0], [2093.0, 0.09], [3135.96, 0.09]].forEach(([f, d], i) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = i === 2 ? 'triangle' : 'sine'
      o.frequency.setValueAtTime(f, t0 + d)
      g.gain.setValueAtTime(0.0001, t0 + d)
      g.gain.exponentialRampToValueAtTime(i === 2 ? 0.25 : 0.9, t0 + d + 0.008)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + (i ? 0.75 : 0.35))
      o.connect(g).connect(master)
      o.start(t0 + d); o.stop(t0 + d + 0.8)
    })
    // soft coin shimmer: short filtered noise burst
    const len = Math.floor(ctx.sampleRate * 0.12)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
    const n = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), ng = ctx.createGain()
    hp.type = 'highpass'; hp.frequency.value = 6000; ng.gain.value = 0.18
    n.buffer = buf; n.connect(hp).connect(ng).connect(master); n.start(t0 + 0.09)
  } catch { /* audio is a nicety; never block the flow */ }
}

// ── Count-up hook for money values ──
export function useCountUp(target, duration = 1100) {
  const [val, setVal] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    const start = from.current
    if (start === target) return
    let raf
    const t0 = performance.now()
    const tick = now => {
      const p = Math.min(1, (now - t0) / duration)
      const e = 1 - Math.pow(1 - p, 4)
      setVal(Math.round(start + (target - start) * e))
      if (p < 1) raf = requestAnimationFrame(tick)
      else from.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); from.current = target }
  }, [target, duration])
  return val
}

// ── Full-screen credit moment: check ring + amount + coins flying into the "This Month" tile ──
export function CreditBurst({ burst, onDone }) {
  const [phase, setPhase] = useState('in')
  useEffect(() => {
    if (!burst) return
    setPhase('in')
    const a = setTimeout(() => setPhase('fly'), 1150)
    const b = setTimeout(() => { setPhase('out'); onDone?.() }, 2100)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [burst, onDone])
  if (!burst || phase === 'out') return null

  const target = document.querySelector('[data-credit-target]')?.getBoundingClientRect()
  const cx = window.innerWidth / 2, cy = window.innerHeight / 2
  const tx = target ? target.left + target.width / 2 - cx : 0
  const ty = target ? target.top + target.height / 2 - cy : -cy
  const coins = Array.from({ length: 14 }, (_, i) => {
    const ang = (i / 14) * Math.PI * 2
    return { i, x: Math.cos(ang) * (60 + (i % 3) * 22), y: Math.sin(ang) * (60 + (i % 3) * 22), d: i * 28 }
  })

  return createPortal(
    <div className={`credit-burst ${phase}`} aria-live="polite">
      <div className="cb-core">
        <svg className="cb-ring" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="52" className="cb-ring-track" />
          <circle cx="60" cy="60" r="52" className="cb-ring-fill" pathLength="100" />
          <path d="M40 62 L54 75 L82 46" className="cb-check" pathLength="100" />
        </svg>
        <div className="cb-amt">+₹{burst.received.toLocaleString('en-IN')}</div>
        <div className="cb-sub">
          credited from {burst.brand}
          {burst.tds > 0 && <span className="cb-tds"> · ₹{burst.tds.toLocaleString('en-IN')} TDS logged</span>}
        </div>
      </div>
      {coins.map(c => (
        <span
          key={c.i}
          className="cb-coin"
          style={{ '--x': `${c.x}px`, '--y': `${c.y}px`, '--tx': `${tx}px`, '--ty': `${ty}px`, '--d': `${c.d}ms` }}
        >₹</span>
      ))}
    </div>,
    document.body
  )
}
