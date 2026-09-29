import { useEffect, useState } from 'react'
import { get, post, put, del } from './api.js'
import { useToast, VisibilityToggle, MoveButtons, PageHead, swap } from './ui.jsx'
import { FieldList } from './fields.jsx'

const FEATURED_FIELDS = [
  { key: 'label', label: 'الشارة', type: 'text', bi: true },
  { key: 'title', label: 'العنوان', type: 'text', bi: true },
  { key: 'desc', label: 'الوصف', type: 'textarea', bi: true },
  { key: 'cta', label: 'نص الزر', type: 'text', bi: true },
  { key: 'url', label: 'رابط الزر', type: 'url' },
  { key: 'img', label: 'الصورة', type: 'image' },
]

const LEVEL_NAMES = ['عنصر رئيسي', 'مجموعة (عمود)', 'رابط']

export default function MenuPage() {
  const toast = useToast()
  const [rows, setRows] = useState(null)
  const [addingTop, setAddingTop] = useState(false)

  const load = () => get('/api/admin/menu').then(setRows).catch(e => toast(e.message, 'error'))
  useEffect(() => { load() }, [])

  if (!rows) return <p>جارِ التحميل…</p>

  const childrenOf = pid => rows.filter(r => r.parent_id === pid).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)

  const move = async (pid, i, d) => {
    const list = swap(childrenOf(pid), i, d)
    const order = new Map(list.map((r, k) => [r.id, k + 1]))
    setRows(all => all.map(r => (order.has(r.id) ? { ...r, sort_order: order.get(r.id) } : r)))
    try { await post('/api/admin/menu/reorder', { parent_id: pid, ids: list.map(r => r.id) }) } catch (e) { toast(e.message, 'error'); load() }
  }

  const update = async (row, patch, msg = 'تم الحفظ') => {
    try {
      const r = await put(`/api/admin/menu/${row.id}`, patch)
      setRows(all => all.map(x => (x.id === r.id ? r : x)))
      toast(msg)
      return true
    } catch (e) { toast(e.message, 'error'); return false }
  }

  const create = async (pid, data) => {
    try { const r = await post('/api/admin/menu', { ...data, parent_id: pid }); setRows(all => [...all, r]); toast('تمت الإضافة'); return true }
    catch (e) { toast(e.message, 'error'); return false }
  }

  const remove = async row => {
    const kids = childrenOf(row.id).length
    if (!window.confirm(`حذف «${row.label_ar || row.label_en}»${kids ? ' وكل ما بداخله' : ''} نهائيًا؟`)) return
    try { await del(`/api/admin/menu/${row.id}`); toast('تم الحذف'); load() } catch (e) { toast(e.message, 'error') }
  }

  const renderLevel = (pid, level) => {
    const list = childrenOf(pid)
    return (
      <ul className={`ad-tree ad-tree-${level}`}>
        {list.map((r, i) => (
          <MenuNode key={r.id} row={r} level={level} index={i} count={list.length}
            onMove={(idx, d) => move(pid, idx, d)} onUpdate={update} onRemove={remove} onCreate={create}
            renderChildren={() => (level < 2 ? renderLevel(r.id, level + 1) : null)} hasChildren={childrenOf(r.id).length > 0} />
        ))}
      </ul>
    )
  }

  return (
    <>
      <PageHead title="المنيو الرئيسية">
        <button type="button" className="ad-btn ad-btn-primary" onClick={() => setAddingTop(true)}>+ عنصر رئيسي</button>
      </PageHead>
      <div className="ad-card ad-help-card">
        <p><strong>كيف تعمل المنيو؟</strong> العنصر الرئيسي بدون عناصر فرعية يكون رابطًا مباشرًا. لو أضفت له «مجموعات»، يفتح قائمة كبيرة (Mega Menu):
          كل مجموعة عنوان عمود، وتحتها «روابط». للربط بقسم في الصفحة اكتب <span dir="ltr">#</span> ثم معرّف القسم، مثل <span dir="ltr">#impact</span>.</p>
      </div>
      {addingTop && (
        <div className="ad-card">
          <MenuForm level={0} onCancel={() => setAddingTop(false)} onSubmit={async d => { if (await create(null, d)) setAddingTop(false) }} submitLabel="إضافة" />
        </div>
      )}
      {renderLevel(null, 0)}
    </>
  )
}

