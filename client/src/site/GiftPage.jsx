// The gift page (/gift), «أغلى هدية»: the donor picks an occasion and a project, writes a dedication, sees the
// gift card live, donates, and sends the card link to the person they love (WhatsApp or copy).
// /gift/card?g=… is what the recipient opens. Texts and occasions come from the home page's gift section.
import { useEffect, useMemo, useState } from 'react'
import { useLang, useT } from './lang.jsx'
import { PageBanner } from './sections.jsx'
import GiftCard, { GIFT_DESIGNS, encodeGift, decodeGift, toLink, fromLink } from './GiftCard.jsx'
import { Icon, Lock, Check, SOCIAL_ICONS, M, MD } from '../shared/icons.jsx'

const TXT = {
  title: ['أغلى هدية', 'The Most Precious Gift'],
  step1: ['اختر المناسبة', 'Choose the occasion'],
  step2: ['اختر مشروع الإهداء', 'Choose the project'],
  step3: ['اكتب بطاقة الإهداء', 'Write the gift card'],
  amount: ['مبلغ الهدية', 'Gift amount'],
  other: ['مبلغ آخر', 'Other amount'],
  from: ['اسمك (المُهدي)', 'Your name'],
  to: ['اسم المُهدى إليه', 'Recipient’s name'],
  phone: ['جوال المُهدى إليه (اختياري)', 'Recipient’s mobile (optional)'],
  phoneHelp: ['لإرسال البطاقة له على واتساب، مع مفتاح الدولة. مثال: 97455555555', 'To send the card on WhatsApp, with the country code. e.g. 97455555555'],
  message: ['نص الإهداء', 'Dedication'],
  design: ['تصميم البطاقة', 'Card design'],
  designs: { maroon: ['عنابي', 'Maroon'], navy: ['كحلي', 'Navy'], ivory: ['عاجي', 'Ivory'] },
  showAmount: ['إظهار المبلغ في البطاقة', 'Show the amount on the card'],
  preview: ['معاينة البطاقة', 'Card preview'],
  total: ['قيمة الهدية', 'Gift total'],
  donate: ['أكمل التبرع بالهدية', 'Donate the gift'],
  needNames: ['اكتب اسمك واسم المُهدى إليه', 'Enter your name and the recipient’s name'],
  chooseAmount: ['اختر مبلغ الهدية أولًا', 'Please choose an amount'],
  chooseProject: ['اختر مشروع الإهداء', 'Please choose a project'],
  noGateway: ['بوابة الدفع غير مفعلة بعد', 'Online payment is not available yet'],
  secure: ['دفع آمن ومشفّر', 'Secure, encrypted payment'],
  send: ['أرسل البطاقة لمن تحب', 'Send the card'],
  sendHint: ['بعد إتمام التبرع، أرسل رابط البطاقة للمُهدى إليه.', 'After donating, send the card link to the recipient.'],
  whatsapp: ['إرسال عبر واتساب', 'Send on WhatsApp'],
  copy: ['نسخ رابط البطاقة', 'Copy card link'],
  copied: ['تم نسخ الرابط', 'Link copied'],
  noProjects: ['لا توجد مشاريع إهداء حاليًا.', 'There are no gift projects right now.'],
  shareText: ['وصلتك هدية من', 'You have received a gift from'],
  // recipient page
  received: ['وصلتك هدية!', 'You have received a gift!'],
  receivedSub: ['أحدٌ يحبك جعل هديته لك صدقةً يبقى أثرها.', 'Someone who loves you gave a charity in your name.'],
  giveBack: ['أهدِ من تحب', 'Send a gift too'],
  project: ['تفاصيل المشروع', 'About the project'],
  invalid: ['رابط البطاقة غير صحيح أو ناقص.', 'This card link is incomplete or invalid.'],
}

const fmt = n => Number(n || 0).toLocaleString('en-US')
const parseAmounts = s => String(s || '50, 100, 250, 500').split(',').map(v => Number(v.trim())).filter(n => n > 0)
const useL = () => { const { lang } = useLang(); return k => TXT[k][lang === 'en' ? 1 : 0] }
const cardUrl = g => `${window.location.origin}/gift/card?g=${encodeGift(toLink(g))}`

