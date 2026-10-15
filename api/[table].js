import { neon } from '@neondatabase/serverless'

// One serverless function for all four tables: /api/deals, /api/topics, /api/calendar, /api/stats
const TABLES = {
  deals:    { table: 'deals',          order: 'created_at desc' },
  topics:   { table: 'topics',         order: 'sort_order' },
  calendar: { table: 'calendar_items', order: 'item_date' },
  stats:    { table: 'perf_stats',     order: 'stat_date desc', limit: 10, upsertOn: 'stat_date' },
}

let _sql
const sql = () => (_sql ??= neon(process.env.DATABASE_URL))

// Column metadata comes from the DB itself, so unknown keys in a request body are dropped
// and date/numeric columns come back in the same shape Supabase's REST API returned
// ('YYYY-MM-DD' strings and JSON numbers).
const colCache = {}
async function columns(table) {
  colCache[table] ??= await sql().query(
    `select column_name, data_type from information_schema.columns
     where table_schema = 'public' and table_name = $1 order by ordinal_position`,
    [table],
  )
  return colCache[table]
}

const q = name => `"${name}"`

function selectList(cols) {
  return cols.map(({ column_name: c, data_type: t }) => {
    if (t === 'date') return `to_char(${q(c)}, 'YYYY-MM-DD') as ${q(c)}`
    if (t === 'numeric') return `${q(c)}::float8 as ${q(c)}`
    return q(c)
  }).join(', ')
}

function pick(body, cols) {
  const names = new Set(cols.map(c => c.column_name))
  return Object.entries(body || {}).filter(([k]) => k !== 'id' && names.has(k))
}

export default async function handler(req, res) {
  const cfg = TABLES[req.query.table]
  if (!cfg) return res.status(404).json({ error: 'Unknown resource' })

  try {
    const cols = await columns(cfg.table)
    const list = selectList(cols)
    const id = req.query.id
    const t = q(cfg.table)

    if (req.method === 'GET') {
      const rows = await sql().query(
        `select ${list} from ${t} order by ${cfg.order}${cfg.limit ? ` limit ${cfg.limit}` : ''}`,
      )
      return res.status(200).json(rows)
    }

    if (req.method === 'POST') {
      const entries = pick(req.body, cols)
      if (!entries.length) return res.status(400).json({ error: 'Empty body' })
      const names = entries.map(([k]) => q(k)).join(', ')
      const slots = entries.map((_, i) => `$${i + 1}`).join(', ')
      let conflict = ''
      if (cfg.upsertOn) {
        const sets = entries.filter(([k]) => k !== cfg.upsertOn).map(([k]) => `${q(k)} = excluded.${q(k)}`)
        conflict = sets.length
          ? ` on conflict (${q(cfg.upsertOn)}) do update set ${sets.join(', ')}`
          : ` on conflict (${q(cfg.upsertOn)}) do nothing`
      }
      const rows = await sql().query(
        `insert into ${t} (${names}) values (${slots})${conflict} returning ${list}`,
        entries.map(([, v]) => v),
      )
      return res.status(200).json(rows[0] ?? null)
    }

    if (req.method === 'PATCH') {
      if (!id) return res.status(400).json({ error: 'id required' })
      const entries = pick(req.body, cols)
      const hasUpdatedAt = cols.some(c => c.column_name === 'updated_at')
      const sets = entries.map(([k], i) => `${q(k)} = $${i + 1}`)
      if (hasUpdatedAt) sets.push('"updated_at" = now()')
      if (!sets.length) return res.status(400).json({ error: 'Nothing to update' })
      const rows = await sql().query(
        `update ${t} set ${sets.join(', ')} where id = $${entries.length + 1} returning ${list}`,
        [...entries.map(([, v]) => v), id],
      )
      return res.status(200).json(rows[0] ?? null)
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id required' })
      await sql().query(`delete from ${t} where id = $1`, [id])
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error(`[api/${req.query.table}]`, err)
    return res.status(500).json({ error: 'Database error' })
  }
}
