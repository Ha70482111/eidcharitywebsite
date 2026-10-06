import { useEffect, useState } from 'react'
import { get, post, setToken, getToken, setUnauthorizedHandler } from './api.js'
import { ToastProvider } from './ui.jsx'
import SectionsPage from './SectionsPage.jsx'
import SectionEditor from './SectionEditor.jsx'
import MenuPage from './MenuPage.jsx'
import PagesPage from './PagesPage.jsx'
import SettingsPage from './SettingsPage.jsx'
import AccountPage from './AccountPage.jsx'
import './admin.css'

function useHashRoute() {
  const read = () => window.location.hash.replace(/^#/, '') || '/sections'
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const fn = () => { setRoute(read()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', fn)
    return () => window.removeEventListener('hashchange', fn)
  }, [])
  return route
}

export default function Admin() {
  const [state, setState] = useState({ loading: true })

  useEffect(() => {
    document.documentElement.lang = 'ar'
    document.documentElement.dir = 'rtl'
    document.title = 'لوحة التحكم'
    setUnauthorizedHandler(() => { setToken(null); setState(s => ({ ...s, user: null })) })
    get('/api/auth/status')
      .then(s => setState({ loading: false, needsInstall: s.needsInstall, needsSetup: s.needsSetup, user: getToken() ? s.user : null }))
      .catch(e => setState({ loading: false, error: e.message }))
  }, [])

  const onAuth = ({ token, user }) => { setToken(token); setState({ loading: false, needsSetup: false, user }) }
  const logout = () => { setToken(null); setState(s => ({ ...s, user: null })) }

  if (state.loading) return <div className="ad-center">جارِ التحميل…</div>
  if (state.error) return <div className="ad-center ad-error">تعذر الاتصال بالسيرفر: {state.error}</div>

  return (
    <ToastProvider>
      {state.needsInstall ? <InstallForm onDone={onAuth} />
        : state.user ? <Shell user={state.user} onLogout={logout} />
        : <AuthForm setup={state.needsSetup} onAuth={onAuth} />}
    </ToastProvider>
  )
}

function InstallForm({ onDone }) {
  const [f, setF] = useState({ db_host: 'localhost', db_name: '', db_user: '', db_password: '', username: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = k => e => setF({ ...f, [k]: e.target.value })

  const submit = async e => {
    e.preventDefault()
    setError('')
    if (f.password !== f.confirm) return setError('كلمتا مرور المدير غير متطابقتين')
    setBusy(true)
    try {
      await post('/api/install', f)
      onDone(await post('/api/auth/login', { username: f.username, password: f.password }))
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  const field = (k, label, props = {}) => (
    <>
      <label className="ad-label" htmlFor={`in-${k}`}>{label}</label>
      <input id={`in-${k}`} className="ad-input" dir="ltr" value={f[k]} onChange={set(k)} {...props} />
    </>
  )

  return (
    <div className="ad-auth">
      <form className="ad-auth-card" onSubmit={submit} style={{ width: 'min(480px, 100%)' }}>
        <img src="/logo.jpg" alt="" className="ad-auth-logo" />
        <h1>تجهيز الموقع لأول مرة</h1>
        <p className="ad-help">اكتب بيانات قاعدة البيانات اللي عملتها في cPanel، وبيانات حساب المدير. الخطوة دي بتحصل مرة واحدة بس.</p>
        <h2 style={{ fontSize: 16, margin: '14px 0 0' }}>قاعدة البيانات</h2>
        {field('db_host', 'الخادم (Host)', { required: true })}
        {field('db_name', 'اسم قاعدة البيانات (الاسم الكامل)', { required: true, placeholder: 'hifzalna_eid' })}
        {field('db_user', 'اسم مستخدم قاعدة البيانات (الاسم الكامل)', { required: true, placeholder: 'hifzalna_eid' })}
        {field('db_password', 'كلمة مرور قاعدة البيانات', { type: 'password', autoComplete: 'off' })}
        <h2 style={{ fontSize: 16, margin: '18px 0 0' }}>حساب المدير</h2>
        {field('username', 'اسم المستخدم', { required: true, minLength: 3, autoComplete: 'username' })}
        {field('password', 'كلمة المرور (8 أحرف على الأقل)', { type: 'password', required: true, minLength: 8, autoComplete: 'new-password' })}
        {field('confirm', 'تأكيد كلمة المرور', { type: 'password', required: true, minLength: 8, autoComplete: 'new-password' })}
        {error && <p className="ad-error" role="alert">{error}</p>}
        <button className="ad-btn ad-btn-primary ad-block" disabled={busy}>{busy ? 'جارِ التجهيز… (قد يستغرق ثوانٍ)' : 'تجهيز الموقع'}</button>
      </form>
    </div>
  )
}

function AuthForm({ setup, onAuth }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async e => {
    e.preventDefault()
    setError('')
    if (setup && password !== confirm) return setError('كلمتا المرور غير متطابقتين')
    setBusy(true)
    try { onAuth(await post(setup ? '/api/auth/setup' : '/api/auth/login', { username, password })) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="ad-auth">
      <form className="ad-auth-card" onSubmit={submit}>
        <img src="/logo.jpg" alt="" className="ad-auth-logo" />
        <h1>{setup ? 'إنشاء حساب المدير' : 'تسجيل الدخول'}</h1>
        {setup && <p className="ad-help">هذه أول مرة تفتح فيها لوحة التحكم. أنشئ حساب المدير الآن.</p>}
        <label className="ad-label" htmlFor="u">اسم المستخدم</label>
        <input id="u" className="ad-input" dir="ltr" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required minLength={3} />
        <label className="ad-label" htmlFor="p">كلمة المرور</label>
        <input id="p" className="ad-input" dir="ltr" type="password" autoComplete={setup ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={setup ? 8 : 1} />
        {setup && <>
          <label className="ad-label" htmlFor="c">تأكيد كلمة المرور</label>
          <input id="c" className="ad-input" dir="ltr" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} />
        </>}
        {error && <p className="ad-error" role="alert">{error}</p>}
        <button className="ad-btn ad-btn-primary ad-block" disabled={busy}>{busy ? 'لحظة…' : setup ? 'إنشاء الحساب' : 'دخول'}</button>
      </form>
    </div>
  )
}

const NAV = [
  ['/sections', 'أقسام الصفحة الرئيسية'],
  ['/pages', 'الصفحات الفرعية'],
  ['/menu', 'المنيو الرئيسية'],
  ['/settings', 'الإعدادات العامة'],
  ['/account', 'الحسابات'],
]

function Shell({ user, onLogout }) {
  const route = useHashRoute()
  const [navOpen, setNavOpen] = useState(false)
  const sectionMatch = /^\/sections\/(\d+)$/.exec(route)
  const pageMatch = /^\/pages\/(\d+)$/.exec(route)

  let page
  if (sectionMatch) page = <SectionEditor id={Number(sectionMatch[1])} />
  else if (pageMatch) page = <SectionsPage pageId={Number(pageMatch[1])} />
  else if (route === '/pages') page = <PagesPage />
  else if (route === '/menu') page = <MenuPage />
  else if (route === '/settings') page = <SettingsPage />
  else if (route === '/account') page = <AccountPage user={user} />
  else page = <SectionsPage />

  return (
    <div className="ad-shell">
      <aside className={`ad-side ${navOpen ? 'open' : ''}`}>
        <div className="ad-brand">
          <img src="/logo.jpg" alt="" />
          <span>لوحة التحكم</span>
        </div>
        <nav aria-label="أقسام لوحة التحكم">
          {NAV.map(([path, label]) => (
            <a key={path} href={`#${path}`} onClick={() => setNavOpen(false)}
              className={`ad-nav-link ${route === path || route.startsWith(path + '/') ? 'active' : ''}`}
              aria-current={route === path || route.startsWith(path + '/') ? 'page' : undefined}>{label}</a>
          ))}
          <a className="ad-nav-link" href="/" target="_blank" rel="noopener">عرض الموقع ↗</a>
        </nav>
        <div className="ad-user">
          <span dir="ltr">{user.username}</span>
          <button type="button" className="ad-btn ad-btn-light" onClick={onLogout}>خروج</button>
        </div>
      </aside>
      <div className="ad-main">
        <button type="button" className="ad-burger" aria-label="القائمة" aria-expanded={navOpen} onClick={() => setNavOpen(!navOpen)}>☰ القائمة</button>
        <main>{page}</main>
      </div>
    </div>
  )
}
