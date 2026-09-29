import { createContext, useCallback, useContext, useState } from 'react'

const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const push = useCallback((msg, kind = 'ok') => {
    const id = Math.random()
    setToasts(t => [...t, { id, msg, kind }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), kind === 'error' ? 6000 : 3000)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="ad-toasts" role="status" aria-live="polite">
        {toasts.map(t => <div key={t.id} className={`ad-toast ${t.kind === 'error' ? 'ad-toast-error' : ''}`}>{t.msg}</div>)}
      </div>
    </ToastCtx.Provider>
  )
}

export function VisibilityToggle({ visible, onChange, label }) {
  return (
    <button type="button" className={`ad-vis ${visible ? 'on' : 'off'}`} aria-pressed={visible} onClick={() => onChange(!visible)}
      aria-label={`${visible ? 'إخفاء' : 'إظهار'} ${label || ''}`.trim()} title={visible ? 'ظاهر — اضغط للإخفاء' : 'مخفي — اضغط للإظهار'}>
      <span className="ad-dot" aria-hidden="true" />{visible ? 'ظاهر' : 'مخفي'}
    </button>
  )
}

export function MoveButtons({ index, count, onMove, label = '' }) {
  return (
    <>
      <button type="button" className="ad-icon-btn" disabled={index === 0} onClick={() => onMove(index, -1)} aria-label={`تحريك ${label} لأعلى`}>▲</button>
      <button type="button" className="ad-icon-btn" disabled={index === count - 1} onClick={() => onMove(index, 1)} aria-label={`تحريك ${label} لأسفل`}>▼</button>
    </>
  )
}

export function PageHead({ title, children }) {
  return (
    <div className="ad-page-head">
      <h1>{title}</h1>
      <div className="ad-page-actions">{children}</div>
    </div>
  )
}

export const swap = (list, i, d) => {
  const j = i + d
  if (j < 0 || j >= list.length) return list
  const next = [...list]
  const tmp = next[i]
  next[i] = next[j]
  next[j] = tmp
  return next
}

export const pickLabel = v => (v && typeof v === 'object' ? v.ar || v.en || '' : String(v || ''))
