import { useEffect, useState } from 'react'
import { get, post, put, del } from './api.js'
import { useToast, PageHead, isManager } from './ui.jsx'

const ROLES = { manager: 'مدير الموقع', editor: 'محرر' }

export default function AccountPage({ user }) {
  const manager = isManager(user)
  return (
    <>
      <PageHead title={manager ? 'الحسابات والصلاحيات' : 'حسابي'} />
      {manager && <Accounts user={user} />}
      <PasswordForm />
    </>
  )
}

function Accounts({ user }) {
  const toast = useToast()
  const [admins, setAdmins] = useState([])
  const [menu, setMenu] = useState(null)
  const [open, setOpen] = useState(null) // account id whose permissions are open
  const [nu, setNu] = useState({ username: '', password: '', role: 'editor', menu: [] })

  const load = () => get('/api/admin/admins').then(setAdmins).catch(e => toast(e.message, 'error'))
  useEffect(() => {
    load()
    get('/api/admin/access-menu').then(setMenu).catch(e => toast(e.message, 'error'))
  }, [])

  const addAdmin = async e => {
    e.preventDefault()
    try {
      await post('/api/admin/admins', nu)
      setNu({ username: '', password: '', role: 'editor', menu: [] })
      toast('تمت إضافة الحساب')
      load()
    } catch (err) { toast(err.message, 'error') }
  }

  const update = async (a, patch, msg) => {
    try {
      const r = await put(`/api/admin/admins/${a.id}`, patch)
      setAdmins(l => l.map(x => (x.id === r.id ? r : x)))
      toast(msg)
      return true
    } catch (err) { toast(err.message, 'error'); return false }
  }

  const resetPassword = a => {
    const pw = window.prompt(`كلمة مرور جديدة لحساب «${a.username}» (8 أحرف على الأقل):`)
    if (pw) update(a, { password: pw }, 'تم تغيير كلمة المرور')
  }

  const remove = async a => {
    if (!window.confirm(`حذف حساب «${a.username}»؟`)) return
    try { await del(`/api/admin/admins/${a.id}`); toast('تم حذف الحساب'); load() } catch (err) { toast(err.message, 'error') }
  }

  return (
    <div className="ad-card">
      <div className="ad-card-head"><h2>حسابات لوحة التحكم</h2></div>
      <p className="ad-help">
        <strong>مدير الموقع</strong> يعدّل كل حاجة ويضيف الحسابات. <strong>المحرر</strong> يعدّل بس محتوى عناصر المنيو اللي تختارها له
        (العنصر الرئيسي أو المجموعة بيدّي كل اللي تحتها): الصفحات الفرعية بكل أقسامها، وأقسام الصفحة الرئيسية اللي الرابط بيشاور عليها (زي <span dir="ltr">#media</span>).
      </p>
      <ul className="ad-rows">
        {admins.map(a => (
          <li key={a.id} className={`ad-row ad-row-item ${a.is_active ? '' : 'ad-row-hidden'}`}>
            <div className="ad-row-line">
              <div className="ad-row-main">
                <span className="ad-row-title" dir="ltr">{a.username}</span>
                <span className="ad-row-meta">
                  {ROLES[a.role]}
                  {a.role === 'editor' && ` · ${a.menu.length ? `${a.menu.length} عنصر من المنيو` : 'بدون صلاحيات لسه'}`}
                  {!a.is_active && ' · موقوف'}
                  {a.id === user.id && ' · حسابك الحالي'}
                </span>
              </div>
              {a.id !== user.id && (
                <div className="ad-row-actions">
                  {a.role === 'editor' && (
                    <button type="button" className="ad-btn ad-btn-light" onClick={() => setOpen(open === a.id ? null : a.id)} aria-expanded={open === a.id}>الصلاحيات</button>
                  )}
                  <button type="button" className="ad-btn ad-btn-light" onClick={() => update(a, { is_active: !a.is_active }, a.is_active ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب')}>
                    {a.is_active ? 'إيقاف' : 'تفعيل'}
                  </button>
                  <button type="button" className="ad-btn ad-btn-light" onClick={() => resetPassword(a)}>كلمة مرور جديدة</button>
                  <button type="button" className="ad-btn ad-btn-light"
                    onClick={() => update(a, { role: a.role === 'editor' ? 'manager' : 'editor' }, 'تم تغيير نوع الحساب')}>
                    {a.role === 'editor' ? 'اجعله مديرًا' : 'اجعله محررًا'}
                  </button>
                  <button type="button" className="ad-btn ad-btn-danger" onClick={() => remove(a)}>حذف</button>
                </div>
              )}
            </div>
            {open === a.id && (
              <div className="ad-row-editor">
                <EditorPerms menu={menu} initial={a.menu} onCancel={() => setOpen(null)}
                  onSave={async ids => { if (await update(a, { menu: ids }, 'تم حفظ الصلاحيات')) setOpen(null) }} />
              </div>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={addAdmin} className="ad-inline-form">
        <h3>إضافة حساب جديد</h3>
        <div className="ad-fields">
          <div className="ad-field"><label className="ad-label">اسم المستخدم<input className="ad-input" dir="ltr" autoComplete="off" value={nu.username} onChange={e => setNu({ ...nu, username: e.target.value })} required minLength={3} /></label></div>
          <div className="ad-field"><label className="ad-label">كلمة المرور (8 أحرف على الأقل)<input className="ad-input" dir="ltr" type="password" autoComplete="new-password" value={nu.password} onChange={e => setNu({ ...nu, password: e.target.value })} required minLength={8} /></label></div>
          <div className="ad-field">
            <label className="ad-label">نوع الحساب
              <select className="ad-input" value={nu.role} onChange={e => setNu({ ...nu, role: e.target.value })}>
                <option value="editor">محرر (يعدّل أجزاء تختارها له)</option>
                <option value="manager">مدير الموقع (كل الصلاحيات)</option>
              </select>
            </label>
          </div>
        </div>
        {nu.role === 'editor' && <MenuPicker menu={menu} value={nu.menu} onChange={ids => setNu({ ...nu, menu: ids })} />}
        <div className="ad-form-actions"><button className="ad-btn ad-btn-primary">إضافة الحساب</button></div>
      </form>
    </div>
  )
}

function EditorPerms({ menu, initial, onSave, onCancel }) {
  const [ids, setIds] = useState(initial)
  return (
    <>
      <MenuPicker menu={menu} value={ids} onChange={setIds} />
      <div className="ad-form-actions">
        <button type="button" className="ad-btn ad-btn-primary" onClick={() => onSave(ids)}>حفظ الصلاحيات</button>
        <button type="button" className="ad-btn ad-btn-light" onClick={onCancel}>إلغاء</button>
      </div>
    </>
  )
}

// The menu as a tree of checkboxes. A checked item gives everything under it, so its children show as checked.
function MenuPicker({ menu, value, onChange }) {
  if (!menu) return <p>جارِ تحميل المنيو…</p>
  const childrenOf = pid => menu.filter(r => r.parent_id === pid)
  const toggle = (id, on) => {
    const under = new Set()
    const walk = pid => childrenOf(pid).forEach(c => { under.add(c.id); walk(c.id) })
    walk(id)
    // checking an item makes the ticks under it redundant
    onChange(on ? [...value.filter(x => !under.has(x)), id] : value.filter(x => x !== id))
  }
  const level = (pid, inherited) => (
    <ul className="ad-perms">
      {childrenOf(pid).map(r => {
        const own = value.includes(r.id)
        return (
          <li key={r.id}>
            <label className="ad-perm">
              <input type="checkbox" checked={own || inherited} disabled={inherited} onChange={e => toggle(r.id, e.target.checked)} />
              <span>
                {r.label_ar || r.label_en || '(بدون اسم)'}
                {r.target && <span className="ad-row-meta"> — {r.target}</span>}
              </span>
            </label>
            {childrenOf(r.id).length > 0 && level(r.id, inherited || own)}
          </li>
        )
      })}
    </ul>
  )
  return (
    <fieldset className="ad-field ad-wide" style={{ border: 0, padding: 0, margin: '12px 0 0' }}>
      <legend className="ad-label">عناصر المنيو اللي يقدر يعدّل محتواها</legend>
      <p className="ad-help" style={{ margin: '0 0 8px' }}>العنصر اللي جنبه «صفحة» أو «الرئيسية» هو اللي ليه محتوى يتعدّل. اختيار عنصر رئيسي أو مجموعة بيدّي كل اللي تحتها.</p>
      {level(null, false)}
    </fieldset>
  )
}

function PasswordForm() {
  const toast = useToast()
  const [pw, setPw] = useState({ current: '', password: '', confirm: '' })

  const changePw = async e => {
    e.preventDefault()
    if (pw.password !== pw.confirm) return toast('كلمتا المرور غير متطابقتين', 'error')
    try { await put('/api/admin/password', { current: pw.current, password: pw.password }); setPw({ current: '', password: '', confirm: '' }); toast('تم تغيير كلمة المرور') }
    catch (err) { toast(err.message, 'error') }
  }

  return (
    <form className="ad-card" onSubmit={changePw}>
      <div className="ad-card-head"><h2>تغيير كلمة المرور</h2></div>
      <div className="ad-fields">
        <div className="ad-field"><label className="ad-label">كلمة المرور الحالية<input className="ad-input" dir="ltr" type="password" autoComplete="current-password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} required /></label></div>
        <div className="ad-field"><label className="ad-label">كلمة المرور الجديدة<input className="ad-input" dir="ltr" type="password" autoComplete="new-password" value={pw.password} onChange={e => setPw({ ...pw, password: e.target.value })} required minLength={8} /></label></div>
        <div className="ad-field"><label className="ad-label">تأكيد كلمة المرور الجديدة<input className="ad-input" dir="ltr" type="password" autoComplete="new-password" value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} required minLength={8} /></label></div>
      </div>
      <div className="ad-form-actions"><button className="ad-btn ad-btn-primary">تغيير كلمة المرور</button></div>
    </form>
  )
}
