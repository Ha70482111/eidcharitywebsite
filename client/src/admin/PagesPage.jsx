import { useEffect, useState } from 'react'
import { get, post, put, del } from './api.js'
import { useToast, VisibilityToggle, MoveButtons, PageHead, swap } from './ui.jsx'
import { FieldList } from './fields.jsx'

// Banner fields shown at the top of every sub-page.
const BANNER_FIELDS = [
  { key: 'subtitle', label: 'وصف قصير تحت العنوان (اختياري)', type: 'textarea', bi: true },
  { key: 'image', label: 'صورة خلفية للعنوان (اختياري)', type: 'image' },
]

export const pageUrl = p => `/page/${p.slug}`

export default function PagesPage() {
  const toast = useToast()
  const [list, setList] = useState(null)
  const [editing, setEditing] = useState(null) // page id, or 'new'

  const load = () => get('/api/admin/pages').then(setList).catch(e => toast(e.message, 'error'))
  useEffect(() => { load() }, [])

  const toggle = async (p, v) => {
    setList(l => l.map(x => (x.id === p.id ? { ...x, is_visible: v } : x)))
    try { await put(`/api/admin/pages/${p.id}`, { is_visible: v }); toast(v ? 'الصفحة ظاهرة الآن' : 'تم إخفاء الصفحة') }
    catch (e) { toast(e.message, 'error'); load() }
  }

  const move = async (i, d) => {
    const next = swap(list, i, d)
    setList(next)
    try { await post('/api/admin/pages/reorder', { ids: next.map(p => p.id) }) } catch (e) { toast(e.message, 'error'); load() }
  }

  const remove = async p => {
    if (!window.confirm(`حذف صفحة «${p.title_ar}» وكل أقسامها نهائيًا؟`)) return
    try { await del(`/api/admin/pages/${p.id}`); toast('تم حذف الصفحة'); load() } catch (e) { toast(e.message, 'error') }
  }

  const copyLink = async p => {
    try { await navigator.clipboard.writeText(pageUrl(p)); toast(`تم نسخ الرابط: ${pageUrl(p)}`) }
    catch { window.prompt('انسخ الرابط:', pageUrl(p)) }
  }

  return (
    <>
      <PageHead title="الصفحات الفرعية">
        <button type="button" className="ad-btn ad-btn-primary" onClick={() => setEditing('new')}>+ إضافة صفحة</button>
      </PageHead>
      <p className="ad-help">
        كل صفحة ليها رابط زي <span dir="ltr">/page/about</span>. عشان تظهر في المنيو: انسخ رابط الصفحة، وحطه في خانة «الرابط» لعنصر المنيو.
        الصفحات المخفية لا تظهر للزوار.
      </p>

      <MediaImport />

      {editing === 'new' && <PageForm onClose={() => setEditing(null)} onSaved={p => { setEditing(null); window.location.hash = `/pages/${p.id}` }} />}

      {!list ? <p>جارِ التحميل…</p> : !list.length ? <p className="ad-help">لا توجد صفحات بعد.</p> : (
        <ul className="ad-rows">
          {list.map((p, i) => (
            <li key={p.id} className={`ad-row ad-row-item ${p.is_visible ? '' : 'ad-row-hidden'}`}>
              <div className="ad-row-line">
                <div className="ad-row-order"><MoveButtons index={i} count={list.length} onMove={move} label={p.title_ar} /></div>
                <div className="ad-row-main">
                  <a href={`#/pages/${p.id}`} className="ad-row-title">{p.title_ar || p.title_en || p.slug}</a>
                  <span className="ad-row-meta"><span dir="ltr">{pageUrl(p)}</span> · {p.section_count} قسم</span>
                </div>
                <div className="ad-row-actions">
                  <VisibilityToggle visible={p.is_visible} onChange={v => toggle(p, v)} label={p.title_ar} />
                  <a className="ad-btn ad-btn-light" href={`#/pages/${p.id}`}>الأقسام</a>
                  <button type="button" className="ad-btn ad-btn-light" onClick={() => setEditing(editing === p.id ? null : p.id)} aria-expanded={editing === p.id}>العنوان والرابط</button>
                  <button type="button" className="ad-btn ad-btn-light" onClick={() => copyLink(p)}>نسخ الرابط</button>
                  <a className="ad-btn ad-btn-light" href={pageUrl(p)} target="_blank" rel="noopener">عرض ↗</a>
                  <button type="button" className="ad-btn ad-btn-danger" onClick={() => remove(p)}>حذف</button>
                </div>
              </div>
              {editing === p.id && (
                <div className="ad-row-editor">
                  <PageForm page={p} onClose={() => setEditing(null)} onSaved={saved => { setList(l => l.map(x => (x.id === saved.id ? { ...x, ...saved } : x))); setEditing(null) }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function PageForm({ page, onClose, onSaved }) {
  const toast = useToast()
  const [d, setD] = useState({
    title_ar: page?.title_ar || '', title_en: page?.title_en || '', slug: page?.slug || '',
    content: page?.content || { subtitle: { ar: '', en: '' }, image: '' },
  })
  const [busy, setBusy] = useState(false)
  const set = k => e => setD({ ...d, [k]: e.target.value })

  const submit = async e => {
    e.preventDefault()
    setBusy(true)
    try {
      const saved = page ? await put(`/api/admin/pages/${page.id}`, d) : await post('/api/admin/pages', d)
      toast(page ? 'تم حفظ الصفحة' : 'تمت إضافة الصفحة — أضف لها أقسامًا الآن')
      onSaved(saved)
    } catch (err) { toast(err.message, 'error'); setBusy(false) }
  }

  return (
    <form className={page ? undefined : 'ad-card'} onSubmit={submit}>
      {!page && (
        <div className="ad-card-head">
          <h2>صفحة جديدة</h2>
          <button type="button" className="ad-icon-btn" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
      )}
      <div className="ad-fields">
        <div className="ad-field">
          <label className="ad-label" htmlFor={`pg-ar-${page?.id || 'new'}`}>عنوان الصفحة (عربي)</label>
          <input id={`pg-ar-${page?.id || 'new'}`} className="ad-input" value={d.title_ar} onChange={set('title_ar')} required />
        </div>
        <div className="ad-field">
          <label className="ad-label" htmlFor={`pg-en-${page?.id || 'new'}`}>Page title (English)</label>
          <input id={`pg-en-${page?.id || 'new'}`} className="ad-input" dir="ltr" value={d.title_en} onChange={set('title_en')} />
        </div>
        <div className="ad-field ad-wide">
          <label className="ad-label" htmlFor={`pg-slug-${page?.id || 'new'}`}>رابط الصفحة (حروف إنجليزية وأرقام وشرطة فقط)</label>
          <input id={`pg-slug-${page?.id || 'new'}`} className="ad-input" dir="ltr" value={d.slug} onChange={set('slug')} required placeholder="about-us" />
          <p className="ad-help" dir="ltr" style={{ textAlign: 'start' }}>/page/{d.slug || '…'}</p>
          {page && <p className="ad-help">لو غيّرت الرابط، عدّل كمان أي عنصر في المنيو بيشاور على الرابط القديم.</p>}
        </div>
      </div>
      <FieldList fields={BANNER_FIELDS} value={d.content} onChange={content => setD({ ...d, content })} />
      <div className="ad-form-actions">
        <button className="ad-btn ad-btn-primary" disabled={busy}>{busy ? 'لحظة…' : page ? 'حفظ' : 'إنشاء الصفحة'}</button>
        <button type="button" className="ad-btn ad-btn-light" onClick={onClose}>إلغاء</button>
      </div>
    </form>
  )
}

// Copies the images and PDF files that the imported pages still load from the old website into this site.
function MediaImport() {
  const toast = useToast()
  const [state, setState] = useState(null)

  const run = async retry => {
    let copied = 0
    setState({ busy: true, copied })
    try {
      for (let round = 0; round < 40; round++) {
        const r = await post('/api/admin/pages/import-media', { retry: retry && round === 0 })
        copied += r.copied
        setState({ busy: true, copied, failed: r.failed })
        if (!r.remaining) { setState({ busy: false, copied, failed: r.failed, done: true }); break }
      }
    } catch (e) { toast(e.message, 'error'); setState(s => ({ ...s, busy: false })) }
  }

  return (
    <div className="ad-card">
      <h2 style={{ margin: '0 0 6px', fontSize: 17 }}>صور وملفات الموقع القديم</h2>
      <p className="ad-help" style={{ margin: '0 0 12px' }}>
        بعض الصور وملفات PDF في الصفحات لسه بتتحمّل من الموقع القديم (eidcharity.net). اضغط الزر عشان تتنسخ على الموقع الجديد،
        فتفضل شغالة حتى لو الموقع القديم اتقفل.
      </p>
      <div className="ad-form-actions" style={{ margin: 0 }}>
        <button type="button" className="ad-btn ad-btn-primary" disabled={state?.busy} onClick={() => run(false)}>
          {state?.busy ? `جارِ النسخ… (${state.copied})` : 'انسخ الصور والملفات للموقع الجديد'}
        </button>
        {state?.done && state.failed > 0 && <button type="button" className="ad-btn ad-btn-light" onClick={() => run(true)}>حاول تاني</button>}
      </div>
      {state?.done && (
        <p className="ad-help" role="status" style={{ margin: '10px 0 0' }}>
          {state.copied ? `تم نسخ ${state.copied} ملف.` : 'مفيش ملفات جديدة تتنسخ.'}
          {state.failed > 0 ? ` ${state.failed} ملف ما اتنسخش (ممكن الموقع القديم يكون مقفول)؛ ارفعه بنفسك من الأقسام أو اضغط «حاول تاني».` : ''}
        </p>
      )}
    </div>
  )
}
