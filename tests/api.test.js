// API tests for the PHP backend. Run with: npm test
// Starts PHP's built-in server with SQLite (instead of MySQL) in a temporary folder.
const test = require('node:test')
const assert = require('node:assert')
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const ROOT = path.join(__dirname, '..')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eid-php-'))
const docroot = path.join(tmp, 'public')
let base, token, php

const call = async (method, url, body, tok = token, header = 'Authorization') => {
  const auth = tok ? (header === 'Authorization' ? { Authorization: `Bearer ${tok}` } : { 'X-Auth-Token': tok }) : {}
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...auth },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: res.status, data: await res.json().catch(() => null) }
}

test.before(async () => {
  fs.cpSync(path.join(ROOT, 'php'), docroot, { recursive: true })
  fs.writeFileSync(path.join(docroot, 'index.html'), '<!doctype html><title>app</title>')
  const port = 20000 + Math.floor(Math.random() * 20000)
  php = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', docroot, path.join(ROOT, 'tools/php-router.php')], {
    env: { ...process.env, EID_TEST: '1', EID_CONFIG_FILE: path.join(tmp, 'config.php'), EID_UPLOAD_DIR: path.join(docroot, 'uploads') },
    stdio: ['ignore', 'ignore', 'pipe'],
  })
  php.stderr.on('data', d => { if (/(Fatal|Warning|Notice|Deprecated)/.test(d)) process.stderr.write(d) })
  base = `http://127.0.0.1:${port}`
  for (let i = 0; i < 50; i++) {
    try { await fetch(base + '/api/auth/status'); return } catch { await new Promise(r => setTimeout(r, 100)) }
  }
  throw new Error('PHP server did not start')
})
test.after(() => { php.kill(); fs.rmSync(tmp, { recursive: true, force: true }) })

test('first-run installer', async () => {
  let r = await call('GET', '/api/auth/status', undefined, null)
  assert.equal(r.data.needsInstall, true)
  assert.equal((await call('GET', '/api/site', undefined, null)).status, 503)
  assert.equal((await call('GET', '/api/admin/menu', undefined, null)).status, 503)
  r = await call('POST', '/api/install', { username: 'ad', password: 'secret-pass-1', db_name: 'x', db_user: 'y' }, null)
  assert.equal(r.status, 400)
  r = await call('POST', '/api/install', { username: 'admin', password: 'secret-pass-1', db_name: 'x', db_user: 'y', db_host: '127.0.0.1', db_password: 'nope' }, null)
  assert.equal(r.status, 400, 'bad MySQL credentials are reported')
  assert.match(r.data.error, /تعذر الاتصال/)
  r = await call('POST', '/api/install', { username: 'admin', password: 'secret-pass-1', driver: 'sqlite', sqlite_file: path.join(tmp, 'db.sqlite') }, null)
  assert.equal(r.status, 200)
  assert.ok(fs.existsSync(path.join(tmp, 'config.php')))
  r = await call('POST', '/api/install', { username: 'x', password: 'secret-pass-2', driver: 'sqlite', sqlite_file: path.join(tmp, 'db2.sqlite') }, null)
  assert.equal(r.status, 403, 'installer is locked once configured')
  r = await call('GET', '/api/auth/status', undefined, null)
  assert.deepEqual([r.data.needsInstall, r.data.needsSetup], [false, false])
})

test('seeded site content', async () => {
  const { status, data } = await call('GET', '/api/site')
  assert.equal(status, 200)
  assert.equal(data.sections.length, 11)
  assert.equal(data.sections[0].type, 'hero')
  assert.equal(data.sections[0].items.length, 4)
  assert.equal(data.menu.length, 6)
  assert.equal(data.menu[0].children.length, 4)
  assert.ok(data.menu[0].children[0].children.length > 3)
  assert.equal(data.settings.donate_label.ar, 'تبرع الآن')
  assert.equal(data.sections[0].is_visible, true)
  assert.equal(typeof data.sections[0].id, 'number')
})

test('admin requires login', async () => {
  assert.equal((await call('GET', '/api/admin/menu', undefined, null)).status, 401)
  assert.equal((await call('GET', '/api/admin/menu', undefined, 'bad.token')).status, 401)
})

test('login, setup locked, token via either header', async () => {
  let r = await call('POST', '/api/auth/setup', { username: 'x', password: 'another-pass' }, null)
  assert.equal(r.status, 403)
  r = await call('POST', '/api/auth/login', { username: 'admin', password: 'wrong-pass' }, null)
  assert.equal(r.status, 401)
  r = await call('POST', '/api/auth/login', { username: 'admin', password: 'secret-pass-1' }, null)
  assert.equal(r.status, 200)
  token = r.data.token
  r = await call('GET', '/api/auth/status')
  assert.equal(r.data.user.username, 'admin')
  r = await call('GET', '/api/admin/menu', undefined, token, 'X-Auth-Token')
  assert.equal(r.status, 200)
})

