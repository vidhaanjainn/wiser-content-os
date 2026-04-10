import { useState, useMemo } from 'react'
import { useCalendar } from '../hooks/useCalendar'
import { useDeals } from '../hooks/useDeals'
import { Modal, Field, Input, Select, Row2 } from '../components/Modal'
import { Card, SectionHeader, AddBtn, Spinner, Empty } from '../components/UI'
import { CAL_TYPES, today, daysUntil } from '../lib/constants'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekDates(offset = 0) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const dow = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export default function Calendar({ showToast }) {
  const { items, loading, addItem, deleteItem } = useCalendar()
  const { deals } = useDeals()
  const [weekOffset, setWeekOffset] = useState(0)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ title: '', date: today(), type: 'reel' })
  const [selectedDate, setSelectedDate] = useState(null)

  const weekDays = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const todayStr = new Date().toISOString().split('T')[0]

  const weekLabel = useMemo(() => {
    const fmt = (d) => d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    return `${fmt(weekDays[0])} – ${fmt(weekDays[6])}, ${weekDays[6].getFullYear()}`
  }, [weekDays])

  function openAdd(dateStr) {
    setForm({ title: '', date: dateStr, type: 'reel' })
    setModal(true)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.date) { showToast('Title and date required'); return }
    await addItem({ title: form.title.trim(), item_date: form.date, type: form.type })
    setModal(false)
    showToast('Added to calendar')
  }

  // Deadlines from deals
  const deadlines = useMemo(() =>
    deals
      .filter(d => d.due_date)
      .map(d => ({ ...d, diff: daysUntil(d.due_date) }))
      .filter(d => d.diff !== null && d.diff >= -1 && d.diff <= 21)
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 7),
    [deals]
  )

  if (loading) return <div className="scroll-area"><Spinner /></div>

  return (
    <div className="scroll-area page-enter">
      <SectionHeader
        title="Calendar"
        action={<AddBtn onClick={() => openAdd(today())}>＋ Add</AddBtn>}
      />

      {/* WEEK CALENDAR */}
      <Card>
        <div className="cal-header">
          <button className="cal-nav-btn" onClick={() => setWeekOffset(w => w - 1)}>‹</button>
          <div className="cal-month">{weekLabel}</div>
          <button className="cal-nav-btn" onClick={() => setWeekOffset(w => w + 1)}>›</button>
        </div>
        <div className="cal-grid-wrap">
          {/* Day headers */}
          <div className="cal-grid">
            {DAY_LABELS.map(d => (
              <div key={d} className="cal-day-hd">{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div className="cal-grid" style={{ marginTop: 4 }}>
            {weekDays.map((day) => {
              const ds = day.toISOString().split('T')[0]
              const isToday = ds === todayStr
              const dayItems = items.filter(i => i.item_date === ds)
              return (
                <div
                  key={ds}
                  className={`cal-cell${isToday ? ' today' : ''}`}
                  onClick={() => openAdd(ds)}
                >
                  <div className="cal-cell-num">{day.getDate()}</div>
                  {dayItems.map(it => {
                    const t = CAL_TYPES[it.type] || CAL_TYPES.reel
                    return (
                      <span
                        key={it.id}
                        className={`cal-pill cp-${it.type}`}
                        title={it.title}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm(`Delete "${it.title}"?`)) {
                            deleteItem(it.id).then(() => showToast('Deleted'))
                          }
                        }}
                      >
                        {it.title}
                      </span>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
        <div className="card-pad" style={{ paddingTop: 4 }}>
          <p style={{ fontSize: 10, color: 'var(--t3)' }}>Tap a day to add · Tap a pill to delete</p>
        </div>
      </Card>

      {/* DEADLINES */}
      <Card>
        <div className="card-pad" style={{ paddingBottom: 6 }}>
          <div className="label">Upcoming Deadlines</div>
        </div>
        {deadlines.length === 0
          ? <Empty icon="📅" text="No upcoming deadlines" />
          : deadlines.map(d => {
              const color = d.diff < 0 ? 'var(--red)' : d.diff <= 3 ? 'var(--amber)' : 'var(--green)'
              const label = d.diff < 0 ? 'Overdue' : d.diff === 0 ? 'Due today' : `${d.diff}d left`
              return (
                <div key={d.id} className="deadline-row">
                  <div className="deadline-dot" style={{ background: color }} />
                  <div className="deadline-info">
                    <div className="deadline-title">{d.brand}</div>
                    <div className="deadline-sub">{d.deliverables || 'Content'}</div>
                  </div>
                  <div className="deadline-date" style={{ color }}>{label}</div>
                </div>
              )
            })
        }
      </Card>

      {/* ADD MODAL */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add to Calendar">
        <Field label="Title">
          <Input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Hormuz Reel shoot"
            autoFocus
          />
        </Field>
        <Row2>
          <Field label="Date">
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="reel">Reel</option>
              <option value="carousel">Carousel</option>
              <option value="collab">Collab</option>
              <option value="shoot">Shoot Day</option>
            </Select>
          </Field>
        </Row2>
        <button className="btn btn-lime btn-full" onClick={handleSave} style={{ marginBottom: 8 }}>
          Add to Calendar
        </button>
        <button className="btn btn-ghost btn-full" onClick={() => setModal(false)}>Cancel</button>
      </Modal>
    </div>
  )
}
