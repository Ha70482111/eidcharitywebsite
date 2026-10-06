// Section type registry: drives both the admin forms and the defaults for newly added sections.
// Field types: text, textarea, image, file (PDF), number, url, select, color, bool, list (repeatable sub-fields)
import { ICON_OPTIONS, SOCIAL_OPTIONS } from './icons.jsx'

const bi = (key, label, type = 'text', extra = {}) => ({ key, label, type, bi: true, ...extra })
const f = (key, label, type = 'text', extra = {}) => ({ key, label, type, ...extra })
const b = (ar, en) => ({ ar, en })

const LIGHT_BG = [['white', 'أبيض'], ['cream', 'كريمي فاتح'], ['warm', 'رمادي دافئ']]
const ALL_BG = [...LIGHT_BG, ['navy', 'كحلي'], ['maroon', 'عنابي']]

const anchor = f('anchor', 'المعرّف (للربط من المنيو)', 'text', { help: 'مثال: impact ← واربطه في المنيو بـ #impact', dir: 'ltr' })
const bgLight = f('bg', 'لون الخلفية', 'select', { options: LIGHT_BG })
const heading = [bi('eyebrow', 'العنوان الصغير'), bi('title', 'العنوان'), bi('subtitle', 'الوصف', 'textarea')]
const button = (key = 'button', label = 'نص الزر') => [bi(key, label), f(`${key}_url`, 'رابط الزر', 'url')]

