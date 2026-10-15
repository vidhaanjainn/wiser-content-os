import { useState, useCallback, useRef, useEffect } from 'react'
import Money from './pages/Money'
import Calendar from './pages/Calendar'
import Topics from './pages/Topics'
import Stats from './pages/Stats'
import AI from './pages/AI'
import { isLive } from './lib/api'

const TABS = [
  {
    key: 'money',
    label: 'Money',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-3"/>
        <path d="M21 9h-5a3 3 0 000 6h5V9z"/>
        <circle cx="16.5" cy="12" r=".6" fill="currentColor"/>
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>
        <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>
      </svg>
    ),
  },
]

const TITLES = {
  money:    ['Your', 'money'],
  calendar: ['Content', 'calendar'],
  topics:   ['Topic', 'pipeline'],
  stats:    ['Growth', 'stats'],
  ai:       ['AI', 'studio'],
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function useDesktop() {
  const q = '(min-width: 960px)'
  const [desk, setDesk] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const fn = e => setDesk(e.matches)
    m.addEventListener('change', fn)
    return () => m.removeEventListener('change', fn)
  }, [])
  return desk
}

export const LogoMark = ({ size = 28 }) => (
  <span className="logo-mark" style={{ width: size, height: size, fontSize: size * 0.62 }}>w</span>
)

const Logo = () => (
  <div className="logo"><LogoMark /><span>wiser<em>.</em>os</span></div>
)

// Fade out the HTML boot screen once the app has painted (min ~1.2s so the mark finishes drawing)
function useBootScreen() {
  useEffect(() => {
    const boot = document.getElementById('boot')
    if (!boot) return
    const wait = Math.max(0, 1250 - performance.now())
    const t = setTimeout(() => {
      boot.classList.add('done')
      setTimeout(() => boot.remove(), 600)
    }, wait)
    return () => clearTimeout(t)
  }, [])
}

export default function App() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('wiser_tab') || 'money')
  const [toast, setToast] = useState({ msg: '', show: false })
  const toastTimer = useRef(null)
  const desktop = useDesktop()
  useBootScreen()

  const go = useCallback((key) => {
    setActiveTab(key)
    try { localStorage.setItem('wiser_tab', key) } catch {}
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const showToast = useCallback((msg) => {
    setToast({ msg, show: true })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2600)
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

  const tabIndex = Math.max(0, TABS.findIndex(t => t.key === activeTab))
  const indicatorStyle = desktop
    ? { transform: `translateY(${tabIndex * 48 + 82}px)` }
    : { width: `calc((100% - 12px) / ${TABS.length})`, transform: `translateX(${tabIndex * 100}%)` }
  const [t1, t2] = TITLES[activeTab] || TITLES.money
  const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <>
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            {desktop
              ? <>
                  <div className="topbar-date">{dateStr} · {greeting()}, Vidhaan</div>
                  <div className="topbar-title">{t1} <em>{t2}</em></div>
                </>
              : <Logo />}
          </div>
          <div className="sync-chip">
            <div className={`sync-dot${isLive ? '' : ' off'}`} />
            <span>{isLive ? 'Live' : 'Demo'}</span>
          </div>
        </header>

        <main key={activeTab}>
          {renderPage()}
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Sections">
        <div className="nav-brand"><Logo /></div>
        <div className="nav-indicator" style={indicatorStyle} />
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`nav-item${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => go(tab.key)}
            aria-current={activeTab === tab.key ? 'page' : undefined}
          >
            {tab.icon}
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className={`toast${toast.show ? ' show' : ''}`} role="status">{toast.msg}</div>
    </>
  )
}
