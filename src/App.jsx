import { useState, useCallback, useRef } from 'react'
import Money from './pages/Money'
import Calendar from './pages/Calendar'
import Topics from './pages/Topics'
import Stats from './pages/Stats'
import AI from './pages/AI'
import { isLive } from './lib/supabase'

const TABS = [
  {
    key: 'money',
    label: 'Money',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v2m0 8v2M9 9.5c.4-1 1.6-1.5 3-1.5 1.9 0 3 1 3 2.5 0 1.5-1.5 2.5-3 2.5"/>
        <circle cx="12" cy="16.5" r=".5" fill="currentColor" stroke="currentColor"/>
      </svg>
    ),
  },
  {
    key: 'calendar',
    label: 'Calendar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    key: 'topics',
    label: 'Topics',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <path d="M9 12h6M9 16h4"/>
      </svg>
    ),
  },
  {
    key: 'stats',
    label: 'Stats',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M18 20V10M12 20V4M6 20v-6"/>
      </svg>
    ),
  },
  {
    key: 'ai',
    label: 'AI',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 2a5 5 0 015 5c0 2.76-2.24 5-5 5S7 9.76 7 7a5 5 0 015-5z"/>
        <path d="M3 21c0-4 4-7 9-7s9 3 9 7"/>
      </svg>
    ),
  },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('money')
  const [toast, setToast] = useState({ msg: '', show: false })
  const toastTimer = useRef(null)

  const showToast = useCallback((msg) => {
    setToast({ msg, show: true })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500)
  }, [])

  const renderPage = () => {
    const props = { showToast }
    switch (activeTab) {
      case 'money':    return <Money    {...props} />
      case 'calendar': return <Calendar {...props} />
      case 'topics':   return <Topics   {...props} />
      case 'stats':    return <Stats    {...props} />
      case 'ai':       return <AI       {...props} />
      default:         return <Money    {...props} />
    }
  }

  return (
    <>
      {/* TOPBAR */}
      <header className="topbar">
        <div className="logo">wiser<em>.</em>os</div>
        <div className="sync-chip">
          <div className={`sync-dot${isLive ? '' : ' off'}`} />
          <span>{isLive ? 'Live' : 'Demo'}</span>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <main key={activeTab}>
        {renderPage()}
      </main>

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`nav-item${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* TOAST */}
      <div className={`toast${toast.show ? ' show' : ''}`}>{toast.msg}</div>
    </>
  )
}
