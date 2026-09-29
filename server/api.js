'use strict'
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const db = require('./db')
const auth = require('./auth')

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads')
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

// ── helpers ────────────────────────────────────────────────────────────────
const str = (v, max = 500) => String(v ?? '').slice(0, max)
const bool = v => v === true || v === 1 || v === '1' || v === 'true'
const int = v => {
  const n = Number(v)
  if (!Number.isInteger(n)) throw new HttpError(400, 'رقم غير صالح')
  return n
}
function obj(v, name = 'content') {
  if (v == null) return {}
  if (typeof v !== 'object' || Array.isArray(v)) throw new HttpError(400, `${name} يجب أن يكون كائن JSON`)
  if (JSON.stringify(v).length > 512 * 1024) throw new HttpError(413, `${name} كبير جدًا`)
  return v
}
const ids = v => {
  if (!Array.isArray(v) || v.length > 500) throw new HttpError(400, 'قائمة الترتيب غير صالحة')
  return v.map(int)
}

const menuRow = r => ({
  id: r.id, parent_id: r.parent_id == null ? null : Number(r.parent_id),
  label_ar: r.label_ar, label_en: r.label_en, url: r.url,
  sort_order: Number(r.sort_order), is_visible: !!Number(r.is_visible), extra: db.parse(r.extra),
})
const sectionRow = r => ({
  id: r.id, type: r.type, name: r.name, sort_order: Number(r.sort_order),
  is_visible: !!Number(r.is_visible), content: db.parse(r.content),
})
const itemRow = r => ({
  id: r.id, section_id: Number(r.section_id), sort_order: Number(r.sort_order),
  is_visible: !!Number(r.is_visible), content: db.parse(r.content),
})

async function mustFind(table, id, label) {
  const rows = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [id])
  if (!rows.length) throw new HttpError(404, `${label} غير موجود`)
  return rows[0]
}

async function menuDepth(id) {
  let depth = 0, cur = id
  while (cur != null && depth < 10) {
    const rows = await db.query('SELECT parent_id FROM menu_items WHERE id = ?', [cur])
    if (!rows.length) break
    depth++
    cur = rows[0].parent_id
  }
  return depth
}

async function deleteMenuTree(id) {
  const kids = await db.query('SELECT id FROM menu_items WHERE parent_id = ?', [id])
  for (const k of kids) await deleteMenuTree(k.id)
  await db.query('DELETE FROM menu_items WHERE id = ?', [id])
}

async function nextOrder(table, where = '', params = []) {
  const [{ m }] = await db.query(`SELECT COALESCE(MAX(sort_order), 0) AS m FROM ${table} ${where}`, params)
  return Number(m) + 1
}

async function applyOrder(table, list, scopeCol, scopeVal) {
  for (let i = 0; i < list.length; i++) {
    if (scopeCol) {
      const sql = scopeVal == null
        ? `UPDATE ${table} SET sort_order = ? WHERE id = ? AND ${scopeCol} IS NULL`
        : `UPDATE ${table} SET sort_order = ? WHERE id = ? AND ${scopeCol} = ?`
      await db.query(sql, scopeVal == null ? [i + 1, list[i]] : [i + 1, list[i], scopeVal])
    } else {
      await db.query(`UPDATE ${table} SET sort_order = ? WHERE id = ?`, [i + 1, list[i]])
    }
  }
}

function buildTree(rows) {
  const byParent = new Map()
  for (const r of rows) {
    const k = r.parent_id ?? 0
    if (!byParent.has(k)) byParent.set(k, [])
    byParent.get(k).push(r)
  }
  const walk = pid => (byParent.get(pid) || [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(r => ({ ...r, children: walk(r.id) }))
  return walk(0)
}

// ── routes ─────────────────────────────────────────────────────────────────
const routes = []
const route = (method, pattern, handler, opts = {}) => {
  const keys = []
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '(\\d+)' }) + '$')
  routes.push({ method, re, keys, handler, auth: pattern.startsWith('/api/admin'), limit: opts.limit || 1024 * 1024 })
}

// Public: everything the website needs in one request
route('GET', '/api/site', async () => {
  const settings = await db.getSetting('site', {})
  const menuRows = (await db.query('SELECT * FROM menu_items WHERE is_visible = 1')).map(menuRow)
  const sections = (await db.query('SELECT * FROM sections WHERE is_visible = 1 ORDER BY sort_order, id')).map(sectionRow)
  const items = (await db.query('SELECT * FROM section_items WHERE is_visible = 1 ORDER BY sort_order, id')).map(itemRow)
  for (const s of sections) s.items = items.filter(i => i.section_id === s.id)
  // buildTree drops children whose parent is hidden, because hidden parents are not in the list
  return { settings, menu: buildTree(menuRows), sections }
})

