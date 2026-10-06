import { useEffect, useRef, useState } from 'react'
import { LangCtx, useLang, useT, Link } from './lang.jsx'
import { SECTION_COMPONENTS, PageBanner } from './sections.jsx'
import { ChevDown, Phone, Mail, Pin, SOCIAL_ICONS, SOCIAL_OPTIONS, M, G, N } from '../shared/icons.jsx'
import './site.css'

function readLang() {
  try { return localStorage.getItem('ec-lang') === 'en' ? 'en' : 'ar' } catch { return 'ar' }
}

// Sub-pages live at /page/<slug>; everything else is the home page.
const pageSlug = (/^\/page\/([A-Za-z0-9-]+)\/?$/.exec(window.location.pathname) || [])[1] || null

export default function Site() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [lang, setLang] = useState(readLang)

  useEffect(() => {
    const notFound = () => fetch('/api/site').then(r => r.json()).then(d => setData({ ...d, sections: [], notFound: true }))
    fetch(pageSlug ? `/api/page/${pageSlug}` : '/api/site')
      .then(r => { if (r.status === 503) throw new Error('setup'); if (r.status === 404 && pageSlug) return notFound(); if (!r.ok) throw new Error(); return r.json().then(setData) })
      .catch(e => setError(e.message === 'setup' ? 'setup' : true))
  }, [])

  // On a sub-page, links to home-page sections (#impact, #donate…) go back to the home page.
  useEffect(() => {
    if (!pageSlug) return
    const onClick = e => {
      const a = e.target.closest?.('a[href^="#"]')
      const hash = a?.getAttribute('href')
      if (!hash || hash === '#' || document.getElementById(decodeURIComponent(hash.slice(1)))) return
      e.preventDefault()
      window.location.href = '/' + hash
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    try { localStorage.setItem('ec-lang', lang) } catch { /* private mode */ }
  }, [lang])

  useEffect(() => {
    if (data?.settings?.site_name) {
      const n = data.settings.site_name
      const site = (lang === 'en' ? n.en : n.ar) || n.ar || ''
      const p = data.page
      const page = p ? (lang === 'en' ? p.title_en : p.title_ar) || p.title_ar || p.title_en : data.notFound ? (lang === 'en' ? 'Page not found' : 'الصفحة غير موجودة') : ''
      document.title = page ? `${page} | ${site}` : site
    }
  }, [data, lang])

  // Jump to #anchor after content loads
  useEffect(() => {
    if (data && window.location.hash) {
      const el = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
      if (el) setTimeout(() => el.scrollIntoView(), 50)
    }
  }, [data])

  if (error === 'setup') return <div className="ec-loading">الموقع قيد التجهيز. <a href="/admin" style={{ color: M, fontWeight: 700, marginInlineStart: 6 }}>ابدأ التجهيز</a></div>
  if (error) return <div className="ec-loading">تعذر تحميل المحتوى، حاول تحديث الصفحة.</div>
  if (!data) return <div className="ec-loading" aria-live="polite">جارِ التحميل…</div>

  const toggle = () => setLang(l => (l === 'ar' ? 'en' : 'ar'))
  const settings = data.settings || {}

  return (
    <LangCtx.Provider value={{ lang, toggle, settings }}>
      <div style={{ fontFamily: 'Cairo, sans-serif', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
        <a href="#main" className="ec-skip">{lang === 'ar' ? 'انتقل إلى المحتوى' : 'Skip to content'}</a>
        {settings.topbar_visible !== false && <TopBar />}
        <Header menu={data.menu || []} />
        <main id="main">
          {data.page && <PageBanner page={data.page} />}
          {data.notFound && <NotFound />}
          {data.sections.map(s => {
            const C = SECTION_COMPONENTS[s.type]
            return C ? <C key={s.id} section={s} content={s.content || {}} items={(s.items || []).map(i => i.content || {})} /> : null
          })}
        </main>
        <Footer />
      </div>
    </LangCtx.Provider>
  )
}

function NotFound() {
  const { lang } = useLang()
  return (
    <section className="ec-notfound">
      <h1 style={{ fontSize: 'clamp(26px,3vw,40px)', fontWeight: 900, color: N, margin: '0 0 12px' }}>{lang === 'ar' ? 'الصفحة غير موجودة' : 'Page not found'}</h1>
      <p style={{ color: '#5A5450', fontSize: 16, margin: '0 0 28px' }}>{lang === 'ar' ? 'ربما تم نقل الصفحة أو حذفها.' : 'The page may have been moved or removed.'}</p>
      <a className="ec-btn-primary" href="/">{lang === 'ar' ? 'العودة للرئيسية' : 'Back to home'}</a>
    </section>
  )
}

function Socials({ className, color }) {
  const { settings } = useLang()
  const names = Object.fromEntries(SOCIAL_OPTIONS)
  return (settings.socials || []).filter(s => s.url).map((s, i) => {
    const Icon = SOCIAL_ICONS[s.platform] || SOCIAL_ICONS.facebook
    return (
      <a key={i} href={s.url} className={className} aria-label={names[s.platform] || s.platform} target="_blank" rel="noopener noreferrer">
        <Icon c={color} />
      </a>
    )
  })
}

// ─── TOP UTILITY BAR ─────────────────────────────────────────────────────────
function TopBar() {
  const { lang, toggle, settings } = useLang()
  const t = useT()
  const links = settings.topbar_links || []
  return (
    <div className="ec-topbar-wrap" style={{ background: N, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '4px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="ec-util-link" onClick={toggle} lang={lang === 'ar' ? 'en' : 'ar'}
            style={{ fontWeight: 700, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.92)' }}>
            {lang === 'ar' ? 'English' : 'العربية'}
          </button>
          {links.map((l, i) => (
            <span key={i} style={{ display: 'contents' }}>
              <span aria-hidden="true" style={{ color: 'rgba(255,255,255,0.25)', userSelect: 'none' }}>|</span>
              <a className="ec-util-link" href={l.url || '#'}>{t(l.label)}</a>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Socials className="ec-topbar-social" color="rgba(255,255,255,0.78)" />
        </div>
      </div>
    </div>
  )
}

// ─── HEADER + MEGA MENU ──────────────────────────────────────────────────────
function MegaPanel({ item, onEnter, onLeave }) {
  const t = useT()
  const groups = item.children || []
  const cols = [...new Set(groups.map(g => Number(g.extra?.col) || 1))].sort((a, b) => a - b)
  const featured = item.extra?.featured
  const { lang } = useLang()
  const label = g => (lang === 'en' ? g.label_en : g.label_ar) || g.label_ar || g.label_en
  return (
    <div className="ec-mega-panel" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 48px', display: 'flex' }}>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${cols.length || 1}, 1fr)`, padding: '28px 0' }}>
          {cols.map((col, ci) => (
            <div key={col} style={{ padding: '0 28px', borderInlineEnd: ci < cols.length - 1 ? '1px solid #F0EDE8' : 'none' }}>
              {groups.filter(g => (Number(g.extra?.col) || 1) === col).map(g => g.children?.length ? (
                <div key={g.id} style={{ margin: '0 0 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 10px', paddingBottom: 9, borderBottom: '1.5px solid #F0EDE8' }}>
                    <span style={{ width: 3, height: 14, background: M, borderRadius: 2, display: 'block', flexShrink: 0 }} />
                    <Link href={g.url && g.url !== '#' ? g.url : ''} style={{ fontSize: 13, fontWeight: 800, color: N, letterSpacing: '0.04em' }}>{label(g)}</Link>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {g.children.map(l => <li key={l.id}><a className="ec-mega-link" href={l.url || '#'}>{label(l)}</a></li>)}
                  </ul>
                </div>
              ) : (
                <a key={g.id} className="ec-mega-link" href={g.url || '#'}>{label(g)}</a>
              ))}
            </div>
          ))}
        </div>
        {featured?.title && (featured.title.ar || featured.title.en) && (
          <div style={{ width: 280, flexShrink: 0, borderInlineStart: '1px solid #F0EDE8', padding: '28px 0', paddingInlineStart: 28 }}>
            <div style={{ borderRadius: 14, overflow: 'hidden', background: N }}>
              {featured.img && (
                <div style={{ height: 150, overflow: 'hidden', position: 'relative' }}>
                  <img src={featured.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,27,53,0.6), transparent)' }} />
                  {t(featured.label) && <span style={{ position: 'absolute', top: 10, insetInlineEnd: 10, background: M, color: '#fff', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>{t(featured.label)}</span>}
                </div>
              )}
              <div style={{ padding: '14px 16px 18px' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 6px', lineHeight: 1.35 }}>{t(featured.title)}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: '0 0 14px' }}>{t(featured.desc)}</div>
                {t(featured.cta) && <a href={featured.url || '#'} className="ec-hover-fade" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 36, background: G, color: N, borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 800 }}>{t(featured.cta)}</a>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Header({ menu }) {
  const { lang, toggle, settings } = useLang()
  const t = useT()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openMobileId, setOpenMobileId] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const closeTimer = useRef(null)
  const headerRef = useRef(null)

  const open = id => { clearTimeout(closeTimer.current); setActiveId(id) }
  const scheduleClose = () => { closeTimer.current = setTimeout(() => setActiveId(null), 150) }
  const cancelClose = () => clearTimeout(closeTimer.current)

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') setActiveId(null) }
    const onClick = e => { if (headerRef.current && !headerRef.current.contains(e.target)) setActiveId(null) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('click', onClick) }
  }, [])

  const active = menu.find(m => m.id === activeId && m.children?.length)
  const label = m => (lang === 'en' ? m.label_en : m.label_ar) || m.label_ar || m.label_en

  return (
    <header ref={headerRef} style={{ position: 'sticky', top: 0, zIndex: 50, background: '#fff', borderBottom: active ? 'none' : '1px solid #EAE7E2', boxShadow: '0 2px 18px rgba(0,0,0,0.06)' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', paddingInlineStart: 'clamp(16px, 3.3vw, 48px)', paddingInlineEnd: 'clamp(12px, 1.7vw, 24px)', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <img src={settings.logo || '/logo.jpg'} alt={t(settings.site_name) || 'Logo'} style={{ height: 66, width: 'auto', objectFit: 'contain' }} />
        </a>

        <nav className="ec-desktop-nav" aria-label={lang === 'ar' ? 'القائمة الرئيسية' : 'Main menu'}>
          {menu.map(m => {
            const hasKids = m.children?.length > 0
            const isActive = activeId === m.id
            return (
              <div key={m.id} style={{ position: 'relative' }}
                onMouseEnter={() => hasKids ? open(m.id) : setActiveId(null)} onMouseLeave={scheduleClose}>
                {hasKids ? (
                  <button className="ec-nav-item" data-active={isActive} aria-expanded={isActive} onClick={() => setActiveId(isActive ? null : m.id)}>
                    {label(m)}
                    <span style={{ display: 'inline-flex', transition: 'transform 0.2s', transform: isActive ? 'rotate(180deg)' : 'none' }}><ChevDown /></span>
                  </button>
                ) : (
                  <a className="ec-nav-item" href={m.url || '#'}>{label(m)}</a>
                )}
                {isActive && <span style={{ position: 'absolute', bottom: 0, right: 14, left: 14, height: 2, background: M, borderRadius: 1 }} />}
              </div>
            )
          })}
        </nav>

        <div className="ec-desktop-donate" style={{ flexShrink: 0 }}>
          <a className="ec-btn-primary" href={settings.donate_url || '#donate'} style={{ padding: '13px 36px', fontSize: 16 }}>{t(settings.donate_label) || 'تبرع الآن'}</a>
        </div>

        <button className="ec-mobile-toggle" aria-label={lang === 'ar' ? 'القائمة' : 'Menu'} aria-expanded={mobileOpen} aria-controls="ec-mobile-menu"
          style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, width: 48, height: 48, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8 }}
          onClick={() => setMobileOpen(!mobileOpen)}>
          {[0, 1, 2].map(i => <span key={i} style={{ display: 'block', width: 24, height: 2, background: N, borderRadius: 1 }} />)}
        </button>
      </div>

      {active && <MegaPanel item={active} onEnter={cancelClose} onLeave={scheduleClose} />}

      {mobileOpen && (
        <div id="ec-mobile-menu" style={{ background: '#fff', borderTop: '1px solid #EAE7E2', padding: '8px 24px 22px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
          {menu.map(m => {
            const hasKids = m.children?.length > 0
            const isOpen = openMobileId === m.id
            return (
              <div key={m.id} style={{ borderBottom: '1px solid #F0EDE8' }}>
                {hasKids ? (
                  <button className="ec-nav-item" aria-expanded={isOpen} onClick={() => setOpenMobileId(isOpen ? null : m.id)}
                    style={{ width: '100%', justifyContent: 'space-between', borderRadius: 0, padding: '14px 0' }}>
                    {label(m)}<span style={{ display: 'inline-flex', transform: isOpen ? 'rotate(180deg)' : 'none' }}><ChevDown /></span>
                  </button>
                ) : (
                  <a className="ec-nav-item" href={m.url || '#'} onClick={() => setMobileOpen(false)} style={{ width: '100%', borderRadius: 0, padding: '14px 0' }}>{label(m)}</a>
                )}
                {hasKids && isOpen && (
                  <div style={{ padding: '0 12px 12px' }}>
                    {m.children.map(g => (
                      <div key={g.id} style={{ margin: '6px 0' }}>
                        {g.children?.length ? (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 800, color: N, margin: '8px 0 2px' }}>{label(g)}</div>
                            {g.children.map(l => <a key={l.id} className="ec-mega-link" href={l.url || '#'} onClick={() => setMobileOpen(false)} style={{ padding: '10px 0' }}>{label(l)}</a>)}
                          </>
                        ) : <a className="ec-mega-link" href={g.url || '#'} onClick={() => setMobileOpen(false)} style={{ padding: '10px 0' }}>{label(g)}</a>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          <div style={{ display: 'flex', gap: 10, margin: '16px 0 0' }}>
            <a className="ec-btn-primary" href={settings.donate_url || '#donate'} onClick={() => setMobileOpen(false)} style={{ flex: 1, padding: 14, fontSize: 15 }}>{t(settings.donate_label) || 'تبرع الآن'}</a>
            <button onClick={toggle} lang={lang === 'ar' ? 'en' : 'ar'}
              style={{ minHeight: 48, padding: '0 18px', border: `1.5px solid ${N}55`, borderRadius: 50, fontSize: 14, fontWeight: 700, color: N, background: 'none', cursor: 'pointer' }}>
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer() {
  const { lang, settings: s } = useLang()
  const t = useT()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const subscribe = e => {
    e.preventDefault()
    if (!email) return
    if (s.newsletter_action) {
      fetch(s.newsletter_action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).catch(() => {})
    }
    setSent(true)
    setEmail('')
  }

  const contacts = [
    s.phone && { Icon: Phone, v: s.phone, href: `tel:${s.phone.replace(/\s+/g, '')}`, dir: 'ltr' },
    s.email && { Icon: Mail, v: s.email, href: `mailto:${s.email}`, dir: 'ltr' },
    t(s.address) && { Icon: Pin, v: t(s.address) },
  ].filter(Boolean)

  return (
    <footer id="contact" style={{ background: N }}>
      <div className="ec-inner" style={{ paddingTop: 60 }}>
        <div className="ec-grid-footer" style={{ margin: '0 0 48px' }}>
          <div>
            <img src={s.logo || '/logo.jpg'} alt={t(s.site_name) || 'Logo'}
              style={{ height: 50, width: 'auto', objectFit: 'contain', margin: '0 0 18px', filter: 'brightness(0) invert(1)', opacity: 0.92 }} />
            {t(s.footer_desc) && <p style={{ fontSize: 14, lineHeight: 2, color: 'rgba(255,255,255,0.72)', margin: '0 0 22px' }}>{t(s.footer_desc)}</p>}

            {s.newsletter_visible !== false && (
              <form onSubmit={subscribe} style={{ margin: '0 0 22px' }}>
                <label htmlFor="ec-newsletter" style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: '0 0 10px' }}>{t(s.newsletter_title)}</label>
                <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 10, overflow: 'hidden' }}>
                  <input id="ec-newsletter" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t(s.newsletter_placeholder)}
                    style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', padding: '11px 14px', color: '#fff', fontSize: 14, outlineColor: G }} />
                  <button className="ec-btn-primary" style={{ borderRadius: 0, padding: '0 18px', fontSize: 14 }}>{t(s.newsletter_button)}</button>
                </div>
                {sent && <p role="status" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, margin: '8px 0 0' }}>{lang === 'ar' ? 'شكرًا لاشتراكك!' : 'Thanks for subscribing!'}</p>}
              </form>
            )}

            {(s.socials || []).length > 0 && <>
              <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.72)', margin: '0 0 10px' }}>{t(s.follow_us)}</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><Socials className="ec-social-btn" color="currentColor" /></div>
            </>}
          </div>

          {(s.footer_columns || []).map((col, i) => (
            <div key={i}>
              <h2 style={{ color: G, fontSize: 15, fontWeight: 800, margin: '0 0 14px', letterSpacing: '0.04em' }}>{t(col.title)}</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {(col.links || []).map((l, j) => <li key={j}><a className="ec-footer-link" href={l.url || '#'}>{t(l.label)}</a></li>)}
              </ul>
            </div>
          ))}
        </div>

        {contacts.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', padding: '24px 0', display: 'flex', gap: 36, flexWrap: 'wrap', alignItems: 'center' }}>
            {contacts.map(({ Icon, v, href, dir }) => (
              <Link key={v} href={href} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, color: 'rgba(255,255,255,0.82)', minHeight: 32 }}>
                <Icon c={G} /> <span dir={dir}>{v}</span>
              </Link>
            ))}
          </div>
        )}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '18px 0 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{t(s.license)}</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{t(s.copyright)}</span>
        </div>
      </div>
    </footer>
  )
}
