import { useEffect, useState } from 'react'
import { get, post, put, del } from './api.js'
import { useToast, VisibilityToggle, MoveButtons, PageHead, swap } from './ui.jsx'
import { SECTION_TYPES } from '../shared/sectionTypes.js'

// pageId: a sub-page's sections; without it, the home page's.
export default function SectionsPage({ pageId = null }) {
  const toast = useToast()
  const [list, setList] = useState(null)
  const [page, setPage] = useState(null)
  const [adding, setAdding] = useState(false)

  const load = () => get(pageId ? `/api/admin/sections?page=${pageId}` : '/api/admin/sections').then(setList).catch(e => toast(e.message, 'error'))
  useEffect(() => {
    setList(null)
    setAdding(false)
    load()
    if (pageId) get(`/api/admin/pages/${pageId}`).then(setPage).catch(e => toast(e.message, 'error'))
  }, [pageId])

  const toggle = async (s, v) => {
    setList(l => l.map(x => (x.id === s.id ? { ...x, is_visible: v } : x)))
    try { await put(`/api/admin/sections/${s.id}`, { is_visible: v }); toast(v ? 'القسم ظاهر الآن' : 'تم إخفاء القسم') }
    catch (e) { toast(e.message, 'error'); load() }
  }

  const move = async (i, d) => {
    const next = swap(list, i, d)
    setList(next)
    try { await post('/api/admin/sections/reorder', { ids: next.map(s => s.id) }) } catch (e) { toast(e.message, 'error'); load() }
  }

  const remove = async s => {
    if (!window.confirm(`حذف قسم «${s.name}» وكل عناصره نهائيًا؟`)) return
    try { await del(`/api/admin/sections/${s.id}`); toast('تم حذف القسم'); load() } catch (e) { toast(e.message, 'error') }
  }

  const duplicate = async s => {
    try { await post(`/api/admin/sections/${s.id}/duplicate`); toast('تم إنشاء نسخة (مخفية)'); load() } catch (e) { toast(e.message, 'error') }
  }

  return (
    <>
      {pageId && <a href="#/pages" className="ad-back">→ كل الصفحات</a>}
      <PageHead title={pageId ? `أقسام صفحة «${page?.title_ar || '…'}»` : 'أقسام الصفحة الرئيسية'}>
        {page && <a className="ad-btn ad-btn-light" href={`/page/${page.slug}`} target="_blank" rel="noopener">عرض الصفحة ↗</a>}
        <button type="button" className="ad-btn ad-btn-primary" onClick={() => setAdding(true)}>+ إضافة قسم</button>
      </PageHead>
      <p className="ad-help">الترتيب هنا هو ترتيب ظهور الأقسام في الموقع. الأقسام المخفية لا تظهر للزوار.</p>

      {adding && <AddSection pageId={pageId} onClose={() => setAdding(false)} />}

      {!list ? <p>جارِ التحميل…</p> : !list.length ? <p className="ad-help">الصفحة دي لسه ما فيهاش أقسام. اضغط «إضافة قسم».</p> : (
        <ul className="ad-rows">
          {list.map((s, i) => (
            <li key={s.id} className={`ad-row ${s.is_visible ? '' : 'ad-row-hidden'}`}>
              <div className="ad-row-order"><MoveButtons index={i} count={list.length} onMove={move} label={s.name} /></div>
              <div className="ad-row-main">
                <a href={`#/sections/${s.id}`} className="ad-row-title">{s.name || SECTION_TYPES[s.type]?.label || s.type}</a>
                <span className="ad-row-meta">
                  {SECTION_TYPES[s.type]?.label || s.type}
                  {SECTION_TYPES[s.type]?.item ? ` · ${s.item_count} عنصر` : ''}
                  {s.content?.anchor ? <> · <span dir="ltr">#{s.content.anchor}</span></> : ''}
                </span>
              </div>
              <div className="ad-row-actions">
                <VisibilityToggle visible={s.is_visible} onChange={v => toggle(s, v)} label={s.name} />
                <a className="ad-btn ad-btn-light" href={`#/sections/${s.id}`}>تعديل</a>
                <button type="button" className="ad-btn ad-btn-light" onClick={() => duplicate(s)}>نسخ</button>
                <button type="button" className="ad-btn ad-btn-danger" onClick={() => remove(s)}>حذف</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function AddSection({ pageId, onClose }) {
  const toast = useToast()
  const [type, setType] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const create = async e => {
    e.preventDefault()
    if (!type) return toast('اختر نوع القسم', 'error')
    setBusy(true)
    try {
      const d = SECTION_TYPES[type].defaults()
      const s = await post('/api/admin/sections', { type, name: name || SECTION_TYPES[type].label, content: d.content, items: d.items, page_id: pageId })
      toast('تمت إضافة القسم في آخر الصفحة')
      window.location.hash = `/sections/${s.id}`
    } catch (err) { toast(err.message, 'error'); setBusy(false) }
  }

  return (
    <form className="ad-card" onSubmit={create}>
      <div className="ad-card-head">
        <h2>قسم جديد</h2>
        <button type="button" className="ad-icon-btn" onClick={onClose} aria-label="إغلاق">✕</button>
      </div>
      <fieldset className="ad-types">
        <legend className="ad-label">نوع القسم</legend>
        {Object.entries(SECTION_TYPES).map(([k, t]) => (
          <label key={k} className={`ad-type ${type === k ? 'selected' : ''}`}>
            <input type="radio" name="type" value={k} checked={type === k} onChange={() => setType(k)} />
            <strong>{t.label}</strong>
            <span>{t.description}</span>
          </label>
        ))}
      </fieldset>
      <label className="ad-label" htmlFor="new-name">اسم القسم (يظهر لك في لوحة التحكم فقط)</label>
      <input id="new-name" className="ad-input" value={name} onChange={e => setName(e.target.value)} placeholder={type ? SECTION_TYPES[type].label : ''} />
      <div className="ad-form-actions">
        <button className="ad-btn ad-btn-primary" disabled={busy}>{busy ? 'لحظة…' : 'إنشاء القسم'}</button>
        <button type="button" className="ad-btn ad-btn-light" onClick={onClose}>إلغاء</button>
      </div>
    </form>
  )
}
