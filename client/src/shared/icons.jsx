export const M = '#7C1A44'
export const MD = '#5E1334'
export const G = '#B69030'   // gold: decorative lines and text on dark backgrounds
export const GT = '#8A6A20'  // darker gold: text on light backgrounds (passes WCAG AA)
export const N = '#0D1B35'
export const NM = '#1A2E52'

const s = (props, d) => ({ fill: 'none', ...props })

// Icons that editors can pick for items (gates, governance, join)
export const ICONS = {
  zakat: ({ c = M, g = G }) => <svg viewBox="0 0 48 48" {...s()} width="36" height="36" aria-hidden="true"><circle cx="24" cy="24" r="20" stroke={c} strokeWidth="1.6"/><path d="M24 12v24M17 17l7-5 7 5M17 31l7 5 7-5" stroke={g} strokeWidth="1.6" strokeLinecap="round"/></svg>,
  sadaqa: ({ c = M }) => <svg viewBox="0 0 48 48" {...s()} width="36" height="36" aria-hidden="true"><path d="M24 40S9 29 9 18a10 10 0 0120 0 10 10 0 0120 0c0 11-15 22-15 22z" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  orphan: ({ c = M, g = G }) => <svg viewBox="0 0 48 48" {...s()} width="36" height="36" aria-hidden="true"><circle cx="24" cy="15" r="7" stroke={c} strokeWidth="1.6"/><path d="M10 41c0-7.73 6.27-14 14-14s14 6.27 14 14" stroke={c} strokeWidth="1.6" strokeLinecap="round"/><path d="M19 23l5 5 5-5" stroke={g} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  medical: ({ c = M, g = G }) => <svg viewBox="0 0 48 48" {...s()} width="36" height="36" aria-hidden="true"><rect x="8" y="8" width="32" height="32" rx="7" stroke={c} strokeWidth="1.6"/><path d="M24 15v18M15 24h18" stroke={g} strokeWidth="2.2" strokeLinecap="round"/></svg>,
  food: ({ c = M, g = G }) => <svg viewBox="0 0 48 48" {...s()} width="36" height="36" aria-hidden="true"><path d="M12 12c0 10 6 15 12 15s12-5 12-15" stroke={c} strokeWidth="1.6" strokeLinecap="round"/><path d="M24 27v10M18 37h12" stroke={g} strokeWidth="1.6" strokeLinecap="round"/></svg>,
  water: ({ c = M, g = G }) => <svg viewBox="0 0 48 48" {...s()} width="36" height="36" aria-hidden="true"><path d="M24 8c0 0-13 13-13 21a13 13 0 0026 0C37 21 24 8 24 8z" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/><path d="M17 31a7 7 0 0011 0" stroke={g} strokeWidth="1.6" strokeLinecap="round"/></svg>,
  waqf: ({ c = M, g = G }) => <svg viewBox="0 0 48 48" {...s()} width="36" height="36" aria-hidden="true"><rect x="9" y="22" width="30" height="19" rx="3" stroke={c} strokeWidth="1.6"/><path d="M16 22v-4a8 8 0 0116 0v4" stroke={c} strokeWidth="1.6" strokeLinecap="round"/><circle cx="24" cy="31" r="4" stroke={g} strokeWidth="1.6"/></svg>,
  project: ({ c = M, g = G }) => <svg viewBox="0 0 48 48" {...s()} width="36" height="36" aria-hidden="true"><path d="M9 40V20l15-11 15 11v20" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/><rect x="19" y="27" width="10" height="13" rx="1.5" stroke={g} strokeWidth="1.6"/></svg>,
  scale: ({ c = '#fff' }) => <svg viewBox="0 0 44 44" {...s()} width="40" height="40" aria-hidden="true"><path d="M22 8v28M10 36h24" stroke={c} strokeWidth="1.5" strokeLinecap="round"/><path d="M10 16l-4 9h8l-4-9zM34 16l-4 9h8l-4-9z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  eye: ({ c = '#fff' }) => <svg viewBox="0 0 44 44" {...s()} width="40" height="40" aria-hidden="true"><path d="M5 22s7-10 17-10 17 10 17 10-7 10-17 10S5 22 5 22z" stroke={c} strokeWidth="1.5"/><circle cx="22" cy="22" r="4" stroke={c} strokeWidth="1.5"/></svg>,
  doc: ({ c = '#fff' }) => <svg viewBox="0 0 44 44" {...s()} width="40" height="40" aria-hidden="true"><rect x="9" y="6" width="26" height="32" rx="3.5" stroke={c} strokeWidth="1.5"/><path d="M15 16h14M15 22h14M15 28h9" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  chart: ({ c = '#fff' }) => <svg viewBox="0 0 44 44" {...s()} width="40" height="40" aria-hidden="true"><path d="M6 34l9-11 7 7 7-14 9 9" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 38h32" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  heart: ({ c = M }) => <svg viewBox="0 0 52 52" {...s()} width="44" height="44" aria-hidden="true"><path d="M26 44S10 33 10 21a11 11 0 0122 0 11 11 0 0122 0c0 12-16 23-16 23z" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/><path d="M20 21h12M26 15v12" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg>,
  hands: ({ c = N }) => <svg viewBox="0 0 52 52" {...s()} width="44" height="44" aria-hidden="true"><path d="M7 22l11 11 5-2 11 7 13-16" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M18 33l6 7" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg>,
  network: ({ c = GT }) => <svg viewBox="0 0 52 52" {...s()} width="44" height="44" aria-hidden="true"><circle cx="16" cy="16" r="7" stroke={c} strokeWidth="1.6"/><circle cx="36" cy="16" r="7" stroke={c} strokeWidth="1.6"/><path d="M6 43c0-5.52 4.48-10 10-10h20c5.52 0 10 4.48 10 10" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg>,
}

