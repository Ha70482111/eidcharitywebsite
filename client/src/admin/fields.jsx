import { useEffect, useId, useRef, useState } from 'react'
import { get, uploadImage } from './api.js'
import { useToast } from './ui.jsx'

export function FieldList({ fields, value = {}, onChange }) {
  return (
    <div className="ad-fields">
      {fields.map(f => (
        <Field key={f.key} field={f} value={value[f.key]} onChange={v => onChange({ ...value, [f.key]: v })} />
      ))}
    </div>
  )
}

export function Field({ field, value, onChange }) {
  const id = useId()
  const wide = field.type === 'textarea' || field.type === 'list' || field.type === 'image'

  if (field.bi) {
    const v = value && typeof value === 'object' ? value : { ar: typeof value === 'string' ? value : '', en: '' }
    return (
      <fieldset className={`ad-field ad-bi ${wide ? 'ad-wide' : ''}`}>
        <legend>{field.label}</legend>
        <div className="ad-bi-row">
          <label className="ad-bi-col">
            <span className="ad-lang">عربي</span>
            <Input type={field.type} value={v.ar ?? ''} onChange={ar => onChange({ ...v, ar })} dir="rtl" />
          </label>
          <label className="ad-bi-col">
            <span className="ad-lang">English</span>
            <Input type={field.type} value={v.en ?? ''} onChange={en => onChange({ ...v, en })} dir="ltr" />
          </label>
        </div>
        {field.help && <p className="ad-help">{field.help}</p>}
      </fieldset>
    )
  }

  if (field.type === 'bool') {
    return (
      <div className="ad-field ad-wide">
        <label className="ad-switch">
          <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} />
          <span className="ad-switch-ui" aria-hidden="true" />
          <span>{field.label}</span>
        </label>
        {field.help && <p className="ad-help">{field.help}</p>}
      </div>
    )
  }

  if (field.type === 'list') {
    return (
      <fieldset className="ad-field ad-wide">
        <legend>{field.label}</legend>
        <ListInput field={field} value={Array.isArray(value) ? value : []} onChange={onChange} />
      </fieldset>
    )
  }

  if (field.type === 'image') {
    return (
      <div className="ad-field ad-wide">
        <span className="ad-label" id={id}>{field.label}</span>
        <ImageInput value={value || ''} onChange={onChange} labelledBy={id} />
        {field.help && <p className="ad-help">{field.help}</p>}
      </div>
    )
  }

  return (
    <div className={`ad-field ${wide ? 'ad-wide' : ''}`}>
      <label className="ad-label" htmlFor={id}>{field.label}</label>
      {field.type === 'select' ? (
        <select id={id} className="ad-input" value={value ?? ''} onChange={e => onChange(e.target.value)}>
          {!field.options.some(([k]) => k === value) && <option value="">— اختر —</option>}
          {field.options.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      ) : field.type === 'color' ? (
        <div className="ad-color">
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(value || '') ? value : '#000000'} onChange={e => onChange(e.target.value)} aria-label={field.label} />
          <input id={id} className="ad-input" dir="ltr" value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder="#7C1A44" />
        </div>
      ) : (
        <Input id={id} type={field.type} value={value ?? ''} onChange={onChange} dir={field.dir} />
      )}
      {field.help && <p className="ad-help">{field.help}</p>}
    </div>
  )
}

function Input({ type, value, onChange, dir, id }) {
  if (type === 'textarea') {
    return <textarea id={id} className="ad-input" rows={4} dir={dir} value={value} onChange={e => onChange(e.target.value)} />
  }
  if (type === 'number') {
    return <input id={id} className="ad-input" type="number" dir="ltr" value={value}
      onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
  }
  return <input id={id} className="ad-input" type={type === 'url' ? 'text' : 'text'} dir={type === 'url' ? 'ltr' : dir}
    value={value} onChange={e => onChange(e.target.value)} placeholder={type === 'url' ? 'https://… أو #anchor' : undefined} />
}

function ListInput({ field, value, onChange }) {
  const move = (i, d) => {
    const j = i + d
    if (j < 0 || j >= value.length) return
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const blank = () => Object.fromEntries(field.fields.map(f => [f.key, f.bi ? { ar: '', en: '' } : f.type === 'list' ? [] : '']))
  return (
    <div className="ad-list">
      {value.map((entry, i) => (
        <div key={i} className="ad-list-item">
          <div className="ad-list-head">
            <strong>{field.itemLabel || 'عنصر'} {i + 1}</strong>
            <div className="ad-row-actions">
              <button type="button" className="ad-icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="تحريك لأعلى">▲</button>
              <button type="button" className="ad-icon-btn" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="تحريك لأسفل">▼</button>
              <button type="button" className="ad-icon-btn ad-danger" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label="حذف">✕</button>
            </div>
          </div>
          <FieldList fields={field.fields} value={entry} onChange={v => onChange(value.map((e, k) => (k === i ? v : e)))} />
        </div>
      ))}
      <button type="button" className="ad-btn ad-btn-light" onClick={() => onChange([...value, blank()])}>+ إضافة {field.itemLabel || 'عنصر'}</button>
    </div>
  )
}

export function ImageInput({ value, onChange, labelledBy }) {
  const toast = useToast()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [library, setLibrary] = useState(null)

  const onFile = async e => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try { onChange(await uploadImage(file)); toast('تم رفع الصورة') } catch (err) { toast(err.message, 'error') } finally { setBusy(false) }
  }

  return (
    <div className="ad-image" role="group" aria-labelledby={labelledBy}>
      <div className="ad-image-preview">{value ? <img src={value} alt="" /> : <span>لا توجد صورة</span>}</div>
      <div className="ad-image-controls">
        <input className="ad-input" dir="ltr" value={value} onChange={e => onChange(e.target.value)} placeholder="رابط الصورة أو ارفع صورة" aria-label="رابط الصورة" />
        <div className="ad-image-buttons">
          <button type="button" className="ad-btn ad-btn-light" onClick={() => fileRef.current?.click()} disabled={busy}>{busy ? 'جارِ الرفع…' : 'رفع صورة'}</button>
          <button type="button" className="ad-btn ad-btn-light" onClick={() => setLibrary(true)}>من المكتبة</button>
          {value && <button type="button" className="ad-btn ad-btn-light" onClick={() => onChange('')}>إزالة</button>}
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={onFile} />
      </div>
      {library && <MediaLibrary onClose={() => setLibrary(null)} onPick={url => { onChange(url); setLibrary(null) }} />}
    </div>
  )
}

function MediaLibrary({ onClose, onPick }) {
  const [files, setFiles] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { get('/api/admin/uploads').then(setFiles).catch(e => setError(e.message)) }, [])
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="ad-modal-backdrop" onClick={onClose}>
      <div className="ad-modal" role="dialog" aria-modal="true" aria-label="مكتبة الصور" onClick={e => e.stopPropagation()}>
        <div className="ad-modal-head">
          <h3>مكتبة الصور</h3>
          <button type="button" className="ad-icon-btn" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        {error && <p className="ad-error">{error}</p>}
        {!files && !error && <p>جارِ التحميل…</p>}
        {files && !files.length && <p>لم يتم رفع أي صور بعد.</p>}
        <div className="ad-library">
          {files?.map(f => (
            <button type="button" key={f.url} onClick={() => onPick(f.url)} className="ad-library-item" aria-label={f.url.split('/').pop()}>
              <img src={f.url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
