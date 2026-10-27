import { useLang } from './lang.jsx'

// Default illustrations (client/public/placeholders/) for items that have no image yet.
// They show no people, and carry a small note saying they are AI-generated illustrations.
// The topic is guessed from the item's texts, most important first (title before description).
const RULES = [
  ['award', /جائز|جوائز|وسام|تكريم|أيزو|award|medal|honou?r|\biso\b/i],
  ['education', /مدرس|تعليم|طالب|طلاب|الثانوية|دراس|مواهب|ثقاف|كتاب|school|educat|student|exam|cultur/i],
  ['health', /مريض|مرضى|علاج|طبي|صحي|الصحة|قلب|heart|medic|health|patients/i],
  ['water', /بئر|آبار|ماء|مياه|سقيا|\bwells?\b|water/i],
  ['mosque', /مسجد|مساجد|جامع|دعو|قرآن|ضيوف|mosque|quran|guests/i],
  ['food', /إفطار|طعام|غذا|لحوم|أضاحي|أضح|النعمة|سلة|كسوة|food|meal|iftar|udhiya|naama/i],
  ['home', /يتيم|أيتام|أسر|بيت|بيوت|أم |الأم|كفالة|سكن|orphan|famil|home|house|mother/i],
  ['chart', /إنجاز|حصاد|تقرير|ميزانية|achiev|harvest|report|budget/i],
  ['news', /خبر|أخبار|\bnews\b/i],
]

const flat = v => (v && typeof v === 'object' ? `${v.ar || ''} ${v.en || ''}` : String(v ?? ''))

export function placeholderFor(texts, fallback = 'general') {
  for (const v of texts) {
    const hit = RULES.find(([, re]) => re.test(flat(v)))
    if (hit) return `/placeholders/${hit[0]}.svg`
  }
  return `/placeholders/${fallback}.svg`
}

// Official logos of the home page's partners (client/public/partners/), all on the same 480×240 canvas
// so they look the same size. Used when a partner has no logo set in /admin; matched by name.
const PARTNER_LOGOS = [
  ['qatar-foundation', /qatar foundation|مؤسسة قطر/i],
  ['qatar-red-crescent', /red crescent|الهلال الأحمر/i],
  ['unhcr', /unhcr|المفوضية|اللاجئين/i],
  ['unicef', /unicef|يونيسف/i],
  ['qatar-charity', /qatar charity|قطر الخيرية/i],
  ['qdb', /qatar dev|\bqdb\b|بنك قطر للتنمية/i],
  ['al-jazeera', /jazeera|الجزيرة/i],
]

export function partnerLogo(name) {
  const hit = PARTNER_LOGOS.find(([, re]) => re.test(flat(name)))
  return hit ? `/partners/${hit[0]}.png` : ''
}

// The item's own image, or a default illustration plus the AI note.
// Render it inside a positioned box (the image area of a card).
export function CardImage({ src, texts = [], fallback = 'general', alt = '', top = false, loading, style, className }) {
  const { lang } = useLang()
  if (src) return <img src={src} alt={alt} loading={loading} className={className} style={style} />
  return <>
    <img src={placeholderFor(texts, fallback)} alt="" loading={loading} className={className} style={style} />
    <span className="ec-ai-note" style={top ? { top: 8, bottom: 'auto' } : undefined}>
      {lang === 'ar' ? 'صورة توضيحية منشأة بالذكاء الاصطناعي' : 'Illustrative AI-generated image'}
    </span>
  </>
}
