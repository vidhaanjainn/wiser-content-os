import { useState, useEffect, useRef } from 'react'
import { useStats } from '../hooks/useStats'
import { Modal, Field, Input, Row2 } from '../components/Modal'
import { Card, SectionHeader, AddBtn, Spinner, StatTile, ProgressBar } from '../components/UI'
import { fmtINRFull, fmtCount, today } from '../lib/constants'

const TOP_REELS = [
  { name: 'Hormuz Ep.1 — Oil shock',       views: 620000 },
  { name: 'Gold crashes during war',         views: 480000 },
  { name: 'SPIVA — active funds fail',       views: 310000 },
  { name: '₹10L portfolio breakdown',       views: 270000 },
]

export default function Stats({ showToast }) {
  const { stats, loading, upsertStat } = useStats()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ stat_date: today(), followers: '', reel_views: '', saves: '', wisermoney_visits: '', wisermoney_profiles: '', wisermoney_calls: '' })
  const [barsReady, setBarsReady] = useState(false)
  const barRef = useRef(null)

  // Animate bars after mount
  useEffect(() => {
    const t = setTimeout(() => setBarsReady(true), 150)
    return () => clearTimeout(t)
  }, [])

  const latest = stats[0]
  const prev   = stats[1]

  const followers  = latest?.followers  || 0
  const views      = latest?.reel_views || 0
  const folPct     = Math.min(100, Math.round(followers / 1000))
  const folDelta   = prev ? followers - (prev.followers || 0) : null
  const viewsDelta = prev ? Math.round(((views - (prev.reel_views || 0)) / (prev.reel_views || 1)) * 100) : null
  const calls      = latest?.wisermoney_calls    || 0
  const profiles   = latest?.wisermoney_profiles || 0
  const visits     = latest?.wisermoney_visits   || 0
  const maxReels   = TOP_REELS[0].views

  async function handleSave() {
    if (!form.stat_date) { showToast('Date required'); return }
    const entry = {
      stat_date:           form.stat_date,
      followers:           parseInt(form.followers)           || null,
      reel_views:          parseInt(form.reel_views)          || null,
      saves:               parseInt(form.saves)               || null,
      wisermoney_visits:   parseInt(form.wisermoney_visits)   || null,
      wisermoney_profiles: parseInt(form.wisermoney_profiles) || null,
      wisermoney_calls:    parseInt(form.wisermoney_calls)    || null,
    }
    await upsertStat(entry)
    setModal(false)
    showToast('Stats saved')
  }

  if (loading) return <div className="scroll-area"><Spinner /></div>

  return (
    <div className="scroll-area page-enter">
      <SectionHeader
        title="Performance"
        action={<AddBtn onClick={() => setModal(true)}>＋ Update</AddBtn>}
      />

      {/* TOP STATS */}
      <div className="grid2">
        <div className="stat-tile">
          <div className="label">Followers</div>
          <div className="stat-val">{followers >= 1000 ? (followers / 1000).toFixed(1) + 'k' : followers || '—'}</div>
          {folDelta !== null && (
            <div className={`badge badge-${folDelta >= 0 ? 'green' : 'red'}`} style={{ marginTop: 8 }}>
              {folDelta >= 0 ? '↑' : '↓'} {Math.abs(folDelta).toLocaleString()} this period
            </div>
          )}
          <ProgressBar pct={folPct} />
          <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4 }}>
            {folPct}% to 100k
          </div>
        </div>
        <div className="stat-tile">
          <div className="label">Avg Reel Views</div>
          <div className="stat-val">{views ? fmtCount(views) : '—'}</div>
          {viewsDelta !== null && (
            <div className={`badge badge-${viewsDelta >= 0 ? 'blue' : 'red'}`} style={{ marginTop: 8 }}>
              {viewsDelta >= 0 ? '↑' : '↓'} {Math.abs(viewsDelta)}% vs last entry
            </div>
          )}
        </div>
      </div>

      {/* TOP REELS */}
      <Card>
        <div className="card-pad">
          <div className="label">Top Reels</div>
          {TOP_REELS.map((r, i) => (
            <div key={i} className="bar-row">
              <div className="bar-labels">
                <span className="bar-name">{r.name}</span>
                <span className="bar-val">{fmtCount(r.views)}</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: barsReady ? `${Math.round((r.views / maxReels) * 100)}%` : '0%',
                    background: i === 0 ? 'var(--lime)' : 'var(--blue)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* WISERMONEY FUNNEL */}
      <Card>
        <div className="card-pad">
          <div className="label">WiserMoney Funnel</div>
          <div className="funnel-row">
            <div className="funnel-step">
              <div className="funnel-val">{visits || '—'}</div>
              <div className="funnel-lbl">Visits</div>
            </div>
            <div className="funnel-arrow">→</div>
            <div className="funnel-step">
              <div className="funnel-val" style={{ color: 'var(--amber)' }}>{profiles || '—'}</div>
              <div className="funnel-lbl">Profiles</div>
            </div>
            <div className="funnel-arrow">→</div>
            <div className="funnel-step">
              <div className="funnel-val" style={{ color: 'var(--lime)' }}>{calls || '—'}</div>
              <div className="funnel-lbl">Calls</div>
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--bd)', margin: '12px 0' }} />
          <div style={{ fontSize: 12, color: 'var(--t2)' }}>
            ₹{fmtINRFull(calls * 999)} consultation revenue
          </div>
        </div>
      </Card>

      {/* HISTORY TABLE */}
      {stats.length > 1 && (
        <Card>
          <div className="card-pad">
            <div className="label">History</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: 'var(--t3)' }}>
                    {['Date','Followers','Views','Saves','WM Calls'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '4px 0', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.map(s => (
                    <tr key={s.id} style={{ borderTop: '1px solid var(--bd)' }}>
                      <td style={{ padding: '8px 0', color: 'var(--t2)' }}>{s.stat_date}</td>
                      <td style={{ padding: '8px 0' }}>{s.followers?.toLocaleString() || '—'}</td>
                      <td style={{ padding: '8px 0' }}>{s.reel_views ? fmtCount(s.reel_views) : '—'}</td>
                      <td style={{ padding: '8px 0' }}>{s.saves?.toLocaleString() || '—'}</td>
                      <td style={{ padding: '8px 0' }}>{s.wisermoney_calls || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* ADD STATS MODAL */}
      <Modal open={modal} onClose={() => setModal(false)} title="Update Stats">
        <Field label="Date">
          <Input type="date" value={form.stat_date} onChange={e => setForm(f => ({ ...f, stat_date: e.target.value }))} />
        </Field>
        <Row2>
          <Field label="Followers">
            <Input type="number" value={form.followers} onChange={e => setForm(f => ({ ...f, followers: e.target.value }))} placeholder="60200" />
          </Field>
          <Field label="Avg Reel Views">
            <Input type="number" value={form.reel_views} onChange={e => setForm(f => ({ ...f, reel_views: e.target.value }))} placeholder="240000" />
          </Field>
        </Row2>
        <Row2>
          <Field label="Saves">
            <Input type="number" value={form.saves} onChange={e => setForm(f => ({ ...f, saves: e.target.value }))} placeholder="8400" />
          </Field>
          <Field label="WM Visits">
            <Input type="number" value={form.wisermoney_visits} onChange={e => setForm(f => ({ ...f, wisermoney_visits: e.target.value }))} placeholder="347" />
          </Field>
        </Row2>
        <Row2>
          <Field label="WM Profiles">
            <Input type="number" value={form.wisermoney_profiles} onChange={e => setForm(f => ({ ...f, wisermoney_profiles: e.target.value }))} placeholder="89" />
          </Field>
          <Field label="Calls Booked">
            <Input type="number" value={form.wisermoney_calls} onChange={e => setForm(f => ({ ...f, wisermoney_calls: e.target.value }))} placeholder="12" />
          </Field>
        </Row2>
        <button className="btn btn-lime btn-full" onClick={handleSave} style={{ marginBottom: 8 }}>
          Save Stats
        </button>
        <button className="btn btn-ghost btn-full" onClick={() => setModal(false)}>Cancel</button>
      </Modal>
    </div>
  )
}
