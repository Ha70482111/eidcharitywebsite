import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import Site from './site/Site.jsx'

// The admin dashboard is loaded only when visiting /admin, so visitors never download it.
const Admin = lazy(() => import('./admin/Admin.jsx'))
const isAdmin = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdmin
      ? <Suspense fallback={<div style={{ padding: 40, fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>جارِ التحميل…</div>}><Admin /></Suspense>
      : <Site />}
  </StrictMode>
)
