// The donations page (/donate), laid out like a charity's donations listing: a quick-donation bar,
// category filters with search, and a card per project that opens its details page (/donate/<id>).
import { useMemo, useState } from 'react'
import { useLang, useT } from './lang.jsx'
import { PageBanner, campaignHref } from './sections.jsx'
import { addToCart } from './cart.js'
import { CartIcon } from './CartPage.jsx'
import { Pin, Lock, Check, Arrow, M, MD, N } from '../shared/icons.jsx'

const TXT = {
  title: ['التبرعات', 'Donations'],
  subtitle: ['اختر المشروع الذي تحب أن تساهم فيه، وتبرّع بالمبلغ الذي يناسبك.', 'Choose a project you would like to support and give any amount you wish.'],
  quick: ['التبرع السريع', 'Quick Donation'],
  once: ['مرة واحدة', 'One-time'],
  monthly: ['تبرع شهري', 'Monthly'],
  project: ['مجال التبرع', 'Donate to'],
  amount: ['المبلغ', 'Amount'],
  other: ['مبلغ آخر', 'Other amount'],
  donate: ['تبرع', 'Donate'],
  addCart: ['أضف إلى السلة', 'Add to cart'],
  details: ['التفاصيل', 'Details'],
  chooseAmount: ['اختر مبلغ التبرع أولًا', 'Please choose an amount'],
  noGateway: ['بوابة الدفع غير مفعلة بعد', 'Online payment is not available yet'],
  secure: ['دفع آمن ومشفّر', 'Secure, encrypted payment'],
  all: ['الكل', 'All'],
  categories: ['تصنيفات التبرع', 'Donation categories'],
  search: ['ابحث عن مشروع', 'Search projects'],
  results: ['مشروع', 'projects'],
  empty: ['لا توجد مشاريع مطابقة لبحثك.', 'No projects match your search.'],
  noProjects: ['لا توجد مشاريع تبرع حاليًا.', 'There are no donation projects right now.'],
  reset: ['عرض كل المشاريع', 'Show all projects'],
  raised: ['حتى الآن', 'Raised'],
  remaining: ['متبقي', 'Remaining'],
  beneficiaries: ['المستفيدين', 'Beneficiaries'],
  done: ['مكتمل', 'complete'],
  pickFor: ['اختر مبلغ التبرع لـ', 'Choose an amount for'],
}

const fmt = n => Number(n || 0).toLocaleString('en-US')
const pctOf = (raised, target) => (Number(target) > 0 ? Math.min(100, Math.round((Number(raised) / Number(target)) * 100)) : 0)
const parseAmounts = s => String(s || '50, 100, 250, 500').split(',').map(v => Number(v.trim())).filter(n => n > 0)

