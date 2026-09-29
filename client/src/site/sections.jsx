import { useEffect, useState } from 'react'
import { useLang, useT, Link, lines } from './lang.jsx'
import { Icon, ICONS, Arrow, Pin, Lock, Check, M, MD, G, GT, N, NM } from '../shared/icons.jsx'

const CR = 18
const CS = '0 2px 18px rgba(0,0,0,0.07)'
const CB = '1px solid #EAE7E2'
const BG = { white: '#fff', cream: '#FAFAF8', warm: '#F4F2EE', navy: N, maroon: M }
const isDark = bg => bg === 'navy' || bg === 'maroon'
const H2 = { fontFamily: 'Cairo, sans-serif', fontSize: 'clamp(28px,3.2vw,44px)', fontWeight: 900, margin: 0 }

const useDir = () => (useLang().lang === 'ar' ? 'rtl' : 'ltr')

function Label({ text, center = false, dark = false }) {
  if (!text) return null
  const color = dark ? G : GT
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: center ? 'center' : 'flex-start', margin: '0 0 14px' }}>
      <span aria-hidden="true" style={{ width: 26, height: 2, background: G, borderRadius: 1, display: 'block', flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 700, color, letterSpacing: '0.06em' }}>{text}</span>
    </div>
  )
}

function Shell({ content, defaultBg = 'white', children, style, padding }) {
  const bg = content.bg || defaultBg
  return (
    <section id={content.anchor || undefined} className={padding ? undefined : 'ec-section'}
      style={{ background: BG[bg] || bg, position: 'relative', overflow: 'hidden', ...(padding ? { padding } : {}), ...style }}>
      <div className="ec-inner">{children}</div>
    </section>
  )
}

function Head({ c, center = true, dark = false, action, margin = '0 0 52px' }) {
  const t = useT()
  const titleColor = dark ? '#fff' : N
  const subColor = dark ? 'rgba(255,255,255,0.78)' : '#5A5450'
  if (!t(c.eyebrow) && !t(c.title) && !t(c.subtitle) && !action) return null
  const block = (
    <div>
      <Label text={t(c.eyebrow)} center={center && !action} dark={dark} />
      {t(c.title) && <h2 style={{ ...H2, color: titleColor, margin: center && !action ? '0 0 10px' : 0 }}>{t(c.title)}</h2>}
      {t(c.subtitle) && <p style={{ fontSize: 16.5, lineHeight: 1.8, color: subColor, maxWidth: center && !action ? 560 : 640, margin: center && !action ? '0 auto' : '8px 0 0' }}>{t(c.subtitle)}</p>}
    </div>
  )
  if (action) {
    return <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', margin, flexWrap: 'wrap', gap: 16 }}>{block}{action}</div>
  }
  return <div style={{ textAlign: center ? 'center' : 'start', margin }}>{block}</div>
}

function OutlineButton({ c, k = 'button' }) {
  const t = useT()
  if (!t(c[k])) return null
  return <a className="ec-btn-outline" href={c[`${k}_url`] || '#'}>{t(c[k])}</a>
}

