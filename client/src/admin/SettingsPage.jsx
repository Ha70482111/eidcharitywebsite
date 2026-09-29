import { useEffect, useState } from 'react'
import { get, put } from './api.js'
import { useToast, PageHead } from './ui.jsx'
import { FieldList } from './fields.jsx'
import { SETTINGS_GROUPS } from '../shared/sectionTypes.js'

export default function SettingsPage() {
  const toast = useToast()
  const [saved, setSaved] = useState(null)
  const [draft, setDraft] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { get('/api/admin/settings').then(s => { setSaved(s); setDraft(s) }).catch(e => toast(e.message, 'error')) }, [])

  const dirty = saved && JSON.stringify(saved) !== JSON.stringify(draft)
  useEffect(() => {
    if (!dirty) return
    const fn = e => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', fn)
    return () => window.removeEventListener('beforeunload', fn)
  }, [dirty])

  if (!draft) return <p>جارِ التحميل…</p>

  const save = async () => {
    setBusy(true)
    try { const s = await put('/api/admin/settings', draft); setSaved(s); setDraft(s); toast('تم حفظ الإعدادات') }
    catch (e) { toast(e.message, 'error') } finally { setBusy(false) }
  }

  return (
    <>
      <PageHead title="الإعدادات العامة">
        <button type="button" className="ad-btn ad-btn-primary" onClick={save} disabled={busy || !dirty}>{busy ? 'جارِ الحفظ…' : dirty ? 'حفظ التغييرات' : 'محفوظ'}</button>
      </PageHead>
      <p className="ad-help">الشعار، الشريط العلوي، السوشيال ميديا، والفوتر.</p>
      {SETTINGS_GROUPS.map(g => (
        <div key={g.title} className="ad-card">
          <div className="ad-card-head"><h2>{g.title}</h2></div>
          <FieldList fields={g.fields} value={draft} onChange={setDraft} />
        </div>
      ))}
      <div className="ad-form-actions">
        <button type="button" className="ad-btn ad-btn-primary" onClick={save} disabled={busy || !dirty}>{busy ? 'جارِ الحفظ…' : 'حفظ الإعدادات'}</button>
      </div>
    </>
  )
}