export default function DonationsPage({ data }) {
  const { lang, settings } = useLang()
  const t = useT()
  const L = k => TXT[k][lang === 'en' ? 1 : 0]

  // One flat list of projects; each keeps its section's currency, amounts and payment link.
  // Sections made for this page ("listing only") come first.
  const projects = useMemo(() => [...(data.donations || [])].sort((a, b) => !!b.content?.listing_only - !!a.content?.listing_only).flatMap(g => g.items.map(i => {
    const c = { ...i.content, _id: i.id }
    return { ...c, _cur: g.content?.currency || 'QAR', _amounts: parseAmounts(g.content?.amounts), _pay: g.donate_action_url || '' }
  })), [data])

  const categories = useMemo(() => {
    const seen = new Map()
    projects.forEach(p => { const k = t(p.category); if (k) seen.set(k, (seen.get(k) || 0) + 1) })
    return [...seen]
  }, [projects, lang])

  const [cat, setCat] = useState('')
  // Links like /donate?q=زكاة (areas of giving in the menu and footer) open the page already searched.
  const [query, setQuery] = useState(() => (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('q')) || '')
  const q = query.trim().toLowerCase()
  const shown = projects.filter(p => (!cat || t(p.category) === cat) &&
    (!q || [t(p.name), t(p.desc), t(p.category), t(p.location)].some(s => s.toLowerCase().includes(q))))

  const page = {
    title_ar: (settings.donations_title && settings.donations_title.ar) || TXT.title[0],
    title_en: (settings.donations_title && settings.donations_title.en) || TXT.title[1],
    content: { subtitle: t(settings.donations_subtitle) ? settings.donations_subtitle : { ar: TXT.subtitle[0], en: TXT.subtitle[1] }, image: settings.donations_image || '' },
  }

  return (
    <>
      <PageBanner page={page} />

      <div className="ec-inner">
        {projects.length > 0 && <QuickDonate projects={projects} L={L} />}
      </div>

      <section className="ec-dl-wrap" aria-labelledby="dl-heading">
        <div className="ec-inner">
          <h2 id="dl-heading" className="ec-visually-hidden">{page[lang === 'en' ? 'title_en' : 'title_ar']}</h2>
          {projects.length === 0 ? <p className="ec-dl-empty">{L('noProjects')}</p> : <>
            <div className="ec-dl-tools">
              {categories.length > 1 && (
                <div role="group" aria-label={L('categories')} className="ec-dl-cats">
                  {[['', projects.length], ...categories].map(([k, n]) => (
                    <button key={k || 'all'} type="button" aria-pressed={cat === k} onClick={() => setCat(k)}>
                      {k || L('all')} <span>{n}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="ec-dl-search">
                <SearchIcon />
                <input className="ec-field" type="search" placeholder={L('search')} aria-label={L('search')} value={query} onChange={e => setQuery(e.target.value)} />
              </div>
            </div>
            <p className="ec-dl-count" role="status">{shown.length} {L('results')}</p>

            {shown.length ? (
              <div className="ec-grid-3">
                {shown.map(p => <ProjectCard key={p._id} p={p} L={L} />)}
              </div>
            ) : (
              <div className="ec-dl-empty">
                <p>{L('empty')}</p>
                <button type="button" className="ec-btn-primary" onClick={() => { setCat(''); setQuery('') }}>{L('reset')}</button>
              </div>
            )}
          </>}
        </div>
      </section>
    </>
  )
}

function QuickDonate({ projects, L }) {
  const t = useT()
  const [type, setType] = useState('once')
  const [id, setId] = useState(projects[0]._id)
  const p = projects.find(x => x._id === Number(id)) || projects[0]
  const amounts = p._amounts
  const [amount, setAmount] = useState(amounts[1] || amounts[0] || null)
  const [custom, setCustom] = useState('')
  const [notice, setNotice] = useState('')
  const total = custom ? Number(custom) : amount

  const donate = e => {
    e.preventDefault()
    if (!total || total <= 0) { setNotice(L('chooseAmount')); return }
    if (!p._pay) { setNotice(L('noGateway')); return }
    const url = new URL(p._pay, window.location.origin)
    url.searchParams.set('amount', String(total))
    url.searchParams.set('type', type)
    url.searchParams.set('campaign', String(p._id))
    url.searchParams.set('category', (p.name && (p.name.ar || p.name.en)) || '')
    window.location.href = url.toString()
  }

  const addCart = () => {
    if (!total || total <= 0) { setNotice(L('chooseAmount')); return }
    addToCart({ id: p._id, name: p.name, image: p.image || '', cur: p._cur, pay: p._pay, type, amount: total, step: amounts[0] })
    setNotice('')
  }

  return (
    <form className="ec-dl-quick" onSubmit={donate} aria-labelledby="dl-quick-title">
      <div className="ec-dl-quick-head">
        <h2 id="dl-quick-title">{L('quick')}</h2>
        <div className="ec-dl-seg" role="group" aria-label={L('quick')}>
          {['once', 'monthly'].map(tp => (
            <button key={tp} type="button" aria-pressed={type === tp} onClick={() => setType(tp)}>{type === tp && <Check />}{L(tp)}</button>
          ))}
        </div>
      </div>
      <div className="ec-dl-quick-row">
        <label className="ec-dl-quick-project">
          <span>{L('project')}</span>
          <select className="ec-field" value={p._id} onChange={e => { setId(Number(e.target.value)); setNotice('') }}>
            {projects.map(x => <option key={x._id} value={x._id}>{t(x.name)}</option>)}
          </select>
        </label>
        <div className="ec-dl-quick-amounts">
          <span id="dl-quick-amount">{L('amount')} ({p._cur})</span>
          <div role="group" aria-labelledby="dl-quick-amount">
            {amounts.map(a => {
              const on = amount === a && !custom
              return <button key={a} type="button" className="ec-amount-btn" aria-pressed={on} onClick={() => { setAmount(a); setCustom(''); setNotice('') }}
                style={{ border: `2px solid ${on ? M : '#D6D1CA'}`, background: on ? M : '#fff', color: on ? '#fff' : N }}>{fmt(a)}</button>
            })}
            <input className="ec-field" type="number" min="1" inputMode="numeric" placeholder={L('other')} aria-label={L('other')} value={custom}
              onChange={e => { setCustom(e.target.value); setAmount(null); setNotice('') }} style={{ borderColor: custom ? M : undefined }} />
          </div>
        </div>
        <div className="ec-donate-row">
          <button type="submit" className="ec-btn-primary ec-dl-quick-go" style={{ background: `linear-gradient(135deg,${M},${MD})` }}>
            {L('donate')}{total > 0 && <> {fmt(total)} {p._cur}</>}
          </button>
          <button type="button" className="ec-btn-cart" onClick={addCart} aria-label={L('addCart')} title={L('addCart')}><CartIcon s={24} /></button>
        </div>
      </div>
      {notice ? <p role="status" className="ec-dn-notice">{notice}</p> : <p className="ec-dn-secure"><Lock /> {L('secure')}</p>}
    </form>
  )
}

function ProjectCard({ p, L }) {
  const t = useT()
  const { lang } = useLang()
  const amounts = p._amounts
  const [amount, setAmount] = useState(amounts[0] || null)
  const target = Number(p.target) || 0
  const raised = Number(p.raised) || 0
  const pct = pctOf(raised, target)
  const href = campaignHref(p)
  const own = href === `/donate/${p._id}`
  const donateHref = own && amount ? `${href}?amount=${amount}#donate-card` : href
  const name = t(p.name)

  return (
    <article className="ec-card-hover ec-dl-card">
      <a href={href} tabIndex={-1} aria-hidden="true" className="ec-img-zoom ec-dl-img">
        {p.image && <img src={p.image} alt="" loading="lazy" />}
        {t(p.category) && <span className="ec-dn-badge">{t(p.category)}</span>}
        {t(p.location) && <span className="ec-dl-loc"><Pin c={M} s={12} /> {t(p.location)}</span>}
      </a>
      <div className="ec-dl-body">
        <h3><a href={href} className="ec-title-link">{name}</a></h3>
        {t(p.desc) && <p className="ec-dl-desc">{t(p.desc)}</p>}

        {target > 0 && <>
          <div className="ec-dl-pct"><strong>{pct}%</strong> <span>{L('done')}</span></div>
          <div className="ec-progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${name}: ${pct}% ${L('done')}`} style={{ height: 8, borderRadius: 4 }}>
            <div className="ec-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <dl className="ec-dl-nums">
            <div><dt>{L('raised')}</dt><dd>{fmt(raised)} {p._cur}</dd></div>
            <div><dt>{L('remaining')}</dt><dd>{fmt(Math.max(0, target - raised))} {p._cur}</dd></div>
            {Number(p.beneficiaries) > 0 && <div><dt>{L('beneficiaries')}</dt><dd>{fmt(p.beneficiaries)}</dd></div>}
          </dl>
        </>}

        <div style={{ flex: 1 }} />
        {own && amounts.length > 0 && (
          <div role="group" aria-label={`${L('pickFor')} ${name}`} className="ec-dl-chips">
            {amounts.slice(0, 4).map(a => (
              <button key={a} type="button" aria-pressed={amount === a} onClick={() => setAmount(a)}>{fmt(a)}</button>
            ))}
          </div>
        )}
        <div className="ec-dl-actions">
          <a className="ec-btn-primary" href={donateHref}>{L('donate')}{own && amount ? <> {fmt(amount)} {p._cur}</> : null}</a>
          {own && amount ? (
            <button type="button" className="ec-btn-cart" aria-label={`${L('addCart')}: ${name}`} title={L('addCart')}
              onClick={() => addToCart({ id: p._id, name: p.name, image: p.image || '', cur: p._cur, pay: p._pay, type: 'once', amount, step: amounts[0] })}>
              <CartIcon s={22} />
            </button>
          ) : null}
          <a className="ec-dl-more" href={href} aria-label={`${L('details')}: ${name}`}>{L('details')} <Arrow c={M} s={14} dir={lang === 'ar' ? 'rtl' : 'ltr'} /></a>
        </div>
      </div>
    </article>
  )
}

const SearchIcon = () => <svg viewBox="0 0 20 20" fill="none" width="18" height="18" aria-hidden="true"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6"/><path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
