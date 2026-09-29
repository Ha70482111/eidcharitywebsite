'use strict'
// Initial content for a fresh database, taken from the original Figma Make design.
// Every text field is bilingual: { ar, en }.

const b = (ar, en) => ({ ar, en })
const U = (id, w = 800, h = 600, extra = '') =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format${extra}`

const IMG = {
  food: U('1599059813005-11265ba4b4ce'),
  foodDist: U('1593113616828-6f22bca04804'),
  multicult: U('1524069290683-0457abfe42c3'),
  reading: U('1610500796385-3ffc1ae2f046'),
  water: U('1601662583164-1c61cb71b182'),
  children: U('1542810634-71277d95dcbb'),
  volunteers: U('1593113646773-028c64a8f1b8'),
  meeting: U('1680759291020-79a92d38cdfd'),
  smilingW: U('1583971663176-dd7180de1b76'),
  story: U('1488521787991-ed7bbaae773c', 900, 780, '&crop=faces'),
}

const settings = {
  site_name: b('مؤسسة عيد الخيرية', 'Eid Charity'),
  logo: '/logo.jpg',
  donate_label: b('تبرع الآن', 'Donate Now'),
  donate_url: '#donate',
  topbar_visible: true,
  topbar_links: [
    { label: b('دخول المتبرع', 'Donor Login'), url: '#' },
    { label: b('طلب مساعدة', 'Request Help'), url: '#' },
    { label: b('تطوع معنا', 'Volunteer'), url: '#' },
    { label: b('تواصل معنا', 'Contact Us'), url: '#contact' },
  ],
  socials: [
    { platform: 'facebook', url: 'https://facebook.com' },
    { platform: 'instagram', url: 'https://instagram.com' },
    { platform: 'youtube', url: 'https://youtube.com' },
    { platform: 'linkedin', url: 'https://linkedin.com' },
  ],
  footer_desc: b(
    'مؤسسة قطرية خيرية تعمل على تحقيق التنمية المستدامة وتقديم العون الإنساني داخل قطر وحول العالم.',
    'A Qatari charitable foundation working towards sustainable development and humanitarian aid in Qatar and worldwide.'
  ),
  newsletter_visible: true,
  newsletter_title: b('النشرة البريدية', 'Newsletter'),
  newsletter_placeholder: b('بريدك الإلكتروني', 'Your email address'),
  newsletter_button: b('اشترك', 'Subscribe'),
  follow_us: b('تابعونا على', 'Follow us'),
  phone: '+974 4000 0000',
  email: 'info@eid-charity.qa',
  address: b('الدوحة، دولة قطر', 'Doha, State of Qatar'),
  license: b(
    'مرخصة من وزارة التنمية الاجتماعية والأسرة — دولة قطر | رقم الترخيص: 001/2010',
    'Licensed by Ministry of Social Development & Family — Qatar | License No: 001/2010'
  ),
  copyright: b('© 2026 مؤسسة عيد الخيرية. جميع الحقوق محفوظة.', '© 2026 Eid Charity. All rights reserved.'),
  footer_columns: [
    { title: b('عن عيد', 'About Eid'), links: [
      ['نبذة عن المؤسسة', 'About the Foundation'], ['الحوكمة', 'Governance'], ['الشفافية والمساءلة', 'Transparency'],
      ['مجلس الإدارة', 'Board of Directors'], ['التقارير السنوية', 'Annual Reports'] ] },
    { title: b('مجالات العطاء', 'Areas of Giving'), links: [
      ['الزكاة', 'Zakat'], ['الصدقات', 'Sadaqa'], ['الكفالات', 'Sponsorship'], ['المشاريع', 'Projects'] ] },
    { title: b('مراكز عيد', 'Eid Centers'), links: [
      ['حفظ النعمة', 'Hefz Al Naama'], ['ضيوف قطر', 'Qatar Guests'], ['عيد الثقافي', 'Eid Cultural'], ['عيد النسائي', "Eid Women's"] ] },
    { title: b('شارك معنا', 'Get Involved'), links: [
      ['تبرع', 'Donate'], ['تطوع', 'Volunteer'], ['كن شريكًا', 'Become a Partner'], ['طلب مساعدة', 'Request Help'] ] },
    { title: b('روابط مهمة', 'Resources'), links: [
      ['القوائم المالية', 'Financial Statements'], ['السياسات', 'Policies'], ['الخصوصية', 'Privacy'],
      ['الشروط والأحكام', 'Terms & Conditions'], ['الأسئلة الشائعة', 'FAQ'] ] },
  ].map(c => ({ title: c.title, links: c.links.map(([ar, en]) => ({ label: b(ar, en), url: '#' })) })),
}

// ── Menu: top level → groups (column headings) → links ────────────────────
const L = (ar, en, url = '#') => ({ label: b(ar, en), url })
const G = (col, ar, en, links) => ({ ...L(ar, en), extra: { col }, children: links.map(([a, e]) => L(a, e)) })
const F = (label, title, desc, cta, img, url = '#') => ({ featured: { label, title, desc, cta, img, url } })
const IMGS = id => `https://images.unsplash.com/photo-${id}?w=420&h=260&fit=crop&auto=format`

