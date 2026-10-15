import { useLayoutEffect, useRef, useState } from 'react'

// ── Issuer details (printed on every invoice) ─────────────────
export const ISSUER = {
  name: 'Vidhaan Jain',
  tagline: 'Content Creator · Wiser With Vidhaan',
  email: 'hividhaan@gmail.com',
  phone: '+91 79995 46362',
  pan: 'BETPJ2184N',
  bank: { name: 'State Bank of India', holder: 'Vidhaan Jain', account: '34074199631', ifsc: 'SBIN0016842' },
}

const inr = n => '₹' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = s => {
  if (!s) return '—'
  const d = new Date(s + 'T00:00:00')
  return isNaN(d) ? s : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Indian-system amount in words: 150000 → "One Lakh Fifty Thousand"
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
function two(n) { return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}` }
function three(n) { return n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ' ' + two(n % 100) : ''}` : two(n) }
export function inWords(amount) {
  let n = Math.round(Number(amount) || 0)
  if (!n) return 'Zero'
  const parts = []
  for (const [div, name] of [[1e7, 'Crore'], [1e5, 'Lakh'], [1e3, 'Thousand']]) {
    if (n >= div) { parts.push(`${three(Math.floor(n / div))} ${name}`); n %= div }
  }
  if (n) parts.push(three(n))
  return parts.join(' ')
}

// All invoice styles are scoped under .ivx so the same markup renders
// identically in the in-app preview and the isolated print frame.
export const INVOICE_CSS = `
.ivx{width:794px;min-height:1123px;padding:64px 64px 56px;background:#fff;color:#14161a;font-family:'Geist',-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:12.5px;line-height:1.55;-webkit-font-smoothing:antialiased;display:flex;flex-direction:column;box-sizing:border-box;position:relative}
.ivx *{box-sizing:border-box;margin:0;padding:0}
.ivx .ac{position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(90deg,#14161a 0%,#14161a 70%,#b8e04a 70%,#cdf464 100%)}
.ivx .hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:44px}
.ivx .mk{width:40px;height:40px;border-radius:11px;background:#14161a;color:#cdf464;display:flex;align-items:center;justify-content:center;font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-size:24px;margin-bottom:14px}
.ivx .nm{font-size:17px;font-weight:600;letter-spacing:-.02em}
.ivx .tg{font-size:11.5px;color:#6b6f78;margin-top:1px}
.ivx .ct{font-size:11.5px;color:#6b6f78;margin-top:8px;line-height:1.6}
.ivx .tt{text-align:right}
.ivx .tw{font-family:'Instrument Serif',Georgia,serif;font-size:56px;line-height:.9;letter-spacing:-.01em}
.ivx .no{font-family:'Geist Mono',ui-monospace,monospace;font-size:12px;color:#6b6f78;margin-top:10px;letter-spacing:.04em}
.ivx .mt{display:grid;grid-template-columns:1.3fr 1fr;gap:40px;padding:22px 0;border-top:1px solid #e7e8eb;border-bottom:1px solid #e7e8eb;margin-bottom:34px}
.ivx .lb{font-family:'Geist Mono',ui-monospace,monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:#8a8e97;margin-bottom:8px}
.ivx .co{font-size:14px;font-weight:600;letter-spacing:-.01em;margin-bottom:4px}
.ivx .ad{color:#4a4e57;font-size:12px}
.ivx .dg{display:grid;grid-template-columns:auto 1fr;gap:6px 18px;align-content:start}
.ivx .dg .k{color:#8a8e97;font-size:12px}
.ivx .dg .v{text-align:right;font-weight:500;font-size:12px;font-variant-numeric:tabular-nums}
.ivx table{width:100%;border-collapse:collapse;margin-bottom:8px}
.ivx th{font-family:'Geist Mono',ui-monospace,monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:#8a8e97;font-weight:500;text-align:right;padding:0 0 10px;border-bottom:1.5px solid #14161a}
.ivx th:first-child{text-align:left}
.ivx td{padding:16px 0;border-bottom:1px solid #e7e8eb;text-align:right;vertical-align:top;font-variant-numeric:tabular-nums}
.ivx td:first-child{text-align:left;padding-right:24px}
.ivx .it{font-weight:600;font-size:13px;letter-spacing:-.01em}
.ivx .is{color:#6b6f78;font-size:11.5px;margin-top:3px}
.ivx .sm{display:flex;justify-content:flex-end;margin-bottom:30px}
.ivx .sm .bx{width:300px}
.ivx .rw{display:flex;justify-content:space-between;padding:7px 0;color:#4a4e57;font-variant-numeric:tabular-nums}
.ivx .gt{margin-top:8px;padding:14px 16px;background:#14161a;color:#fff;border-radius:10px;display:flex;justify-content:space-between;align-items:baseline}
.ivx .gt .k{font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-family:'Geist Mono',ui-monospace,monospace;color:#b9bcc4}
.ivx .gt .v{font-size:20px;font-weight:600;letter-spacing:-.02em;color:#cdf464;font-variant-numeric:tabular-nums}
.ivx .wd{font-size:11.5px;color:#4a4e57;margin-top:10px;text-align:right;font-style:italic}
.ivx .ft{margin-top:auto;display:grid;grid-template-columns:1.3fr 1fr;gap:40px;padding-top:26px;border-top:1px solid #e7e8eb}
.ivx .bk{display:grid;grid-template-columns:auto 1fr;gap:4px 16px;font-size:12px}
.ivx .bk .k{color:#8a8e97}
.ivx .bk .v{font-weight:500;font-family:'Geist Mono',ui-monospace,monospace;font-size:11.5px}
.ivx .ty{font-family:'Instrument Serif',Georgia,serif;font-size:26px;line-height:1.1;margin-bottom:6px}
.ivx .nt{font-size:11px;color:#6b6f78;line-height:1.6}
`

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap'

