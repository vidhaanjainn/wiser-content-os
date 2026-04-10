import { useEffect } from 'react'

export function Modal({ open, onClose, title, children }) {
  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h3 className="modal-title">{title}</h3>
        {children}
      </div>
    </div>
  )
}

// ── FORM HELPERS ─────────────────────────────────────────────
export function Field({ label, children }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}

export function Input({ ...props }) {
  return <input className="form-input" {...props} />
}

export function Select({ children, ...props }) {
  return <select className="form-input" {...props}>{children}</select>
}

export function Row2({ children }) {
  return <div className="form-row2">{children}</div>
}
