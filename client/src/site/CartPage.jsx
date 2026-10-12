// Donation cart (/cart): every project the donor added with «أضف إلى السلة», with amounts they can
// change, remove or clear, and one checkout per payment link. Also the header cart button and the
// "added to cart" toast used by the donation pages.
import { useEffect, useState } from 'react'
import { useLang, useT } from './lang.jsx'
import { useCart, updateCartItem, removeFromCart, clearCart } from './cart.js'
import { Lock, Check, M, MD, N } from '../shared/icons.jsx'

const TXT = {
  title: ['سلة التبرعات', 'Donation Cart'],
  home: ['الرئيسية', 'Home'],
  empty: ['سلة التبرعات فارغة.', 'Your donation cart is empty.'],
  browse: ['تصفح المشاريع', 'Browse projects'],
  count: ['مشروع في السلة', 'projects in your cart'],
  once: ['مرة واحدة', 'One-time'],
  monthly: ['شهري', 'Monthly'],
  amount: ['المبلغ', 'Amount'],
  shares: ['عدد الأسهم', 'Shares'],
  less: ['تقليل', 'Decrease'],
  more: ['زيادة', 'Increase'],
  remove: ['حذف', 'Remove'],
  clear: ['إفراغ السلة', 'Empty cart'],
  confirmClear: ['هل تريد حذف كل المشاريع من السلة؟', 'Remove every project from your cart?'],
  continue: ['أضف مشاريع أخرى', 'Add more projects'],
  summary: ['ملخص التبرع', 'Donation summary'],
  total: ['الإجمالي', 'Total'],
  checkout: ['إتمام التبرع', 'Complete donation'],
  checkoutPart: ['ادفع', 'Pay'],
  split: ['التبرع الشهري والتبرع لمرة واحدة (أو روابط الدفع المختلفة) يُدفع كلٌّ منها على حدة.', 'Monthly and one-time donations (or different payment links) are paid separately.'],
  noGateway: ['بوابة الدفع غير مفعلة بعد', 'Online payment is not available yet'],
  badAmount: ['اكتب مبلغًا صحيحًا لكل مشروع', 'Enter a valid amount for each project'],
  secure: ['دفع آمن ومشفّر', 'Secure, encrypted payment'],
  cart: ['سلة التبرعات', 'Donation cart'],
  added: ['تمت الإضافة إلى السلة', 'Added to your cart'],
  view: ['عرض السلة', 'View cart'],
}
const useL = () => { const { lang } = useLang(); return k => TXT[k][lang === 'en' ? 1 : 0] }
const fmt = n => Number(n || 0).toLocaleString('en-US')
const nameOf = (n, lang) => (n && (lang === 'en' ? n.en || n.ar : n.ar || n.en)) || ''

