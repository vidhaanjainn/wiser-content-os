import { useState, useMemo, useRef } from 'react'
import { useDeals } from '../hooks/useDeals'
import { Modal, Field, Input, Select, Row2 } from '../components/Modal'
import { Card, SectionHeader, AddBtn, Spinner, Empty, StatTile } from '../components/UI'
import { DEAL_STATUSES, PAYMENT_TERMS, fmtINR, fmtINRFull, today, daysUntil, calcPaymentDue } from '../lib/constants'
import { isLive } from '../lib/supabase'

// ── KNOWN AGENCY BILL-TO DETAILS ──────────────────────────────
const AGENCY_DETAILS = {
  'Sociowash Media': {
    company: 'Sociowash Media Private Limited',
    address: 'B-44, Retreat Apartment, 20, I.P Extension, New Delhi, Delhi-110092',
    gstin: '07ABDCS8972L1ZL',
    pan: 'ABDCS8972L',
  },
  'Madhouse Media': { company: 'Madhouse Media Pvt Ltd', address: '', gstin: '', pan: '' },
  'Finnet Media':   { company: 'Finnet Media Pvt Ltd',   address: '', gstin: '', pan: '' },
  'Creators Cube':  { company: 'Creators Cube',          address: '', gstin: '', pan: '' },
  'Kinetic':        { company: 'Kinetic Worldwide',       address: '', gstin: '', pan: '' },
  'Opraah FX':      { company: 'Opraah FX',              address: '', gstin: '', pan: '' },
  'Digiwhistle':    { company: 'Digiwhistle',             address: '', gstin: '', pan: '' },
  'Socioimpulse':   { company: 'Socioimpulse',            address: '', gstin: '', pan: '' },
  'Influns':        { company: 'Influns',                 address: '', gstin: '', pan: '' },
  'Madchatter':     { company: 'Madchatter',              address: '', gstin: '', pan: '' },
}

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

const EMPTY_BILL_TO = { agency_key: '', company: '', address: '', gstin: '', pan: '' }