function MenuNode({ row, level, index, count, onMove, onUpdate, onRemove, onCreate, renderChildren, hasChildren }) {
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState(level === 0 ? false : true)
  const label = row.label_ar || row.label_en || '(بدون اسم)'

  return (
    <li className={`ad-node ${row.is_visible ? '' : 'ad-row-hidden'}`}>
      <div className="ad-row">
        <div className="ad-row-order"><MoveButtons index={index} count={count} onMove={onMove} label={label} /></div>
        <div className="ad-row-main">
          {level < 2 && hasChildren ? (
            <button type="button" className="ad-row-title ad-link-btn" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
              <span aria-hidden="true">{expanded ? '▾' : '▸'}</span> {label}
            </button>
          ) : <span className="ad-row-title">{label}</span>}
          <span className="ad-row-meta">
            {LEVEL_NAMES[level]}{row.label_en ? <> · <span dir="ltr">{row.label_en}</span></> : ''}
            {row.url ? <> · <span dir="ltr">{row.url}</span></> : ''}
            {level === 1 ? ` · عمود ${row.extra?.col || 1}` : ''}
          </span>
        </div>
        <div className="ad-row-actions">
          <VisibilityToggle visible={row.is_visible} onChange={v => onUpdate(row, { is_visible: v }, v ? 'العنصر ظاهر الآن' : 'تم إخفاء العنصر')} label={label} />
          <button type="button" className="ad-btn ad-btn-light" onClick={() => setEditing(!editing)} aria-expanded={editing}>تعديل</button>
          {level < 2 && <button type="button" className="ad-btn ad-btn-light" onClick={() => { setAdding(true); setExpanded(true) }}>+ {LEVEL_NAMES[level + 1]}</button>}
          <button type="button" className="ad-btn ad-btn-danger" onClick={() => onRemove(row)}>حذف</button>
        </div>
      </div>
      {editing && (
        <div className="ad-row-editor">
          <MenuForm level={level} initial={row} submitLabel="حفظ" onCancel={() => setEditing(false)}
            onSubmit={async d => { if (await onUpdate(row, d)) setEditing(false) }} />
        </div>
      )}
      {adding && (
        <div className="ad-row-editor">
          <MenuForm level={level + 1} submitLabel="إضافة" onCancel={() => setAdding(false)}
            onSubmit={async d => { if (await onCreate(row.id, d)) setAdding(false) }} />
        </div>
      )}
      {expanded && renderChildren()}
    </li>
  )
}

function MenuForm({ level, initial, onSubmit, onCancel, submitLabel }) {
  const [d, setD] = useState({
    label_ar: initial?.label_ar || '', label_en: initial?.label_en || '', url: initial?.url || '',
    extra: initial?.extra || (level === 1 ? { col: 1 } : {}),
  })
  const [busy, setBusy] = useState(false)
  const featured = d.extra?.featured || {}

  const submit = async e => {
    e.preventDefault()
    setBusy(true)
    await onSubmit(d)
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="ad-menu-form">
      <h3>{initial ? 'تعديل' : 'إضافة'} {LEVEL_NAMES[level]}</h3>
      <div className="ad-fields">
        <div className="ad-field"><label className="ad-label">الاسم بالعربي<input className="ad-input" value={d.label_ar} onChange={e => setD({ ...d, label_ar: e.target.value })} required /></label></div>
        <div className="ad-field"><label className="ad-label">الاسم بالإنجليزي<input className="ad-input" dir="ltr" value={d.label_en} onChange={e => setD({ ...d, label_en: e.target.value })} /></label></div>
        <div className="ad-field"><label className="ad-label">الرابط{level === 0 ? ' (يُتجاهل إذا كان للعنصر مجموعات)' : ''}
          <input className="ad-input" dir="ltr" value={d.url} placeholder="https://… أو #impact" onChange={e => setD({ ...d, url: e.target.value })} /></label></div>
        {level === 1 && (
          <div className="ad-field"><label className="ad-label">رقم العمود
            <select className="ad-input" value={d.extra?.col || 1} onChange={e => setD({ ...d, extra: { ...d.extra, col: Number(e.target.value) } })}>
              {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
            </select></label></div>
        )}
      </div>
      {level === 0 && (
        <details className="ad-details">
          <summary>بطاقة مميزة داخل القائمة الكبيرة (اختياري)</summary>
          <FieldList fields={FEATURED_FIELDS} value={featured} onChange={f => setD({ ...d, extra: { ...d.extra, featured: f } })} />
        </details>
      )}
      <div className="ad-form-actions">
        <button className="ad-btn ad-btn-primary" disabled={busy}>{busy ? 'لحظة…' : submitLabel}</button>
        <button type="button" className="ad-btn ad-btn-light" onClick={onCancel}>إلغاء</button>
      </div>
    </form>
  )
}