export default function CartPage() {
  const L = useL()
  const t = useT()
  const { lang } = useLang()
  const items = useCart()
  const [notice, setNotice] = useState('')

  // Items that pay through the same link, type and currency are paid together.
  const groups = []
  items.forEach(i => {
    const k = `${i.pay || ''}|${i.type}|${i.cur}`
    const g = groups.find(x => x.k === k)
    g ? g.items.push(i) : groups.push({ k, pay: i.pay || '', type: i.type, cur: i.cur, items: [i] })
  })

  const checkout = g => {
    if (g.items.some(i => !(Number(i.amount) > 0))) { setNotice(L('badAmount')); return }
    if (!g.pay) { setNotice(L('noGateway')); return }
    const total = g.items.reduce((s, i) => s + Number(i.amount), 0)
    const url = new URL(g.pay, window.location.origin)
    url.searchParams.set('amount', String(total))
    url.searchParams.set('type', g.type)
    url.searchParams.set('campaign', g.items.map(i => i.id).join(','))
    url.searchParams.set('category', g.items.map(i => (i.name && (i.name.ar || i.name.en)) || '').join(' | '))
    url.searchParams.set('items', g.items.map(i => `${i.id}:${i.amount}`).join(','))
    if (g.items.length === 1 && g.items[0].sharePrice) url.searchParams.set('quantity', String(g.items[0].qty || 1))
    window.location.href = url.toString()
  }

  return (
    <>
      <nav aria-label={lang === 'ar' ? 'مسار التنقل' : 'Breadcrumb'} className="ec-dn-crumbs">
        <div className="ec-inner">
          <a href="/">{L('home')}</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{L('title')}</span>
        </div>
      </nav>

      <section className="ec-cart-wrap">
        <div className="ec-inner">
          <h1 className="ec-cart-title">{L('title')}</h1>
          {items.length === 0 ? (
            <div className="ec-dl-empty">
              <CartIcon s={56} c="#C9C3BC" />
              <p>{L('empty')}</p>
              <a className="ec-btn-primary" href="/donate">{L('browse')}</a>
            </div>
          ) : (
            <div className="ec-cart-grid">
              <div>
                <div className="ec-cart-bar">
                  <span>{items.length} {L('count')}</span>
                  <button type="button" className="ec-cart-link" onClick={() => { if (window.confirm(L('confirmClear'))) clearCart() }}>{L('clear')}</button>
                </div>
                <ul className="ec-cart-list">
                  {items.map(i => <CartRow key={i.key} i={i} L={L} name={nameOf(i.name, lang) || t(i.name)} onChange={() => setNotice('')} />)}
                </ul>
                <a className="ec-cart-link" href="/donate">+ {L('continue')}</a>
              </div>

              <aside className="ec-dn-card ec-cart-summary" aria-labelledby="cart-summary">
                <div className="ec-dn-card-head"><h2 id="cart-summary">{L('summary')}</h2></div>
                <div className="ec-dn-card-body">
                  {groups.length > 1 && <p className="ec-dn-hint">{L('split')}</p>}
                  {groups.map(g => {
                    const total = g.items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
                    return (
                      <div key={g.k} className="ec-cart-group">
                        {g.items.map(i => (
                          <div key={i.key} className="ec-cart-line"><span>{nameOf(i.name, lang)}</span><span>{fmt(i.amount)} {i.cur}</span></div>
                        ))}
                        <div className="ec-dn-total">
                          <span>{L('total')}</span>
                          <strong>{fmt(total)} {g.cur}{g.type === 'monthly' && <small> / {L('monthly')}</small>}</strong>
                        </div>
                        <button type="button" onClick={() => checkout(g)} className="ec-btn-primary" style={{ width: '100%', padding: 15, fontSize: 17, borderRadius: 12, background: `linear-gradient(135deg,${M},${MD})` }}>
                          {groups.length > 1 ? `${L('checkoutPart')} ${fmt(total)} ${g.cur}` : L('checkout')}
                        </button>
                      </div>
                    )
                  })}
                  {notice && <p role="status" className="ec-dn-notice">{notice}</p>}
                  <p className="ec-dn-secure"><Lock /> {L('secure')}</p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function CartRow({ i, L, name, onChange }) {
  const href = `/donate/${i.id}`
  const set = patch => { updateCartItem(i.key, patch); onChange() }
  return (
    <li className="ec-cart-item">
      <a href={href} className="ec-cart-img" tabIndex={-1} aria-hidden="true">{i.image && <img src={i.image} alt="" loading="lazy" />}</a>
      <div className="ec-cart-info">
        <h2><a href={href} className="ec-title-link">{name}</a></h2>
        <div className="ec-cart-type" role="group" aria-label={name}>
          {['once', 'monthly'].map(tp => (
            <button key={tp} type="button" aria-pressed={i.type === tp} onClick={() => set({ type: tp })}>{i.type === tp && <Check />}{L(tp)}</button>
          ))}
        </div>
      </div>
      <div className="ec-cart-amount">
        {i.sharePrice ? (
          <div className="ec-dn-qty" role="group" aria-label={`${L('shares')}: ${name}`}>
            <button type="button" aria-label={L('less')} onClick={() => set({ qty: Math.max(1, (i.qty || 1) - 1) })} disabled={(i.qty || 1) <= 1}>−</button>
            <input type="number" min="1" inputMode="numeric" value={i.qty || 1} aria-label={L('shares')}
              onChange={e => set({ qty: Math.max(1, Math.floor(Number(e.target.value)) || 1) })} />
            <button type="button" aria-label={L('more')} onClick={() => set({ qty: (i.qty || 1) + 1 })}>+</button>
          </div>
        ) : (
          <label className="ec-dn-custom" style={{ margin: 0 }}>
            <span className="ec-visually-hidden">{L('amount')}: {name}</span>
            <input className="ec-field" type="number" min="1" inputMode="numeric" value={i.amount || ''}
              onChange={e => set({ amount: Math.max(0, Number(e.target.value) || 0) })} />
            <span>{i.cur}</span>
          </label>
        )}
        {i.sharePrice ? <strong className="ec-cart-sum">{fmt(i.amount)} {i.cur}</strong> : null}
      </div>
      <button type="button" className="ec-cart-remove" aria-label={`${L('remove')}: ${name}`} title={L('remove')} onClick={() => removeFromCart(i.key)}><TrashIcon /></button>
    </li>
  )
}

// Header button with the number of projects in the cart.
export function CartButton({ className = '' }) {
  const L = useL()
  const n = useCart().length
  return (
    <a href="/cart" className={`ec-cart-btn ${className}`} aria-label={n ? `${L('cart')} (${n})` : L('cart')} title={L('cart')}>
      <CartIcon c={N} />
      {n > 0 && <span className="ec-cart-badge" aria-hidden="true">{n}</span>}
    </a>
  )
}

// Short confirmation after «أضف إلى السلة», with a link to the cart. `show` changes on every add.
export function CartToast({ show }) {
  const L = useL()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!show) return
    setOpen(true)
    const id = setTimeout(() => setOpen(false), 5000)
    return () => clearTimeout(id)
  }, [show])
  return (
    <div role="status" aria-live="polite" className="ec-cart-toast" data-open={open}>
      {open && <><Check /> <span>{L('added')}</span> <a href="/cart">{L('view')}</a></>}
    </div>
  )
}

export const CartIcon = ({ c = 'currentColor', s = 24 }) => <svg viewBox="0 0 24 24" fill="none" width={s} height={s} aria-hidden="true"><path d="M3 4h2l2.4 10.2a1.5 1.5 0 001.5 1.1h8.6a1.5 1.5 0 001.4-1.1L21 8H6.2" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9.5" cy="19.5" r="1.4" fill={c}/><circle cx="17" cy="19.5" r="1.4" fill={c}/></svg>
const TrashIcon = () => <svg viewBox="0 0 20 20" fill="none" width="18" height="18" aria-hidden="true"><path d="M4 6h12M8 6V4.5h4V6M6 6l.7 10h6.6L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
