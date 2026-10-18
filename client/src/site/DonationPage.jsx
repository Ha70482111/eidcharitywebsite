// Donation details page for one campaign (/donate/<id>), laid out like a project page on
// a donation platform: gallery and project details on one side, a sticky donation card on the other.
import { useEffect, useRef, useState } from 'react'
import { useLang, useT, lines } from './lang.jsx'
import { campaignHref } from './sections.jsx'
import { addToCart } from './cart.js'
import { CartIcon } from './CartPage.jsx'
import { Pin, Lock, Check, Arrow, SOCIAL_ICONS, M, MD, N } from '../shared/icons.jsx'

const TXT = {
  home: ['الرئيسية', 'Home'],
  donations: ['التبرعات', 'Donations'],
  donorsBefore: ['متبرعًا سبقوك في فعل الخير', 'donors have given before you'],
  firstDonor: ['كن أول من يساهم في هذه الحملة', 'Be the first to give to this campaign'],
  ref: ['الرقم المرجعي', 'Reference'],
  raised: ['تم جمع', 'Raised'],
  target: ['المبلغ المستهدف', 'Target'],
  remaining: ['المبلغ المتبقي', 'Remaining'],
  done: ['مكتمل', 'complete'],
  beneficiaries: ['المستفيدون', 'Beneficiaries'],
  duration: ['مدة التنفيذ', 'Duration'],
  type: ['نوع المشروع', 'Project type'],
  location: ['المكان', 'Location'],
  sharePrice: ['قيمة السهم', 'Share value'],
  about: ['عن المشروع', 'About the project'],
  photos: ['الصور', 'Photos'],
  donateTitle: ['تبرع لهذه الحملة', 'Donate to this campaign'],
  once: ['مرة واحدة', 'One-time'],
  monthly: ['شهري', 'Monthly'],
  monthlyNote: ['يُخصم المبلغ تلقائيًا كل شهر', 'Charged automatically every month'],
  amount: ['مبلغ التبرع', 'Donation amount'],
  other: ['مبلغ آخر', 'Other amount'],
  shares: ['عدد الأسهم', 'Number of shares'],
  less: ['تقليل', 'Decrease'],
  more: ['زيادة', 'Increase'],
  total: ['إجمالي المبلغ', 'Total amount'],
  donate: ['تبرع الآن', 'Donate Now'],
  addCart: ['أضف إلى السلة', 'Add to cart'],
  chooseAmount: ['اختر مبلغ التبرع أولًا', 'Please choose an amount'],
  noGateway: ['بوابة الدفع غير مفعلة بعد', 'Online payment is not available yet'],
  secure: ['دفع آمن ومشفّر', 'Secure, encrypted payment'],
  share: ['شارك الحملة', 'Share this campaign'],
  copy: ['نسخ الرابط', 'Copy link'],
  copied: ['تم نسخ الرابط', 'Link copied'],
  related: ['حملات أخرى قد تهمك', 'Other campaigns you may like'],
  view: ['تفاصيل الحملة', 'Campaign details'],
  prev: ['الصورة السابقة', 'Previous photo'],
  next: ['الصورة التالية', 'Next photo'],
  photo: ['صورة', 'Photo'],
}

const fmt = n => Number(n || 0).toLocaleString('en-US')
const pctOf = (raised, target) => (Number(target) > 0 ? Math.min(100, Math.round((Number(raised) / Number(target)) * 100)) : 0)