// ─── HERO ────────────────────────────────────────────────────────────────────
function Hero({ content: c, items }) {
  const { lang } = useLang()
  const t = useT()
  const dir = useDir()
  const amounts = String(c.amounts || '').split(',').map(s => Number(s.trim())).filter(n => n > 0)
  const [slide, setSlide] = useState(0)
  const [type, setType] = useState('once')
  const [amount, setAmount] = useState(Number(c.default_amount) || amounts[0] || null)
  const [custom, setCustom] = useState('')
  const [cat, setCat] = useState('')
  const [notice, setNotice] = useState('')
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  const currency = c.currency || 'QAR'
  const slides = items.filter(i => i.image)

  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  useEffect(() => {
    if (slides.length < 2) return
    const ms = Math.max(3, Number(c.slide_seconds) || 8) * 1000
    const id = setInterval(() => setSlide(s => (s + 1) % slides.length), ms)
    return () => clearInterval(id)
  }, [slides.length, c.slide_seconds])

  const current = slides[slide % Math.max(1, slides.length)]
  const finalAmount = custom ? Number(custom) : amount
  const categories = lines(t(c.categories))

  const donate = () => {
    if (!finalAmount || finalAmount <= 0) { setNotice(lang === 'ar' ? 'اختر مبلغ التبرع أولًا' : 'Please choose an amount'); return }
    if (!c.donate_action_url) { setNotice(lang === 'ar' ? 'بوابة الدفع غير مفعلة بعد' : 'Online payment is not available yet'); return }
    const url = new URL(c.donate_action_url, window.location.origin)
    url.searchParams.set('amount', String(finalAmount))
    url.searchParams.set('type', type)
    if (cat) url.searchParams.set('category', cat)
    window.location.href = url.toString()
  }

  return (
    <section id={c.anchor || undefined} style={{ position: 'relative', minHeight: mobile ? '100svh' : '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: N }}>
      {slides.map((s, i) => (
        <img key={i} src={s.image} alt="" aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: s.position || '50% 50%',
            filter: 'brightness(1.12) saturate(1.15)', opacity: i === slide ? 1 : 0, transition: 'opacity 1.6s ease' }} />
      ))}
      <div style={{ position: 'absolute', inset: 0,
        background: `linear-gradient(${lang === 'ar' ? 'to left' : 'to right'}, rgba(6,14,28,0.72) 0%, rgba(6,14,28,0.52) 22%, rgba(6,14,28,0.22) 46%, rgba(6,14,28,0.04) 66%, transparent 100%)` }} />

      {slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: 20, right: 0, left: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 10 }}>
          {t(current?.label) && (
            <div aria-live="polite" style={{ background: 'rgba(6,14,28,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 16px', fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
              {t(current.label)}
            </div>
          )}
          <div style={{ display: 'flex', gap: 2 }}>
            {slides.map((s, i) => (
              <button key={i} className="ec-dot" onClick={() => setSlide(i)} aria-label={t(s.label) || `${i + 1}`} aria-current={i === slide}>
                <span style={{ width: i === slide ? 28 : 8, background: i === slide ? '#fff' : 'rgba(255,255,255,0.55)' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: mobile ? '56px 20px 110px' : '72px 64px', width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ width: mobile ? '100%' : undefined, maxWidth: mobile ? '100%' : 570, background: 'rgba(6,14,30,0.58)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
            borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', padding: mobile ? '28px 20px 24px' : '36px 36px 32px', boxShadow: '0 8px 48px rgba(0,0,0,0.28)' }}>
            <Label text={t(c.eyebrow)} dark />
            <h1 style={{ fontFamily: 'Cairo, sans-serif', fontSize: mobile ? 'clamp(38px,10vw,60px)' : 'clamp(44px,5.5vw,78px)', fontWeight: 900, lineHeight: 1.08, color: '#fff', margin: '0 0 14px' }}>
              {t(c.title)}{t(c.title_gold) && <><br /><span style={{ color: G }}>{t(c.title_gold)}</span></>}
            </h1>
            {t(c.subtitle) && <p style={{ fontSize: mobile ? 15.5 : 17, color: 'rgba(255,255,255,0.92)', lineHeight: 1.85, margin: '0 0 26px', maxWidth: 440 }}>{t(c.subtitle)}</p>}

            {(t(c.btn_primary) || t(c.btn_secondary)) && (
              <div style={{ display: 'flex', gap: 14, margin: c.show_donation_card ? '0 0 28px' : 0, flexWrap: 'wrap' }}>
                {t(c.btn_primary) && <a className="ec-btn-primary" href={c.btn_primary_url || '#'} style={{ padding: '14px 38px', fontSize: 16 }}>{t(c.btn_primary)}</a>}
                {t(c.btn_secondary) && <a className="ec-btn-ghost" href={c.btn_secondary_url || '#'} style={{ fontSize: 15 }}>{t(c.btn_secondary)} <Arrow c="#fff" dir={dir} /></a>}
              </div>
            )}

            {c.show_donation_card && (
              <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.32)', overflow: 'hidden' }}>
                <div style={{ background: N, padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <h2 style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: 16, color: '#fff', margin: 0 }}>{t(c.donate_title)}</h2>
                  <div className="ec-toggle" role="group" aria-label={t(c.donate_title)}>
                    {['once', 'monthly'].map(tp => (
                      <button key={tp} type="button" aria-pressed={type === tp} onClick={() => setType(tp)}>
                        {type === tp && <Check />}{tp === 'once' ? t(c.once_label) : t(c.monthly_label)}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '18px 22px 20px' }}>
                  {categories.length > 0 && (
                    <select className="ec-field" value={cat} onChange={e => setCat(e.target.value)} aria-label={t(c.category_placeholder)}
                      style={{ margin: '0 0 12px', cursor: 'pointer', borderColor: cat ? M : undefined }}>
                      <option value="">{t(c.category_placeholder)}</option>
                      {categories.map(o => <option key={o}>{o}</option>)}
                    </select>
                  )}

                  {amounts.length > 0 && (
                    <div role="group" aria-label={lang === 'ar' ? 'مبلغ التبرع' : 'Donation amount'}
                      style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(4, amounts.length)},1fr)`, gap: 8, margin: '0 0 10px' }}>
                      {amounts.map(a => {
                        const on = amount === a && !custom
                        return (
                          <button key={a} type="button" className="ec-amount-btn" aria-pressed={on} onClick={() => { setAmount(a); setCustom(''); setNotice('') }}
                            style={{ padding: '10px 4px', borderRadius: 9, border: `2px solid ${on ? M : '#D6D1CA'}`, background: on ? M : '#fff', color: on ? '#fff' : N, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                            {a.toLocaleString('en-US')}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px' }}>
                    <input className="ec-field" type="number" min="1" inputMode="numeric" placeholder={t(c.other_amount)} aria-label={t(c.other_amount)} value={custom}
                      onChange={e => { setCustom(e.target.value); setAmount(null); setNotice('') }}
                      style={{ flex: 1, textAlign: 'start', borderColor: custom ? M : undefined }} />
                    <span style={{ fontSize: 14, color: '#6A6560', whiteSpace: 'nowrap', flexShrink: 0 }}>{currency}</span>
                  </div>

                  <button type="button" onClick={donate} className="ec-btn-primary" style={{ width: '100%', padding: 14, fontSize: 16, borderRadius: 12, background: `linear-gradient(135deg,${M},${MD})` }}>
                    {t(c.donate_button)} — {finalAmount ? `${Number(finalAmount).toLocaleString('en-US')} ${currency}` : currency}
                  </button>
                  {notice && <p role="status" style={{ textAlign: 'center', fontSize: 13.5, color: M, fontWeight: 700, margin: '10px 0 0' }}>{notice}</p>}
                  {t(c.secure_note) && (
                    <p style={{ textAlign: 'center', fontSize: 12.5, color: '#6A6560', margin: '10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <Lock /> {t(c.secure_note)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── GATES (ABWAB) ───────────────────────────────────────────────────────────
function Gates({ content: c, items }) {
  const t = useT()
  return (
    <Shell content={c}>
      <Head c={c} />
      <div className="ec-grid-abwab" style={{ margin: '0 0 42px' }}>
        {items.map((it, i) => (
          <a key={i} className="ec-gate-btn" href={it.url || '#'}>
            <Icon name={it.icon} image={it.icon_image} />
            <span style={{ fontSize: 14, fontWeight: 700, color: N, textAlign: 'center', lineHeight: 1.3 }}>{t(it.name)}</span>
          </a>
        ))}
      </div>
      <div style={{ textAlign: 'center' }}><OutlineButton c={c} /></div>
    </Shell>
  )
}

// ─── CAMPAIGNS ───────────────────────────────────────────────────────────────
function Campaigns({ content: c, items }) {
  const t = useT()
  const cur = c.currency || 'QAR'
  const fmt = n => Number(n || 0).toLocaleString('en-US')
  return (
    <Shell content={c} defaultBg="warm">
      <Head c={c} center={false} action={<OutlineButton c={c} />} margin="0 0 48px" />
      <div className="ec-grid-3">
        {items.map((it, i) => {
          const pct = it.target ? Math.min(100, Math.round((Number(it.raised) / Number(it.target)) * 100)) : 0
          return (
            <article key={i} className="ec-card-hover" style={{ background: '#fff', borderRadius: CR, overflow: 'hidden', boxShadow: CS, display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', height: 218, overflow: 'hidden' }} className="ec-img-zoom">
                {it.image && <img src={it.image} alt={t(it.name)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                {t(it.location) && (
                  <div style={{ position: 'absolute', top: 12, insetInlineEnd: 12, background: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 700, color: N, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Pin c={M} s={12} /> {t(it.location)}
                  </div>
                )}
              </div>
              <div style={{ padding: '22px 22px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: 18.5, fontWeight: 800, color: N, margin: '0 0 7px', lineHeight: 1.3 }}>{t(it.name)}</h3>
                <p style={{ fontSize: 14.5, color: '#5A5450', lineHeight: 1.75, margin: '0 0 18px' }}>{t(it.desc)}</p>
                {Number(it.target) > 0 && <>
                  <div className="ec-progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t(it.name)} style={{ margin: '0 0 9px' }}>
                    <div className="ec-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, margin: '0 0 6px', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ color: M, fontWeight: 800 }}>{pct}% {t(c.pct_label)}</strong>
                    <span style={{ color: '#6A6560' }}>{t(c.target_label)}: {fmt(it.target)} {cur}</span>
                  </div>
                  <div style={{ fontSize: 13.5, color: '#6A6560', margin: '0 0 4px' }}>
                    {t(c.raised_label)}: <strong style={{ color: N }}>{fmt(it.raised)} {cur}</strong>
                    {Number(it.beneficiaries) > 0 && <span> · {t(c.beneficiaries_label)}: {fmt(it.beneficiaries)}</span>}
                  </div>
                </>}
                <div style={{ flex: 1 }} />
                {t(it.permit) && <div style={{ fontSize: 12.5, color: '#6A6560', padding: '11px 0', borderTop: '1px solid #F0EDE8', margin: '12px 0 14px' }}>{t(it.permit)}</div>}
                {t(c.cta) && <a className="ec-btn-primary" href={it.url || '#donate'} style={{ width: '100%', padding: 13, fontSize: 15.5 }}>{t(c.cta)}</a>}
              </div>
            </article>
          )
        })}
      </div>
    </Shell>
  )
}

// ─── CENTERS ─────────────────────────────────────────────────────────────────
function Centers({ content: c, items }) {
  const t = useT()
  return (
    <Shell content={c}>
      <Head c={c} />
      <div className="ec-grid-4" style={{ gap: 18 }}>
        {items.map((it, i) => {
          const shade = /^#[0-9a-f]{6}$/i.test(it.shade || '') ? it.shade : '#08162A'
          return (
            <Link key={i} href={it.url} as="div" className="ec-img-zoom" style={{ borderRadius: CR, overflow: 'hidden', position: 'relative', height: 460, display: 'block' }}>
              {it.image && <img src={it.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top,${shade}F8 0%,${shade}B0 50%,${shade}18 100%)` }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 22px' }}>
                <h3 style={{ color: '#fff', fontFamily: 'Cairo, sans-serif', fontSize: 20, fontWeight: 900, margin: '0 0 8px' }}>{t(it.name)}</h3>
                <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 14, lineHeight: 1.7, margin: '0 0 18px' }}>{t(it.desc)}</p>
                {t(c.button) && <span className="ec-btn-ghost" style={{ padding: '8px 20px', fontSize: 13.5 }}>{t(c.button)}</span>}
              </div>
            </Link>
          )
        })}
      </div>
    </Shell>
  )
}

// ─── IMPACT NUMBERS ──────────────────────────────────────────────────────────
function Impact({ content: c, items }) {
  const t = useT()
  return (
    <section id={c.anchor || undefined} className="ec-section" style={{ background: `linear-gradient(155deg,${N} 0%,${NM} 100%)`, position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{ position: 'absolute', top: -120, left: -120, width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(182,144,48,0.1)', pointerEvents: 'none' }} />
      <div className="ec-inner">
        <Head c={c} dark />
        <div className="ec-grid-4">
          {items.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '28px 16px', borderInlineEnd: i < items.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
              <div dir="ltr" style={{ fontFamily: 'Cairo, sans-serif', fontSize: 'clamp(52px,6vw,76px)', fontWeight: 900, color: G, lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '4px 0 0' }}>{t(s.unit)}</div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: '10px 0 0' }}>{t(s.label)}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.68)', margin: '4px 0 0' }}>{t(s.note)}</div>
            </div>
          ))}
        </div>
        {t(c.note) && <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.62)', margin: '34px 0 0' }}>{t(c.note)}</p>}
      </div>
    </section>
  )
}