export const SECTION_TYPES = {
  hero: {
    label: 'الواجهة الرئيسية (Hero)',
    description: 'صور متغيرة مع عنوان كبير وبطاقة تبرع سريع',
    fields: [
      anchor, bi('eyebrow', 'العنوان الصغير'), bi('title', 'العنوان'), bi('title_gold', 'العنوان (الجزء الذهبي)'),
      bi('subtitle', 'الوصف', 'textarea'), ...button('btn_primary', 'الزر الرئيسي'), ...button('btn_secondary', 'الزر الثانوي'),
      f('slide_seconds', 'مدة الشريحة (بالثواني)', 'number'),
      f('show_donation_card', 'إظهار بطاقة التبرع', 'bool'),
      bi('donate_title', 'عنوان بطاقة التبرع'), bi('once_label', 'نص «مرة واحدة»'), bi('monthly_label', 'نص «شهري»'),
      bi('category_placeholder', 'نص اختيار باب الخير'),
      bi('categories', 'أبواب الخير (كل باب في سطر)', 'textarea'),
      f('amounts', 'المبالغ المقترحة (مفصولة بفاصلة)', 'text', { dir: 'ltr' }),
      f('default_amount', 'المبلغ المختار افتراضيًا', 'number'), f('currency', 'العملة', 'text', { dir: 'ltr' }),
      bi('other_amount', 'نص «مبلغ آخر»'), bi('donate_button', 'نص زر التبرع'),
      f('donate_action_url', 'رابط صفحة الدفع', 'url', { help: 'يُضاف له تلقائيًا: amount و type و category. اتركه فارغًا إن لم تكن بوابة الدفع جاهزة.' }),
      bi('secure_note', 'ملاحظة الدفع الآمن'),
    ],
    item: { label: 'شريحة', title: c => c.label, fields: [f('image', 'الصورة', 'image'), bi('label', 'اسم الشريحة'), f('position', 'موضع الصورة', 'text', { help: 'مثال: 50% 30%', dir: 'ltr' })] },
    defaults: () => ({ content: { anchor: '', eyebrow: b('', ''), title: b('عنوان جديد', 'New title'), title_gold: b('', ''), subtitle: b('', ''),
      btn_primary: b('تبرع الآن', 'Donate Now'), btn_primary_url: '#donate', btn_secondary: b('', ''), btn_secondary_url: '', slide_seconds: 8,
      show_donation_card: false, amounts: '100, 300, 500, 1000', default_amount: 300, currency: 'QAR' }, items: [] }),
  },

  gates: {
    label: 'أبواب الخير (أيقونات)',
    description: 'شبكة أيقونات لمجالات التبرع',
    fields: [anchor, bgLight, ...heading, ...button()],
    item: { label: 'باب', title: c => c.name, fields: [bi('name', 'الاسم'), f('icon', 'الأيقونة', 'select', { options: ICON_OPTIONS }), f('icon_image', 'أو صورة أيقونة مخصصة', 'image'), f('url', 'الرابط', 'url')] },
    defaults: () => ({ content: { anchor: '', bg: 'white', eyebrow: b('', ''), title: b('عنوان القسم', 'Section title'), subtitle: b('', '') }, items: [] }),
  },

  campaigns: {
    label: 'الحملات (مع نسبة الإنجاز)',
    description: 'بطاقات حملات فيها المبلغ المجموع والهدف',
    fields: [anchor, bgLight, ...heading, ...button(),
      bi('pct_label', 'نص «مكتمل»'), bi('target_label', 'نص «الهدف»'), bi('raised_label', 'نص «جُمع»'),
      bi('beneficiaries_label', 'نص «المستفيدون»'), bi('cta', 'نص زر البطاقة'), f('currency', 'العملة', 'text', { dir: 'ltr' })],
    item: { label: 'حملة', title: c => c.name, fields: [f('image', 'الصورة', 'image'), bi('name', 'اسم الحملة'), bi('location', 'المكان'),
      bi('desc', 'الوصف', 'textarea'), f('raised', 'المبلغ المجموع', 'number'), f('target', 'المبلغ المستهدف', 'number'),
      f('beneficiaries', 'عدد المستفيدين', 'number'), bi('permit', 'رقم الترخيص'), f('url', 'رابط الحملة', 'url')] },
    defaults: () => ({ content: { anchor: '', bg: 'warm', eyebrow: b('', ''), title: b('حملات', 'Campaigns'), subtitle: b('', ''),
      pct_label: b('مكتمل', 'Complete'), target_label: b('الهدف', 'Target'), raised_label: b('جُمع', 'Raised'),
      beneficiaries_label: b('المستفيدون', 'Beneficiaries'), cta: b('ساهم الآن', 'Contribute Now'), currency: 'QAR' }, items: [] }),
  },

  centers: {
    label: 'بطاقات صور طويلة (المراكز)',
    description: 'بطاقات بصورة كاملة ونص فوقها',
    fields: [anchor, bgLight, ...heading, bi('button', 'نص زر البطاقة')],
    item: { label: 'بطاقة', title: c => c.name, fields: [f('image', 'الصورة', 'image'), bi('name', 'الاسم'), bi('desc', 'الوصف', 'textarea'),
      f('shade', 'لون التظليل', 'color'), f('url', 'الرابط', 'url')] },
    defaults: () => ({ content: { anchor: '', bg: 'white', eyebrow: b('', ''), title: b('عنوان القسم', 'Section title'), subtitle: b('', ''), button: b('اكتشف', 'Discover') }, items: [] }),
  },

  impact: {
    label: 'أرقام وإحصائيات',
    description: 'أرقام كبيرة على خلفية كحلي',
    fields: [anchor, ...heading, bi('note', 'ملاحظة أسفل القسم')],
    item: { label: 'رقم', title: c => c.label, fields: [f('num', 'الرقم', 'text', { dir: 'ltr' }), bi('unit', 'الوحدة'), bi('label', 'العنوان'), bi('note', 'ملاحظة')] },
    defaults: () => ({ content: { anchor: '', eyebrow: b('', ''), title: b('في أرقام', 'In Numbers'), subtitle: b('', ''), note: b('', '') }, items: [] }),
  },

  story: {
    label: 'قصة (صورة + اقتباس)',
    description: 'صورة كبيرة بجانب قصة واقتباس',
    fields: [anchor, bgLight, f('image', 'الصورة', 'image'), bi('badge', 'الشارة'), bi('location', 'المكان والتاريخ'),
      bi('title', 'العنوان (يمكن استخدام أكثر من سطر)', 'textarea'), bi('quote', 'الاقتباس', 'textarea'), bi('attribution', 'صاحب الاقتباس'), ...button()],
    item: null,
    defaults: () => ({ content: { anchor: '', bg: 'cream', image: '', badge: b('قصة أثر', 'Impact Story'), title: b('عنوان القصة', 'Story title'), quote: b('', '') }, items: [] }),
  },

  projects: {
    label: 'مشاريع (بتبويبين)',
    description: 'بطاقات مشاريع مقسمة على تبويبين',
    fields: [anchor, bgLight, bi('eyebrow', 'العنوان الصغير'), bi('title', 'العنوان'), bi('tab1', 'اسم التبويب الأول'), bi('tab2', 'اسم التبويب الثاني'), bi('view_label', 'نص رابط المشروع')],
    item: { label: 'مشروع', title: c => c.type, fields: [f('tab', 'التبويب', 'select', { options: [['tab1', 'التبويب الأول'], ['tab2', 'التبويب الثاني']] }),
      f('image', 'الصورة', 'image'), bi('type', 'نوع المشروع'), bi('location', 'المكان'), bi('desc', 'الوصف', 'textarea'), f('url', 'الرابط', 'url')] },
    defaults: () => ({ content: { anchor: '', bg: 'white', eyebrow: b('', ''), title: b('مشاريعنا', 'Our Projects'), tab1: b('داخل قطر', 'In Qatar'), tab2: b('حول العالم', 'Worldwide'), view_label: b('اطلع على المشروع', 'View Project') }, items: [] }),
  },

  governance: {
    label: 'بطاقات على خلفية كحلي (الحوكمة)',
    description: 'أيقونات وعناوين على خلفية داكنة',
    fields: [anchor, ...heading, ...button(), bi('view_label', 'نص رابط البطاقة')],
    item: { label: 'بطاقة', title: c => c.title, fields: [f('icon', 'الأيقونة', 'select', { options: ICON_OPTIONS }), f('icon_image', 'أو صورة أيقونة مخصصة', 'image'),
      bi('title', 'العنوان'), bi('desc', 'الوصف', 'textarea'), f('url', 'الرابط', 'url')] },
    defaults: () => ({ content: { anchor: '', eyebrow: b('', ''), title: b('عنوان القسم', 'Section title'), subtitle: b('', ''), view_label: b('اطلع الآن', 'View Now') }, items: [] }),
  },

  join: {
    label: 'بطاقات دعوة (انضم إلينا)',
    description: 'بطاقات ملونة بأيقونة وزر',
    fields: [anchor, bgLight, bi('eyebrow', 'العنوان الصغير'), bi('title', 'العنوان')],
    item: { label: 'بطاقة', title: c => c.title, fields: [f('icon', 'الأيقونة', 'select', { options: ICON_OPTIONS }), f('accent', 'اللون', 'color'),
      bi('title', 'العنوان'), bi('desc', 'الوصف', 'textarea'), bi('cta', 'نص الزر'), f('url', 'رابط الزر', 'url')] },
    defaults: () => ({ content: { anchor: '', bg: 'warm', eyebrow: b('', ''), title: b('عنوان القسم', 'Section title') }, items: [] }),
  },

  media: {
    label: 'الأخبار',
    description: 'خبر رئيسي كبير وأخبار جانبية',
    fields: [anchor, bgLight, bi('eyebrow', 'العنوان الصغير'), bi('title', 'العنوان'), ...button()],
    item: { label: 'خبر', title: c => c.title, fields: [f('image', 'الصورة', 'image'), bi('date', 'التاريخ'), bi('title', 'العنوان'), bi('desc', 'الملخص', 'textarea'), f('url', 'رابط الخبر', 'url')] },
    defaults: () => ({ content: { anchor: '', bg: 'white', eyebrow: b('', ''), title: b('آخر الأخبار', 'Latest News') }, items: [] }),
  },

  partners: {
    label: 'الشركاء (شعارات)',
    description: 'شعارات الشركاء',
    fields: [anchor, bgLight, bi('eyebrow', 'العنوان الصغير'), bi('title', 'العنوان')],
    item: { label: 'شريك', title: c => c.name, fields: [bi('name', 'اسم الشريك'), f('logo', 'الشعار', 'image'), f('url', 'موقع الشريك', 'url')] },
    defaults: () => ({ content: { anchor: '', bg: 'warm', eyebrow: b('', ''), title: b('شركاء النجاح', 'Partners') }, items: [] }),
  },

  cards: {
    label: 'بطاقات عامة (صورة + نص)',
    description: 'قسم مرن: شبكة بطاقات بصورة وعنوان ووصف',
    fields: [anchor, bgLight, ...heading, f('columns', 'عدد الأعمدة', 'select', { options: [['2', '2'], ['3', '3'], ['4', '4']] }), ...button()],
    item: { label: 'بطاقة', title: c => c.title, fields: [f('image', 'الصورة', 'image'), bi('title', 'العنوان'), bi('desc', 'الوصف', 'textarea'), bi('link_label', 'نص الرابط'), f('url', 'الرابط', 'url')] },
    defaults: () => ({ content: { anchor: '', bg: 'white', eyebrow: b('', ''), title: b('عنوان القسم', 'Section title'), subtitle: b('', ''), columns: '3' }, items: [] }),
  },

  text_block: {
    label: 'نص وصورة',
    description: 'قسم حر: عنوان وفقرة وصورة اختيارية وزر',
    fields: [anchor, f('bg', 'لون الخلفية', 'select', { options: ALL_BG }), bi('eyebrow', 'العنوان الصغير'), bi('title', 'العنوان'),
      bi('body', 'النص', 'textarea'), f('image', 'الصورة (اختياري)', 'image'),
      f('image_side', 'مكان الصورة', 'select', { options: [['start', 'في البداية'], ['end', 'في النهاية']] }), ...button()],
    item: null,
    defaults: () => ({ content: { anchor: '', bg: 'white', eyebrow: b('', ''), title: b('عنوان جديد', 'New title'), body: b('اكتب النص هنا', 'Write your text here'), image: '', image_side: 'end' }, items: [] }),
  },

  documents: {
    label: 'ملفات ومستندات (PDF)',
    description: 'قائمة ملفات للتحميل مثل التقارير والسياسات',
    fields: [anchor, bgLight, ...heading, bi('link_label', 'نص زر التحميل')],
    item: { label: 'ملف', title: c => c.title, fields: [bi('title', 'العنوان'), bi('desc', 'وصف قصير', 'textarea'), f('file', 'الملف', 'file')] },
    defaults: () => ({ content: { anchor: '', bg: 'white', eyebrow: b('', ''), title: b('الملفات', 'Documents'), subtitle: b('', ''), link_label: b('تحميل PDF', 'Download PDF') }, items: [] }),
  },

  cta_banner: {
    label: 'شريط دعوة (زر كبير)',
    description: 'شريط ملون بعنوان وزر',
    fields: [anchor, f('bg', 'لون الخلفية', 'select', { options: [['maroon', 'عنابي'], ['navy', 'كحلي']] }), f('image', 'صورة خلفية (اختياري)', 'image'),
      bi('title', 'العنوان'), bi('subtitle', 'الوصف', 'textarea'), ...button()],
    item: null,
    defaults: () => ({ content: { anchor: '', bg: 'maroon', title: b('ساهم معنا اليوم', 'Give today'), subtitle: b('', ''), button: b('تبرع الآن', 'Donate Now'), button_url: '#donate' }, items: [] }),
  },
}