export const ICON_OPTIONS = [
  ['zakat', 'الزكاة'], ['sadaqa', 'قلب (صدقة)'], ['orphan', 'شخص (كفالة)'], ['medical', 'طبي'], ['food', 'طعام'],
  ['water', 'ماء'], ['waqf', 'وقف'], ['project', 'مبنى (مشروع)'], ['scale', 'ميزان'], ['eye', 'عين'], ['doc', 'مستند'],
  ['chart', 'رسم بياني'], ['heart', 'قلب +'], ['hands', 'مصافحة'], ['network', 'أشخاص'],
]

export function Icon({ name, image, ...props }) {
  if (image) return <img src={image} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
  const C = ICONS[name] || ICONS.project
  return <C {...props} />
}

// UI icons
export const ChevDown = () => <svg viewBox="0 0 16 16" fill="none" width="13" height="13" aria-hidden="true"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
export const Arrow = ({ c = 'currentColor', s: size = 16, dir = 'rtl' }) =>
  <svg viewBox="0 0 20 20" fill="none" width={size} height={size} aria-hidden="true" style={{ transform: dir === 'ltr' ? 'scaleX(-1)' : undefined }}><path d="M15 10H5M10 4L4 10l6 6" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
export const Phone = ({ c = 'currentColor' }) => <svg viewBox="0 0 20 20" fill="none" width="17" height="17" aria-hidden="true"><path d="M14.5 12.5l-2 2a10.5 10.5 0 01-7-7l2-2L9 8.5l-1 2a6 6 0 003 3l2-1 1.5 1.5z" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/></svg>
export const Mail = ({ c = 'currentColor' }) => <svg viewBox="0 0 20 20" fill="none" width="17" height="17" aria-hidden="true"><rect x="2" y="4" width="16" height="12" rx="2.5" stroke={c} strokeWidth="1.4"/><path d="M2 7l8 5 8-5" stroke={c} strokeWidth="1.4" strokeLinecap="round"/></svg>
export const Pin = ({ c = 'currentColor', s: size = 17 }) => <svg viewBox="0 0 20 20" fill="none" width={size} height={size} aria-hidden="true"><path d="M10 2a6 6 0 016 6c0 5.25-6 10-6 10S4 13.25 4 8a6 6 0 016-6z" stroke={c} strokeWidth="1.4"/><circle cx="10" cy="8" r="2.5" stroke={c} strokeWidth="1.4"/></svg>
export const Lock = () => <svg viewBox="0 0 16 16" fill="none" width="13" height="13" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
export const Check = () => <svg viewBox="0 0 16 16" fill="none" width="13" height="13" aria-hidden="true"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>