// Auth
route('GET', '/api/auth/status', async ({ user }) => {
  const [{ n }] = await db.query('SELECT COUNT(*) AS n FROM admins')
  return { needsSetup: Number(n) === 0, user }
})

route('POST', '/api/auth/setup', async ({ body }) => {
  const [{ n }] = await db.query('SELECT COUNT(*) AS n FROM admins')
  if (Number(n) > 0) throw new HttpError(403, 'تم إنشاء حساب المدير بالفعل')
  const username = str(body.username, 100).trim()
  const password = str(body.password, 200)
  if (username.length < 3) throw new HttpError(400, 'اسم المستخدم 3 أحرف على الأقل')
  if (password.length < 8) throw new HttpError(400, 'كلمة المرور 8 أحرف على الأقل')
  const r = await db.query('INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)',
    [username, auth.hashPassword(password), new Date().toISOString()])
  const user = { id: r.insertId, username }
  return { token: await auth.signToken(user), user }
})

route('POST', '/api/auth/login', async ({ body, ip }) => {
  if (auth.tooManyAttempts(ip)) throw new HttpError(429, 'محاولات كثيرة، حاول بعد 15 دقيقة')
  const rows = await db.query('SELECT * FROM admins WHERE username = ?', [str(body.username, 100).trim()])
  if (!rows.length || !auth.verifyPassword(str(body.password, 200), rows[0].password_hash)) {
    auth.recordFailure(ip)
    throw new HttpError(401, 'اسم المستخدم أو كلمة المرور غير صحيحة')
  }
  auth.clearFailures(ip)
  const user = { id: rows[0].id, username: rows[0].username }
  return { token: await auth.signToken(user), user }
})

// Admin: menu
route('GET', '/api/admin/menu', async () =>
  (await db.query('SELECT * FROM menu_items ORDER BY sort_order, id')).map(menuRow))

route('POST', '/api/admin/menu', async ({ body }) => {
  const parentId = body.parent_id == null || body.parent_id === '' ? null : int(body.parent_id)
  if (parentId != null) {
    await mustFind('menu_items', parentId, 'العنصر الأب')
    if (await menuDepth(parentId) >= 3) throw new HttpError(400, 'المنيو يدعم 3 مستويات فقط')
  }
  const order = await nextOrder('menu_items', parentId == null ? 'WHERE parent_id IS NULL' : 'WHERE parent_id = ?', parentId == null ? [] : [parentId])
  const r = await db.query(
    'INSERT INTO menu_items (parent_id, label_ar, label_en, url, sort_order, is_visible, extra) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [parentId, str(body.label_ar, 255), str(body.label_en, 255), str(body.url, 500), order,
      body.is_visible === undefined ? 1 : bool(body.is_visible), db.json(obj(body.extra, 'extra'))])
  return menuRow(await mustFind('menu_items', r.insertId, 'العنصر'))
})

route('PUT', '/api/admin/menu/:id', async ({ params, body }) => {
  const id = int(params.id)
  const cur = menuRow(await mustFind('menu_items', id, 'العنصر'))
  await db.query('UPDATE menu_items SET label_ar = ?, label_en = ?, url = ?, is_visible = ?, extra = ? WHERE id = ?', [
    body.label_ar !== undefined ? str(body.label_ar, 255) : cur.label_ar,
    body.label_en !== undefined ? str(body.label_en, 255) : cur.label_en,
    body.url !== undefined ? str(body.url, 500) : cur.url,
    body.is_visible !== undefined ? bool(body.is_visible) : cur.is_visible,
    db.json(body.extra !== undefined ? obj(body.extra, 'extra') : cur.extra), id])
  return menuRow(await mustFind('menu_items', id, 'العنصر'))
})

route('DELETE', '/api/admin/menu/:id', async ({ params }) => {
  const id = int(params.id)
  await mustFind('menu_items', id, 'العنصر')
  await deleteMenuTree(id)
  return { ok: true }
})

route('POST', '/api/admin/menu/reorder', async ({ body }) => {
  const parentId = body.parent_id == null || body.parent_id === '' ? null : int(body.parent_id)
  await applyOrder('menu_items', ids(body.ids), 'parent_id', parentId)
  return { ok: true }
})

// Admin: sections
route('GET', '/api/admin/sections', async () => {
  const sections = (await db.query('SELECT * FROM sections ORDER BY sort_order, id')).map(sectionRow)
  const counts = await db.query('SELECT section_id, COUNT(*) AS n FROM section_items GROUP BY section_id')
  const byId = new Map(counts.map(c => [Number(c.section_id), Number(c.n)]))
  return sections.map(s => ({ ...s, item_count: byId.get(s.id) || 0 }))
})

