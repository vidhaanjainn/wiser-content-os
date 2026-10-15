import { useEffect, useRef, useState } from 'react'

// ── CARD ─────────────────────────────────────────────────────
export function Card({ children, style, className = '' }) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  )
}

// ── SECTION LABEL ────────────────────────────────────────────
export function Label({ children }) {
  return <div className="label">{children}</div>
}

// ── STAT TILE WITH COUNT-UP ───────────────────────────────────
export function StatTile({ label, value, badge, badgeType = 'green', valueColor }) {
  return (
    <div className="stat-tile">
      <div className="label">{label}</div>
      <div className="stat-val" style={valueColor ? { color: valueColor } : {}}>
        {value || '—'}
      </div>
      {badge && (
        <div className={`badge badge-${badgeType}`} style={{ marginTop: 8 }}>
          {badge}
        </div>
      )}
    </div>
  )
}

// ── BADGE ────────────────────────────────────────────────────
export function Badge({ children, type = 'green' }) {
  return <span className={`badge badge-${type}`}>{children}</span>
}

// ── BUTTON ───────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'lime', size = 'md', full, disabled, style }) {
  return (
    <button
      className={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${full ? 'btn-full' : ''}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  )
}

// ── ADD BUTTON ───────────────────────────────────────────────
export function AddBtn({ children, onClick }) {
  return (
    <button className="add-btn" onClick={onClick}>
      {children}
    </button>
  )
}

// ── SKELETON LOADER (page-shaped) ────────────────────────────
export function Spinner({ tiles = true, rows = 5 }) {
  return (
    <div className="sk-page" aria-busy="true" aria-label="Loading">
      <div className="skeleton sk-title" />
      {tiles && (
        <div className="sk-tiles">
          {[0, 1, 2].map(i => <div key={i} className="skeleton sk-tile" style={{ animationDelay: `${i * 90}ms` }} />)}
        </div>
      )}
      <div className="sk-card">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="skeleton-row">
            <div className="skeleton skeleton-dot" />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-line" style={{ width: `${60 - (i % 3) * 10}%`, marginBottom: 7 }} />
              <div className="skeleton skeleton-line" style={{ width: `${38 - (i % 2) * 8}%`, height: 8 }} />
            </div>
            <div className="skeleton skeleton-line" style={{ width: 46 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── EMPTY STATE ──────────────────────────────────────────────
export function Empty({ icon = '📋', text }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-text">{text}</div>
    </div>
  )
}

// ── PROGRESS BAR ─────────────────────────────────────────────
export function ProgressBar({ pct, color = 'var(--lime)' }) {
  return (
    <div className="prog-track">
      <div className="prog-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// ── SECTION HEADER ───────────────────────────────────────────
export function SectionHeader({ title, action }) {
  return (
    <div className="section-hd">
      <h2 className="section-title">{title}</h2>
      {action}
    </div>
  )
}
