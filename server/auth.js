'use strict'
const crypto = require('crypto')
const db = require('./db')

const TOKEN_TTL = 12 * 60 * 60 // seconds

function hashPassword(pw) {
  const salt = crypto.randomBytes(16)
  const key = crypto.scryptSync(pw, salt, 64)
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`
}

function verifyPassword(pw, stored) {
  const [alg, saltHex, keyHex] = String(stored || '').split('$')
  if (alg !== 'scrypt' || !saltHex || !keyHex) return false
  const expected = Buffer.from(keyHex, 'hex')
  const actual = crypto.scryptSync(pw, Buffer.from(saltHex, 'hex'), expected.length)
  return crypto.timingSafeEqual(expected, actual)
}

let secretCache = null
async function secret() {
  if (process.env.APP_SECRET) return process.env.APP_SECRET
  if (secretCache) return secretCache
  let s = await db.getSetting('_secret', null)
  if (!s) {
    s = crypto.randomBytes(32).toString('hex')
    await db.setSetting('_secret', s)
  }
  secretCache = s
  return s
}

const b64 = buf => Buffer.from(buf).toString('base64url')

async function signToken(user) {
  const payload = b64(JSON.stringify({ uid: user.id, u: user.username, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL }))
  const sig = crypto.createHmac('sha256', await secret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

async function verifyToken(token) {
  if (!token || typeof token !== 'string') return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = crypto.createHmac('sha256', await secret()).update(payload).digest('base64url')
  const a = Buffer.from(sig), e = Buffer.from(expected)
  if (a.length !== e.length || !crypto.timingSafeEqual(a, e)) return null
  let data
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString()) } catch { return null }
  if (!data.exp || data.exp < Date.now() / 1000) return null
  const rows = await db.query('SELECT id, username FROM admins WHERE id = ?', [data.uid])
  return rows[0] || null
}

// Simple in-memory brute-force protection for the login endpoint.
const attempts = new Map()
function tooManyAttempts(ip) {
  const now = Date.now()
  const list = (attempts.get(ip) || []).filter(t => now - t < 15 * 60 * 1000)
  attempts.set(ip, list)
  return list.length >= 10
}
function recordFailure(ip) {
  const list = attempts.get(ip) || []
  list.push(Date.now())
  attempts.set(ip, list)
}
function clearFailures(ip) { attempts.delete(ip) }

module.exports = { hashPassword, verifyPassword, signToken, verifyToken, tooManyAttempts, recordFailure, clearFailures }