export default function DonationPage({ data }) {
  const { lang } = useLang()
  const t = useT()
  const L = k => TXT[k][lang === 'en' ? 1 : 0]
  const it = data.campaign.content || {}
  const sc = data.section.content || {}
  const cur = sc.currency || 'QAR'
  const name = t(it.name)
  const images = [it.image, ...(Array.isArray(it.gallery) ? it.gallery.map(g => g?.image) : [])].filter(Boolean)
  const [photo, setPhoto] = useState(0)
  const [tab, setTab] = useState('about')
  const cardRef = useRef(null)

  const target = Number(it.target) || 0
  const raised = Number(it.raised) || 0
  const pct = pctOf(raised, target)
  const stats = [
    Number(it.beneficiaries) > 0 && [L('beneficiaries'), fmt(it.beneficiaries)],
    t(it.duration) && [L('duration'), t(it.duration)],
    t(it.category) && [L('type'), t(it.category)],
    t(it.location) && [L('location'), t(it.location)],
  ].filter(Boolean)
  const paragraphs = [...lines(t(it.desc)), ...lines(t(it.details))]
  const showPhotos = images.length > 1

  return (
    <>
      <nav aria-label={lang === 'ar' ? 'مسار التنقل' : 'Breadcrumb'} className="ec-dn-crumbs">
        <div className="ec-inner">
          <a href="/">{L('home')}</a>
          <span aria-hidden="true">/</span>
          <a href="/donate">{L('donations')}</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{name}</span>
        </div>
      </nav>

      <div className="ec-inner ec-dn-grid">
        <div className="ec-dn-main">
          <Gallery images={images} index={photo} setIndex={setPhoto} name={name} badge={t(it.category)} L={L} />

          <h1 className="ec-dn-title">{name}</h1>
          <div className="ec-dn-chips">
            {t(it.location) && <span className="ec-dn-chip"><Pin c={M} s={13} /> {t(it.location)}</span>}
            {t(it.permit) && <span className="ec-dn-chip ec-dn-chip-muted">{t(it.permit)}</span>}
            <span className="ec-dn-chip ec-dn-chip-muted">{L('ref')}: <span dir="ltr">#{data.campaign.id}</span></span>
          </div>
          <p className="ec-dn-donors">
            <Heart />
            {Number(it.donors) > 0 ? <span><strong>{fmt(it.donors)}</strong> {L('donorsBefore')}</span> : <span>{L('firstDonor')}</span>}
          </p>

          {stats.length > 0 && (
            <dl className="ec-dn-stats">
              {stats.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          )}

          {(paragraphs.length > 0 || showPhotos) && (
            <div className="ec-dn-tabs-wrap">
              <div role="tablist" className="ec-dn-tabs">
                <button role="tab" id="dn-tab-about" aria-controls="dn-panel" aria-selected={tab === 'about'} onClick={() => setTab('about')}>{L('about')}</button>
                {showPhotos && <button role="tab" id="dn-tab-photos" aria-controls="dn-panel" aria-selected={tab === 'photos'} onClick={() => setTab('photos')}>{L('photos')} ({images.length})</button>}
              </div>
              <div id="dn-panel" role="tabpanel" aria-labelledby={`dn-tab-${tab}`} className="ec-dn-panel">
                {tab === 'about' ? paragraphs.map((p, i) => <p key={i}>{p}</p>) : (
                  <div className="ec-dn-photos">
                    {images.map((src, i) => (
                      <button key={i} type="button" aria-label={`${L('photo')} ${i + 1}`}
                        onClick={() => { setPhoto(i); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                        <img src={src} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="ec-dn-aside" ref={cardRef} id="donate-card" aria-label={L('donateTitle')}>
          <DonateCard it={it} id={data.campaign.id} cur={cur} amountsText={sc.amounts} payUrl={data.donate_action_url} pct={pct} L={L} />
        </aside>
      </div>

      {data.related?.length > 0 && <Related items={data.related} cur={cur} amounts={sc.amounts} payUrl={data.donate_action_url} L={L} />}

      <div className="ec-dn-mobilebar">
        {target > 0 && <div className="ec-dn-mobilebar-pct"><strong>{pct}%</strong> <span>{L('done')}</span></div>}
        <button type="button" className="ec-btn-primary" onClick={() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{L('donate')}</button>
      </div>
    </>
  )
}

function Gallery({ images, index, setIndex, name, badge, L }) {
  const { lang } = useLang()
  if (!images.length) return null
  const go = d => setIndex((index + d + images.length) % images.length)
  const prevDir = lang === 'ar' ? 'ltr' : 'rtl'
  return (
    <div className="ec-dn-gallery">
      <div className="ec-dn-photo">
        <img src={images[index]} alt={name} />
        {badge && <span className="ec-dn-badge">{badge}</span>}
        {images.length > 1 && <>
          <button type="button" className="ec-dn-nav ec-dn-nav-prev" aria-label={L('prev')} onClick={() => go(-1)}><Arrow c={N} dir={prevDir} /></button>
          <button type="button" className="ec-dn-nav ec-dn-nav-next" aria-label={L('next')} onClick={() => go(1)}><Arrow c={N} dir={lang === 'ar' ? 'rtl' : 'ltr'} /></button>
          <span className="ec-dn-count" dir="ltr">{index + 1} / {images.length}</span>
        </>}
      </div>
      {images.length > 1 && (
        <div className="ec-dn-thumbs">
          {images.map((src, i) => (
            <button key={i} type="button" aria-label={`${L('photo')} ${i + 1}`} aria-current={i === index} onClick={() => setIndex(i)}>
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function DonateCard({ it, id, cur, amountsText, payUrl, pct, L }) {
  const { lang } = useLang()
  const t = useT()
  const sharePrice = Number(it.share_price) || 0
  const amounts = String(amountsText || '50, 100, 250, 500').split(',').map(s => Number(s.trim())).filter(n => n > 0)
  // An amount picked on the donations page arrives as ?amount=…
  const asked = Number(new URLSearchParams(window.location.search).get('amount')) || 0
  const [type, setType] = useState('once')
  const [amount, setAmount] = useState(asked && amounts.includes(asked) ? asked : asked ? null : amounts[1] || amounts[0] || null)
  const [custom, setCustom] = useState(asked && !amounts.includes(asked) ? String(asked) : '')
  const [qty, setQty] = useState(sharePrice && asked ? Math.max(1, Math.round(asked / sharePrice)) : 1)
  const [notice, setNotice] = useState('')
  const target = Number(it.target) || 0
  const raised = Number(it.raised) || 0
  const total = sharePrice ? sharePrice * qty : custom ? Number(custom) : amount

  const donate = () => {
    if (!total || total <= 0) { setNotice(L('chooseAmount')); return }
    if (!payUrl) { setNotice(L('noGateway')); return }
    const url = new URL(payUrl, window.location.origin)
    url.searchParams.set('amount', String(total))
    url.searchParams.set('type', type)
    url.searchParams.set('campaign', String(id))
    url.searchParams.set('category', (it.name && (it.name.ar || it.name.en)) || '')
    if (sharePrice) url.searchParams.set('quantity', String(qty))
    window.location.href = url.toString()
  }

  const addCart = () => {
    if (!total || total <= 0) { setNotice(L('chooseAmount')); return }
    addToCart({ id, name: it.name, image: it.image || '', cur, pay: payUrl || '', type, amount: total, step: amounts[0], ...(sharePrice ? { sharePrice, qty } : {}) })
    setNotice('')
  }

  return (
    <div className="ec-dn-card">
      {target > 0 && (
        <div className="ec-dn-progress">
          <div className="ec-dn-progress-top">
            <span>{L('raised')} <strong>{fmt(raised)} {cur}</strong></span>
            <strong className="ec-dn-pct">{pct}%</strong>
          </div>
          <div className="ec-progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% ${L('done')}`} style={{ height: 10, borderRadius: 5 }}>
            <div className="ec-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="ec-dn-progress-nums">
            <div><span>{L('target')}</span><strong>{fmt(target)} {cur}</strong></div>
            <div><span>{L('remaining')}</span><strong>{fmt(Math.max(0, target - raised))} {cur}</strong></div>
          </div>
        </div>
      )}

      <div className="ec-dn-card-head">
        <h2>{L('donateTitle')}</h2>
        <div className="ec-toggle" role="group" aria-label={L('donateTitle')}>
          {['once', 'monthly'].map(tp => (
            <button key={tp} type="button" aria-pressed={type === tp} onClick={() => setType(tp)}>
              {type === tp && <Check />}{L(tp)}
            </button>
          ))}
        </div>
      </div>

      <div className="ec-dn-card-body">
        {type === 'monthly' && <p className="ec-dn-hint">{L('monthlyNote')}</p>}

        {sharePrice ? (
          <div className="ec-dn-qty-row">
            <div>
              <div className="ec-dn-label">{L('shares')}</div>
              <div className="ec-dn-sub">{L('sharePrice')}: {fmt(sharePrice)} {cur}</div>
            </div>
            <div className="ec-dn-qty" role="group" aria-label={L('shares')}>
              <button type="button" aria-label={L('less')} onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}>−</button>
              <input type="number" min="1" inputMode="numeric" value={qty} aria-label={L('shares')}
                onChange={e => { setQty(Math.max(1, Math.floor(Number(e.target.value)) || 1)); setNotice('') }} />
              <button type="button" aria-label={L('more')} onClick={() => setQty(q => q + 1)}>+</button>
            </div>
          </div>
        ) : <>
          <div className="ec-dn-label" id="dn-amount-label">{L('amount')}</div>
          <div role="group" aria-labelledby="dn-amount-label" className="ec-dn-amounts">
            {amounts.map(a => {
              const on = amount === a && !custom
              return (
                <button key={a} type="button" className="ec-amount-btn" aria-pressed={on} onClick={() => { setAmount(a); setCustom(''); setNotice('') }}
                  style={{ border: `2px solid ${on ? M : '#D6D1CA'}`, background: on ? M : '#fff', color: on ? '#fff' : N }}>
                  {fmt(a)}
                </button>
              )
            })}
          </div>
          <div className="ec-dn-custom">
            <input className="ec-field" type="number" min="1" inputMode="numeric" placeholder={L('other')} aria-label={L('other')} value={custom}
              onChange={e => { setCustom(e.target.value); setAmount(null); setNotice('') }} style={{ borderColor: custom ? M : undefined }} />
            <span>{cur}</span>
          </div>
        </>}

        <div className="ec-dn-total">
          <span>{L('total')}</span>
          <strong>{total ? fmt(total) : 0} {cur}{type === 'monthly' && <small> / {L('monthly')}</small>}</strong>
        </div>

        <button type="button" onClick={donate} className="ec-btn-primary" style={{ width: '100%', padding: 15, fontSize: 17, borderRadius: 12, background: `linear-gradient(135deg,${M},${MD})` }}>
          {L('donate')}
        </button>
        <button type="button" onClick={addCart} className="ec-btn-cart"><CartIcon c="currentColor" s={20} /> {L('addCart')}</button>
        {notice && <p role="status" className="ec-dn-notice">{notice}</p>}
        <p className="ec-dn-secure"><Lock /> {L('secure')}</p>

        <Share name={t(it.name)} L={L} />
      </div>
    </div>
  )
}

function Share({ name, L }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? window.location.href : ''
  const text = encodeURIComponent(`${name} ${url}`)
  const u = encodeURIComponent(url)
  const links = [
    ['whatsapp', 'WhatsApp', `https://wa.me/?text=${text}`],
    ['facebook', 'Facebook', `https://www.facebook.com/sharer/sharer.php?u=${u}`],
    ['x', 'X', `https://twitter.com/intent/tweet?text=${encodeURIComponent(name)}&url=${u}`],
  ].filter(([k]) => SOCIAL_ICONS[k])
  useEffect(() => { if (!copied) return; const id = setTimeout(() => setCopied(false), 2500); return () => clearTimeout(id) }, [copied])
  const copy = () => { navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => {}) }
  return (
    <div className="ec-dn-share">
      <span>{L('share')}</span>
      <div>
        {links.map(([k, label, href]) => {
          const I = SOCIAL_ICONS[k]
          return <a key={k} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}><I c="currentColor" /></a>
        })}
        <button type="button" onClick={copy} aria-label={L('copy')}><LinkIcon /></button>
      </div>
      {copied && <p role="status">{L('copied')}</p>}
    </div>
  )
}

function Related({ items, cur, amounts: amountsText, payUrl, L }) {
  const t = useT()
  const { lang } = useLang()
  const first = String(amountsText || '50, 100, 250, 500').split(',').map(s => Number(s.trim())).find(n => n > 0) || 50
  return (
    <section className="ec-section" style={{ background: '#F4F2EE' }}>
      <div className="ec-inner">
        <h2 className="ec-dn-related-title">{L('related')}</h2>
        <div className="ec-grid-3">
          {items.map(r => {
            const c = { ...r.content, _id: r.id }
            const pct = pctOf(c.raised, c.target)
            return (
              <article key={r.id} className="ec-card-hover ec-dn-rcard">
                <a href={campaignHref(c)} tabIndex={-1} aria-hidden="true" className="ec-img-zoom ec-dn-rimg">
                  {c.image && <img src={c.image} alt="" loading="lazy" />}
                </a>
                <div className="ec-dn-rbody">
                  <h3><a href={campaignHref(c)} className="ec-title-link">{t(c.name)}</a></h3>
                  {Number(c.target) > 0 && <>
                    <div className="ec-progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t(c.name)}><div className="ec-progress-fill" style={{ width: `${pct}%` }} /></div>
                    <div className="ec-dn-rnums"><strong>{pct}% {L('done')}</strong><span>{fmt(c.raised)} / {fmt(c.target)} {cur}</span></div>
                  </>}
                  <div className="ec-dn-ractions">
                    <a href={campaignHref(c)} className="ec-dn-rlink">{L('view')} <Arrow c={M} s={14} dir={lang === 'ar' ? 'rtl' : 'ltr'} /></a>
                    {campaignHref(c) === `/donate/${r.id}` && (
                      <button type="button" className="ec-btn-cart" aria-label={`${L('addCart')}: ${t(c.name)}`} title={L('addCart')}
                        onClick={() => addToCart({ id: r.id, name: c.name, image: c.image || '', cur, pay: payUrl || '', type: 'once', amount: first, step: first })}>
                        <CartIcon s={20} />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

const Heart = () => <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M10 17s-6.5-4.1-6.5-8.6A3.6 3.6 0 0110 6.2a3.6 3.6 0 016.5 2.2C16.5 12.9 10 17 10 17z" fill={M} /></svg>
const LinkIcon = () => <svg viewBox="0 0 20 20" fill="none" width="17" height="17" aria-hidden="true"><path d="M8.5 11.5a3.5 3.5 0 005 0l2.5-2.5a3.5 3.5 0 00-5-5L10 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M11.5 8.5a3.5 3.5 0 00-5 0L4 11a3.5 3.5 0 005 5l1-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>

