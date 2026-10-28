import { useState, useEffect } from 'react'
import { useContent } from '../hooks/useContent'
import { Card, SectionHeader, Badge, Btn, Spinner, Empty } from '../components/UI'
import { pushState, enablePush, disablePush, testPush } from '../lib/push'

const ago = iso => {
  if (!iso) return ''
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.round(m / 60)}h ago`
  return `${Math.round(m / 1440)}d ago`
}
const n = v => (v == null ? '–' : Number(v).toLocaleString('en-IN'))
const VERDICT = { 'DOUBLE DOWN': 'lime', ok: 'neutral', ramping: 'blue', weak: 'red' }

function Stamp({ snap }) {
  return snap ? <span className="today-stamp">updated {ago(snap.updated_at)}</span> : null
}
const Missing = ({ text }) => <div className="today-missing">{text}</div>

function Notify({ showToast }) {
  const [st, setSt] = useState('…')
  const [busy, setBusy] = useState(false)
  useEffect(() => { pushState().then(setSt) }, [])
  async function turnOn() {
    setBusy(true)
    try { await enablePush(); setSt('on'); const r = await testPush(); showToast(r.sent ? 'Notifications on — test sent' : 'Subscribed') }
    catch (e) { showToast(e.message || 'Could not enable'); setSt(await pushState()) }
    setBusy(false)
  }
  async function turnOff() { await disablePush(); setSt('off'); showToast('Notifications off on this device') }
  const msg = {
    on: 'Updates and urgent alerts reach this device.',
    off: 'Turn on to get every update and urgent alert on this device.',
    denied: 'Blocked in system settings. Allow notifications for Wiser OS, then reload.',
    unsupported: 'This browser cannot do push notifications.',
    'ios-install': 'On iPhone: Share → Add to Home Screen, open Wiser OS from the icon, then turn this on.',
  }[st] || ''
  return (
    <Card className="card-pad today-notify">
      <div className="today-row">
        <div>
          <div className="today-h">🔔 Notifications <Badge type={st === 'on' ? 'green' : 'neutral'}>{st === 'on' ? 'On' : 'Off'}</Badge></div>
          <div className="today-sub">{msg}</div>
        </div>
        {st === 'off' && <Btn size="sm" onClick={turnOn} disabled={busy}>Turn on</Btn>}
        {st === 'on' && <div className="today-btns"><Btn size="sm" variant="ghost" onClick={async () => { const r = await testPush(); showToast(`Test sent to ${r.sent} device(s)`) }}>Test</Btn><Btn size="sm" variant="ghost" onClick={turnOff}>Off</Btn></div>}
      </div>
    </Card>
  )
}

function Picks({ snap }) {
  const d = snap?.data
  return (
    <>
      <SectionHeader title="Today's picks" action={<Stamp snap={snap} />} />
      {!d?.picks?.length ? <Missing text="No menu yet — it lands with the daily script menu." /> : (
        <Card className="card-pad">
          {d.date && <div className="today-sub" style={{ marginBottom: 10 }}>Menu {d.date}{d.total ? ` · ${d.total} candidates` : ''}</div>}
          {d.picks.map((p, i) => (
            <div key={p.code || i} className="today-item">
              <div className="today-row"><b>{p.code} · {p.title}</b><Badge type="lime">{p.score ?? '–'}/10</Badge></div>
              <div className="today-sub">{p.format}{p.ready ? ` · ${p.ready}` : ''}</div>
              {p.hook && <div className="today-hook">“{p.hook}”</div>}
            </div>
          ))}
        </Card>
      )}
    </>
  )
}

function Reels({ snap }) {
  const d = snap?.data
  return (
    <>
      <SectionHeader title="Reel stats" action={<Stamp snap={snap} />} />
      {!d ? <Missing text="Waiting for the first stats run." /> : (
        <>
          <div className="grid3">
            <Card className="card-pad"><div className="label">Instagram</div><div className="today-big">{d.followers?.ig_raw || n(d.followers?.ig)}</div></Card>
            <Card className="card-pad"><div className="label">YouTube</div><div className="today-big">{d.followers?.yt_raw || n(d.followers?.yt)}</div></Card>
            <Card className="card-pad"><div className="label">Median views</div><div className="today-big">{n(d.median)}</div></Card>
          </div>
          <Card className="card-pad" style={{ marginTop: 12 }}>
            {(d.reels || []).slice(0, 6).map((r, i) => (
              <div key={i} className="today-item">
                <div className="today-row">
                  <a href={r.url} target="_blank" rel="noreferrer" className="today-link">{r.title}</a>
                  <Badge type={VERDICT[r.verdict] || 'neutral'}>{r.verdict}</Badge>
                </div>
                <div className="today-sub">{n(r.views)} views · {r.x}x median · saves {r.saves}% · shares {r.shares}% · {r.posted}</div>
              </div>
            ))}
          </Card>
          {d.doubleDown?.length > 0 && (
            <Card className="card-pad" style={{ marginTop: 12 }}>
              <div className="label">Double down</div>
              {d.doubleDown.map((t, i) => <div key={i} className="today-line">→ {t}</div>)}
              {d.fix?.length > 0 && <><div className="label" style={{ marginTop: 12 }}>Fix</div>{d.fix.map((t, i) => <div key={i} className="today-line">→ {t}</div>)}</>}
            </Card>
          )}
        </>
      )}
    </>
  )
}

function Queue({ snap }) {
  const d = snap?.data
  return (
    <>
      <SectionHeader title="Posted vs waiting" action={<Stamp snap={snap} />} />
      {!d ? <Missing text="Queue view appears after the first stats run." /> : (
        <Card className="card-pad">
          <div className="today-row"><span>Buffer slots used</span><Badge type="blue">{d.slotsUsed ?? '–'} / {d.slotsTotal ?? 10}</Badge></div>
          {d.errors > 0 && <div className="today-line" style={{ color: 'var(--red)' }}>{d.errors} errored post(s) — check Buffer.</div>}
          {(d.waiting || []).map((w, i) => (
            <div key={i} className="today-item"><div className="today-row"><span>{w.title}</span><Badge type="amber">{w.status}</Badge></div>
              <div className="today-sub">{w.platform}{w.age ? ` · ${w.age}` : ''}</div></div>
          ))}
          {!d.waiting?.length && <div className="today-sub" style={{ marginTop: 8 }}>Nothing waiting.</div>}
          {d.next?.length > 0 && <><div className="label" style={{ marginTop: 12 }}>Post next</div>{d.next.map((t, i) => <div key={i} className="today-line">→ {t}</div>)}</>}
        </Card>
      )}
    </>
  )
}

function Radar({ snap }) {
  const d = snap?.data
  const lane = (title, items) => items?.length > 0 && (
    <>
      <div className="label" style={{ margin: '12px 0 6px' }}>{title}</div>
      {items.map((x, i) => (
        <div key={i} className="today-item">
          <div className="today-row"><b>{x.title}</b>{x.window && <Badge type="amber">{x.window}</Badge>}</div>
          {x.why && <div className="today-sub">{x.why}</div>}
          {x.angle && <div className="today-hook">{x.angle}</div>}
        </div>
      ))}
    </>
  )
  return (
    <>
      <SectionHeader title="Topic radar" action={<Stamp snap={snap} />} />
      {!d ? <Missing text="Radar digest not pushed yet." /> : (
        <Card className="card-pad">
          {lane('Now', d.now)}{lane('Evergreen', d.evergreen)}{lane('Calendar', d.calendar)}
        </Card>
      )}
    </>
  )
}

function Inbox({ snap }) {
  const d = snap?.data
  return (
    <>
      <SectionHeader title="Inbox" action={<Stamp snap={snap} />} />
      {!d ? <Missing text="No inbox status yet." /> : (
        <div className="grid3">
          <Card className="card-pad"><div className="label">Voice waiting</div><div className="today-big">{d.voice_waiting ?? 0}</div></Card>
          <Card className="card-pad"><div className="label">Raw waiting</div><div className="today-big">{d.raw_waiting ?? 0}</div></Card>
          <Card className="card-pad"><div className="label">Failed</div><div className="today-big" style={{ color: d.failed ? 'var(--red)' : undefined }}>{d.failed ?? 0}</div></Card>
          {d.digest && <Card className="card-pad" style={{ gridColumn: '1 / -1' }}><div className="today-sub">Last reel digest {d.digest.date}: {d.digest.reels} reel(s){d.digest.tags ? ' · ' + Object.entries(d.digest.tags).map(([k, v]) => `${k} ${v}`).join(', ') : ''}</div></Card>}
          {d.disk_gb != null && <Card className="card-pad" style={{ gridColumn: '1 / -1' }}><div className="today-sub">Mac free disk: <b style={{ color: d.disk_gb < 15 ? 'var(--amber)' : undefined }}>{d.disk_gb} GB</b></div></Card>}
        </div>
      )}
    </>
  )
}

function Health({ snap }) {
  const d = snap?.data
  return (
    <>
      <SectionHeader title="Pipeline health" action={<Stamp snap={snap} />} />
      {!d?.tasks?.length ? <Missing text="Task health appears after the first runs." /> : (
        <Card className="card-pad">
          {d.tasks.map((t, i) => {
            const stale = t.last_ok_at && Date.now() - new Date(t.last_ok_at).getTime() > 36 * 3600 * 1000
            return (
              <div key={i} className="today-item">
                <div className="today-row"><span>{t.name}</span><Badge type={t.status === 'fail' ? 'red' : stale ? 'amber' : 'green'}>{t.status === 'fail' ? 'failed' : stale ? 'stale' : 'ok'}</Badge></div>
                <div className="today-sub">{t.schedule} · last ok {ago(t.last_ok_at)}{t.note ? ` · ${t.note}` : ''}</div>
              </div>
            )
          })}
        </Card>
      )}
    </>
  )
}

function Feed({ feed, markRead }) {
  return (
    <>
      <SectionHeader title="Activity" action={feed.some(f => !f.read) ? <Btn size="sm" variant="ghost" onClick={() => markRead()}>Mark all read</Btn> : null} />
      {!feed.length ? <Empty icon="🔕" text="No notifications yet." /> : (
        <Card className="card-pad">
          {feed.map(f => (
            <div key={f.id} className={`today-item${f.read ? ' read' : ''}`} onClick={() => !f.read && markRead(f.id)}>
              <div className="today-row">
                <b>{f.urgency === 'urgent' ? '🔴 ' : ''}{f.title}</b>
                <span className="today-sub">{ago(f.created_at)}</span>
              </div>
              {f.body && <div className="today-sub">{f.body}</div>}
            </div>
          ))}
        </Card>
      )}
    </>
  )
}

export default function Today({ showToast }) {
  const { snapshots: s, feed, loading, error, markRead } = useContent()
  if (loading) return <div className="scroll-area"><Spinner /></div>
  const urgent = feed.filter(f => f.urgency === 'urgent' && !f.read)
  return (
    <div className="scroll-area page-enter">
      {error && <div className="today-missing">Can’t reach the server — showing the last data.</div>}
      <Notify showToast={showToast} />
      {urgent.length > 0 && (
        <Card className="card-pad today-urgent">
          <div className="label" style={{ color: 'var(--red)' }}>Needs attention</div>
          {urgent.map(u => <div key={u.id} className="today-item" onClick={() => markRead(u.id)}><b>{u.title}</b>{u.body && <div className="today-sub">{u.body}</div>}</div>)}
        </Card>
      )}
      <Picks snap={s.menu} />
      <Reels snap={s.stats} />
      <Queue snap={s.queue} />
      <Radar snap={s.radar} />
      <Inbox snap={s.inbox} />
      <Health snap={s.health} />
      <Feed feed={feed} markRead={markRead} />
    </div>
  )
}