// ─── STORY ───────────────────────────────────────────────────────────────────
function Story({ content: c }) {
  const t = useT()
  const dir = useDir()
  return (
    <Shell content={c} defaultBg="cream">
      <div className="ec-grid-story">
        <div className="ec-img-zoom" style={{ borderRadius: CR + 4, overflow: 'hidden', height: 480, position: 'relative', background: '#EAE7E2' }}>
          {c.image && <img src={c.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />}
          {(t(c.badge) || t(c.location)) && (
            <div style={{ position: 'absolute', bottom: 20, insetInlineEnd: 20, background: 'rgba(255,255,255,0.97)', borderRadius: 12, padding: '12px 18px', boxShadow: '0 6px 22px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: 12.5, color: GT, fontWeight: 700, letterSpacing: '0.05em' }}>{t(c.badge)}</div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: N, margin: '3px 0 0' }}>{t(c.location)}</div>
            </div>
          )}
        </div>
        <div>
          {t(c.badge) && <div style={{ display: 'inline-block', background: '#FDF0F4', color: M, fontSize: 13, fontWeight: 700, padding: '5px 14px', borderRadius: 20, margin: '0 0 20px', letterSpacing: '0.04em' }}>{t(c.badge)}</div>}
          <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: 'clamp(26px,2.8vw,42px)', fontWeight: 900, color: N, lineHeight: 1.25, margin: '0 0 18px' }}>
            {lines(t(c.title)).map((l, i, a) => <span key={i}>{l}{i < a.length - 1 && <br />}</span>)}
          </h2>
          <div aria-hidden="true" style={{ width: 48, height: 3, background: G, borderRadius: 2, margin: '0 0 24px' }} />
          {t(c.quote) && <blockquote style={{ fontSize: 17, color: '#4A4540', lineHeight: 2, margin: '0 0 14px', borderInlineStart: `3px solid ${M}33`, paddingInlineStart: 18 }}>{t(c.quote)}</blockquote>}
          {t(c.attribution) && <p style={{ fontSize: 14, color: '#6A6560', margin: '0 0 34px', fontStyle: 'italic' }}>{t(c.attribution)}</p>}
          {t(c.button) && (
            <a href={c.button_url || '#'} style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color: M, fontWeight: 800, fontSize: 16 }}>
              {t(c.button)}
              <span style={{ width: 44, height: 44, borderRadius: '50%', background: '#FDF0F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Arrow c={M} dir={dir} /></span>
            </a>
          )}
        </div>
      </div>
    </Shell>
  )
}

// ─── PROJECTS ────────────────────────────────────────────────────────────────
function Projects({ content: c, items }) {
  const t = useT()
  const dir = useDir()
  const [tab, setTab] = useState('tab1')
  const tabs = [['tab1', t(c.tab1)], ['tab2', t(c.tab2)]].filter(([k, l]) => l && items.some(i => (i.tab || 'tab1') === k))
  const active = tabs.some(([k]) => k === tab) ? tab : tabs[0]?.[0] || 'tab1'
  const cur = items.filter(i => (i.tab || 'tab1') === active)
  return (
    <Shell content={c}>
      <Head c={c} center={false} margin="0 0 40px" action={tabs.length > 1 ? (
        <div role="tablist" style={{ display: 'flex', border: CB, borderRadius: 50, overflow: 'hidden', background: '#fff' }}>
          {tabs.map(([key, label]) => (
            <button key={key} role="tab" aria-selected={active === key} onClick={() => setTab(key)}
              style={{ padding: '11px 30px', minHeight: 44, fontWeight: 700, fontSize: 14.5, background: active === key ? M : 'transparent', color: active === key ? '#fff' : '#5A5450', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
              {label}
            </button>
          ))}
        </div>
      ) : <span />} />
      <div className="ec-grid-3" role={tabs.length > 1 ? 'tabpanel' : undefined}>
        {cur.map((p, i) => (
          <article key={i} className="ec-card-hover" style={{ borderRadius: CR, overflow: 'hidden', border: CB, background: '#fff' }}>
            <div style={{ height: 196, overflow: 'hidden' }} className="ec-img-zoom">
              {p.image && <img src={p.image} alt={t(p.type)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ padding: '18px 20px 22px' }}>
              <div style={{ display: 'flex', gap: 8, margin: '0 0 10px', flexWrap: 'wrap' }}>
                {t(p.type) && <span style={{ background: '#FDF0F4', color: M, fontSize: 13, fontWeight: 700, padding: '3px 11px', borderRadius: 20 }}>{t(p.type)}</span>}
                {t(p.location) && <span style={{ background: '#F4F2EE', color: '#5A5450', fontSize: 13, fontWeight: 600, padding: '3px 11px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}><Pin c="#5A5450" s={12} /> {t(p.location)}</span>}
              </div>
              <p style={{ fontSize: 14.5, color: '#5A5450', lineHeight: 1.75, margin: '0 0 14px' }}>{t(p.desc)}</p>
              {t(c.view_label) && <a href={p.url || '#'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: M, fontWeight: 700, fontSize: 14.5, minHeight: 32 }}>{t(c.view_label)} <Arrow c={M} s={14} dir={dir} /></a>}
            </div>
          </article>
        ))}
      </div>
    </Shell>
  )
}

// ─── GOVERNANCE ──────────────────────────────────────────────────────────────
function Governance({ content: c, items }) {
  const t = useT()
  const dir = useDir()
  return (
    <section id={c.anchor || undefined} className="ec-section" style={{ background: N, position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{ position: 'absolute', top: 0, right: 0, width: 340, height: 340, background: 'rgba(182,144,48,0.05)', borderRadius: '0 0 0 100%', pointerEvents: 'none' }} />
      <div className="ec-inner">
        <Head c={c} dark />
        <div className="ec-grid-4" style={{ margin: '0 0 44px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: CR, overflow: 'hidden' }}>
          {items.map((it, i) => (
            <a key={i} href={it.url || '#'} className="ec-gov-card" style={{ padding: '36px 28px', borderInlineEnd: i < items.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
              <div style={{ margin: '0 0 18px' }}><Icon name={it.icon || 'doc'} image={it.icon_image} /></div>
              <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: 19, fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>{t(it.title)}</h3>
              <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.8, margin: '0 0 22px' }}>{t(it.desc)}</p>
              {t(c.view_label) && <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: G, fontSize: 14.5, fontWeight: 700 }}>{t(c.view_label)} <Arrow c={G} s={14} dir={dir} /></div>}
            </a>
          ))}
        </div>
        {t(c.button) && <div style={{ textAlign: 'center' }}><a className="ec-btn-gold" href={c.button_url || '#'}>{t(c.button)}</a></div>}
      </div>
    </section>
  )
}

// ─── JOIN ────────────────────────────────────────────────────────────────────
function Join({ content: c, items }) {
  const t = useT()
  const BGS = { [M]: '#FAF4F6', [NM]: '#F2F4FA', [GT]: '#FAF7EF' }
  return (
    <Shell content={c} defaultBg="warm">
      <Head c={c} margin="0 0 48px" />
      <div className="ec-grid-3">
        {items.map((it, i) => {
          const accent = /^#[0-9a-f]{6}$/i.test(it.accent || '') ? it.accent : M
          const IconC = ICONS[it.icon] || ICONS.heart
          return (
            <div key={i} className="ec-card-hover" style={{ background: BGS[accent.toUpperCase()] || '#fff', borderRadius: CR, padding: '40px 34px', border: `1px solid ${accent}22` }}>
              <div style={{ margin: '0 0 20px' }}><IconC c={accent} /></div>
              <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: 26, fontWeight: 900, color: N, margin: '0 0 10px' }}>{t(it.title)}</h3>
              <p style={{ fontSize: 15, color: '#4A4540', lineHeight: 1.85, margin: '0 0 28px' }}>{t(it.desc)}</p>
              {t(it.cta) && <a href={it.url || '#'} className="ec-hover-fade" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, background: accent, color: '#fff', padding: '10px 28px', borderRadius: 50, fontWeight: 700, fontSize: 14.5 }}>{t(it.cta)}</a>}
            </div>
          )
        })}
      </div>
    </Shell>
  )
}

// ─── MEDIA / NEWS ────────────────────────────────────────────────────────────
function Media({ content: c, items }) {
  const t = useT()
  if (!items.length) return null
  const [first, ...rest] = items
  return (
    <Shell content={c}>
      <Head c={c} center={false} margin="0 0 40px" action={<OutlineButton c={c} />} />
      <div className={rest.length ? 'ec-grid-2asym' : undefined}>
        <a href={first.url || '#'} className="ec-card-hover ec-img-zoom" style={{ borderRadius: CR, overflow: 'hidden', border: CB, display: 'block', background: '#fff' }}>
          <div style={{ height: 300, overflow: 'hidden' }}>{first.image && <img src={first.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
          <div style={{ padding: '22px 24px 26px' }}>
            <div style={{ fontSize: 13, color: GT, fontWeight: 700, margin: '0 0 10px' }}>{t(first.date)}</div>
            <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: 20, fontWeight: 800, color: N, margin: '0 0 10px', lineHeight: 1.4 }}>{t(first.title)}</h3>
            <p style={{ fontSize: 14.5, color: '#5A5450', lineHeight: 1.75, margin: 0 }}>{t(first.desc)}</p>
          </div>
        </a>
        {rest.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {rest.map((n, i) => (
              <a key={i} href={n.url || '#'} className="ec-card-hover" style={{ display: 'flex', borderRadius: CR - 4, overflow: 'hidden', border: CB, background: '#fff' }}>
                <div style={{ width: 120, flexShrink: 0, overflow: 'hidden' }} className="ec-img-zoom">
                  {n.image && <img src={n.image} alt="" style={{ width: '100%', height: '100%', minHeight: 124, objectFit: 'cover' }} />}
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 12.5, color: GT, fontWeight: 700, margin: '0 0 6px' }}>{t(n.date)}</div>
                  <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: 15, fontWeight: 800, color: N, margin: '0 0 6px', lineHeight: 1.4 }}>{t(n.title)}</h3>
                  <p style={{ fontSize: 13.5, color: '#5A5450', lineHeight: 1.65, margin: 0 }}>{t(n.desc)}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </Shell>
  )
}

// ─── PARTNERS ────────────────────────────────────────────────────────────────
function Partners({ content: c, items }) {
  const t = useT()
  return (
    <Shell content={c} defaultBg="warm" padding="64px 0">
      <div style={{ textAlign: 'center', margin: '0 0 38px' }}>
        <Label text={t(c.eyebrow)} center />
        {t(c.title) && <h2 style={{ fontFamily: 'Cairo, sans-serif', fontSize: 30, fontWeight: 900, color: N, margin: 0 }}>{t(c.title)}</h2>}
      </div>
      <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', alignItems: 'center', listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((p, i) => (
          <li key={i}>
            <Link href={p.url} as="div" className="ec-partner-logo" aria-label={t(p.name)}>
              {p.logo ? <img src={p.logo} alt={t(p.name)} />
                : <>
                  <div aria-hidden="true" style={{ width: 56, height: 28, background: '#D6D1CA', borderRadius: 6 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#5A5450', textAlign: 'center', padding: '0 8px' }}>{t(p.name)}</span>
                </>}
            </Link>
          </li>
        ))}
      </ul>
    </Shell>
  )
}

// ─── GENERIC CARDS ───────────────────────────────────────────────────────────
function Cards({ content: c, items }) {
  const t = useT()
  const dir = useDir()
  const cls = { 2: 'ec-grid-2', 3: 'ec-grid-3', 4: 'ec-grid-4g' }[c.columns] || 'ec-grid-3'
  return (
    <Shell content={c}>
      <Head c={c} />
      <div className={cls} style={{ margin: t(c.button) ? '0 0 42px' : 0 }}>
        {items.map((it, i) => (
          <article key={i} className="ec-card-hover" style={{ borderRadius: CR, overflow: 'hidden', border: CB, background: '#fff' }}>
            {it.image && <div style={{ height: 200, overflow: 'hidden' }} className="ec-img-zoom"><img src={it.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
            <div style={{ padding: '20px 22px 24px' }}>
              <h3 style={{ fontFamily: 'Cairo, sans-serif', fontSize: 19, fontWeight: 800, color: N, margin: '0 0 8px' }}>{t(it.title)}</h3>
              <p style={{ fontSize: 14.5, color: '#5A5450', lineHeight: 1.75, margin: '0 0 12px', whiteSpace: 'pre-line' }}>{t(it.desc)}</p>
              {t(it.link_label) && <a href={it.url || '#'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: M, fontWeight: 700, fontSize: 14.5, minHeight: 32 }}>{t(it.link_label)} <Arrow c={M} s={14} dir={dir} /></a>}
            </div>
          </article>
        ))}
      </div>
      <div style={{ textAlign: 'center' }}><OutlineButton c={c} /></div>
    </Shell>
  )
}

// ─── TEXT + IMAGE ────────────────────────────────────────────────────────────
function TextBlock({ content: c }) {
  const t = useT()
  const dark = isDark(c.bg)
  const text = (
    <div>
      <Label text={t(c.eyebrow)} dark={dark} />
      {t(c.title) && <h2 style={{ ...H2, color: dark ? '#fff' : N, margin: '0 0 16px' }}>{t(c.title)}</h2>}
      {t(c.body) && <div style={{ fontSize: 17, lineHeight: 2, color: dark ? 'rgba(255,255,255,0.85)' : '#4A4540', whiteSpace: 'pre-line', margin: '0 0 26px' }}>{t(c.body)}</div>}
      {t(c.button) && <a className={dark ? 'ec-btn-gold' : 'ec-btn-primary'} href={c.button_url || '#'}>{t(c.button)}</a>}
    </div>
  )
  if (!c.image) return <Shell content={c}><div style={{ maxWidth: 820 }}>{text}</div></Shell>
  const img = <div style={{ borderRadius: CR + 4, overflow: 'hidden', height: 420 }}><img src={c.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
  return <Shell content={c}><div className="ec-grid-story">{c.image_side === 'start' ? <>{img}{text}</> : <>{text}{img}</>}</div></Shell>
}

// ─── CTA BANNER ──────────────────────────────────────────────────────────────
function CtaBanner({ content: c }) {
  const t = useT()
  const base = c.bg === 'navy' ? N : M
  return (
    <section id={c.anchor || undefined} style={{ position: 'relative', overflow: 'hidden', background: base, padding: '72px 0' }}>
      {c.image && <>
        <img src={c.image} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: `${base}D9` }} />
      </>}
      <div className="ec-inner" style={{ position: 'relative', textAlign: 'center' }}>
        {t(c.title) && <h2 style={{ ...H2, color: '#fff', margin: '0 0 12px' }}>{t(c.title)}</h2>}
        {t(c.subtitle) && <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.88)', maxWidth: 620, margin: '0 auto 28px', lineHeight: 1.8 }}>{t(c.subtitle)}</p>}
        {t(c.button) && <a href={c.button_url || '#'} className="ec-hover-fade" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 48, background: '#fff', color: base, padding: '12px 40px', borderRadius: 50, fontWeight: 800, fontSize: 16 }}>{t(c.button)}</a>}
      </div>
    </section>
  )
}

export const SECTION_COMPONENTS = {
  hero: Hero, gates: Gates, campaigns: Campaigns, centers: Centers, impact: Impact, story: Story,
  projects: Projects, governance: Governance, join: Join, media: Media, partners: Partners,
  cards: Cards, text_block: TextBlock, cta_banner: CtaBanner,
}