export default function GiftPage({ data }) {
  const { lang } = useLang()
  const t = useT()
  const L = useL()
  const sec = data.gift || { content: {}, items: [] }
  const c = sec.content || {}
  const occasions = sec.items || []
  const amounts = parseAmounts(c.amounts)
  const cur = c.currency || 'QAR'

  // Every visible campaign, each with its own payment link (the gift section's link wins when set).
  const projects = useMemo(() => [...(data.donations || [])].sort((a, b) => !!b.content?.listing_only - !!a.content?.listing_only)
    .flatMap(g => g.items.map(i => ({ id: i.id, ...i.content, _pay: c.donate_action_url || g.donate_action_url || data.donate_action_url || '' }))), [data])

  const asked = new URLSearchParams(window.location.search)
  const [occId, setOccId] = useState(() => { const o = occasions.find(o => String(o.id) === asked.get('occasion')); return (o || occasions[0])?.id ?? null })
  const [projectId, setProjectId] = useState(() => { const p = projects.find(p => String(p.id) === asked.get('project')); return (p || projects[0])?.id ?? null })
  const [amount, setAmount] = useState(amounts[1] || amounts[0] || null)
  const [custom, setCustom] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState(null) // null = the occasion's suggested text
  const [design, setDesign] = useState('maroon')
  const [showAmount, setShowAmount] = useState(false)
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState(false)

  const occ = occasions.find(o => o.id === occId)
  const project = projects.find(p => p.id === projectId)
  const total = custom ? Number(custom) : amount
  const text = message ?? t(occ?.content?.message)
  const gift = {
    occasion: t(occ?.content?.name), icon: occ?.content?.icon, to: to.trim(), from: from.trim(), project: t(project?.name), id: project ? String(project.id) : undefined,
    message: text.trim(), amount: showAmount && total > 0 ? total : 0, cur, design, lang,
  }

  useEffect(() => { if (!copied) return; const id = setTimeout(() => setCopied(false), 2500); return () => clearTimeout(id) }, [copied])

  const check = () => {
    if (!project) return L('chooseProject')
    if (!total || total <= 0) return L('chooseAmount')
    if (!gift.to || !gift.from) return L('needNames')
    return ''
  }

  const donate = () => {
    const err = check() || (!project._pay && L('noGateway'))
    setNotice(err)
    if (err) return
    const url = new URL(project._pay, window.location.origin)
    url.searchParams.set('amount', String(total))
    url.searchParams.set('type', 'once')
    url.searchParams.set('campaign', String(project.id))
    url.searchParams.set('category', (project.name && (project.name.ar || project.name.en)) || '')
    url.searchParams.set('gift', '1')
    url.searchParams.set('occasion', gift.occasion)
    url.searchParams.set('gift_from', gift.from)
    url.searchParams.set('gift_to', gift.to)
    if (phone.trim()) url.searchParams.set('gift_phone', phone.replace(/[^\d]/g, ''))
    url.searchParams.set('gift_message', gift.message)
    url.searchParams.set('gift_card', cardUrl(gift))
    window.location.href = url.toString()
  }

  const shareMsg = () => `${L('shareText')} ${gift.from} 🎁\n${cardUrl(gift)}`
  const whatsapp = () => {
    const err = check()
    setNotice(err)
    if (err) return
    const num = phone.replace(/[^\d]/g, '')
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(shareMsg())}`, '_blank', 'noopener')
  }
  const copy = () => {
    const err = check()
    setNotice(err)
    if (err) return
    navigator.clipboard?.writeText(cardUrl(gift)).then(() => setCopied(true)).catch(() => {})
  }

  const page = {
    title_ar: (c.title && c.title.ar) || TXT.title[0],
    title_en: (c.title && c.title.en) || TXT.title[1],
    content: { subtitle: c.page_subtitle && t(c.page_subtitle) ? c.page_subtitle : c.subtitle, image: c.image || '' },
  }
  const WA = SOCIAL_ICONS.whatsapp

  return (
    <>
      <PageBanner page={page} />
      {t(c.hadith) && <p className="ec-gf-hadith"><span>{t(c.hadith)}</span></p>}

      <div className="ec-inner ec-dn-grid ec-gf-grid">
        <div className="ec-gf-steps">
          {occasions.length > 0 && (
            <fieldset className="ec-gf-step">
              <legend><span className="ec-gf-num">1</span>{L('step1')}</legend>
              <div className="ec-gf-occasions">
                {occasions.map(o => (
                  <button key={o.id} type="button" aria-pressed={o.id === occId} onClick={() => { setOccId(o.id); setMessage(null) }}>
                    <Icon name={o.content?.icon || 'gift'} />
                    <span>{t(o.content?.name)}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className="ec-gf-step">
            <legend><span className="ec-gf-num">{occasions.length ? 2 : 1}</span>{L('step2')}</legend>
            {projects.length === 0 ? <p className="ec-dn-hint">{L('noProjects')}</p> : (
              <div className="ec-gf-projects">
                {projects.map(p => (
                  <button key={p.id} type="button" aria-pressed={p.id === projectId} onClick={() => { setProjectId(p.id); setNotice('') }}>
                    <span className="ec-gf-pimg">{p.image && <img src={p.image} alt="" loading="lazy" />}{p.id === projectId && <span className="ec-gf-tick"><Check /></span>}</span>
                    <span className="ec-gf-pname">{t(p.name)}</span>
                    {t(p.category) && <span className="ec-gf-pcat">{t(p.category)}</span>}
                  </button>
                ))}
              </div>
            )}
            <div className="ec-dn-label" id="gf-amount-label" style={{ marginTop: 20 }}>{L('amount')}</div>
            <div role="group" aria-labelledby="gf-amount-label" className="ec-dn-amounts">
              {amounts.map(a => {
                const on = amount === a && !custom
                return (
                  <button key={a} type="button" className="ec-amount-btn" aria-pressed={on} onClick={() => { setAmount(a); setCustom(''); setNotice('') }}
                    style={{ border: `2px solid ${on ? M : '#D6D1CA'}`, background: on ? M : '#fff', color: on ? '#fff' : '#003049' }}>
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
          </fieldset>

          <fieldset className="ec-gf-step">
            <legend><span className="ec-gf-num">{occasions.length ? 3 : 2}</span>{L('step3')}</legend>
            <div className="ec-gf-fields">
              <label>{L('from')}<input className="ec-field" value={from} maxLength={60} autoComplete="name" onChange={e => { setFrom(e.target.value); setNotice('') }} /></label>
              <label>{L('to')}<input className="ec-field" value={to} maxLength={60} onChange={e => { setTo(e.target.value); setNotice('') }} /></label>
              <label className="ec-gf-wide">{L('phone')}
                <input className="ec-field" type="tel" dir="ltr" inputMode="tel" value={phone} maxLength={20} onChange={e => setPhone(e.target.value)} aria-describedby="gf-phone-help" />
                <small id="gf-phone-help">{L('phoneHelp')}</small>
              </label>
              <label className="ec-gf-wide">{L('message')}<textarea className="ec-field" rows={3} maxLength={400} value={text} onChange={e => setMessage(e.target.value)} /></label>
            </div>
            <div className="ec-dn-label" id="gf-design-label">{L('design')}</div>
            <div role="group" aria-labelledby="gf-design-label" className="ec-gf-designs">
              {Object.keys(GIFT_DESIGNS).map(k => (
                <button key={k} type="button" aria-pressed={design === k} onClick={() => setDesign(k)}>
                  <span style={{ background: GIFT_DESIGNS[k].bg, borderColor: GIFT_DESIGNS[k].accent }} />{TXT.designs[k][lang === 'en' ? 1 : 0]}
                </button>
              ))}
            </div>
            <label className="ec-gf-check"><input type="checkbox" checked={showAmount} onChange={e => setShowAmount(e.target.checked)} /> {L('showAmount')}</label>
          </fieldset>
        </div>

        <aside className="ec-dn-aside" aria-label={L('preview')}>
          <div className="ec-dn-card">
            <div className="ec-dn-card-head"><h2>{L('preview')}</h2></div>
            <div className="ec-dn-card-body">
              <GiftCard gift={gift} lang={lang} />
              <div className="ec-dn-total">
                <span>{L('total')}</span>
                <strong>{total ? fmt(total) : 0} {cur}</strong>
              </div>
              <button type="button" onClick={donate} className="ec-btn-primary" style={{ width: '100%', padding: 15, fontSize: 17, borderRadius: 12, background: `linear-gradient(135deg,${M},${MD})` }}>
                {L('donate')}
              </button>
              {notice && <p role="status" className="ec-dn-notice">{notice}</p>}
              <p className="ec-dn-secure"><Lock /> {L('secure')}</p>

              <div className="ec-gf-send">
                <div className="ec-dn-label">{L('send')}</div>
                <p>{L('sendHint')}</p>
                <div className="ec-gf-send-btns">
                  <button type="button" className="ec-btn-cart" onClick={whatsapp}><WA c="currentColor" /> {L('whatsapp')}</button>
                  <button type="button" className="ec-btn-cart" onClick={copy}>{L('copy')}</button>
                </div>
                {copied && <p role="status" className="ec-gf-copied">{L('copied')}</p>}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}

// What the recipient sees when they open the card link.
export function GiftCardView() {
  const L = useL()
  const raw = decodeGift(new URLSearchParams(window.location.search).get('g') || '')
  const gift = raw && fromLink(raw)
  return (
    <section className="ec-gf-view">
      <div className="ec-inner">
        {gift ? <>
          <h1>{L('received')}</h1>
          <p className="ec-gf-view-sub">{L('receivedSub')}</p>
          <GiftCard gift={gift} lang={gift.lang} className="ec-gf-card-lg" />
          <div className="ec-gf-view-actions">
            <a className="ec-btn-primary" href="/gift">{L('giveBack')}</a>
            {gift.id && <a className="ec-btn-outline" href={`/donate/${gift.id}`}>{L('project')}</a>}
          </div>
        </> : <>
          <p className="ec-gf-view-sub">{L('invalid')}</p>
          <div className="ec-gf-view-actions"><a className="ec-btn-primary" href="/gift">{L('giveBack')}</a></div>
        </>}
      </div>
    </section>
  )
}