const menu = [
  { ...L('من نحن', 'About Us'), extra: F(b('قصة أثر', 'Impact Story'), b('منذ 2010 نصنع أثرًا حقيقيًا', 'Since 2010 Creating Real Impact'),
      b('تعرف على رحلتنا وقيمنا وكيف نوظّف ثقة المتبرعين لخدمة الإنسان.', 'Learn about our journey, values, and how we deploy donor trust to serve humanity.'),
      b('نبذة عن المؤسسة', 'About the Foundation'), IMGS('1593113616828-6f22bca04804')),
    children: [
      G(1, 'عن عيد الخيرية', 'About Eid Charity', [['المكاتب والجهات الشريكة', 'Offices & Partners'], ['تطبيقاتنا', 'Our Apps'], ['فروع ومواقع التحصيل', 'Collection Branches'], ['كن شريكًا', 'Become a Partner'], ['تطوع معنا', 'Volunteer'], ['اتصل بنا', 'Contact Us'], ['الأسئلة الشائعة', 'FAQ']]),
      G(2, 'المركز الإعلامي', 'Media Center', [['أخبار', 'News'], ['برنامج "همة"', 'Hemma Program'], ['قصص نجاح', 'Success Stories'], ['تقارير وإصدارات', 'Reports & Publications'], ['المدونة', 'Blog'], ['قناة يوتيوب', 'YouTube Channel']]),
      G(3, 'الحوكمة', 'Governance', [['الهيكل التنظيمي', 'Organizational Structure'], ['نبذة عن مجلس الإدارة', 'Board of Directors'], ['الرئيس التنفيذي', 'CEO'], ['سياسة الإدارة المتكاملة', 'Management Policy']]),
      G(3, 'المساءلة والشفافية', 'Accountability', [['تقارير سنوية', 'Annual Reports'], ['تقارير المدقق المستقل', 'Auditor Reports'], ['الإبلاغ', 'Reporting'], ['حقائق وتوضيحات', 'Facts & Clarifications']]),
    ] },
  { ...L('مجالات العطاء', 'Areas of Giving'), extra: F(b('تبرع الآن', 'Donate Now'), b('عطاؤك يصنع أثرًا', 'Your Gift Makes an Impact'),
      b('اختر المجال الأقرب إلى قلبك وساهم في تغيير حياة إنسان.', 'Choose the cause closest to your heart and help change a life.'),
      b('ابدأ التبرع', 'Start Donating'), IMGS('1542810634-71277d95dcbb')),
    children: [
      G(1, 'صدقات', 'Charity', [['الزكاة', 'Zakat'], ['صدقة عامة', 'General Sadaqa'], ['إطعام الطعام', 'Food Aid'], ['سقيا الماء', 'Clean Water'], ['الأضحية', 'Udhiyah']]),
      G(2, 'كفالات', 'Sponsorship', [['كفالة أيتام', 'Orphan Sponsorship'], ['كفالة أسر', 'Family Sponsorship'], ['كفالة طلاب', 'Student Sponsorship'], ['كفالة طالب علم', 'Scholarship']]),
      G(3, 'مشاريع ووقف', 'Projects & Endowment', [['الوقف الخيري', 'Charitable Endowment'], ['مشاريع التنمية', 'Development Projects'], ['مشاريع المياه', 'Water Projects'], ['البنية التحتية', 'Infrastructure']]),
      G(3, 'إغاثة', 'Relief', [['الإغاثة الطارئة', 'Emergency Relief'], ['حملات رمضان', 'Ramadan Campaigns'], ['دعم المجتمعات', 'Community Support']]),
    ] },
  { ...L('المشاريع والحملات', 'Projects & Campaigns'), extra: F(b('الحملات', 'Campaigns'), b('حملات تحتاج دعمك الآن', 'Campaigns That Need Your Support'),
      b('كل ريال يصل إلى من يحتاجه مباشرة وبشفافية كاملة.', 'Every riyal reaches those in need directly and transparently.'),
      b('جميع الحملات', 'All Campaigns'), IMGS('1599059813005-11265ba4b4ce'), '#campaigns'),
    children: [
      G(1, 'الحملات العاجلة', 'Urgent Campaigns', [['كفالة أيتام اليمن', 'Yemen Orphan Care'], ['حملة إطعام رمضان', 'Ramadan Food Campaign'], ['مشروع سقيا الماء', 'Clean Water Project'], ['الإغاثة الطارئة', 'Emergency Relief']]),
      G(2, 'المشاريع الدائمة', 'Permanent Projects', [['مشاريع المياه', 'Water Projects'], ['مشاريع التعليم', 'Education Projects'], ['مشاريع الصحة', 'Health Projects'], ['مشاريع الوقف', 'Endowment Projects']]),
    ] },
  { ...L('مراكز عيد', 'Eid Centers'), extra: F(b('اكتشف المراكز', 'Discover Centers'), b('منظومة عيد لخدمة المجتمع', 'Eid Network for Community Service'),
      b('أربعة مراكز متخصصة تخدم المجتمع القطري والإنسانية جمعاء.', 'Four specialized centers serving the Qatari community and humanity.'),
      b('تعرف على مراكزنا', 'Our Centers'), IMGS('1524069290683-0457abfe42c3'), '#centers'),
    children: [
      G(1, 'مراكز عيد', 'Eid Centers', [['مركز حفظ النعمة', 'Hefz Al Naama Center'], ['مركز ضيوف قطر', 'Qatar Guests Center'], ['مركز عيد الثقافي', 'Eid Cultural Center'], ['مركز عيد النسائي', "Eid Women's Center"]]),
      G(2, 'برامج المراكز', 'Center Programs', [['برامج غذائية', 'Food Programs'], ['برامج ثقافية وتعليمية', 'Cultural & Educational'], ['برامج المرأة والأسرة', 'Women & Family Programs'], ['خدمة ضيوف الرحمن', 'Pilgrim Services']]),
    ] },
  { ...L('أثرنا', 'Our Impact', '#impact') },
  { ...L('المركز الإعلامي', 'Media Center', '#media') },
]