route('POST', '/api/admin/sections', async ({ body }) => {
  const type = str(body.type, 50)
  if (!/^[a-z_]+$/.test(type)) throw new HttpError(400, 'نوع القسم غير صالح')
  const order = await nextOrder('sections')
  const r = await db.query('INSERT INTO sections (type, name, sort_order, is_visible, content) VALUES (?, ?, ?, ?, ?)',
    [type, str(body.name, 255), order, body.is_visible === undefined ? 1 : bool(body.is_visible), db.json(obj(body.content))])
  const items = Array.isArray(body.items) ? body.items.slice(0, 50) : []
  for (let i = 0; i < items.length; i++) {
    await db.query('INSERT INTO section_items (section_id, sort_order, is_visible, content) VALUES (?, ?, 1, ?)',
      [r.insertId, i + 1, db.json(obj(items[i]))])
  }
  return sectionRow(await mustFind('sections', r.insertId, 'القسم'))
})

route('GET', '/api/admin/sections/:id', async ({ params }) => {
  const id = int(params.id)
  const section = sectionRow(await mustFind('sections', id, 'القسم'))
  const items = (await db.query('SELECT * FROM section_items WHERE section_id = ? ORDER BY sort_order, id', [id])).map(itemRow)
  return { ...section, items }
})

route('PUT', '/api/admin/sections/:id', async ({ params, body }) => {
  const id = int(params.id)
  const cur = sectionRow(await mustFind('sections', id, 'القسم'))
  await db.query('UPDATE sections SET name = ?, is_visible = ?, content = ? WHERE id = ?', [
    body.name !== undefined ? str(body.name, 255) : cur.name,
    body.is_visible !== undefined ? bool(body.is_visible) : cur.is_visible,
    db.json(body.content !== undefined ? obj(body.content) : cur.content), id])
  return sectionRow(await mustFind('sections', id, 'القسم'))
})

route('DELETE', '/api/admin/sections/:id', async ({ params }) => {
  const id = int(params.id)
  await mustFind('sections', id, 'القسم')
  await db.query('DELETE FROM section_items WHERE section_id = ?', [id])
  await db.query('DELETE FROM sections WHERE id = ?', [id])
  return { ok: true }
})

route('POST', '/api/admin/sections/reorder', async ({ body }) => {
  await applyOrder('sections', ids(body.ids))
  return { ok: true }
})

route('POST', '/api/admin/sections/:id/duplicate', async ({ params }) => {
  const id = int(params.id)
  const s = sectionRow(await mustFind('sections', id, 'القسم'))
  const items = (await db.query('SELECT * FROM section_items WHERE section_id = ? ORDER BY sort_order, id', [id])).map(itemRow)
  const content = { ...s.content, anchor: s.content.anchor ? `${s.content.anchor}-2` : '' }
  const r = await db.query('INSERT INTO sections (type, name, sort_order, is_visible, content) VALUES (?, ?, ?, 0, ?)',
    [s.type, `${s.name} (نسخة)`, await nextOrder('sections'), db.json(content)])
  for (const it of items) {
    await db.query('INSERT INTO section_items (section_id, sort_order, is_visible, content) VALUES (?, ?, ?, ?)',
      [r.insertId, it.sort_order, it.is_visible, db.json(it.content)])
  }
  return sectionRow(await mustFind('sections', r.insertId, 'القسم'))
})

// Admin: section items
route('POST', '/api/admin/sections/:id/items', async ({ params, body }) => {
  const sid = int(params.id)
  await mustFind('sections', sid, 'القسم')
  const r = await db.query('INSERT INTO section_items (section_id, sort_order, is_visible, content) VALUES (?, ?, ?, ?)',
    [sid, await nextOrder('section_items', 'WHERE section_id = ?', [sid]),
      body.is_visible === undefined ? 1 : bool(body.is_visible), db.json(obj(body.content))])
  return itemRow(await mustFind('section_items', r.insertId, 'العنصر'))
})

route('POST', '/api/admin/sections/:id/items/reorder', async ({ params, body }) => {
  await applyOrder('section_items', ids(body.ids), 'section_id', int(params.id))
  return { ok: true }
})

route('PUT', '/api/admin/items/:id', async ({ params, body }) => {
  const id = int(params.id)
  const cur = itemRow(await mustFind('section_items', id, 'العنصر'))
  await db.query('UPDATE section_items SET is_visible = ?, content = ? WHERE id = ?', [
    body.is_visible !== undefined ? bool(body.is_visible) : cur.is_visible,
    db.json(body.content !== undefined ? obj(body.content) : cur.content), id])
  return itemRow(await mustFind('section_items', id, 'العنصر'))
})

route('DELETE', '/api/admin/items/:id', async ({ params }) => {
  const id = int(params.id)
  await mustFind('section_items', id, 'العنصر')
  await db.query('DELETE FROM section_items WHERE id = ?', [id])
  return { ok: true }
})

