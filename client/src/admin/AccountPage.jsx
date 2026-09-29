import { useEffect, useState } from 'react'
import { get, post, put, del } from './api.js'
import { useToast, PageHead } from './ui.jsx'

export default function AccountPage({ user }) {
  const toast = useToast()
  const [admins, setAdmins] = useState([])
  const [pw, setPw] = useState({ current: '', password: '', confirm: '' })
  const [nu, setNu] = useState({ username: '', password: '' })

  const load = () => get('/api/admin/admins').then(setAdmins).catch(e => toast(e.message, 'error'))
  useEffect(() => { load() }, [])

  const changePw = async e => {
    e.preventDefault()
    if (pw.password !== pw.confirm) return toast('كلمتا المرور غير متطابقتين', 'error')
    try { await put('/api/admin/password', { current: pw.current, password: pw.password }); setPw({ current: '', password: '', confirm: '' }); toast('تم تغيير كلمة المرور') }
    catch (err) { toast(err.message, 'error') }
  }

  const addAdmin = async e => {
    e.preventDefault()
    try { await post('/api/admin/admins', nu); setNu({ username: '', password: '' }); toast('تمت إضافة الحساب'); load() }
    catch (err) { toast(err.message, 'error') }
  }

  const remove = async a => {
    if (!window.confirm(`حذف حساب «${a.username}»؟`)) return
    try { await del(`/api/admin/admins/${a.id}`); toast('تم حذف الحساب'); load() } catch (err) { toast(err.message, 'error') }
  }

  return (
    <>
      <PageHead title="الحسابات" />
      <div className="ad-card">
        <div className="ad-card-head"><h2>حسابات لوحة التحكم</h2></div>
        <ul className="ad-rows">
          {admins.map(a => (
            <li key={a.id} className="ad-row">
              <div className="ad-row-main"><span className="ad-row-title" dir="ltr">{a.username}</span>{a.id === user.id && <span className="ad-row-meta">حسابك الحالي</span>}</div>
              <div className="ad-row-actions">{a.id !== user.id && <button type="button" className="ad-btn ad-btn-danger" onClick={() => remove(a)}>حذف</button>}</div>
            </li>
          ))}
        </ul>
        <form onSubmit={addAdmin} className="ad-inline-form">
          <h3>إضافة حساب جديد</h3>
          <div className="ad-fields">
            <div className="ad-field"><label className="ad-label">اسم المستخدم<input className="ad-input" dir="ltr" autoComplete="off" value={nu.username} onChange={e => setNu({ ...nu, username: e.target.value })} required minLength={3} /></label></div>
            <div className="ad-field"><label className="ad-label">كلمة المرور (8 أحرف على الأقل)<input className="ad-input" dir="ltr" type="password" autoComplete="new-password" value={nu.password} onChange={e => setNu({ ...nu, password: e.target.value })} required minLength={8} /></label></div>
          </div>
          <div className="ad-form-actions"><button className="ad-btn ad-btn-primary">إضافة الحساب</button></div>
        </form>
      </div>

      <form className="ad-card" onSubmit={changePw}>
        <div className="ad-card-head"><h2>تغيير كلمة المرور</h2></div>
        <div className="ad-fields">
          <div className="ad-field"><label className="ad-label">كلمة المرور الحالية<input className="ad-input" dir="ltr" type="password" autoComplete="current-password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} required /></label></div>
          <div className="ad-field"><label className="ad-label">كلمة المرور الجديدة<input className="ad-input" dir="ltr" type="password" autoComplete="new-password" value={pw.password} onChange={e => setPw({ ...pw, password: e.target.value })} required minLength={8} /></label></div>
          <div className="ad-field"><label className="ad-label">تأكيد كلمة المرور الجديدة<input className="ad-input" dir="ltr" type="password" autoComplete="new-password" value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} required minLength={8} /></label></div>
        </div>
        <div className="ad-form-actions"><button className="ad-btn ad-btn-primary">تغيير كلمة المرور</button></div>
      </form>
    </>
  )
}
