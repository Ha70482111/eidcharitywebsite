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

// A link that leads somewhere: not empty and not a bare "#" placeholder.
// Placeholder links are hidden on the site until a page is set for them in /admin.
export const live = u => { const s = String(u ?? '').trim(); return s !== '' && s !== '#' }

// Renders a link when a real URL is set, otherwise the given fallback tag.
export function Link({ href, children, as: Tag = 'span', ...rest }) {
  if (live(href)) {
    const external = /^https?:\/\//.test(href) && typeof window !== 'undefined' && !href.startsWith(window.location.origin)
    return <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>{children}</a>
  }
  return <Tag {...rest}>{children}</Tag>
}

export const lines = v => String(v || '').split('\n').map(s => s.trim()).filter(Boolean)
