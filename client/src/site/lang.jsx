import { createContext, useContext } from 'react'

export const LangCtx = createContext({ lang: 'ar', toggle: () => {}, settings: {} })
export const useLang = () => useContext(LangCtx)

// Pick the current language from a bilingual value ({ ar, en }) with fallback.
export function pick(v, lang) {
  if (v == null) return ''
  if (typeof v === 'string' || typeof v === 'number') return String(v)
  return v[lang] || v.ar || v.en || ''
}

export function useT() {
  const { lang } = useLang()
  return v => pick(v, lang)
}

// Renders a link when a URL is set, otherwise the given fallback tag.
export function Link({ href, children, as: Tag = 'span', ...rest }) {
  if (href) {
    const external = /^https?:\/\//.test(href) && typeof window !== 'undefined' && !href.startsWith(window.location.origin)
    return <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>{children}</a>
  }
  return <Tag {...rest}>{children}</Tag>
}

export const lines = v => String(v || '').split('\n').map(s => s.trim()).filter(Boolean)
