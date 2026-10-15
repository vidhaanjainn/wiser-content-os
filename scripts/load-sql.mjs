// Usage: DATABASE_URL=... node scripts/load-sql.mjs neon-schema.sql [more.sql ...]
// Runs each statement of the given files, one at a time, over Neon's HTTP driver.
import { readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

for (const file of process.argv.slice(2)) {
  const text = readFileSync(file, 'utf8').replace(/^\s*--.*$/gm, '')
  const statements = text.split(/;\s*(?:\r?\n|$)/).map(s => s.trim()).filter(Boolean)
  for (const stmt of statements) await sql.query(stmt)
  console.log(`${file}: ${statements.length} statements ok`)
}
