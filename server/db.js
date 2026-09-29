'use strict'
// Database layer. Uses MySQL (mysql2) in production.
// DB_CLIENT=sqlite switches to Node's built-in SQLite, used only for local tests.

const TABLES = {
  admins: `
    id {PK},
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at VARCHAR(30) NULL`,
  settings: `
    k VARCHAR(100) NOT NULL PRIMARY KEY,
    v LONGTEXT NULL`,
  menu_items: `
    id {PK},
    parent_id INT NULL,
    label_ar VARCHAR(255) NOT NULL DEFAULT '',
    label_en VARCHAR(255) NOT NULL DEFAULT '',
    url VARCHAR(500) NOT NULL DEFAULT '',
    sort_order INT NOT NULL DEFAULT 0,
    is_visible TINYINT NOT NULL DEFAULT 1,
    extra LONGTEXT NULL`,
  sections: `
    id {PK},
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT '',
    sort_order INT NOT NULL DEFAULT 0,
    is_visible TINYINT NOT NULL DEFAULT 1,
    content LONGTEXT NULL`,
  section_items: `
    id {PK},
    section_id INT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_visible TINYINT NOT NULL DEFAULT 1,
    content LONGTEXT NULL`,
}

function ddl(dialect) {
  const pk = dialect === 'mysql' ? 'INT NOT NULL AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'
  const tail = dialect === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : ''
  return Object.entries(TABLES).map(([name, cols]) =>
    `CREATE TABLE IF NOT EXISTS ${name} (${cols.replace('{PK}', pk)}\n)${tail};`)
}

let impl = null

function norm(v) {
  if (v === undefined) return null
  if (typeof v === 'boolean') return v ? 1 : 0
  return v
}

async function connect() {
  if (impl) return impl
  if (process.env.DB_CLIENT === 'sqlite') {
    const { DatabaseSync } = require('node:sqlite')
    const db = new DatabaseSync(process.env.SQLITE_FILE || ':memory:')
    impl = {
      dialect: 'sqlite',
      async query(sql, params = []) {
        const st = db.prepare(sql)
        const p = params.map(norm)
        if (/^\s*select/i.test(sql)) return st.all(...p).map(r => ({ ...r }))
        const r = st.run(...p)
        return { insertId: Number(r.lastInsertRowid), affectedRows: Number(r.changes) }
      },
      async close() { db.close() },
    }
  } else {
    const mysql = require('mysql2/promise')
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4',
      connectionLimit: Number(process.env.DB_POOL || 5),
      waitForConnections: true,
    })
    impl = {
      dialect: 'mysql',
      async query(sql, params = []) {
        const [rows] = await pool.query(sql, params.map(norm))
        return rows
      },
      async close() { await pool.end() },
    }
  }
  return impl
}

async function query(sql, params) {
  const db = await connect()
  return db.query(sql, params)
}

const parse = (s, fallback = {}) => {
  if (s == null || s === '') return fallback
  if (typeof s === 'object') return s
  try { return JSON.parse(s) } catch { return fallback }
}
const json = v => JSON.stringify(v ?? {})

// Creates tables if missing and fills a brand-new database with the starting content.
async function ensureSchema({ seed = true } = {}) {
  const db = await connect()
  for (const stmt of ddl(db.dialect)) await db.query(stmt)
  if (!seed) return
  const [{ n }] = await db.query('SELECT COUNT(*) AS n FROM sections')
  const [{ m }] = await db.query('SELECT COUNT(*) AS m FROM settings')
  if (Number(n) === 0 && Number(m) === 0) await seedDatabase()
}

async function seedDatabase() {
  const data = require('./seed')
  await query('INSERT INTO settings (k, v) VALUES (?, ?)', ['site', json(data.settings)])

  const insertMenu = async (items, parentId) => {
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      const r = await query(
        'INSERT INTO menu_items (parent_id, label_ar, label_en, url, sort_order, is_visible, extra) VALUES (?, ?, ?, ?, ?, 1, ?)',
        [parentId, it.label.ar, it.label.en, it.url || '', i + 1, json(it.extra || {})])
      if (it.children) await insertMenu(it.children, r.insertId)
    }
  }
  await insertMenu(data.menu, null)

  for (let i = 0; i < data.sections.length; i++) {
    const s = data.sections[i]
    const r = await query('INSERT INTO sections (type, name, sort_order, is_visible, content) VALUES (?, ?, ?, 1, ?)',
      [s.type, s.name, i + 1, json(s.content)])
    for (let j = 0; j < s.items.length; j++) {
      await query('INSERT INTO section_items (section_id, sort_order, is_visible, content) VALUES (?, ?, 1, ?)',
        [r.insertId, j + 1, json(s.items[j])])
    }
  }
}

async function getSetting(k, fallback = null) {
  const rows = await query('SELECT v FROM settings WHERE k = ?', [k])
  return rows.length ? parse(rows[0].v, fallback) : fallback
}

async function setSetting(k, value) {
  const rows = await query('SELECT k FROM settings WHERE k = ?', [k])
  if (rows.length) await query('UPDATE settings SET v = ? WHERE k = ?', [json(value), k])
  else await query('INSERT INTO settings (k, v) VALUES (?, ?)', [k, json(value)])
}

async function close() {
  if (impl) { await impl.close(); impl = null }
}

module.exports = { connect, query, ensureSchema, seedDatabase, getSetting, setSetting, parse, json, ddl, close }