const linkList = (key, label) => f(key, label, 'list', { itemLabel: 'رابط', fields: [bi('label', 'النص'), f('url', 'الرابط', 'url')] })

export const SETTINGS_GROUPS = [
  { title: 'عام', fields: [bi('site_name', 'اسم الموقع'), f('logo', 'الشعار', 'image'), bi('donate_label', 'نص زر التبرع في الهيدر'), f('donate_url', 'رابط زر التبرع', 'url')] },
  { title: 'الشريط العلوي', fields: [f('topbar_visible', 'إظهار الشريط العلوي', 'bool'), linkList('topbar_links', 'روابط الشريط العلوي')] },
  { title: 'السوشيال ميديا', fields: [f('socials', 'الحسابات', 'list', { itemLabel: 'حساب', fields: [f('platform', 'المنصة', 'select', { options: SOCIAL_OPTIONS }), f('url', 'الرابط', 'url')] })] },
  { title: 'الفوتر', fields: [bi('footer_desc', 'وصف المؤسسة', 'textarea'),
    f('footer_columns', 'أعمدة الروابط', 'list', { itemLabel: 'عمود', fields: [bi('title', 'عنوان العمود'), linkList('links', 'الروابط')] }),
    f('newsletter_visible', 'إظهار النشرة البريدية', 'bool'), bi('newsletter_title', 'عنوان النشرة'), bi('newsletter_placeholder', 'نص خانة البريد'),
    bi('newsletter_button', 'نص زر الاشتراك'), f('newsletter_action', 'رابط استقبال الاشتراكات (اختياري)', 'url'), bi('follow_us', 'نص «تابعونا»')] },
  { title: 'التواصل والترخيص', fields: [f('phone', 'الهاتف', 'text', { dir: 'ltr' }), f('email', 'البريد', 'text', { dir: 'ltr' }), bi('address', 'العنوان'),
    bi('license', 'نص الترخيص'), bi('copyright', 'حقوق النشر')] },
]