// Admin: site settings
route('GET', '/api/admin/settings', async () => db.getSetting('site', {}))
route('PUT', '/api/admin/settings', async ({ body }) => {
  await db.setSetting('site', obj(body, 'settings'))
  return db.getSetting('site', {})
})

// Admin: uploads (images sent as base64 data URLs)
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }
route('POST', '/api/admin/upload', async ({ body }) => {
  const m = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/.exec(str(body.data, 8 * 1024 * 1024))
  if (!m) throw new HttpError(400, 'الملف لازم يكون صورة PNG أو JPG أو WEBP أو GIF')
  const buf = Buffer.from(m[2], 'base64')
  if (buf.length > MAX_UPLOAD_BYTES) throw new HttpError(413, 'أقصى حجم للصورة 5 ميجا')
  const base = str(body.filename, 80).replace(/\.[^.]*$/, '').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'image'
  const name = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}-${base}.${EXT[m[1]]}`
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf)
  return { url: `/uploads/${name}` }
}, { limit: 8 * 1024 * 1024 })

route('GET', '/api/admin/uploads', async () => {
  if (!fs.existsSync(UPLOAD_DIR)) return []
  return fs.readdirSync(UPLOAD_DIR)
    .filter(f => /\.(png|jpe?g|webp|gif)$/i.test(f))
    .map(f => ({ url: `/uploads/${f}`, mtime: fs.statSync(path.join(UPLOAD_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
})

// Admin: accounts
route('GET', '/api/admin/admins', async () =>
  db.query('SELECT id, username, created_at FROM admins ORDER BY id'))

route('POST', '/api/admin/admins', async ({ body }) => {
  const username = str(body.username, 100).trim()
  const password = str(body.password, 200)
  if (username.length < 3) throw new HttpError(400, 'اسم المستخدم 3 أحرف على الأقل')
  if (password.length < 8) throw new HttpError(400, 'كلمة المرور 8 أحرف على الأقل')
  if ((await db.query('SELECT id FROM admins WHERE username = ?', [username])).length) throw new HttpError(409, 'اسم المستخدم موجود بالفعل')
  const r = await db.query('INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)',
    [username, auth.hashPassword(password), new Date().toISOString()])
  return { id: r.insertId, username }
})

route('DELETE', '/api/admin/admins/:id', async ({ params, user }) => {
  const id = int(params.id)
  if (id === user.id) throw new HttpError(400, 'لا يمكنك حذف حسابك الحالي')
  await mustFind('admins', id, 'الحساب')
  await db.query('DELETE FROM admins WHERE id = ?', [id])
  return { ok: true }
})

route('PUT', '/api/admin/password', async ({ body, user }) => {
  const rows = await db.query('SELECT * FROM admins WHERE id = ?', [user.id])
  if (!auth.verifyPassword(str(body.current, 200), rows[0].password_hash)) throw new HttpError(400, 'كلمة المرور الحالية غير صحيحة')
  const pw = str(body.password, 200)
  if (pw.length < 8) throw new HttpError(400, 'كلمة المرور الجديدة 8 أحرف على الأقل')
  await db.query('UPDATE admins SET password_hash = ? WHERE id = ?', [auth.hashPassword(pw), user.id])
  return { ok: true }
})

// ── dispatcher ─────────────────────────────────────────────────────────────
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', c => {
      size += c.length
      if (size > limit) { reject(new HttpError(413, 'حجم الطلب كبير جدًا')); req.destroy(); return }
      chunks.push(c)
    })
    req.on('end', () => {
      if (!chunks.length) return resolve({})
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) } catch { reject(new HttpError(400, 'JSON غير صالح')) }
    })
    req.on('error', reject)
  })
}

async function handleApi(req, res, pathname) {
  const send = (status, data) => {
    const body = JSON.stringify(data)
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
    res.end(body)
  }
  try {
    const matches = routes.filter(r => r.re.test(pathname))
    if (!matches.length) throw new HttpError(404, 'المسار غير موجود')
    const r = matches.find(x => x.method === req.method)
    if (!r) throw new HttpError(405, 'Method not allowed')
    const m = r.re.exec(pathname)
    const params = Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1]]))
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    const user = await auth.verifyToken(token)
    if (r.auth && !user) throw new HttpError(401, 'يجب تسجيل الدخول')
    const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await readBody(req, r.limit) : {}
    if (typeof body !== 'object' || body === null) throw new HttpError(400, 'JSON غير صالح')
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim()
    send(200, await r.handler({ req, params, body, user, ip }))
  } catch (err) {
    if (err instanceof HttpError) return send(err.status, { error: err.message })
    console.error(err)
    send(500, { error: 'خطأ في السيرفر' })
  }
}

module.exports = { handleApi, HttpError, UPLOAD_DIR }