// ── Sections (page order) ─────────────────────────────────────────────────
const sections = [
  { type: 'hero', name: 'الواجهة الرئيسية (Hero)', content: {
      anchor: 'donate',
      eyebrow: b('مؤسسة عيد الخيرية — قطر', 'Eid Charity — Qatar'),
      title: b('عطاؤك', 'Your Gift'), title_gold: b('يصنع أثرًا', 'Makes an Impact'),
      subtitle: b('من قطر، نصل بعطائكم إلى الإنسان ونصنع أثرًا مستدامًا في حياة المجتمعات.',
        'From Qatar, your generosity reaches people in need, creating lasting and sustainable impact in communities worldwide.'),
      btn_primary: b('تبرع الآن', 'Donate Now'), btn_primary_url: '#donate',
      btn_secondary: b('اكتشف أثرنا', 'Discover Our Impact'), btn_secondary_url: '#impact',
      show_donation_card: true,
      donate_title: b('تبرع بسهولة', 'Donate Easily'),
      once_label: b('مرة واحدة', 'One Time'), monthly_label: b('شهري', 'Monthly'),
      category_placeholder: b('اختر باب الخير', 'Choose a category'),
      categories: b('الزكاة\nالصدقات\nكفالة الأيتام\nعلاج المرضى\nإطعام الطعام\nسقيا الماء\nالوقف\nالمشاريع الخيرية',
        'Zakat\nSadaqa\nOrphan Care\nMedical Aid\nFood Aid\nClean Water\nEndowment\nCharitable Projects'),
      amounts: '100, 300, 500, 1000', default_amount: 300, currency: 'QAR',
      other_amount: b('مبلغ آخر', 'Other Amount'),
      donate_button: b('تبرع الآن', 'Donate Now'),
      donate_action_url: '',
      secure_note: b('دفع آمن — مرخص من وزارة التنمية الاجتماعية والأسرة', 'Secure payment — Licensed by Ministry of Social Development & Family'),
      slide_seconds: 8,
    },
    items: [
      { image: 'https://images.unsplash.com/photo-1601662583487-20630f298aed?w=1900&h=920&fit=crop&auto=format&crop=top', position: '50% 30%', label: b('سقيا الماء', 'Clean Water') },
      { image: 'https://images.unsplash.com/photo-1533222535026-754c501569dd?w=1900&h=920&fit=crop&auto=format&crop=center', position: '50% 40%', label: b('كفالة الأيتام', 'Orphan Care') },
      { image: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=1900&h=920&fit=crop&auto=format&crop=entropy', position: '50% 50%', label: b('بيوت الله', 'Houses of God') },
      { image: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?w=1900&h=920&fit=crop&auto=format&crop=entropy', position: '50% 50%', label: b('إطعام الطعام', 'Food Aid') },
    ] },

  { type: 'gates', name: 'أبواب الخير', content: {
      anchor: 'giving', bg: 'white',
      eyebrow: b('فرص التبرع', 'Giving Opportunities'), title: b('أبواب الخير', 'Gates of Goodness'),
      subtitle: b('اختر المجال الأقرب إلى قلبك وساهم في صناعة الأثر.', 'Choose the cause closest to your heart and help create real impact.'),
      button: b('استعرض جميع فرص التبرع', 'Browse All Giving Opportunities'), button_url: '#',
    },
    items: [
      ['zakat', 'الزكاة', 'Zakat'], ['sadaqa', 'الصدقات', 'Sadaqa'], ['orphan', 'كفالة الأيتام', 'Orphan Care'], ['medical', 'علاج المرضى', 'Medical Aid'],
      ['food', 'إطعام الطعام', 'Food Aid'], ['water', 'سقيا الماء', 'Clean Water'], ['waqf', 'الوقف', 'Endowment'], ['project', 'المشاريع الخيرية', 'Charitable Projects'],
    ].map(([icon, ar, en]) => ({ icon, icon_image: '', name: b(ar, en), url: '#' })) },

  { type: 'campaigns', name: 'الحملات العاجلة', content: {
      anchor: 'campaigns', bg: 'warm',
      eyebrow: b('الحملات العاجلة', 'Urgent Campaigns'), title: b('حملات تحتاج دعمك الآن', 'Campaigns That Need Your Support'),
      subtitle: b('مساهمتك اليوم قد تصنع فرقًا حقيقيًا في حياة إنسان.', "Your contribution today can make a real difference in someone's life."),
      button: b('جميع الحملات', 'All Campaigns'), button_url: '#',
      pct_label: b('مكتمل', 'Complete'), target_label: b('الهدف', 'Target'), raised_label: b('جُمع', 'Raised'),
      beneficiaries_label: b('المستفيدون', 'Beneficiaries'), cta: b('ساهم الآن', 'Contribute Now'), currency: 'QAR',
    },
    items: [
      { image: IMG.children, name: b('كفالة أيتام اليمن', 'Yemen Orphan Care'), location: b('اليمن', 'Yemen'),
        desc: b('توفير الرعاية الكاملة لأيتام في ظروف نزاع مستمر.', 'Providing full care for orphans living in conflict zones.'),
        raised: 186000, target: 300000, beneficiaries: 240, permit: b('رقم الترخيص: KH/2024/012', 'License No: KH/2024/012'), url: '#' },
      { image: IMG.food, name: b('حملة إطعام رمضان', 'Ramadan Food Campaign'), location: b('دول متعددة', 'Multiple Countries'),
        desc: b('وجبات يومية لآلاف الأسر خلال شهر رمضان المبارك.', 'Daily meals for thousands of families during Ramadan.'),
        raised: 412000, target: 600000, beneficiaries: 5200, permit: b('رقم الترخيص: KH/2024/035', 'License No: KH/2024/035'), url: '#' },
      { image: IMG.water, name: b('مشروع سقيا الماء — الصومال', 'Clean Water Project — Somalia'), location: b('الصومال', 'Somalia'),
        desc: b('حفر وتأهيل آبار مياه نظيفة في المناطق المحرومة.', 'Drilling and rehabilitating clean water wells in underserved areas.'),
        raised: 98000, target: 200000, beneficiaries: 1800, permit: b('رقم الترخيص: KH/2024/028', 'License No: KH/2024/028'), url: '#' },
    ] },

  { type: 'centers', name: 'مراكز عيد', content: {
      anchor: 'centers', bg: 'white',
      eyebrow: b('منظومة عيد', 'Eid Network'), title: b('منظومة عيد لخدمة المجتمع', 'Eid Centers for Community Service'),
      subtitle: b('أربعة مراكز متخصصة تجمعها رسالة واحدة: خدمة الإنسان وبناء المجتمع.', 'Four specialized centers united by one mission: serving people and building community.'),
      button: b('اكتشف المركز', 'Discover Center'),
    },
    items: [
      { image: IMG.foodDist, shade: '#3E0E1F', name: b('مركز حفظ النعمة', 'Hefz Al Naama Center'), desc: b('نحفظ النعمة ونوصلها إلى من يستحقها.', 'We preserve blessings and deliver them to those who deserve it.'), url: '#' },
      { image: IMG.multicult, shade: '#08162A', name: b('مركز ضيوف قطر', 'Qatar Guests Center'), desc: b('خدمة ضيوف قطر وتعزيز التواصل الثقافي والإنساني.', "Serving Qatar's guests and fostering cultural and humanitarian connection."), url: '#' },
      { image: IMG.reading, shade: '#0D2818', name: b('مركز عيد الثقافي', 'Eid Cultural Center'), desc: b('برامج معرفية وثقافية تسهم في بناء الإنسان.', 'Educational and cultural programs that build communities and individuals.'), url: '#' },
      { image: IMG.smilingW, shade: '#280D28', name: b('مركز عيد النسائي', "Eid Women's Center"), desc: b('مبادرات وبرامج متخصصة للمرأة والأسرة.', 'Specialized initiatives and programs for women and families.'), url: '#' },
    ] },

  { type: 'impact', name: 'أثر عطائكم (أرقام)', content: {
      anchor: 'impact',
      eyebrow: b('في أرقام', 'In Numbers'), title: b('أثر عطائكم', 'Your Impact'),
      subtitle: b('أرقام تحكي أثرًا صنعه عطاء أهل الخير.', 'Numbers that tell a story of generosity and real change.'),
      note: b('وفق أحدث البيانات المعتمدة — ستُحدَّث الأرقام بالأرقام الرسمية الموثقة', 'Based on latest verified data — figures will be updated with official statistics'),
    },
    items: [
      ['50+', 'مليون', 'Million', 'مستفيد', 'Beneficiaries', 'من برامج المؤسسة', 'Across all programs'],
      ['30+', 'دولة', 'Countries', 'وصل إليها عطاؤنا', 'Reached', 'حول العالم', 'Around the world'],
      ['12+', 'ألف', 'Thousand', 'مشروع ومبادرة', 'Projects', 'داخل قطر وخارجها', 'In Qatar and beyond'],
      ['15+', 'عامًا', 'Years', 'من العطاء', 'Of Giving', 'في خدمة الإنسان', 'Serving humanity'],
    ].map(([num, ua, ue, la, le, na, ne]) => ({ num, unit: b(ua, ue), label: b(la, le), note: b(na, ne) })) },

  { type: 'story', name: 'قصة أثر', content: {
      anchor: 'story', bg: 'cream', image: IMG.story,
      badge: b('قصة أثر', 'Impact Story'), location: b('من اليمن — 2024', 'From Yemen — 2024'),
      title: b('حين يتحول العطاء\nإلى بداية جديدة', 'When Giving Becomes\na New Beginning'),
      quote: b('"لم أتخيل يومًا أن يصل إلينا من هذه المسافة. كفالة يتيم واحدة غيّرت مسار حياتي وفتحت أمامي أبواب العلم والمستقبل."',
        '"I never imagined it could reach us from so far. A single orphan sponsorship changed the course of my life and opened the doors of education and a better future."'),
      attribution: b('— أحمد، مستفيد من برنامج كفالة الأيتام، اليمن', '— Ahmed, beneficiary of the Orphan Sponsorship Program, Yemen'),
      button: b('اقرأ القصة', 'Read the Story'), button_url: '#',
    },
    items: [] },

  { type: 'projects', name: 'مشاريعنا', content: {
      anchor: 'projects', bg: 'white',
      eyebrow: b('على أرض الواقع', 'On the Ground'), title: b('مشاريعنا', 'Our Projects'),
      tab1: b('داخل قطر', 'In Qatar'), tab2: b('حول العالم', 'Worldwide'), view_label: b('اطلع على المشروع', 'View Project'),
    },
    items: [
      { tab: 'tab1', image: IMG.food, type: b('غذاء وإعاشة', 'Food & Aid'), location: b('الدوحة', 'Doha'), desc: b('توزيع السلال الغذائية على الأسر المحتاجة داخل قطر.', 'Distributing food baskets to families in need across Qatar.'), url: '#' },
      { tab: 'tab1', image: IMG.reading, type: b('تعليم وثقافة', 'Education'), location: b('الريان', 'Al Rayyan'), desc: b('برنامج دعم طلاب التعليم العام والجامعي.', 'Support program for general and university education students.'), url: '#' },
      { tab: 'tab1', image: IMG.meeting, type: b('تنمية مجتمعية', 'Community Dev.'), location: b('الخور', 'Al Khor'), desc: b('تأهيل الأسر وبناء القدرات المهنية.', 'Family rehabilitation and vocational capacity building.'), url: '#' },
      { tab: 'tab2', image: IMG.children, type: b('رعاية الأيتام', 'Orphan Care'), location: b('اليمن', 'Yemen'), desc: b('كفالة وتعليم ورعاية الأيتام في مناطق النزاع.', 'Sponsoring, educating, and caring for orphans in conflict areas.'), url: '#' },
      { tab: 'tab2', image: IMG.water, type: b('مياه وإصحاح', 'Water & Sanitation'), location: b('الصومال', 'Somalia'), desc: b('مشاريع مياه نظيفة وإصحاح بيئي مستدام.', 'Clean water projects and sustainable environmental sanitation.'), url: '#' },
      { tab: 'tab2', image: IMG.volunteers, type: b('إغاثة طارئة', 'Emergency Relief'), location: b('سوريا', 'Syria'), desc: b('مساعدات إنسانية عاجلة للمتضررين.', 'Urgent humanitarian aid for those affected by crisis.'), url: '#' },
    ] },

  { type: 'governance', name: 'الحوكمة والمساءلة', content: {
      anchor: 'governance',
      eyebrow: b('الحوكمة والمساءلة', 'Governance & Accountability'), title: b('عطاؤكم أمانة', 'Your Trust, Our Responsibility'),
      subtitle: b('نلتزم بأعلى معايير الحوكمة والشفافية والمساءلة للحفاظ على ثقة المتبرعين وتعظيم أثر عطائهم.',
        'We uphold the highest standards of governance, transparency, and accountability to honor donor trust and maximize the impact of every gift.'),
      button: b('تعرف على الحوكمة والشفافية', 'Learn About Our Governance'), button_url: '#',
      view_label: b('اطلع الآن', 'View Now'),
    },
    items: [
      ['scale', 'الحوكمة', 'Governance', 'تعرف على إطار الحوكمة والسياسات المؤسسية.', 'Learn about our governance framework and institutional policies.'],
      ['eye', 'المساءلة والشفافية', 'Accountability', 'وضوح في الإجراءات والنتائج والإفصاحات.', 'Clarity in procedures, results, and disclosures.'],
      ['doc', 'التقارير السنوية', 'Annual Reports', 'اطلع على أداء المؤسسة وإنجازاتها.', "Review the foundation's performance and achievements."],
      ['chart', 'القوائم المالية', 'Financial Statements', 'تقارير مالية ومعلومات موثقة.', 'Audited financial reports and verified information.'],
    ].map(([icon, ta, te, da, de]) => ({ icon, title: b(ta, te), desc: b(da, de), url: '#' })) },

  { type: 'join', name: 'كن جزءًا من الأثر', content: {
      anchor: 'join', bg: 'warm',
      eyebrow: b('انضم إلينا', 'Join Us'), title: b('كن جزءًا من الأثر', 'Be Part of the Impact'),
    },
    items: [
      { icon: 'heart', accent: '#7C1A44', title: b('تبرع', 'Donate'), desc: b('ساهم بعطائك وأحدث أثرًا حقيقيًا في حياة المحتاجين.', 'Contribute your generosity and create real impact for those in need.'), cta: b('تبرع الآن', 'Donate Now'), url: '#donate' },
      { icon: 'hands', accent: '#1A2E52', title: b('تطوع', 'Volunteer'), desc: b('امنح من وقتك وخبرتك وكن جزءًا من فريق عيد الخيرية.', 'Give your time and expertise and join the Eid Charity team.'), cta: b('تطوع معنا', 'Volunteer'), url: '#' },
      { icon: 'network', accent: '#8A6A20', title: b('كن شريكًا', 'Partner'), desc: b('شاركنا في صناعة أثر مستدام يخدم المجتمع والإنسان.', 'Join us in creating sustainable impact that serves community and humanity.'), cta: b('اكتشف الشراكات', 'Discover Partnerships'), url: '#' },
    ] },

  { type: 'media', name: 'آخر الأخبار', content: {
      anchor: 'media', bg: 'white',
      eyebrow: b('أخبار وتقارير', 'News & Reports'), title: b('آخر أخبار عيد', 'Latest Eid News'),
      button: b('زيارة المركز الإعلامي', 'Visit Media Center'), button_url: '#',
    },
    items: [
      { image: IMG.volunteers, date: b('8 أغسطس 2026', '8 August 2026'), title: b('عيد الخيرية توزع 1,000 سلة غذائية على الأسر المحتاجة', 'Eid Charity Distributes 1,000 Food Baskets to Families in Need'),
        desc: b('في إطار برنامجها الرمضاني، وزّعت المؤسسة اليوم ألف سلة غذائية على الأسر المحتاجة.', 'As part of its Ramadan program, the foundation distributed one thousand food baskets to families in need.'), url: '#' },
      { image: IMG.meeting, date: b('1 أغسطس 2026', '1 August 2026'), title: b('انطلاق برنامج تمكين المرأة الخامس', 'Fifth Women Empowerment Program Launched'),
        desc: b('أطلق مركز عيد النسائي برنامجه التدريبي الخامس لتمكين المرأة اقتصاديًا وأسريًا.', "Eid Women's Center launched its fifth training program for economic and family empowerment."), url: '#' },
      { image: IMG.reading, date: b('25 يوليو 2026', '25 July 2026'), title: b('مركز عيد الثقافي يُعلن عن موسمه الجديد', 'Eid Cultural Center Announces New Season'),
        desc: b('يستعد المركز لإطلاق برامجه المعرفية للموسم الثقافي الجديد مطلع الشهر القادم.', 'The center is preparing to launch its educational programs for the new cultural season next month.'), url: '#' },
    ] },

  { type: 'partners', name: 'شركاء النجاح', content: {
      anchor: 'partners', bg: 'warm',
      eyebrow: b('معًا نصنع الأثر', 'Together We Create Impact'), title: b('شركاء النجاح', 'Partners in Success'),
    },
    items: ['Qatar Foundation', 'Qatar Red Crescent', 'UNHCR', 'UNICEF', 'Qatar Charity', 'Qatar Dev. Bank', 'Al Jazeera', 'Ooredoo']
      .map(n => ({ name: b(n, n), logo: '', url: '' })) },
]

module.exports = { settings, menu, sections }
