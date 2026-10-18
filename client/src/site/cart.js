// Donation cart kept in the visitor's browser (localStorage), shared by every page and tab.
// An item is one campaign + donation type; adding the same campaign again adds to its amount.
import { useSyncExternalStore } from 'react'

const KEY = 'ec-cart'
const EVENT = 'ec-cart-change'
export const ADDED_EVENT = 'ec-cart-added' // shows the "added to cart" toast
let cache = null

function read() {
  if (cache) return cache
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    cache = Array.isArray(v) ? v.filter(i => i && i.id && Number(i.amount) > 0) : []
  } catch { cache = [] }
  return cache
}

function write(items) {
  cache = items
  try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* private mode: cart lasts for this page only */ }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(cb) {
  const onStorage = e => { if (e.key === KEY) { cache = null; cb() } }
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', onStorage)
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener('storage', onStorage) }
}

export const useCart = () => useSyncExternalStore(subscribe, read, () => [])

export const cartKey = (id, type) => `${id}:${type || 'once'}`

// item: { id, name, image, cur, pay, type, amount, step?, sharePrice?, qty? }
// `id` is a campaign id, or a text key such as "general" for the home page's quick donation.
export function addToCart(item) {
  addItem(item)
  window.dispatchEvent(new Event(ADDED_EVENT))
}

function addItem(item) {
  const type = item.type || 'once'
  const key = cartKey(item.id, type)
  const items = read()
  const old = items.find(i => i.key === key)
  if (old) {
    const qty = item.sharePrice ? (old.qty || 1) + (item.qty || 1) : undefined
    const amount = item.sharePrice ? item.sharePrice * qty : Number(old.amount) + Number(item.amount)
    write(items.map(i => (i.key === key ? { ...i, ...item, key, type, qty, amount } : i)))
  } else {
    write([...items, { ...item, key, type, amount: Number(item.amount) }])
  }
}

export function updateCartItem(key, patch) {
  const items = read()
  const cur = items.find(i => i.key === key)
  if (!cur) return
  const next = { ...cur, ...patch, key: cartKey(cur.id, patch.type || cur.type) }
  if (next.sharePrice) next.amount = next.sharePrice * Math.max(1, next.qty || 1)
  // Switching type onto a line that already exists for the same project merges the two.
  const twin = next.key !== key && items.find(i => i.key === next.key)
  if (twin) {
    const qty = next.sharePrice ? (twin.qty || 1) + (next.qty || 1) : undefined
    const merged = { ...twin, qty, amount: next.sharePrice ? next.sharePrice * qty : Number(twin.amount) + Number(next.amount) }
    write(items.filter(i => i.key !== key).map(i => (i.key === twin.key ? merged : i)))
  } else {
    write(items.map(i => (i.key === key ? next : i)))
  }
}

export const removeFromCart = key => write(read().filter(i => i.key !== key))
export const clearCart = () => write([])
