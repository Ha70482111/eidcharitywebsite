'use strict'
const http = require('http')
const fs = require('fs')
const path = require('path')

// Load .env from the project root if present (does not override real env vars).
const envFile = path.join(__dirname, '..', '.env')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
  }
}

const db = require('./db')
const { handleApi, UPLOAD_DIR } = require('./api')

const DIST_DIR = path.join(__dirname, '..', 'dist')
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain',
}

function sendFile(res, file, cache) {
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff' })
  fs.createReadStream(file).pipe(res)
}

// Returns a file path inside root, or null (blocks ../ tricks).
function safeJoin(root, urlPath) {
  const p = path.normalize(path.join(root, decodeURIComponent(urlPath)))
  return p.startsWith(root + path.sep) && fs.existsSync(p) && fs.statSync(p).isFile() ? p : null
}

const server = http.createServer(async (req, res) => {
  let pathname
  try { pathname = new URL(req.url, 'http://x').pathname } catch { res.writeHead(400); return res.end() }

  if (pathname.startsWith('/api/')) return handleApi(req, res, pathname)
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end() }

  try {
    if (pathname.startsWith('/uploads/')) {
      const f = safeJoin(UPLOAD_DIR, pathname.slice('/uploads/'.length))
      if (f) return sendFile(res, f, 'public, max-age=604800')
      res.writeHead(404); return res.end('Not found')
    }
    const f = pathname !== '/' && safeJoin(DIST_DIR, pathname)
    if (f) return sendFile(res, f, pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600')
    // Single-page app: every other route (/, /admin, ...) gets index.html
    const index = path.join(DIST_DIR, 'index.html')
    if (fs.existsSync(index)) return sendFile(res, index, 'no-cache')
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('الواجهة غير مبنية بعد. شغّل: npm run build')
  } catch (err) {
    console.error(err)
    if (!res.headersSent) res.writeHead(500)
    res.end()
  }
})

async function start() {
  await db.ensureSchema()
  const port = process.env.PORT || 3000
  server.listen(port, () => console.log(`Server running on port ${port}`))
}

module.exports = { server, start }