test('menu: add, hide, reorder, delete with children', async () => {
  let r = await call('POST', '/api/admin/menu', { label_ar: 'تجربة', label_en: 'Test', url: '#t' })
  assert.equal(r.status, 200)
  const top = r.data
  r = await call('POST', '/api/admin/menu', { parent_id: top.id, label_ar: 'مجموعة', label_en: 'Group', extra: { col: 1 } })
  const group = r.data
  r = await call('POST', '/api/admin/menu', { parent_id: group.id, label_ar: 'رابط', label_en: 'Link' })
  const link = r.data
  r = await call('POST', '/api/admin/menu', { parent_id: link.id, label_ar: 'عمق', label_en: 'Too deep' })
  assert.equal(r.status, 400)

  let site = (await call('GET', '/api/site')).data
  assert.equal(site.menu.length, 7)
  await call('PUT', `/api/admin/menu/${top.id}`, { is_visible: false })
  site = (await call('GET', '/api/site')).data
  assert.equal(site.menu.length, 6)
  assert.ok(!JSON.stringify(site.menu).includes('Too deep') && !JSON.stringify(site.menu).includes('"Link"'))

  const all = (await call('GET', '/api/admin/menu')).data
  const topIds = all.filter(m => m.parent_id === null).sort((a, b) => a.sort_order - b.sort_order).map(m => m.id)
  await call('POST', '/api/admin/menu/reorder', { parent_id: null, ids: [top.id, ...topIds.filter(i => i !== top.id)] })
  await call('PUT', `/api/admin/menu/${top.id}`, { is_visible: true, label_en: 'First' })
  site = (await call('GET', '/api/site')).data
  assert.equal(site.menu[0].label_en, 'First')

  r = await call('DELETE', `/api/admin/menu/${top.id}`)
  assert.equal(r.status, 200)
  const after = (await call('GET', '/api/admin/menu')).data
  assert.ok(!after.some(m => [top.id, group.id, link.id].includes(m.id)))
})

test('sections: add, edit, hide, reorder, duplicate, delete', async () => {
  let r = await call('POST', '/api/admin/sections', { type: 'text_block', name: 'قسم جديد', content: { title: { ar: 'عنوان', en: 'Title' } }, items: [{ a: 1 }] })
  assert.equal(r.status, 200)
  const sec = r.data
  r = await call('POST', '/api/admin/sections', { type: 'Bad Type!' })
  assert.equal(r.status, 400)

  r = await call('PUT', `/api/admin/sections/${sec.id}`, { content: { title: { ar: 'معدل', en: 'Edited' } } })
  assert.equal(r.data.content.title.en, 'Edited')

  let site = (await call('GET', '/api/site')).data
  assert.equal(site.sections.at(-1).content.title.en, 'Edited')
  assert.equal(site.sections.at(-1).items.length, 1)

  const list = (await call('GET', '/api/admin/sections')).data
  await call('POST', '/api/admin/sections/reorder', { ids: [sec.id, ...list.map(s => s.id).filter(i => i !== sec.id)] })
  site = (await call('GET', '/api/site')).data
  assert.equal(site.sections[0].id, sec.id)

  await call('PUT', `/api/admin/sections/${sec.id}`, { is_visible: false })
  site = (await call('GET', '/api/site')).data
  assert.ok(!site.sections.some(s => s.id === sec.id))

  r = await call('POST', `/api/admin/sections/${sec.id}/duplicate`)
  assert.equal(r.status, 200)
  const copy = (await call('GET', `/api/admin/sections/${r.data.id}`)).data
  assert.equal(copy.items.length, 1)
  assert.equal(copy.is_visible, false)

  for (const id of [sec.id, copy.id]) assert.equal((await call('DELETE', `/api/admin/sections/${id}`)).status, 200)
  assert.equal((await call('GET', `/api/admin/sections/${sec.id}`)).status, 404)
})

test('items: add, edit, hide, reorder, delete', async () => {
  const hero = (await call('GET', '/api/admin/sections')).data.find(s => s.type === 'hero')
  let r = await call('POST', `/api/admin/sections/${hero.id}/items`, { content: { label: { ar: 'جديد', en: 'New' } } })
  const item = r.data
  const full = (await call('GET', `/api/admin/sections/${hero.id}`)).data
  assert.equal(full.items.length, 5)
  await call('POST', `/api/admin/sections/${hero.id}/items/reorder`, { ids: [item.id, ...full.items.map(i => i.id).filter(i => i !== item.id)] })
  let site = (await call('GET', '/api/site')).data
  assert.equal(site.sections.find(s => s.id === hero.id).items[0].content.label.en, 'New')
  await call('PUT', `/api/admin/items/${item.id}`, { is_visible: false })
  site = (await call('GET', '/api/site')).data
  assert.equal(site.sections.find(s => s.id === hero.id).items.length, 4)
  assert.equal((await call('DELETE', `/api/admin/items/${item.id}`)).status, 200)
})

test('settings, upload, accounts, password', async () => {
  const s = (await call('GET', '/api/admin/settings')).data
  s.phone = '+974 1111 2222'
  await call('PUT', '/api/admin/settings', s)
  assert.equal((await call('GET', '/api/site')).data.settings.phone, '+974 1111 2222')

  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  let r = await call('POST', '/api/admin/upload', { filename: 'My Photo.png', data: png })
  assert.equal(r.status, 200)
  const img = await fetch(base + r.data.url)
  assert.equal(img.status, 200)
  assert.equal(img.headers.get('content-type'), 'image/png')
  r = await call('POST', '/api/admin/upload', { filename: 'x.svg', data: 'data:image/svg+xml;base64,PHN2Zz4=' })
  assert.equal(r.status, 400)
  const seed = await fetch(base + '/api/seed.json')
  assert.equal(seed.status, 404, 'private API files are not downloadable')

  r = await call('POST', '/api/admin/admins', { username: 'editor', password: 'editor-pass-1' })
  assert.equal(r.status, 200)
  assert.equal((await call('GET', '/api/admin/admins')).data.length, 2)
  assert.equal((await call('DELETE', `/api/admin/admins/${r.data.id}`)).status, 200)

  r = await call('PUT', '/api/admin/password', { current: 'wrong', password: 'new-secret-9' })
  assert.equal(r.status, 400)
  r = await call('PUT', '/api/admin/password', { current: 'secret-pass-1', password: 'new-secret-9' })
  assert.equal(r.status, 200)
  assert.equal((await call('POST', '/api/auth/login', { username: 'admin', password: 'new-secret-9' }, null)).status, 200)
})
