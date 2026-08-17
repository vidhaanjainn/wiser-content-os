/**
 * WISER OS — Google Sheets backend.
 *
 * SETUP (one time):
 *  1. Create a Google Sheet (any name).
 *  2. Extensions -> Apps Script. Delete the sample code, paste this whole file.
 *  3. Change API_TOKEN below to a long random string (e.g. from a password generator).
 *  4. Deploy -> New deployment -> type "Web app".
 *       Execute as: Me
 *       Who has access: Anyone
 *     Click Deploy, authorize the requested permissions, copy the Web app URL.
 *  5. In the app's .env (or Vercel env vars):
 *       VITE_SHEETS_API_URL   = the Web app URL from step 4
 *       VITE_SHEETS_API_TOKEN = the same string you put in API_TOKEN below
 *
 * Sheet tabs are created automatically on first write/read — nothing to set up
 * in the spreadsheet itself.
 *
 * Re-deploy note: editing this file does NOT update a live deployment. Use
 * Deploy -> Manage deployments -> edit (pencil) -> New version -> Deploy.
 */

const API_TOKEN = 'CHANGE-THIS-TO-A-LONG-RANDOM-STRING'

const SCHEMAS = {
  Deals: [
    'brand', 'agency', 'deliverables', 'amount', 'status', 'payment_days',
    'go_live_date', 'go_live_link', 'due_date',
    'ad_rights_days', 'ad_rights_start', 'ad_rights_end',
    'notes', 'amount_received', 'paid_at', 'tds_ais_status',
    'created_at', 'updated_at',
  ],
  Topics: [
    'title', 'category', 'stage', 'hook', 'notes', 'sort_order', 'posted_date',
    'created_at', 'updated_at',
  ],
  Calendar: [
    'title', 'item_date', 'type', 'notes', 'created_at',
  ],
  Stats: [
    'stat_date', 'followers', 'reel_views', 'saves',
    'wisermoney_visits', 'wisermoney_profiles', 'wisermoney_calls', 'created_at',
  ],
}

function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(name)
  if (!sheet) {
    sheet = ss.insertSheet(name)
    sheet.appendRow(['id'].concat(SCHEMAS[name]))
    sheet.setFrozenRows(1)
  }
  return sheet
}

function headers_(name) {
  return ['id'].concat(SCHEMAS[name])
}

function rowToObj_(headers, row) {
  const obj = {}
  headers.forEach((h, i) => {
    const v = row[i]
    obj[h] = (v === '' || v === undefined) ? null : v
  })
  return obj
}

function readAll_(name) {
  const sheet = getSheet_(name)
  const values = sheet.getDataRange().getValues()
  if (values.length < 2) return []
  const headers = values[0]
  return values.slice(1)
    .filter(row => row[0] !== '')
    .map(row => rowToObj_(headers, row))
}

function findRowIndex_(sheet, id) {
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return -1
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2
  }
  return -1
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

function doGet(e) {
  const p = e.parameter
  if (p.token !== API_TOKEN) return json_({ error: 'unauthorized' })
  const name = p.sheet
  if (!SCHEMAS[name]) return json_({ error: 'unknown sheet' })
  return json_({ data: readAll_(name) })
}

function doPost(e) {
  const lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    const body = JSON.parse(e.postData.contents)
    if (body.token !== API_TOKEN) return json_({ error: 'unauthorized' })
    const name = body.sheet
    if (!SCHEMAS[name]) return json_({ error: 'unknown sheet' })

    const sheet = getSheet_(name)
    const fields = SCHEMAS[name]
    const headers = headers_(name)
    const now = new Date().toISOString()

    if (body.action === 'insert') {
      const id = body.id || Utilities.getUuid()
      const data = Object.assign({}, body.data, { created_at: now, updated_at: now })
      const row = [id].concat(fields.map(f => data[f] === undefined || data[f] === null ? '' : data[f]))
      sheet.appendRow(row)
      return json_({ data: Object.assign({ id: id }, data) })
    }

    if (body.action === 'update') {
      const idx = findRowIndex_(sheet, body.id)
      if (idx === -1) return json_({ error: 'not found' })
      const current = rowToObj_(headers, sheet.getRange(idx, 1, 1, headers.length).getValues()[0])
      const updated = Object.assign({}, current, body.data, { updated_at: now })
      const row = [updated.id].concat(fields.map(f => updated[f] === undefined || updated[f] === null ? '' : updated[f]))
      sheet.getRange(idx, 1, 1, row.length).setValues([row])
      return json_({ data: updated })
    }

    if (body.action === 'delete') {
      const idx = findRowIndex_(sheet, body.id)
      if (idx === -1) return json_({ error: 'not found' })
      sheet.deleteRow(idx)
      return json_({ ok: true })
    }

    if (body.action === 'upsert') {
      const keyField = body.keyField
      const keyValue = body.data[keyField]
      const all = readAll_(name)
      const existing = all.filter(function (r) { return String(r[keyField]) === String(keyValue) })[0]
      if (existing) {
        const idx = findRowIndex_(sheet, existing.id)
        const updated = Object.assign({}, existing, body.data, { updated_at: now })
        const row = [updated.id].concat(fields.map(f => updated[f] === undefined || updated[f] === null ? '' : updated[f]))
        sheet.getRange(idx, 1, 1, row.length).setValues([row])
        return json_({ data: updated })
      }
      const id = body.id || Utilities.getUuid()
      const data = Object.assign({}, body.data, { created_at: now })
      const row = [id].concat(fields.map(f => data[f] === undefined || data[f] === null ? '' : data[f]))
      sheet.appendRow(row)
      return json_({ data: Object.assign({ id: id }, data) })
    }

    return json_({ error: 'unknown action' })
  } finally {
    lock.releaseLock()
  }
}
