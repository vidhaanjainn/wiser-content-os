import { useState, useMemo } from 'react'
import { useDeals } from '../hooks/useDeals'
import { Modal, Field, Input, Select, Row2 } from '../components/Modal'
import { Card, SectionHeader, AddBtn, Spinner, Empty, StatTile } from '../components/UI'
import { DEAL_STATUSES, PAYMENT_TERMS, fmtINR, fmtINRFull, today, daysUntil, calcPaymentDue } from '../lib/constants'
import { isLive } from '../lib/supabase'

const EMPTY_DEAL = {
  brand: '', agency: '', deliverables: '', amount: '',
  status: 'negotiating', ad_rights_days: '0',
  ad_rights_start: '', ad_rights_end: '', notes: '',
  go_live_date: '', go_live_link: '', payment_days: '30',
}

const EMPTY_INV = {
  name: 'Vidhaan Jain', brand: '', agency: '', deliverables: '',
  amount: '', gst: '0', date: today(), due: '', campaign_code: '',
}

export default function Money({ showToast }) {
  const { deals, loading, addDeal, updateDeal, deleteDeal } = useDeals()
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState(EMPTY_DEAL)
  const [editId, setEditId]   = useState(null)
  const [invForm, setInvForm] = useState(EMPTY_INV)
  const [glForm, setGlForm]   = useState({ id: null, brand: '', deliverables: '', amount: 0, agency: '', go_live_date: today(), go_live_link: '', payment_days: '30' })

  const [showTotal, setShowTotal] = useState(false)

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setInv = (k, v) => setInvForm(f => ({ ...f, [k]: v }))
  const setGl  = (k, v) => setGlForm(f => ({ ...f, [k]: v }))

  // ── STATS ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date()
    let month = 0, pipeline = 0, overdue = 0
    let monthCount = 0, pipeCount = 0, overdueCount = 0
    deals.forEach(d => {
      const amt = Number(d.amount) || 0
      if (d.status === 'overdue')                             { overdue += amt; overdueCount++ }
      if (['negotiating','pending'].includes(d.status))       { pipeline += amt; pipeCount++ }
      if (d.status === 'confirmed' && d.created_at) {
        const c = new Date(d.created_at)
        if (c.getMonth() === now.getMonth() && c.getFullYear() === now.getFullYear()) {
          month += amt; monthCount++
        }
      }
    })
    const grandTotal = deals.filter(d => d.status === 'confirmed').reduce((s, d) => s + (Number(d.amount) || 0), 0)
    return { month, pipeline, overdue, monthCount, pipeCount, overdueCount, grandTotal }
  }, [deals])

  // ── AD ALERTS ──────────────────────────────────────────────
  const expiringAds = useMemo(() =>
    deals
      .filter(d => d.ad_rights_end)
      .map(d => ({ ...d, diff: daysUntil(d.ad_rights_end) }))
      .filter(d => d.diff !== null && d.diff >= -1 && d.diff <= 14)
      .sort((a, b) => a.diff - b.diff),
    [deals]
  )

  // ── AWAITING GO-LIVE ───────────────────────────────────────
  const awaitingGoLive = useMemo(() =>
    deals.filter(d => ['pending', 'negotiating'].includes(d.status) && !d.go_live_date),
    [deals]
  )

  // ── PAYMENT TIMELINE (live but unpaid) ─────────────────────
  const paymentTimeline = useMemo(() =>
    deals
      .filter(d => d.go_live_date && d.status !== 'confirmed')
      .map(d => ({
        ...d,
        dueDate: calcPaymentDue(d.go_live_date, d.payment_days),
        diffDue: daysUntil(calcPaymentDue(d.go_live_date, d.payment_days)),
      }))
      .sort((a, b) => (a.diffDue ?? 999) - (b.diffDue ?? 999)),
    [deals]
  )

  // ── OPEN GO-LIVE MODAL ─────────────────────────────────────
  function openGoLive(deal) {
    setGlForm({
      id: deal.id,
      brand: deal.brand,
      deliverables: deal.deliverables || '',
      amount: deal.amount || 0,
      agency: deal.agency || '',
      go_live_date: today(),
      go_live_link: '',
      payment_days: String(deal.payment_days || 30),
    })
    setModal('golive')
  }

  async function handleMarkLive() {
    if (!glForm.go_live_date) { showToast('Go-live date required'); return }
    const payDays = parseInt(glForm.payment_days)
    const dueDate = calcPaymentDue(glForm.go_live_date, payDays)
    await updateDeal(glForm.id, {
      go_live_date: glForm.go_live_date,
      go_live_link: glForm.go_live_link || null,
      payment_days: payDays,
      status: 'pending',
      due_date: dueDate,
    })
    showToast('Marked live!')
    setModal(null)
    // Pre-fill invoice and open it
    setInvForm({
      name: 'Vidhaan Jain',
      brand: glForm.brand,
      agency: glForm.agency,
      deliverables: glForm.deliverables,
      amount: String(glForm.amount),
      gst: '0',
      date: glForm.go_live_date,
      due: dueDate || '',
      campaign_code: '',
    })
    setTimeout(() => setModal('invoice'), 300)
  }

  // ── DEAL MODAL OPEN/SAVE ───────────────────────────────────
  function openAdd() {
    setForm({ ...EMPTY_DEAL })
    setEditId(null)
    setModal('deal')
  }

  function openEdit(deal) {
    setForm({
      brand: deal.brand || '', agency: deal.agency || '',
      deliverables: deal.deliverables || '', amount: deal.amount || '',
      status: deal.status || 'negotiating',
      ad_rights_days: String(deal.ad_rights_days || 0),
      ad_rights_start: deal.ad_rights_start || '',
      ad_rights_end:   deal.ad_rights_end   || '',
      notes: deal.notes || '',
      go_live_date: deal.go_live_date || '',
      go_live_link: deal.go_live_link || '',
      payment_days: String(deal.payment_days || 30),
    })
    setEditId(deal.id)
    setModal('deal')
  }

  async function handleSaveDeal() {
    if (!form.brand.trim() || !form.amount) { showToast('Brand and amount required'); return }
    const adDays  = parseInt(form.ad_rights_days) || 0
    const payDays = parseInt(form.payment_days) || 30
    const goLive  = form.go_live_date || null
    const payload = {
      brand:           form.brand.trim(),
      agency:          form.agency.trim() || 'Direct',
      deliverables:    form.deliverables.trim(),
      amount:          parseFloat(form.amount),
      status:          form.status,
      payment_days:    payDays,
      go_live_date:    goLive,
      go_live_link:    form.go_live_link || null,
      due_date:        goLive ? calcPaymentDue(goLive, payDays) : null,
      ad_rights_days:  adDays,
      ad_rights_start: adDays > 0 ? (form.ad_rights_start || null) : null,
      ad_rights_end:   adDays > 0 ? (form.ad_rights_end   || null) : null,
      notes:           form.notes.trim() || null,
    }
    if (editId) { await updateDeal(editId, payload); showToast('Deal updated') }
    else        { await addDeal(payload);             showToast('Deal added') }
    setModal(null)
  }

  async function handleDelete() {
    if (!editId || !window.confirm('Delete this deal?')) return
    await deleteDeal(editId)
    setModal(null)
    showToast('Deleted')
  }

  function draftStopAd(brand) {
    const p = encodeURIComponent(`Draft a brief professional message to the ${brand} team: our ad rights period is ending within 3 days. Please stop running the sponsored content as an ad immediately. Short and polite. Sign off: Vidhaan / 7999546362`)
    window.open('https://claude.ai/new?q=' + p, '_blank')
  }

  // ── INVOICE ────────────────────────────────────────────────
  const invAmt   = parseFloat(invForm.amount) || 0
  const invGST   = parseInt(invForm.gst) || 0
  const invTax   = Math.round(invAmt * invGST / 100)
  const invTotal = invAmt + invTax

  function copyInvoice() {
    if (!invAmt) { showToast('Enter amount first'); return }
    const cc = invForm.campaign_code ? `\nCampaign Code : ${invForm.campaign_code}` : ''
    const text = [
      'INVOICE',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `From          : ${invForm.name}`,
      `To            : ${invForm.agency || invForm.brand}`,
      `Brand         : ${invForm.brand}`,
      `Invoice Date  : ${invForm.date}`,
      `Payment Due   : ${invForm.due || '—'}` + cc,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `${(invForm.deliverables || 'Content creation').substring(0,26).padEnd(26)}  ₹${fmtINRFull(invAmt)}`,
      ...(invGST > 0 ? [`${'GST ' + invGST + '%'}`.padEnd(28) + `₹${fmtINRFull(invTax)}`] : []),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `${'TOTAL'.padEnd(28)}₹${fmtINRFull(invTotal)}`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'Payment  : UPI / NEFT',
      'Email    : hividhaan@gmail.com',
      'Phone    : 7999546362',
    ].join('\n')
    navigator.clipboard.writeText(text)
      .then(() => showToast('Invoice copied to clipboard!'))
      .catch(() => showToast('Copy failed — try long press'))
  }

  if (loading) return <div className="scroll-area"><Spinner /></div>

  return (
    <div className="scroll-area page-enter">
      <SectionHeader title="Revenue" action={<AddBtn onClick={openAdd}>＋ Add Deal</AddBtn>} />

      {/* STATS */}
      <div className="grid3">
        <StatTile label="This Month"  value={fmtINR(stats.month)}    badge={`${stats.monthCount} received`} badgeType="green" valueColor="var(--lime)" />
        <StatTile label="Pipeline"    value={fmtINR(stats.pipeline)} badge={`${stats.pipeCount} pending`}   badgeType="blue" />
        <StatTile label="Overdue"     value={fmtINR(stats.overdue)}  badge={`${stats.overdueCount} deals`}  badgeType="red"  valueColor={stats.overdue > 0 ? 'var(--red)' : undefined} />
      </div>

      {/* GRAND TOTAL — tap to reveal */}
      <div
        onClick={() => setShowTotal(s => !s)}
        style={{
          marginTop: 10,
          background: 'var(--bg2)', border: '1px solid var(--bd)',
          borderRadius: 'var(--r-lg)', padding: '12px 14px',
          cursor: 'pointer', transition: 'border-color .15s',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div>
          <div className="label" style={{ marginBottom: showTotal ? 6 : 0 }}>Total Earned (All Time)</div>
          {showTotal
            ? <div style={{ fontFamily: 'var(--fh)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--lime)' }}>
                {fmtINRFull(stats.grandTotal)}
              </div>
            : <div style={{ fontSize: 12, color: 'var(--t3)' }}>Tap to reveal</div>
          }
        </div>
        <div style={{ fontSize: 18, color: 'var(--t3)', transition: 'transform .2s', transform: showTotal ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ›
        </div>
      </div>

      {/* AWAITING GO-LIVE */}
      {awaitingGoLive.length > 0 && (
        <Card style={{ marginTop: 10 }}>
          <div className="card-pad" style={{ paddingBottom: 6 }}>
            <div className="label">🎬 Awaiting Go-Live</div>
          </div>
          {awaitingGoLive.map(d => (
            <div key={d.id} className="deal-row" onClick={() => openGoLive(d)}>
              <div className="deal-dot" style={{ background: 'var(--blue)' }} />
              <div className="deal-info">
                <div className="deal-brand">{d.brand}{d.agency && d.agency !== 'Direct' ? ` × ${d.agency}` : ''}</div>
                <div className="deal-meta">{d.deliverables} · Tap to mark live</div>
              </div>
              <div className="deal-right">
                <div className="deal-amt">{fmtINR(d.amount)}</div>
                <div className="deal-status" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>Not live yet</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* PAYMENT TIMELINE */}
      {paymentTimeline.length > 0 && (
        <Card style={{ marginTop: 10 }}>
          <div className="card-pad" style={{ paddingBottom: 6 }}>
            <div className="label">💰 Payment Timeline</div>
          </div>
          {paymentTimeline.map(d => {
            const diff = d.diffDue
            const urgent = diff !== null && diff <= 7
            const color = diff === null ? 'var(--t3)' : diff < 0 ? 'var(--red)' : urgent ? 'var(--amber)' : 'var(--green)'
            const label = diff === null ? '—' : diff < 0 ? `${Math.abs(diff)}d overdue` : diff === 0 ? 'Due today' : `${diff}d left`
            return (
              <div key={d.id} className="deal-row" onClick={() => openEdit(d)}>
                <div className="deal-dot" style={{ background: color }} />
                <div className="deal-info">
                  <div className="deal-brand">{d.brand}</div>
                  <div className="deal-meta">Live {d.go_live_date} · {d.payment_days}d terms · Due {d.dueDate}</div>
                </div>
                <div className="deal-right">
                  <div className="deal-amt">{fmtINR(d.amount)}</div>
                  <div className="deal-status" style={{ background: diff !== null && diff < 0 ? 'var(--red-bg)' : urgent ? 'var(--amber-bg)' : 'var(--blue-bg)', color }}>
                    {label}
                  </div>
                </div>
              </div>
            )
          })}
        </Card>
      )}

      {/* AD RIGHTS EXPIRING */}
      {expiringAds.length > 0 && (
        <Card style={{ marginTop: 10 }}>
          <div className="card-pad" style={{ paddingBottom: 4 }}><div className="label">Ad Rights Expiring</div></div>
          <div className="card-pad" style={{ paddingTop: 4 }}>
            {expiringAds.map(d => (
              <div key={d.id} className={`alert-banner ${d.diff <= 3 ? 'alert-red' : 'alert-amber'}`}>
                <div className="alert-icon">{d.diff <= 3 ? '🔴' : '🟡'}</div>
                <div className="alert-body">
                  <div className="alert-title">
                    {d.brand} — {d.diff < 0 ? 'Expired' : d.diff === 0 ? 'Expires today' : `Expires in ${d.diff}d`}
                  </div>
                  <div className="alert-desc">{d.ad_rights_days}-day rights · Ends {d.ad_rights_end}</div>
                  <button className="alert-action" onClick={() => draftStopAd(d.brand)}>Draft stop-ad message ↗</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ALL DEALS */}
      <Card>
        <div className="card-pad" style={{ paddingBottom: 6 }}><div className="label">All Deals</div></div>
        {deals.length === 0
          ? <Empty icon="📋" text="No deals yet" />
          : deals.map(d => {
              const s = DEAL_STATUSES[d.status] || DEAL_STATUSES.negotiating
              const payDue = d.go_live_date && d.status !== 'confirmed'
                ? calcPaymentDue(d.go_live_date, d.payment_days)
                : d.due_date
              return (
                <div key={d.id} className="deal-row" onClick={() => openEdit(d)}>
                  <div className="deal-dot" style={{ background: s.color }} />
                  <div className="deal-info">
                    <div className="deal-brand">{d.brand}{d.agency && d.agency !== 'Direct' ? ` × ${d.agency}` : ''}</div>
                    <div className="deal-meta">
                      {d.deliverables || '—'}
                      {d.go_live_date ? ` · Live ${d.go_live_date}` : ''}
                      {payDue && d.status !== 'confirmed' ? ` · Due ${payDue}` : ''}
                    </div>
                  </div>
                  <div className="deal-right">
                    <div className="deal-amt">{fmtINR(d.amount)}</div>
                    <div className="deal-status" style={{ background: s.bg, color: s.color }}>{s.label}</div>
                  </div>
                </div>
              )
            })
        }
        <div className="card-pad" style={{ paddingTop: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={openAdd}>＋ New deal</button>
        </div>
      </Card>

      {/* INVOICE BUTTON */}
      <Card>
        <div className="card-pad">
          <div className="label">Invoice Generator</div>
          <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 12 }}>Generate a clean invoice for any deal</p>
          <button className="btn btn-lime btn-full" onClick={() => setModal('invoice')}>Generate Invoice</button>
        </div>
      </Card>

      {/* ── GO-LIVE MODAL ────────────────────────────────────── */}
      <Modal open={modal === 'golive'} onClose={() => setModal(null)} title={`${glForm.brand} — Mark Live`}>
        <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '10px 12px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 2 }}>Deal</div>
          <div style={{ fontSize: 13, color: 'var(--t1)' }}>{glForm.deliverables} · {fmtINR(glForm.amount)}</div>
        </div>
        <Field label="Go-Live Date">
          <Input type="date" value={glForm.go_live_date} onChange={e => setGl('go_live_date', e.target.value)} />
        </Field>
        <Field label="Live Link (Instagram URL)">
          <Input value={glForm.go_live_link} onChange={e => setGl('go_live_link', e.target.value)} placeholder="https://instagram.com/reel/..." />
        </Field>
        <Field label="Payment Terms">
          <Select value={glForm.payment_days} onChange={e => setGl('payment_days', e.target.value)}>
            {PAYMENT_TERMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </Field>
        {glForm.go_live_date && (
          <div style={{ background: 'var(--lime-bg)', border: '1px solid var(--lime-bd)', borderRadius: 'var(--r)', padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--lime-d)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px' }}>Payment due date</div>
            <div style={{ fontSize: 20, color: 'var(--lime)', fontWeight: 700, fontFamily: 'var(--fh)', marginTop: 4 }}>
              {calcPaymentDue(glForm.go_live_date, parseInt(glForm.payment_days)) || '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 2 }}>
              {glForm.payment_days} days from go-live
            </div>
          </div>
        )}
        <button className="btn btn-lime btn-full" onClick={handleMarkLive} style={{ marginBottom: 8 }}>
          Mark Live & Open Invoice →
        </button>
        <button className="btn btn-ghost btn-full" onClick={() => setModal(null)}>Cancel</button>
      </Modal>

      {/* ── DEAL MODAL ───────────────────────────────────────── */}
      <Modal open={modal === 'deal'} onClose={() => setModal(null)} title={editId ? 'Edit Deal' : 'New Deal'}>
        <Field label="Brand Name">
          <Input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. HDFC Life" autoFocus={!editId} />
        </Field>
        <Field label="Agency">
          <Input value={form.agency} onChange={e => set('agency', e.target.value)} placeholder="e.g. Madhouse Media (optional)" />
        </Field>
        <Field label="Deliverables">
          <Input value={form.deliverables} onChange={e => set('deliverables', e.target.value)} placeholder="e.g. 1 Collab Reel + 1 Story" />
        </Field>
        <Row2>
          <Field label="Amount (₹)">
            <Input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="27500" />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="negotiating">Negotiating</option>
              <option value="pending">Confirmed — pending live</option>
              <option value="confirmed">Received / Paid</option>
              <option value="overdue">Overdue</option>
            </Select>
          </Field>
        </Row2>
        <Row2>
          <Field label="Payment Terms">
            <Select value={form.payment_days} onChange={e => set('payment_days', e.target.value)}>
              {PAYMENT_TERMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Ad Rights">
            <Select value={form.ad_rights_days} onChange={e => set('ad_rights_days', e.target.value)}>
              <option value="0">None</option>
              <option value="30">1 month</option>
              <option value="75">75 days</option>
              <option value="90">3 months</option>
            </Select>
          </Field>
        </Row2>
        {form.ad_rights_days !== '0' && (
          <Row2>
            <Field label="Ad Start"><Input type="date" value={form.ad_rights_start} onChange={e => set('ad_rights_start', e.target.value)} /></Field>
            <Field label="Ad End">  <Input type="date" value={form.ad_rights_end}   onChange={e => set('ad_rights_end',   e.target.value)} /></Field>
          </Row2>
        )}
        <div style={{ height: 1, background: 'var(--bd)', margin: '4px 0 14px' }} />
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 10, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Go-Live (fill when content goes live)</div>
        <Field label="Go-Live Date">
          <Input type="date" value={form.go_live_date} onChange={e => set('go_live_date', e.target.value)} />
        </Field>
        <Field label="Live Link">
          <Input value={form.go_live_link} onChange={e => set('go_live_link', e.target.value)} placeholder="https://instagram.com/reel/..." />
        </Field>
        {form.go_live_date && (
          <div style={{ background: 'var(--lime-bg)', border: '1px solid var(--lime-bd)', borderRadius: 'var(--r)', padding: '10px 12px', marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--lime-d)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px' }}>Payment due</div>
            <div style={{ fontSize: 17, color: 'var(--lime)', fontWeight: 700, marginTop: 3 }}>
              {calcPaymentDue(form.go_live_date, parseInt(form.payment_days)) || '—'}
            </div>
          </div>
        )}
        <Field label="Notes / Campaign Code">
          <Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="e.g. Campaign code: 918_Kotak_01" />
        </Field>
        <button className="btn btn-lime btn-full" onClick={handleSaveDeal} style={{ marginBottom: 8 }}>
          {editId ? 'Update Deal' : 'Save Deal'}
        </button>
        {editId && (
          <button className="btn btn-danger btn-full" onClick={handleDelete} style={{ marginBottom: 8 }}>Delete Deal</button>
        )}
        <button className="btn btn-ghost btn-full" onClick={() => setModal(null)}>Cancel</button>
      </Modal>

      {/* ── INVOICE MODAL ────────────────────────────────────── */}
      <Modal open={modal === 'invoice'} onClose={() => setModal(null)} title="Generate Invoice">
        <Field label="Your Name">
          <Input value={invForm.name} onChange={e => setInv('name', e.target.value)} />
        </Field>
        <Field label="Brand">
          <Input value={invForm.brand} onChange={e => setInv('brand', e.target.value)} placeholder="e.g. Kotak 811" />
        </Field>
        <Field label="Agency / Bill To">
          <Input value={invForm.agency} onChange={e => setInv('agency', e.target.value)} placeholder="e.g. Finnet Media Pvt Ltd" />
        </Field>
        <Field label="Deliverables">
          <Input value={invForm.deliverables} onChange={e => setInv('deliverables', e.target.value)} placeholder="e.g. 1 Collab Reel + 3M Ad Rights" />
        </Field>
        <Field label="Campaign Code (if any)">
          <Input value={invForm.campaign_code} onChange={e => setInv('campaign_code', e.target.value)} placeholder="e.g. 918_Kotak_01" />
        </Field>
        <Row2>
          <Field label="Amount (₹)">
            <Input type="number" value={invForm.amount} onChange={e => setInv('amount', e.target.value)} placeholder="50000" />
          </Field>
          <Field label="GST">
            <Select value={invForm.gst} onChange={e => setInv('gst', e.target.value)}>
              <option value="0">No GST</option>
              <option value="18">18% GST</option>
            </Select>
          </Field>
        </Row2>
        <Row2>
          <Field label="Invoice Date">
            <Input type="date" value={invForm.date} onChange={e => setInv('date', e.target.value)} />
          </Field>
          <Field label="Payment Due">
            <Input type="date" value={invForm.due} onChange={e => setInv('due', e.target.value)} />
          </Field>
        </Row2>
        {invAmt > 0 && (
          <>
            <div style={{ height: 1, background: 'var(--bd)', margin: '4px 0 14px' }} />
            <div className="label" style={{ marginBottom: 10 }}>Preview</div>
            <div className="inv-line"><span>{invForm.deliverables || 'Content creation'}</span><span>₹{fmtINRFull(invAmt)}</span></div>
            {invGST > 0 && <div className="inv-line"><span>GST {invGST}%</span><span>₹{fmtINRFull(invTax)}</span></div>}
            <div className="inv-total"><span>Total</span><span className="val">₹{fmtINRFull(invTotal)}</span></div>
            <div style={{ marginTop: 14 }} />
          </>
        )}
        <button className="btn btn-lime btn-full" onClick={copyInvoice} style={{ marginBottom: 8 }}>
          Copy Invoice Text
        </button>
        <button className="btn btn-ghost btn-full" onClick={() => setModal(null)}>Cancel</button>
      </Modal>

      {!isLive && (
        <p style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginTop: 16 }}>
          Demo mode — add Supabase keys to persist data
        </p>
      )}
    </div>
  )
}
