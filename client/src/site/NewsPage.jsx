// News details page for one news item (/news/<id>): the full story, a share box and the other news of its section.
import { useLang, useT, lines } from './lang.jsx'
import { newsHref } from './sections.jsx'
import { Share } from './DonationPage.jsx'
import { CardImage } from './placeholder.jsx'
import { Arrow, M } from '../shared/icons.jsx'

const TXT = {
  home: ['الرئيسية', 'Home'],
  news: ['الأخبار', 'News'],
  share: ['شارك الخبر', 'Share this story'],
  copy: ['نسخ الرابط', 'Copy link'],
  copied: ['تم نسخ الرابط', 'Link copied'],
  related: ['أخبار أخرى', 'More news'],
  read: ['اقرأ الخبر', 'Read more'],
  back: ['العودة إلى الأخبار', 'Back to news'],
}

export default function NewsPage({ data }) {
  const { lang } = useLang()
  const t = useT()
  const L = k => TXT[k][lang === 'en' ? 1 : 0]
  const it = data.news.content || {}
  const sc = data.section.content || {}
  const title = t(it.title)
  const newsList = `${data.section.page_slug ? `/page/${data.section.page_slug}` : '/'}${sc.anchor ? `#${sc.anchor}` : ''}`
  const lead = lines(t(it.desc))
  const body = lines(t(it.body))
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  return (
    <>
      <nav aria-label={lang === 'ar' ? 'مسار التنقل' : 'Breadcrumb'} className="ec-dn-crumbs">
        <div className="ec-inner">
          <a href="/">{L('home')}</a>
          <span aria-hidden="true">/</span>
          <a href={newsList}>{t(sc.title) || L('news')}</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{title}</span>
        </div>
      </nav>

      <article className="ec-inner ec-nw">
        {t(it.date) && <p className="ec-nw-date">{t(it.date)}</p>}
        <h1 className="ec-nw-title">{title}</h1>
        {body.length > 0 && lead.map((p, i) => <p key={i} className="ec-nw-lead">{p}</p>)}
        <div className="ec-nw-photo">
          <CardImage src={it.image} texts={[it.title, it.desc]} fallback="news" alt={title} />
        </div>
        <div className="ec-nw-body">
          {(body.length ? body : lead).map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <Share name={title} L={L} />
        <a href={newsList} className="ec-nw-back"><Arrow c={M} s={14} dir={lang === 'ar' ? 'ltr' : 'rtl'} /> {L('back')}</a>
      </article>

      {data.related?.length > 0 && (
        <section className="ec-section" style={{ background: '#F4F2EE' }}>
          <div className="ec-inner">
            <h2 className="ec-dn-related-title">{L('related')}</h2>
            <div className="ec-grid-3">
              {data.related.map(r => {
                const c = { ...r.content, _id: r.id }
                return (
                  <article key={r.id} className="ec-card-hover ec-dn-rcard">
                    <a href={newsHref(c)} tabIndex={-1} aria-hidden="true" className="ec-img-zoom ec-dn-rimg">
                      <CardImage src={c.image} texts={[c.title, c.desc]} fallback="news" loading="lazy" />
                    </a>
                    <div className="ec-dn-rbody">
                      {t(c.date) && <div className="ec-nw-rdate">{t(c.date)}</div>}
                      <h3><a href={newsHref(c)} className="ec-title-link">{t(c.title)}</a></h3>
                      {t(c.desc) && <p className="ec-nw-rdesc">{t(c.desc)}</p>}
                      <a href={newsHref(c)} className="ec-dn-rlink" aria-label={`${L('read')}: ${t(c.title)}`}>{L('read')} <Arrow c={M} s={14} dir={dir} /></a>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
