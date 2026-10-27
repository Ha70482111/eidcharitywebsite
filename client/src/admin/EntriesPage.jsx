import { useEffect, useState } from 'react'
import { get, put, del } from './api.js'
import { useToast, PageHead } from './ui.jsx'

// Entries sent from the site's form sections (volunteer, partnership…), newest first.
const when = iso => {
  const d = new Date(iso)
  return isNaN(d) ? iso : d.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
}

// Excel opens a UTF-8 CSV with Arabic correctly only with the BOM.
function downloadCsv(entries, name) {
  const labels = [...new Set(entries.flatMap(e => e.fields.map(f => f.label)))]
  const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = [['التاريخ', 'النموذج', ...labels], ...entries.map(e => [when(e.created_at), e.form_name, ...labels.map(l => e.fields.find(f => f.label === l)?.value ?? '')])]
  const blob = new Blob(['﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${name}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export default function EntriesPage({ onUnread }) {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [form, setForm] = useState('')
  const [open, setOpen] = useState(null)

  const load = () => get('/api/admin/entries').then(d => { setData(d); onUnread?.(d.unread) }).catch(e => toast(e.message, 'error'))
  useEffect(() => { load() }, [])

  if (!data) return <p>جارِ التحميل…</p>

  const forms = [...new Set(data.entries.map(e => e.form_name))]
  const list = form ? data.entries.filter(e => e.form_name === form) : data.entries

  const update = next => {
    const entries = data.entries.map(e => (e.id === next.id ? next : e))
    const unread = entries.filter(e => !e.is_read).length
    setData({ entries, unread })
    onUnread?.(unread)
  }
  const setRead = async (e, is_read) => {
    try { update(await put(`/api/admin/entries/${e.id}`, { is_read })) } catch (err) { toast(err.message, 'error') }
  }
  const toggle = e => {
    setOpen(open === e.id ? null : e.id)
    if (!e.is_read) setRead(e, true)
  }
  const remove = async e => {
    if (!window.confirm(`حذف طلب «${e.fields[0]?.value || e.form_name}» نهائيًا؟`)) return
    try {
      await del(`/api/admin/entries/${e.id}`)
      const entries = data.entries.filter(x => x.id !== e.id)
      setData({ entries, unread: entries.filter(x => !x.is_read).length })
      onUnread?.(entries.filter(x => !x.is_read).length)
      toast('تم حذف الطلب')
    } catch (err) { toast(err.message, 'error') }
  }

  return (
    <>
      <PageHead title="الطلبات الواردة">
        <button type="button" className="ad-btn ad-btn-light" onClick={load}>تحديث</button>
        <button type="button" className="ad-btn ad-btn-primary" disabled={!list.length} onClick={() => downloadCsv(list, form || 'الطلبات')}>تحميل Excel (CSV)</button>
      </PageHead>
      <p className="ad-help">هنا كل اللي بيتبعت من نماذج الموقع (التطوع، الشراكات…). تقدر تضيف نموذج لأي صفحة من «إضافة قسم» ← «نموذج تسجيل».</p>

      {forms.length > 1 && (
        <div className="ad-card" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="ad-label" htmlFor="ent-form" style={{ margin: 0 }}>النموذج</label>
          <select id="ent-form" className="ad-input" style={{ width: 'auto', minWidth: 220 }} value={form} onChange={e => setForm(e.target.value)}>
            <option value="">كل النماذج ({data.entries.length})</option>
            {forms.map(f => <option key={f} value={f}>{f} ({data.entries.filter(e => e.form_name === f).length})</option>)}
          </select>
        </div>
      )}

      {!list.length && <div className="ad-card"><p className="ad-help" style={{ margin: 0 }}>لسه مفيش طلبات.</p></div>}

      <div className="ad-rows">
        {list.map(e => (
          <div key={e.id} className="ad-card" style={{ padding: 0, borderInlineStart: e.is_read ? undefined : '4px solid #8A0047' }}>
            <button type="button" onClick={() => toggle(e)} aria-expanded={open === e.id}
              style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', width: '100%', padding: '14px 18px', minHeight: 44, flexWrap: 'wrap' }}>
              <strong style={{ flex: '1 1 200px' }}>{e.fields.find(f => f.value)?.value || '—'}{!e.is_read && <span style={{ color: '#8A0047', fontSize: 12, marginInlineStart: 8 }}>● جديد</span>}</strong>
              <span className="ad-help" style={{ margin: 0 }}>{e.form_name}{e.page ? ` · ${e.page}` : ''}</span>
              <span className="ad-help" style={{ margin: 0 }}>{when(e.created_at)}</span>
            </button>
            {open === e.id && (
              <div style={{ padding: '0 18px 16px', borderTop: '1px solid #EAE7E2' }}>
                <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 200px) 1fr', gap: '8px 16px', margin: '14px 0' }}>
                  {e.fields.filter(f => f.value).map((f, i) => (
                    <div key={i} style={{ display: 'contents' }}>
                      <dt style={{ fontWeight: 700, color: '#5A5450' }}>{f.label}</dt>
                      <dd style={{ margin: 0, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{/^[^@\s]+@[^@\s]+$/.test(f.value)
                        ? <a href={`mailto:${f.value}`} dir="ltr">{f.value}</a>
                        : /^\+?[\d\s()-]{6,20}$/.test(f.value) ? <a href={`tel:${f.value.replace(/\s+/g, '')}`} dir="ltr">{f.value}</a> : f.value}</dd>
                    </div>
                  ))}
                </dl>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="ad-btn ad-btn-light" onClick={() => setRead(e, !e.is_read)}>{e.is_read ? 'علّمه كجديد' : 'علّمه كمقروء'}</button>
                  <button type="button" className="ad-btn ad-btn-danger" onClick={() => remove(e)}>حذف</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
