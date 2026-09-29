import { useEffect, useState } from 'react'
import { get, post, put, del } from './api.js'
import { useToast, VisibilityToggle, MoveButtons, PageHead, swap, pickLabel } from './ui.jsx'
import { FieldList } from './fields.jsx'
import { SECTION_TYPES } from '../shared/sectionTypes.js'

const blankFor = fields => Object.fromEntries(fields.map(f => [f.key, f.bi ? { ar: '', en: '' } : f.type === 'list' ? [] : f.type === 'bool' ? false : '']))

export default function SectionEditor({ id }) {
  const toast = useToast()
  const [section, setSection] = useState(null)
  const [draft, setDraft] = useState(null)
  const [items, setItems] = useState([])
  const [openItem, setOpenItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const type = section ? SECTION_TYPES[section.type] : null
  const dirty = section && draft && (draft.name !== section.name || JSON.stringify(draft.content) !== JSON.stringify(section.content))

  useEffect(() => {
    get(`/api/admin/sections/${id}`)
      .then(s => { setSection(s); setDraft({ name: s.name, content: s.content }); setItems(s.items) })
      .catch(e => { setNotFound(true); toast(e.message, 'error') })
  }, [id])

  useEffect(() => {
    if (!dirty) return
    const fn = e => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', fn)
    return () => window.removeEventListener('beforeunload', fn)
  }, [dirty])

  if (notFound) return <p>القسم غير موجود. <a href="#/sections">الرجوع للأقسام</a></p>
  if (!section || !draft) return <p>جارِ التحميل…</p>

  const save = async () => {
    setSaving(true)
    try {
      const s = await put(`/api/admin/sections/${id}`, draft)
      setSection(x => ({ ...x, ...s }))
      toast('تم حفظ القسم')
    } catch (e) { toast(e.message, 'error') } finally { setSaving(false) }
  }

  const toggleSection = async v => {
    try { const s = await put(`/api/admin/sections/${id}`, { is_visible: v }); setSection(x => ({ ...x, is_visible: s.is_visible })); toast(v ? 'القسم ظاهر الآن' : 'تم إخفاء القسم') }
    catch (e) { toast(e.message, 'error') }
  }

  const addItem = async () => {
    try {
      const it = await post(`/api/admin/sections/${id}/items`, { content: blankFor(type.item.fields) })
      setItems(l => [...l, it])
      setOpenItem(it.id)
      toast(`تمت إضافة ${type.item.label} جديد — عدّل بياناته ثم احفظ`)
    } catch (e) { toast(e.message, 'error') }
  }

  const moveItem = async (i, d) => {
    const next = swap(items, i, d)
    setItems(next)
    try { await post(`/api/admin/sections/${id}/items/reorder`, { ids: next.map(x => x.id) }) } catch (e) { toast(e.message, 'error') }
  }

  const updateItem = it => setItems(l => l.map(x => (x.id === it.id ? it : x)))
  const removeItem = async it => {
    if (!window.confirm('حذف هذا العنصر نهائيًا؟')) return
    try { await del(`/api/admin/items/${it.id}`); setItems(l => l.filter(x => x.id !== it.id)); toast('تم الحذف') } catch (e) { toast(e.message, 'error') }
  }

  if (!type) {
    return <p>نوع القسم «{section.type}» غير معروف. <a href="#/sections">الرجوع للأقسام</a></p>
  }

  return (
    <>
      <a href="#/sections" className="ad-back">→ كل الأقسام</a>
      <PageHead title={draft.name || type.label}>
        <VisibilityToggle visible={section.is_visible} onChange={toggleSection} label="القسم" />
        <button type="button" className="ad-btn ad-btn-primary" onClick={save} disabled={saving || !dirty}>{saving ? 'جارِ الحفظ…' : dirty ? 'حفظ التغييرات' : 'محفوظ'}</button>
      </PageHead>
      <p className="ad-help">نوع القسم: {type.label}</p>

      <div className="ad-card">
        <div className="ad-field ad-wide">
          <label className="ad-label" htmlFor="sec-name">اسم القسم (داخل لوحة التحكم)</label>
          <input id="sec-name" className="ad-input" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <FieldList fields={type.fields} value={draft.content} onChange={content => setDraft({ ...draft, content })} />
        <div className="ad-form-actions">
          <button type="button" className="ad-btn ad-btn-primary" onClick={save} disabled={saving || !dirty}>{saving ? 'جارِ الحفظ…' : 'حفظ القسم'}</button>
        </div>
      </div>

      {type.item && (
        <div className="ad-card">
          <div className="ad-card-head">
            <h2>العناصر ({items.length})</h2>
            <button type="button" className="ad-btn ad-btn-primary" onClick={addItem}>+ إضافة {type.item.label}</button>
          </div>
          {!items.length && <p className="ad-help">لا توجد عناصر بعد.</p>}
          <ul className="ad-rows">
            {items.map((it, i) => (
              <ItemRow key={it.id} item={it} index={i} count={items.length} type={type} open={openItem === it.id}
                onToggleOpen={() => setOpenItem(openItem === it.id ? null : it.id)}
                onMove={moveItem} onChange={updateItem} onRemove={() => removeItem(it)} />
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

function ItemRow({ item, index, count, type, open, onToggleOpen, onMove, onChange, onRemove }) {
  const toast = useToast()
  const [draft, setDraft] = useState(item.content)
  const [saving, setSaving] = useState(false)
  useEffect(() => { setDraft(item.content) }, [item.id])
  const dirty = JSON.stringify(draft) !== JSON.stringify(item.content)
  const title = pickLabel(type.item.title(item.content)) || `${type.item.label} ${index + 1}`
  const thumb = item.content.image || item.content.logo || item.content.icon_image

  const save = async () => {
    setSaving(true)
    try { onChange(await put(`/api/admin/items/${item.id}`, { content: draft })); toast('تم الحفظ') }
    catch (e) { toast(e.message, 'error') } finally { setSaving(false) }
  }
  const toggle = async v => {
    try { onChange(await put(`/api/admin/items/${item.id}`, { is_visible: v })) } catch (e) { toast(e.message, 'error') }
  }

  return (
    <li className={`ad-row ad-row-item ${item.is_visible ? '' : 'ad-row-hidden'}`}>
      <div className="ad-row-line">
        <div className="ad-row-order"><MoveButtons index={index} count={count} onMove={onMove} label={title} /></div>
        {thumb ? <img className="ad-thumb" src={thumb} alt="" /> : null}
        <div className="ad-row-main">
          <button type="button" className="ad-row-title ad-link-btn" onClick={onToggleOpen} aria-expanded={open}>{title}{dirty ? ' •' : ''}</button>
        </div>
        <div className="ad-row-actions">
          <VisibilityToggle visible={item.is_visible} onChange={toggle} label={title} />
          <button type="button" className="ad-btn ad-btn-light" onClick={onToggleOpen} aria-expanded={open}>{open ? 'إغلاق' : 'تعديل'}</button>
          <button type="button" className="ad-btn ad-btn-danger" onClick={onRemove}>حذف</button>
        </div>
      </div>
      {open && (
        <div className="ad-row-editor">
          <FieldList fields={type.item.fields} value={draft} onChange={setDraft} />
          <div className="ad-form-actions">
            <button type="button" className="ad-btn ad-btn-primary" onClick={save} disabled={saving || !dirty}>{saving ? 'جارِ الحفظ…' : 'حفظ العنصر'}</button>
            {dirty && <button type="button" className="ad-btn ad-btn-light" onClick={() => setDraft(item.content)}>تراجع</button>}
          </div>
        </div>
      )}
    </li>
  )
}