export function InvoiceDoc({ number, issuer = ISSUER, billTo = {}, item = {}, date, due, gstPct = 0 }) {
  const amount = Number(item.amount) || 0
  const tax = Math.round(amount * (Number(gstPct) || 0) / 100)
  const total = amount + tax
  const company = billTo.company || item.agency || item.brand || '—'
  return (
    <div className="ivx">
      <div className="ac" />
      <div className="hd">
        <div>
          <div className="mk">w</div>
          <div className="nm">{issuer.name}</div>
          <div className="tg">{issuer.tagline}</div>
          <div className="ct">{issuer.email}<br />{issuer.phone} · PAN {issuer.pan}</div>
        </div>
        <div className="tt">
          <div className="tw">Invoice</div>
          <div className="no">NO. {String(number).padStart(4, '0')}</div>
        </div>
      </div>

      <div className="mt">
        <div>
          <div className="lb">Billed to</div>
          <div className="co">{company}</div>
          {billTo.address && <div className="ad">{billTo.address}</div>}
          {billTo.gstin && <div className="ad">GSTIN/UIN: {billTo.gstin}</div>}
          {billTo.pan && <div className="ad">PAN: {billTo.pan}</div>}
        </div>
        <div className="dg">
          <span className="k">Invoice date</span><span className="v">{fmtDate(date)}</span>
          <span className="k">Due date</span><span className="v">{fmtDate(due)}</span>
          {item.brand && <><span className="k">Brand</span><span className="v">{item.brand}</span></>}
          {item.campaign_code && <><span className="k">Campaign</span><span className="v">{item.campaign_code}</span></>}
          <span className="k">Balance due</span><span className="v">{inr(total)}</span>
        </div>
      </div>

      <table>
        <thead><tr><th>Description</th><th style={{ width: 60 }}>Qty</th><th style={{ width: 120 }}>Rate</th><th style={{ width: 130 }}>Amount</th></tr></thead>
        <tbody>
          <tr>
            <td>
              <div className="it">{item.deliverables || 'Content creation'}</div>
              <div className="is">{[item.brand && `Brand: ${item.brand}`, item.campaign_code && `Code: ${item.campaign_code}`].filter(Boolean).join(' · ') || 'Instagram content services'}</div>
            </td>
            <td>1</td>
            <td>{inr(amount)}</td>
            <td>{inr(amount)}</td>
          </tr>
        </tbody>
      </table>

      <div className="sm">
        <div className="bx">
          <div className="rw"><span>Subtotal</span><span>{inr(amount)}</span></div>
          <div className="rw"><span>GST ({Number(gstPct) || 0}%)</span><span>{inr(tax)}</span></div>
          <div className="gt"><span className="k">Total due</span><span className="v">{inr(total)}</span></div>
          <div className="wd">Rupees {inWords(total)} Only</div>
        </div>
      </div>

      <div className="ft">
        <div>
          <div className="lb">Payment details</div>
          <div className="bk">
            <span className="k">Bank</span><span className="v">{issuer.bank.name}</span>
            <span className="k">A/c name</span><span className="v">{issuer.bank.holder}</span>
            <span className="k">A/c no.</span><span className="v">{issuer.bank.account}</span>
            <span className="k">IFSC</span><span className="v">{issuer.bank.ifsc}</span>
            <span className="k">PAN</span><span className="v">{issuer.pan}</span>
          </div>
        </div>
        <div>
          <div className="ty">Thank you.</div>
          <div className="nt">Please quote the invoice number with your payment. TDS, if applicable, to be deducted as per law and reflected in Form 26AS.</div>
        </div>
      </div>
    </div>
  )
}

// Live preview: renders the real A4 document and scales it to the container width.
export function InvoicePreview(props) {
  const wrap = useRef(null)
  const [scale, setScale] = useState(0.5)
  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / 794))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div className="inv-preview-frame" ref={wrap} style={{ height: 1123 * scale }}>
      <style>{INVOICE_CSS}</style>
      <div className="inv-preview-scale" style={{ transform: `scale(${scale})` }}>
        <InvoiceDoc {...props} />
      </div>
    </div>
  )
}

// Print in an isolated iframe: no app CSS, exact A4, fonts loaded before printing.
export async function printInvoice(props, title = 'Invoice') {
  const { renderToStaticMarkup } = await import('react-dom/server')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<link rel="stylesheet" href="${FONT_LINK}">
<style>@page{size:A4;margin:0}html,body{margin:0;padding:0;background:#fff}
*{-webkit-print-color-adjust:exact;print-color-adjust:exact}
.ivx{width:210mm!important;min-height:296mm!important}${INVOICE_CSS}</style>
</head><body>${renderToStaticMarkup(<InvoiceDoc {...props} />)}</body></html>`

  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0', visibility: 'hidden' })
  document.body.appendChild(frame)
  const doc = frame.contentDocument
  doc.open(); doc.write(html); doc.close()

  const go = async () => {
    try { await Promise.race([doc.fonts?.ready, new Promise(r => setTimeout(r, 1500))]) } catch {}
    const w = frame.contentWindow
    // Safari sets the PDF filename from the parent title, so swap it temporarily
    const prevTitle = document.title
    document.title = title
    w.focus(); w.print()
    document.title = prevTitle
    setTimeout(() => frame.remove(), 1000)
  }
  if (doc.readyState === 'complete') go()
  else frame.onload = go
}
