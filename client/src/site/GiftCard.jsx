// The «أغلى هدية» gift card: shown on the home-page gift section, as the live preview on /gift, and to the
// person receiving the gift at /gift/card. Its details travel inside the card link, so nothing is stored.
import { Icon, M, G, N } from '../shared/icons.jsx'

export const GIFT_DESIGNS = {
  maroon: { bg: M, ink: '#fff', soft: 'rgba(255,255,255,0.82)', accent: G, frame: 'rgba(182,157,103,0.7)', logo: '/logo-light.svg', dark: true },
  navy: { bg: N, ink: '#fff', soft: 'rgba(255,255,255,0.82)', accent: G, frame: 'rgba(182,157,103,0.7)', logo: '/logo-light.svg', dark: true },
  ivory: { bg: '#FBF8F1', ink: N, soft: '#4A4540', accent: '#7E6124', frame: 'rgba(155,120,45,0.55)', logo: '/logo.svg', dark: false },
}

const TXT = {
  title: ['أغلى هدية', 'The Most Precious Gift'],
  occasion: ['بمناسبة', 'On the occasion of'],
  to: ['إلى', 'To'],
  gave: ['أُهديت إليك صدقة في مشروع', 'A charity was given in your name to'],
  worth: ['بقيمة', 'worth'],
  from: ['مع خالص المحبة', 'With love'],
}

const fmt = n => Number(n || 0).toLocaleString('en-US')

// gift: { occasion, icon, to, from, project, message, amount, cur, design }. `lang` is the card's own language.
export default function GiftCard({ gift, lang = 'ar', className = '' }) {
  const d = GIFT_DESIGNS[gift.design] || GIFT_DESIGNS.maroon
  const L = k => TXT[k][lang === 'en' ? 1 : 0]
  return (
    <div className={`ec-gf-card ${className}`} dir={lang === 'en' ? 'ltr' : 'rtl'} lang={lang}
      style={{ background: d.bg, color: d.ink, '--gf-accent': d.accent, '--gf-frame': d.frame, '--gf-soft': d.soft }}>
      <img src="/logo-mark.svg" alt="" aria-hidden="true" className="ec-gf-watermark" style={d.dark ? { filter: 'brightness(0) invert(1)' } : undefined} />
      <div className="ec-gf-frame">
        <img src={d.logo} alt="" className="ec-gf-logo" />
        {gift.occasion && (
          <div className="ec-gf-occasion">
            <span className="ec-gf-icon"><Icon name={gift.icon || 'gift'} c={d.dark ? '#fff' : M} g={d.accent} /></span>
            <span>{L('occasion')} {gift.occasion}</span>
          </div>
        )}
        <div className="ec-gf-title">{L('title')}</div>
        <div className="ec-gf-to">{L('to')}: <strong>{gift.to || '…'}</strong></div>
        {gift.project && (
          <p className="ec-gf-body">
            {L('gave')} <strong>«{gift.project}»</strong>
            {Number(gift.amount) > 0 && <> {L('worth')} <strong dir="ltr">{fmt(gift.amount)} {gift.cur}</strong></>}
          </p>
        )}
        {gift.message && <p className="ec-gf-message">{gift.message}</p>}
        <div className="ec-gf-from">{L('from')}<strong>{gift.from || '…'}</strong></div>
      </div>
    </div>
  )
}

// The card link carries the card's details as base64url JSON (UTF-8 safe).
const LIMITS = { o: 60, i: 30, t: 60, f: 60, p: 120, m: 400, c: 8, d: 10, l: 2 }

export function encodeGift(g) {
  const bytes = new TextEncoder().encode(JSON.stringify(g))
  let bin = ''
  bytes.forEach(b => { bin += String.fromCharCode(b) })
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeGift(s) {
  try {
    const bin = atob(String(s).replace(/-/g, '+').replace(/_/g, '/'))
    const raw = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, ch => ch.charCodeAt(0))))
    if (!raw || typeof raw !== 'object') return null
    const g = {}
    Object.entries(LIMITS).forEach(([k, max]) => { if (typeof raw[k] === 'string') g[k] = raw[k].slice(0, max) })
    if (Number(raw.a) > 0) g.a = Number(raw.a)
    if (/^\d+$/.test(String(raw.id || ''))) g.id = String(raw.id)
    return g.t || g.f ? g : null
  } catch { return null }
}

// Short keys in the link ↔ the card's props.
export const toLink = g => ({ o: g.occasion, i: g.icon, t: g.to, f: g.from, p: g.project, id: g.id, m: g.message, a: g.amount || undefined, c: g.cur, d: g.design, l: g.lang })
export const fromLink = g => ({ occasion: g.o, icon: g.i, to: g.t, from: g.f, project: g.p, id: g.id, message: g.m, amount: g.a, cur: g.c, design: g.d, lang: g.l === 'en' ? 'en' : 'ar' })