export default function Money({ showToast }) {
  const { deals, loading, addDeal, updateDeal, deleteDeal } = useDeals()
  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState(EMPTY_DEAL)
  const [editId, setEditId]     = useState(null)
  const [invForm, setInvForm]   = useState(EMPTY_INV)
  const [billTo, setBillToState]= useState(EMPTY_BILL_TO)
  const [glForm, setGlForm]     = useState({ id: null, brand: '', deliverables: '', amount: 0, agency: '', go_live_date: '', go_live_link: '', payment_days: '30' })
  const [showTotal, setShowTotal] = useState(false)
  const [emailText, setEmailText] = useState('')
  const [paidFlash, setPaidFlash] = useState(null)

  // Invoice number — persists across sessions
  const [invNum, setInvNum] = useState(() => parseInt(localStorage.getItem('wiser_next_inv') || '544'))

  const set      = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setInv   = (k, v) => setInvForm(f => ({ ...f, [k]: v }))
  const setGl    = (k, v) => setGlForm(f => ({ ...f, [k]: v }))
  const setBillTo = (k, v) => setBillToState(f => ({ ...f, [k]: v }))

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

  // ── QUICK MARK PAID ────────────────────────────────────────
  async function markPaidQuick(id, e) {
    e.stopPropagation()
    setPaidFlash(id)
    await updateDeal(id, { status: 'confirmed' })
    showToast('Payment received! 🎉')
    if (navigator.vibrate) navigator.vibrate([50, 20, 80])
    setTimeout(() => setPaidFlash(null), 600)
  }

  // ── OPEN GO-LIVE MODAL ─────────────────────────────────────
  function openGoLive(deal) {
    setGlForm({
      id: deal.id,
      brand: deal.brand || '',
      deliverables: deal.deliverables || '',
      amount: deal.amount || 0,
      agency: deal.agency || '',
      go_live_date: today(),
      go_live_link: '',
      payment_days: String(deal.payment_days || 30),
    })
    setTimeout(() => setModal('golive'), 50)
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
    showToast('Marked live! Open Invoice to send.')
    setModal(null)
    const deal = deals.find(d => d.id === glForm.id)
    if (deal) {
      setInvForm({
        name: 'Vidhaan Jain',
        brand: glForm.brand,
        agency: glForm.agency,
        deliverables: glForm.deliverables,
        amount: String(glForm.amount),
        gst: '0',
        date: glForm.go_live_date,
        due: dueDate || '',
        campaign_code: deal.notes?.match(/[Cc]ode[:\s]+([A-Z0-9_]+)/)?.[1] || '',
      })
      // Pre-fill Bill To if agency known
      const key = Object.keys(AGENCY_DETAILS).find(k => glForm.agency?.toLowerCase().includes(k.toLowerCase()))
      if (key) setBillToState({ agency_key: key, ...AGENCY_DETAILS[key] })
      else setBillToState({ ...EMPTY_BILL_TO, company: glForm.agency || '' })
      setTimeout(() => setModal('invoice'), 100)
    }
  }

  // ── DEAL MODAL ─────────────────────────────────────────────
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

  // ── EMAIL PASTE PARSER ────────────────────────────────────
  function parseEmail() {
    const text = emailText
    if (!text.trim()) { showToast('Paste an email first'); return }

    const result = { brand: '', agency: '', deliverables: '', amount: '', notes: '' }

    // Amount — ₹X,XX,XXX or Rs X or INR X
    const amtMatch = text.match(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i)
    if (amtMatch) result.amount = amtMatch[1].replace(/,/g, '').split('.')[0]

    // Known agencies
    const agencyNames = Object.keys(AGENCY_DETAILS).concat(['Socioimpulse','Digiwhistle','Madhouse','Finnet','Creators Cube','Kinetic','Opraah','Influns','Madchatter'])
    for (const ag of agencyNames) {
      if (text.toLowerCase().includes(ag.toLowerCase())) { result.agency = ag; break }
    }

    // Deliverables — "1 Reel", "2 Stories", collab reel etc.
    const delivMatches = text.match(/\d+\s*(?:collab\s+)?(?:ig\s+)?(?:reel|story|stories|carousel|video|short|yt short)s?(?:\s*[+&]\s*\d+\s*(?:reel|story|stories|carousel|video|short)s?)*/gi)
    if (delivMatches?.length) result.deliverables = delivMatches.slice(0, 3).join(' + ')

    // Campaign code
    const codeMatch = text.match(/(?:campaign\s+code|code)[:\s]+([A-Z0-9_]{3,})/i)
    if (codeMatch) result.notes = 'Campaign code: ' + codeMatch[1]

    // Brand — look for "for [Brand]" "regarding [Brand]" "with [Brand]"
    const brandMatch = text.match(/(?:for|regarding|collab with|campaign for|partnership with)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s+collab|\s+campaign|\s+brand|\.|,|\n|$)/i)
    if (brandMatch) result.brand = brandMatch[1].trim()

    setForm(f => ({
      ...f,
      brand:        result.brand        || f.brand,
      agency:       result.agency       || f.agency,
      deliverables: result.deliverables || f.deliverables,
      amount:       result.amount       || f.amount,
      notes:        result.notes        || f.notes,
    }))
    setEmailText('')
    setModal('deal')
    showToast('Parsed! Review and confirm the fields.')
  }

  // ── INVOICE ────────────────────────────────────────────────
  const invAmt   = parseFloat(invForm.amount) || 0
  const invGST   = parseInt(invForm.gst) || 0
  const invTax   = Math.round(invAmt * invGST / 100)
  const invTotal = invAmt + invTax

  function openInvoiceFromDeal(deal) {
    setInvForm({
      name: 'Vidhaan Jain',
      brand: deal.brand || '',
      agency: deal.agency || '',
      deliverables: deal.deliverables || '',
      amount: String(deal.amount || ''),
      gst: '0',
      date: today(),
      due: deal.due_date || calcPaymentDue(deal.go_live_date, deal.payment_days) || '',
      campaign_code: deal.notes?.match(/[Cc]ode[:\s]+([A-Z0-9_]+)/)?.[1] || '',
    })
    const key = Object.keys(AGENCY_DETAILS).find(k => deal.agency?.toLowerCase().includes(k.toLowerCase()))
    if (key) setBillToState({ agency_key: key, ...AGENCY_DETAILS[key] })
    else setBillToState({ ...EMPTY_BILL_TO, company: deal.agency || '' })
    setModal('invoice')
  }

  function handleAgencySelect(key) {
    if (key && AGENCY_DETAILS[key]) {
      setBillToState({ agency_key: key, ...AGENCY_DETAILS[key] })
    } else {
      setBillToState({ ...EMPTY_BILL_TO, agency_key: key })
    }
  }

  function printInvoice() {
    if (!invAmt) { showToast('Enter amount first'); return }
    // Save invoice number, increment for next time
    localStorage.setItem('wiser_next_inv', String(invNum + 1))
    setInvNum(n => n + 1)
    setTimeout(() => window.print(), 80)
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

      {/* GRAND TOTAL */}
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
        <div style={{ fontSize: 18, color: 'var(--t3)', transition: 'transform .2s', transform: showTotal ? 'rotate(180deg)' : 'rotate(0deg)' }}>›</div>
      </div>

      {/* AWAITING GO-LIVE */}
      {awaitingGoLive.length > 0 && (
        <Card style={{ marginTop: 10 }}>
          <div className="card-pad" style={{ paddingBottom: 6 }}>
            <div className="label">🎬 Awaiting Go-Live</div>
          </div>
          {awaitingGoLive.map((d, i) => (
            <div key={d.id} className="deal-row" style={{ animationDelay: `${i * 40}ms` }} onClick={() => openGoLive(d)}>
              <div className="deal-dot" style={{ background: 'var(--blue)' }} />
              <div className="deal-info">
                <div className="deal-brand">{d.brand}{d.agency && d.agency !== 'Direct' ? ` × ${d.agency}` : ''}</div>
                <div className="deal-meta">{d.deliverables} · Tap to mark live</div>
              </div>
              <div className="deal-right">
                <div className="deal-amt">{fmtINR(d.amount)}</div>
                <div className="deal-status" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>Not live</div>
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
          {paymentTimeline.map((d, i) => {
            const diff  = d.diffDue
            const urgent = diff !== null && diff <= 7
            const color  = diff === null ? 'var(--t3)' : diff < 0 ? 'var(--red)' : urgent ? 'var(--amber)' : 'var(--green)'
            const label  = diff === null ? '—' : diff < 0 ? `${Math.abs(diff)}d overdue` : diff === 0 ? 'Due today' : `${diff}d left`
            const isFlashing = paidFlash === d.id
            return (
              <div
                key={d.id}
                className={`deal-row${isFlashing ? ' paid-flash' : ''}`}
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => openEdit(d)}
              >
                <div className="deal-dot" style={{ background: color }} />
                <div className="deal-info">
                  <div className="deal-brand">{d.brand}</div>
                  <div className="deal-meta">Live {d.go_live_date} · {d.payment_days}d terms · Due {d.dueDate}</div>
                </div>
                <div className="deal-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div>
                    <div className="deal-amt">{fmtINR(d.amount)}</div>
                    <div className="deal-status" style={{ background: diff !== null && diff < 0 ? 'var(--red-bg)' : urgent ? 'var(--amber-bg)' : 'var(--blue-bg)', color }}>{label}</div>
                  </div>
                  <button
                    className="mark-paid-btn"
                    onClick={(e) => markPaidQuick(d.id, e)}
                    title="Mark as paid"
                  >✓</button>
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
          : deals.map((d, i) => {
              const s = DEAL_STATUSES[d.status] || DEAL_STATUSES.negotiating
              const payDue = d.go_live_date && d.status !== 'confirmed'
                ? calcPaymentDue(d.go_live_date, d.payment_days)
                : d.due_date
              return (
                <div key={d.id} className="deal-row" style={{ animationDelay: `${i * 30}ms` }} onClick={() => openEdit(d)}>
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

      {/* INVOICE + EMAIL IMPORT BUTTONS */}
      <Card>
        <div className="card-pad">
          <div className="label">Invoice & Import</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-lime" style={{ flex: 1 }} onClick={() => { setInvForm(EMPTY_INV); setBillToState(EMPTY_BILL_TO); setModal('invoice') }}>
              🧾 New Invoice
            </button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setForm(EMPTY_DEAL); setEditId(null); setModal('email') }}>
              📩 Paste Email
            </button>
          </div>
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
            <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 2 }}>{glForm.payment_days} days from go-live</div>
          </div>
        )}
        <button className="btn btn-lime btn-full" onClick={handleMarkLive} style={{ marginBottom: 8 }}>Mark Live & Open Invoice →</button>
        <button className="btn btn-ghost btn-full" onClick={() => setModal(null)}>Cancel</button>
      </Modal>

      {/* ── EMAIL PASTE MODAL ────────────────────────────────── */}
      <Modal open={modal === 'email'} onClose={() => setModal(null)} title="Import from Email">
        <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 14, lineHeight: 1.5 }}>
          Paste the brand collab email below. I'll extract the brand, agency, amount, and deliverables automatically.
        </p>
        <Field label="Paste email content">
          <textarea
            className="form-input"
            rows={8}
            value={emailText}
            onChange={e => setEmailText(e.target.value)}
            placeholder="Paste the full email here..."
            style={{ resize: 'vertical', lineHeight: 1.5 }}
          />
        </Field>
        <button className="btn btn-lime btn-full" onClick={parseEmail} style={{ marginBottom: 8 }}>
          Extract & Fill Deal →
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
              <option value="confirmed">Received / Paid ✓</option>
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
        {editId && (
          <button
            className="btn btn-full"
            style={{ marginBottom: 8, background: 'var(--green-bg)', color: 'var(--green)', borderColor: 'var(--green-bd)', fontWeight: 700 }}
            onClick={async () => {
              await updateDeal(editId, { status: 'confirmed' })
              showToast('Marked as paid! 🎉')
              if (navigator.vibrate) navigator.vibrate([50, 20, 80])
              setModal(null)
            }}
          >
            ✓ Mark as Received / Paid
          </button>
        )}
        {editId && (
          <button
            className="btn btn-ghost btn-full"
            style={{ marginBottom: 8 }}
            onClick={() => { const deal = deals.find(d => d.id === editId); if (deal) openInvoiceFromDeal(deal); }}
          >
            🧾 Generate Invoice for this Deal
          </button>
        )}
        <button className="btn btn-lime btn-full" onClick={handleSaveDeal} style={{ marginBottom: 8 }}>
          {editId ? 'Update Deal' : 'Save Deal'}
        </button>
        {editId && (
          <button className="btn btn-danger btn-full" onClick={handleDelete} style={{ marginBottom: 8 }}>Delete Deal</button>
        )}
        <button className="btn btn-ghost btn-full" onClick={() => setModal(null)}>Cancel</button>
      </Modal>

      {/* ── INVOICE MODAL ────────────────────────────────────── */}
      <Modal open={modal === 'invoice'} onClose={() => setModal(null)} title={`Invoice #${invNum}`}>
        {/* Invoice number display */}
        <div style={{ background: 'var(--lime-bg)', border: '1px solid var(--lime-bd)', borderRadius: 'var(--r)', padding: '8px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--lime-d)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Invoice Number</div>
          <div style={{ fontFamily: 'var(--fh)', fontSize: 18, fontWeight: 700, color: 'var(--lime)' }}>#{invNum}</div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 10, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>From</div>
        <Field label="Your Name">
          <Input value={invForm.name} onChange={e => setInv('name', e.target.value)} />
        </Field>

        <div style={{ height: 1, background: 'var(--bd)', margin: '4px 0 14px' }} />
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 10, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Bill To</div>

        <Field label="Agency (select to auto-fill)">
          <Select
            value={billTo.agency_key}
            onChange={e => handleAgencySelect(e.target.value)}
          >
            <option value="">— Select or type below —</option>
            {Object.keys(AGENCY_DETAILS).map(k => <option key={k} value={k}>{k}</option>)}
          </Select>
        </Field>
        <Field label="Company Name">
          <Input value={billTo.company} onChange={e => setBillTo('company', e.target.value)} placeholder="e.g. Sociowash Media Private Limited" />
        </Field>
        <Field label="Address">
          <Input value={billTo.address} onChange={e => setBillTo('address', e.target.value)} placeholder="Full address (optional)" />
        </Field>
        <Row2>
          <Field label="GSTIN/UIN">
            <Input value={billTo.gstin} onChange={e => setBillTo('gstin', e.target.value)} placeholder="07ABCD1234E1ZX" />
          </Field>
          <Field label="PAN">
            <Input value={billTo.pan} onChange={e => setBillTo('pan', e.target.value)} placeholder="ABCDE1234F" />
          </Field>
        </Row2>

        <div style={{ height: 1, background: 'var(--bd)', margin: '4px 0 14px' }} />
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 10, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Line Item</div>

        <Field label="Brand">
          <Input value={invForm.brand} onChange={e => setInv('brand', e.target.value)} placeholder="e.g. Kotak 811" />
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
              <option value="0">No GST (0%)</option>
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
            <div className="inv-line"><span style={{ color: 'var(--t3)' }}>Tax (0%)</span><span style={{ color: 'var(--t3)' }}>₹0.00</span></div>
            <div className="inv-total"><span>Total</span><span className="val">₹{fmtINRFull(invTotal)}</span></div>
            <div style={{ marginTop: 14 }} />
          </>
        )}

        <button className="btn btn-lime btn-full" onClick={printInvoice} style={{ marginBottom: 8 }}>
          📄 Download / Print PDF
        </button>
        <button className="btn btn-ghost btn-full" onClick={() => setModal(null)}>Close</button>
      </Modal>

      {!isLive && (
        <p style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginTop: 16 }}>
          Demo mode — add Supabase keys to persist data
        </p>
      )}

      {/* ── PRINT INVOICE (hidden on screen, full layout when printing) ── */}
      <div className="print-invoice">
        <div className="pi-header">
          <div className="pi-from-name">Vidhaan Jain</div>
          <div className="pi-title-block">
            <div className="pi-title">INVOICE</div>
            <div className="pi-num">#{invNum - 1}</div>
          </div>
        </div>

        <div className="pi-meta-row">
          <div className="pi-billto">
            <div className="pi-meta-label">Bill To:</div>
            <div className="pi-company">{billTo.company || invForm.agency || invForm.brand}</div>
            {billTo.address && <div className="pi-addr">{billTo.address}</div>}
            {billTo.gstin && <div className="pi-gst">GSTIN/UIN: {billTo.gstin}</div>}
            {billTo.pan && <div className="pi-pan">PAN: {billTo.pan}</div>}
          </div>
          <div className="pi-dates">
            <table className="pi-date-table">
              <tbody>
                <tr><td className="pi-dt-label">Date:</td><td className="pi-dt-val">{invForm.date}</td></tr>
                <tr><td className="pi-dt-label">Due Date:</td><td className="pi-dt-val">{invForm.due || '—'}</td></tr>
              </tbody>
            </table>
            <div className="pi-balance-box">
              <div className="pi-balance-label">Balance Due:</div>
              <div className="pi-balance-val">₹{fmtINRFull(invTotal || invAmt)}</div>
            </div>
          </div>
        </div>

        <table className="pi-items-table">
          <thead>
            <tr>
              <th className="pi-th-item">Item</th>
              <th className="pi-th">Quantity</th>
              <th className="pi-th">Rate</th>
              <th className="pi-th">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="pi-td-item">
                <strong>{invForm.campaign_code ? `${invForm.campaign_code} — ` : ''}{invForm.deliverables || 'Content creation'}</strong>
              </td>
              <td className="pi-td">1</td>
              <td className="pi-td">₹{fmtINRFull(invAmt)}</td>
              <td className="pi-td">₹{fmtINRFull(invAmt)}</td>
            </tr>
          </tbody>
        </table>

        <div className="pi-totals">
          <div className="pi-total-row"><span>Subtotal:</span><span>₹{fmtINRFull(invAmt)}</span></div>
          <div className="pi-total-row"><span>Tax ({invGST}%):</span><span>₹{fmtINRFull(invTax)}</span></div>
          <div className="pi-total-row pi-grand"><span>Total:</span><span>₹{fmtINRFull(invTotal)}</span></div>
        </div>

        <div className="pi-notes">
          <div className="pi-notes-label">Notes:</div>
          <div className="pi-payment-header">Payment Details:</div>
          <div>Bank Details:</div>
          <div>Bank Name - SBI</div>
          <div>A/C Name - Vidhaan Jain &nbsp;&nbsp;&nbsp; A/c number - 34074199631 &nbsp;&nbsp;&nbsp; IFSC Code - SBIN0016842 &nbsp;&nbsp;&nbsp; PAN - BETPJ2184N</div>
        </div>
      </div>
    </div>
  )
}