export const SOCIAL_ICONS = {
  facebook: ({ c = 'currentColor' }) => <svg viewBox="0 0 20 20" fill={c} width="16" height="16" aria-hidden="true"><path d="M18 10a8 8 0 10-9.25 7.9V13H7v-3h1.75v-2C8.75 6 10 5 11.75 5c.88 0 1.75.15 1.75.15V7H12.7c-1 0-1.2.6-1.2 1.2V10H13.5l-.25 3h-2.25v4.9A8 8 0 0018 10z"/></svg>,
  instagram: ({ c = 'currentColor' }) => <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true"><rect x="2" y="2" width="16" height="16" rx="5" stroke={c} strokeWidth="1.5"/><circle cx="10" cy="10" r="3.5" stroke={c} strokeWidth="1.5"/><circle cx="14.5" cy="5.5" r="1" fill={c}/></svg>,
  youtube: ({ c = 'currentColor' }) => <svg viewBox="0 0 20 20" fill={c} width="16" height="16" aria-hidden="true"><path d="M17.5 5.5A2.5 2.5 0 0015.7 3.7C14.5 3.5 10 3.5 10 3.5s-4.5 0-5.7.2A2.5 2.5 0 002.5 5.5C2 6.7 2 10 2 10s0 3.3.5 4.5a2.5 2.5 0 001.8 1.8c1.2.3 5.7.3 5.7.3s4.5 0 5.7-.3a2.5 2.5 0 001.8-1.8c.5-1.2.5-4.5.5-4.5s0-3.3-.5-4.5zM8 13V7l5 3-5 3z"/></svg>,
  linkedin: ({ c = 'currentColor' }) => <svg viewBox="0 0 20 20" fill={c} width="16" height="16" aria-hidden="true"><path d="M2 6h4v12H2zm2-4a2 2 0 110 4 2 2 0 010-4zm4 4h3.5v1.8S12.5 6 15 6c3 0 3.5 2 3.5 4.5V18H15v-7c0-1.3-.3-2-1.5-2S12 10.7 12 12v6H8V6z"/></svg>,
  x: ({ c = 'currentColor' }) => <svg viewBox="0 0 20 20" fill={c} width="15" height="15" aria-hidden="true"><path d="M15.2 2h2.8l-6.1 7 7.1 9h-5.6l-4.4-5.7L4 18H1.2l6.5-7.5L1 2h5.7l4 5.2L15.2 2zm-1 14.4h1.6L6 3.5H4.3l9.9 12.9z"/></svg>,
  whatsapp: ({ c = 'currentColor' }) => <svg viewBox="0 0 20 20" fill={c} width="16" height="16" aria-hidden="true"><path d="M10 2a8 8 0 00-6.9 12L2 18l4.1-1.1A8 8 0 1010 2zm0 14.5a6.5 6.5 0 01-3.3-.9l-.2-.1-2.4.6.6-2.3-.2-.3A6.5 6.5 0 1110 16.5zm3.6-4.9c-.2-.1-1.2-.6-1.4-.6-.2-.1-.3-.1-.4.1l-.6.8c-.1.1-.2.1-.4 0a5.3 5.3 0 01-2.6-2.3c-.2-.3.2-.3.6-1 .1-.1 0-.2 0-.3l-.6-1.5c-.2-.4-.3-.3-.4-.3h-.4a.8.8 0 00-.6.3 2.4 2.4 0 00-.8 1.8 4.2 4.2 0 00.9 2.2 9.5 9.5 0 003.6 3.2c1.3.6 1.9.6 2.5.5a2.2 2.2 0 001.4-1c.2-.5.2-.9.1-1l-.3-.2z"/></svg>,
  snapchat: ({ c = 'currentColor' }) => <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true"><path d="M10 2.5c2.6 0 4.3 2 4.3 4.4v2l1.6-.4c.4 0 .6.5.2.7l-1.6.9c.5 1.6 1.7 2.9 3.2 3.4-.4.8-1.8.9-2.3 1.1l-.3 1-1.6-.1c-.9 0-1.7 1.3-3.5 1.3s-2.6-1.3-3.5-1.3l-1.6.1-.3-1c-.5-.2-1.9-.3-2.3-1.1 1.5-.5 2.7-1.8 3.2-3.4l-1.6-.9c-.4-.2-.2-.7.2-.7l1.6.4v-2C5.7 4.5 7.4 2.5 10 2.5z" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  tiktok: ({ c = 'currentColor' }) => <svg viewBox="0 0 20 20" fill={c} width="15" height="15" aria-hidden="true"><path d="M13.6 2h-2.8v10.9a2.4 2.4 0 11-2.4-2.4c.2 0 .5 0 .7.1V7.8a5.2 5.2 0 105.5 5.1V7.2a6 6 0 003.4 1.1V5.5A3.5 3.5 0 0113.6 2z"/></svg>,
}

export const SOCIAL_OPTIONS = [
  ['facebook', 'Facebook'], ['instagram', 'Instagram'], ['youtube', 'YouTube'], ['linkedin', 'LinkedIn'],
  ['x', 'X (Twitter)'], ['whatsapp', 'WhatsApp'], ['snapchat', 'Snapchat'], ['tiktok', 'TikTok'],
]
