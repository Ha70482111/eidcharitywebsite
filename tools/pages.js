// Sub-pages built from the content of the old website (eidcharity.net/ar).
// Imported once into the live database (eid_import_pages in php/api/db.php); after that they are edited in /admin → الصفحات الفرعية.
// Pages with no content on the old site are added hidden, so the owner can fill them first.

const b = (ar, en) => ({ ar, en })
const OLD = 'https://eidcharity.net/arold/articles_attachments/'
const PARTS = 'https://eidcharity.net/arold/partsimages/'

const page = (slug, ar, en, sections, extra = {}) => ({ slug, title: b(ar, en), content: { subtitle: b('', ''), image: '', ...(extra.content || {}) }, visible: extra.visible ?? true, sections })
const text = (name, c) => ({ type: 'text_block', name, content: { anchor: '', bg: 'white', eyebrow: b('', ''), image: '', image_side: 'end', ...c }, items: [] })
const docs = (name, c, items) => ({ type: 'documents', name, content: { anchor: '', bg: 'white', eyebrow: b('', ''), subtitle: b('', ''), link_label: b('تحميل PDF', 'Download PDF'), ...c },
  items: items.map(([ar, en, file]) => ({ title: b(ar, en), desc: b('', ''), file })) })
const cards = (name, c, items) => ({ type: 'cards', name, content: { anchor: '', bg: 'white', eyebrow: b('', ''), subtitle: b('', ''), columns: '3', ...c },
  items: items.map(it => ({ image: '', desc: b('', ''), link_label: b('', ''), url: '', ...it })) })
const cta = (title, subtitle, button, url, bg = 'maroon') => ({ type: 'cta_banner', name: 'شريط دعوة', content: { anchor: '', bg, image: '', title, subtitle, button, button_url: url }, items: [] })

const DONATE = cta(b('ساهم معنا في صناعة الأثر', 'Help us make an impact'), b('عطاؤك يصل إلى المحتاجين في قطر وحول العالم.', 'Your gift reaches people in need in Qatar and around the world.'), b('تبرع الآن', 'Donate Now'), '/#donate')

// Centers: descriptions are from the old home page; their own pages on the old site were empty.
const center = (slug, ar, en, descAr, descEn, img) => page(slug, ar, en, [
  text(`نبذة عن ${ar}`, { eyebrow: b('مبادرات عيد الخيرية', 'Eid Charity Initiatives'), title: b(ar, en), body: b(descAr, descEn), image: img }),
  DONATE,
])

const pages = [
  page('about', 'عن المؤسسة', 'About the Foundation', [
    text('نبذة عن المؤسسة', {
      eyebrow: b('من نحن', 'Who We Are'), title: b('نبذة عن مؤسسة عيد الخيرية', 'About Eid Charity Foundation'),
      body: b('مؤسسة الشيخ عيد الخيرية إحدى المنظمات الإنسانية القطرية التي تهتم برعاية الإنسان في قطر وخارجها، حيث تقدم الإغاثات والإعانات، وتتبنى المنشآت التعليمية والصحية والدعوية، وتوفر المساعدات للمرضى والفقراء والمحتاجين، كما تعمل على تنمية المجتمعات الفقيرة من خلال المشاريع التنموية المتوسطة والصغيرة.',
        'Sheikh Eid Charity Foundation is a Qatari humanitarian organization dedicated to caring for people in Qatar and abroad. It provides relief and aid, sponsors educational, health and Islamic-outreach facilities, supports patients, the poor and those in need, and develops poor communities through small and medium development projects.'),
      image: OLD + '1554274785_about1.jpg',
    }),
    text('النشأة', {
      bg: 'cream', eyebrow: b('النشأة', 'Our Beginnings'), title: b('تأسست عام 1995م', 'Founded in 1995'),
      body: b('أنشئت مؤسسة الشيخ عيد بن محمد آل ثاني الخيرية مع بداية شهر رمضان المبارك لعام 1416هـ الموافق 1995/11/1م، وسميت بهذا الاسم تيمنًا باسم الشيخ عيد بن محمد بن ثاني بن جاسم بن محمد بن ثاني، رحمه الله (1922م - 1994م)، أحد أعلام دولة قطر النبلاء، والمعروف بمحبته للخير وحرصه عليه، وسعيه الدؤوب من أجل تنفيذ المشاريع الخيرية داخل قطر وخارجها على حد سواء.\n\nورغبة منه - رحمه الله - في استمرار هذا الخير، أوصى بوقف ثلث تركته على أعمال الخير والبر؛ طالبًا لمرضاة الله تعالى، ورغبة في الثواب.',
        'Sheikh Eid bin Mohammed Al Thani Charity Foundation was established at the beginning of the holy month of Ramadan 1416 AH (1 November 1995). It is named after Sheikh Eid bin Mohammed bin Thani bin Jassim bin Mohammed bin Thani (1922–1994), may God have mercy on him, one of Qatar\'s noble figures, known for his love of doing good and his tireless efforts to carry out charitable projects in Qatar and abroad.\n\nWishing this good to continue, he bequeathed a third of his estate as an endowment for charitable works, seeking the pleasure of God and His reward.'),
    }),
    DONATE,
  ]),

  page('vision-mission', 'الرؤية والرسالة', 'Vision & Mission', [
    { type: 'join', name: 'الرؤية والرسالة', content: { anchor: '', bg: 'white', eyebrow: b('الرؤية والرسالة والقيم', 'Vision, Mission & Values'), title: b('ما نؤمن به', 'What We Believe In') },
      items: [
        { icon: 'eye', accent: '#7C1A44', title: b('رؤيتنا', 'Our Vision'), desc: b('رحمة للإنسانية وريادة في التنمية المجتمعية', 'Mercy for humanity and leadership in community development'), cta: b('', ''), url: '' },
        { icon: 'heart', accent: '#1A2E52', title: b('رسالتنا', 'Our Mission'), desc: b('القيام بالأعمال الخيرية والتنموية والمحافظة على القيم', 'Carrying out charitable and development work while preserving values'), cta: b('', ''), url: '' },
      ] },
    cards('قيمنا', { bg: 'warm', eyebrow: b('قيمنا', 'Our Values'), title: b('القيم التي تحكم عملنا', 'The Values That Guide Our Work') }, [
      ['الخير', 'Goodness', 'نسعى لبث روح البذل والعطاء والتطوع وترسيخ المبادئ الأصيلة في أفراد المجتمع.', 'We spread the spirit of giving and volunteering and root authentic principles in society.'],
      ['الأمانة', 'Trust', 'نؤكد مبدأ الصدق والأمانة المتبادلة بيننا وبين شركائنا لنكون موضع ثقة الجميع.', 'We uphold honesty and mutual trust with our partners, so that everyone can rely on us.'],
      ['الشفافية', 'Transparency', 'نتعامل بوضوح ونزاهة في جميع معاملاتنا وتقاريرنا ومشاريعنا.', 'We act with clarity and integrity in all our dealings, reports and projects.'],
      ['المبادرة', 'Initiative', 'نسعى لتحقيق أفضل الأفكار الإبداعية والممارسات الخيرية والمؤسسية وتشجيع المشاركات المجتمعية.', 'We pursue the best creative ideas and charitable and institutional practices, and encourage community participation.'],
      ['التعلم', 'Learning', 'نلتزم بالتطوير المستمر والتعلم البنّاء لمنتسبينا وشركائنا.', 'We are committed to continuous development and constructive learning for our staff and partners.'],
      ['الشراكة', 'Partnership', 'نتعاون وننسق بين المؤسسات والجمعيات ذات الصلة بالعمل الخيري محليًا وعالميًا بما يحقق التكامل الخيري.', 'We cooperate and coordinate with charitable organizations locally and globally to achieve integrated charitable work.'],
    ].map(([ar, en, dAr, dEn]) => ({ title: b(ar, en), desc: b(dAr, dEn) }))),
  ]),

  page('goals', 'أهداف المؤسسة', 'Our Goals', [
    text('أهداف المؤسسة', {
      eyebrow: b('أهدافنا', 'Our Goals'), title: b('تسعى المؤسسة إلى تحقيق الأهداف التالية', 'The Foundation Seeks to Achieve the Following Goals'),
      body: b([
        'تقديم الخدمات الإنسانية والخيرية والإغاثية والصحية للمنكوبين والمحتاجين والمضطهدين، والمتضررين من القحط والجفاف، والمجاعات والكوارث الطبيعية والحربية.',
        'القيام بالخدمات التعليمية والتربوية والدعوية للجمعيات الإسلامية التي ليست لها الإمكانيات المادية.',
        'بناء المدارس والمستشفيات والمساجد ومراكز تحفيظ القرآن الكريم والمشاريع الخيرية في الأماكن التي تحتاج إليها.',
        'رعاية الأرامل وكفالة الأيتام، وبالأخص أولئك الذين يعانون من الفقر بجانب اليتم، وتهددهم الأفكار المضللة الفاسدة؛ وذلك برعايتهم ماديًا واجتماعيًا وثقافيًا.',
        'المساهمة في رفع المعاناة عن بعض الأسر القطرية الفقيرة من خلال مساعدات سنوية أو رواتب شهرية.',
        'المساهمة في تحقيق التكافل الاجتماعي داخل مجتمعنا القطري.',
        'التعاون مع الجمعيات واللجان الخيرية داخل قطر والتنسيق الكامل معها، ومع غيرها خارج قطر، لتحقيق الخير والتوازن وإيصال الخير إلى الجميع، والاستفادة من جميع الخبرات المتاحة.',
        'تلقي الإعانات والوصايا والهبات وتوزيعها على مستحقيها.',
      ].map(l => '• ' + l).join('\n'), [
        'Providing humanitarian, charitable, relief and health services to those afflicted, in need or oppressed, and to victims of drought, famine, and natural and war disasters.',
        'Providing educational, pedagogical and outreach services to Islamic associations that lack financial means.',
        'Building schools, hospitals, mosques, Quran memorization centers and charitable projects where they are needed.',
        'Caring for widows and sponsoring orphans, especially those who suffer from poverty as well as the loss of a parent, supporting them materially, socially and culturally.',
        'Helping relieve the hardship of poor Qatari families through annual aid or monthly allowances.',
        'Contributing to social solidarity within Qatari society.',
        'Cooperating and fully coordinating with charitable associations and committees in Qatar and abroad, to spread good to everyone and benefit from all available expertise.',
        'Receiving donations, bequests and gifts and distributing them to those who deserve them.',
      ].map(l => '• ' + l).join('\n')),
      image: OLD + '1554367150_About_main.jpg', image_side: 'start',
    }),
  ]),

  page('organizational-structure', 'الهيكل التنظيمي', 'Organizational Structure', [
    text('الهيكل التنظيمي', {
      title: b('الهيكل التنظيمي للمؤسسة', 'Organizational Structure'),
      body: b('ارفع صورة الهيكل التنظيمي هنا من لوحة التحكم، ثم أظهر الصفحة.', 'Upload the organizational chart image here from the dashboard, then show the page.'),
    }),
  ], { visible: false }),

  page('chairman', 'رئيس مجلس الإدارة', 'Chairman of the Board', [
    text('رئيس مجلس الإدارة', {
      eyebrow: b('رئيس مجلس الإدارة', 'Chairman of the Board'), title: b('سعادة الدكتور الشيخ محمد بن عيد آل ثاني', 'H.E. Dr. Sheikh Mohammed bin Eid Al Thani'),
      body: b('وزير الدولة ورئيس مجلس إدارة مؤسسة الشيخ عيد بن محمد آل ثاني الخيرية.\nمن مواليد 1954م.',
        'Minister of State and Chairman of the Board of Sheikh Eid bin Mohammed Al Thani Charity Foundation.\nBorn in 1954.'),
      image: OLD + '1554370761_2.jpg', image_side: 'start',
    }),
    text('المؤهلات العلمية', {
      bg: 'cream', title: b('المؤهلات العلمية', 'Education'),
      body: b('• بكالوريوس اقتصاد وعلوم سياسية - جامعة القاهرة، 1976م.\n• ماجستير في العلاقات الدولية من جامعة القاهرة بتقدير (ممتاز)، 1992م.\n• دكتوراه الفلسفة في العلوم السياسية من كلية التجارة - جمهورية مصر العربية، 1997م.',
        '• Bachelor of Economics and Political Science, Cairo University, 1976.\n• Master\'s in International Relations, Cairo University (Excellent), 1992.\n• PhD in Political Science, Faculty of Commerce, Arab Republic of Egypt, 1997.'),
    }),
    text('المناصب', {
      title: b('المناصب', 'Positions'),
      body: b([
        'عمل بإدارة شؤون البترول في وزارة المالية والبترول عقب تخرجه في الفترة من 1976 إلى 1979م.',
        'أمينًا عامًا للمجلس الأعلى لرعاية الشباب بتاريخ 1980/10/25م.',
        'نائبًا لرئيس الهيئة العامة للشباب والرياضة بدرجة وزير بتاريخ 1991/6/10م.',
        'رئيسًا للهيئة العامة للشباب والرياضة من 1991/9/18م إلى 2000/7/22م.',
        'أمينًا عامًا لمجلس شؤون العائلة وعضوًا بالمجلس بتاريخ 2000/7/12م.',
        'عُيّن وزيرًا للدولة بتاريخ 2000/7/22م.',
        'رئيسًا لمجلس إدارة جمعية بيوت الشباب القطرية من 1983م إلى 1993م.',
        'رئيسًا لمجلس إدارة مؤسسة الشيخ عيد بن محمد آل ثاني الخيرية منذ تأسيسها.',
        'عضوًا مؤسسًا للجمعية القطرية لرعاية وتأهيل المعاقين، وجمعية بيوت الشباب القطرية، والجمعية القطرية لمرضى السكري.',
      ].map(l => '• ' + l).join('\n'), [
        'Worked in the Petroleum Affairs Department of the Ministry of Finance and Petroleum, 1976–1979.',
        'Secretary-General of the Supreme Council for Youth Welfare, 25/10/1980.',
        'Vice-President of the General Authority for Youth and Sports with the rank of minister, 10/6/1991.',
        'President of the General Authority for Youth and Sports, 18/9/1991 – 22/7/2000.',
        'Secretary-General and member of the Supreme Council for Family Affairs, 12/7/2000.',
        'Appointed Minister of State on 22/7/2000.',
        'Chairman of the Qatar Youth Hostels Association, 1983–1993.',
        'Chairman of the Board of Sheikh Eid bin Mohammed Al Thani Charity Foundation since its founding.',
        'Founding member of the Qatar Society for Rehabilitation of the Disabled, the Qatar Youth Hostels Association and the Qatar Diabetes Association.',
      ].map(l => '• ' + l).join('\n')),
    }),
    text('الخبرات والتكريمات', {
      bg: 'cream', title: b('الخبرات العملية والتكريمات', 'Experience & Honors'),
      body: b([
        'شارك في العديد من مؤتمرات الشباب والرياضة على المستوى الخليجي والعربي والقاري والدولي.',
        'شارك في التوقيع على العديد من الاتفاقيات الدولية في مجال الشباب والرياضة بين دولة قطر والدول العربية والأجنبية.',
        'شارك في افتتاح العديد من البطولات والمهرجانات الرياضية والشبابية، منها دورة الألعاب الأولمبية بسيول 1988م وبرشلونة 1992م.',
        'جائزة الخدمات المتميزة من الأكاديمية الأمريكية للرياضة، 1993م.',
        'وسام الكوكب الأردني من الدرجة الأولى من المملكة الأردنية الهاشمية، 1994م.',
        'وسام الاستحقاق من الدرجة الأولى من الاتحاد العربي لجمعيات بيوت الشباب، 1995م.',
        'كُرّم ضمن رواد العمل الاجتماعي على المستوى الخليجي عن دولة قطر، 2000م.',
        'كرّمه مجلس وزراء الشباب والرياضة العرب كأحد القيادات العربية المتميزة، مارس 2003م.',
        'كُرّم ضمن الاحتفال السنوي بيوم العلم الثاني والعشرين بإمارة عجمان بدولة الإمارات، 2008م.',
        'جائزة العمل الإنساني لدول مجلس التعاون الخليجي بمملكة البحرين، 2009م.',
        'الجائزة الشرفية للعمل التطوعي من دار الإنماء الاجتماعي بدولة قطر، 2011م.',
        'شهادة الجدارة من الاتحاد الدولي لبيوت الشباب، 2012م.',
        'جائزة الدولة التقديرية في مجال الخدمة الاجتماعية (العمل التطوعي) من وزارة الثقافة والفنون والتراث، 2014/2/18م.',
        'جائزة مجلس التعاون لدول الخليج العربية للتميز في دورتها الأولى في مجال العمل التطوعي والخيري، 2015/12/7م.',
      ].map(l => '• ' + l).join('\n'), [
        'Took part in many youth and sports conferences at Gulf, Arab, continental and international level.',
        'Signed many international youth and sports agreements between Qatar and Arab and foreign countries.',
        'Attended the opening of many sports and youth championships and festivals, including the Seoul 1988 and Barcelona 1992 Olympic Games.',
        'Distinguished Service Award, United States Sports Academy, 1993.',
        'Order of the Star of Jordan, First Class, Hashemite Kingdom of Jordan, 1994.',
        'Order of Merit, First Class, Arab Federation of Youth Hostels, 1995.',
        'Honored among the pioneers of social work in the Gulf on behalf of Qatar, 2000.',
        'Honored by the Council of Arab Youth and Sports Ministers as a distinguished Arab leader, March 2003.',
        'Honored at the 22nd annual Flag Day celebration in Ajman, UAE, 2008.',
        'GCC Humanitarian Work Award, Kingdom of Bahrain, 2009.',
        'Honorary Award for Volunteer Work, Social Development Center, Qatar, 2011.',
        'Certificate of Merit, International Youth Hostel Federation, 2012.',
        'State Appreciation Award for Social Service (Volunteer Work), Ministry of Culture, Arts and Heritage, 18/2/2014.',
        'GCC Excellence Award, first edition, in volunteer and charitable work, 7/12/2015.',
      ].map(l => '• ' + l).join('\n')),
    }),
  ]),

  page('board-members', 'أعضاء مجلس الإدارة', 'Board Members', [
    cards('أعضاء مجلس الإدارة', { eyebrow: b('مجلس الإدارة', 'Board of Directors'), title: b('أعضاء مجلس الإدارة', 'Board Members'), columns: '4' }, []),
  ], { visible: false }),

  page('governance-policies', 'سياسات الحوكمة', 'Governance Policies', [
    docs('سياسات الحوكمة', { eyebrow: b('الحوكمة', 'Governance'), title: b('سياسات الحوكمة', 'Governance Policies'),
      subtitle: b('السياسات واللوائح التي تنظم عمل المؤسسة وتضمن النزاهة والشفافية.', 'The policies that govern the Foundation\'s work and ensure integrity and transparency.') }, [
      ['بيان سياسة قبول العملاء', 'Customer Acceptance Policy Statement', OLD + '1571654702_s1.pdf'],
      ['بيان سياسة مكافحة غسل الأموال وتمويل الإرهاب', 'Anti-Money Laundering and Counter-Terrorist Financing Policy Statement', OLD + '1571654123_b1.pdf'],
      ['سياسة الإبلاغ عن المخالفات', 'Whistleblowing Policy', OLD + '1603871058_%D3%ED%C7%D3%C9%20%C7%E1%C5%C8%E1%C7%DB%20%DA%E4%20%C7%E1%E3%CE%C7%E1%DD%C7%CA.pdf'],
      ['سياسة تنظيم تضارب المصالح', 'Conflict of Interest Policy', OLD + '1554633815_corraption.pdf'],
      ['وثيقة الأخلاقيات وقواعد السلوك', 'Code of Ethics and Conduct', OLD + '1554633737_selook.pdf'],
      ['سياسات وإجراءات مكافحة الاحتيال', 'Anti-Fraud Policies and Procedures', OLD + '1554633515_Ehtiall.pdf'],
      ['سياسات أمن المعلومات', 'Information Security Policies', OLD + '1554633328_IT.pdf'],
      ['بيان سياسة المخاطر', 'Risk Policy Statement', OLD + '1571653962_m1.pdf'],
    ]),
  ]),

  page('whistleblowing', 'الإبلاغ عن المخالفات', 'Whistleblowing', [
    docs('سياسة الإبلاغ عن المخالفات', { eyebrow: b('النزاهة والشفافية', 'Integrity & Transparency'), title: b('الإبلاغ عن المخالفات', 'Reporting Violations'),
      subtitle: b('اطلع على سياسة الإبلاغ عن المخالفات، وتواصل معنا للإبلاغ عن أي مخالفة.', 'Read our whistleblowing policy, and contact us to report any violation.') }, [
      ['سياسة الإبلاغ عن المخالفات', 'Whistleblowing Policy', OLD + '1603871058_%D3%ED%C7%D3%C9%20%C7%E1%C5%C8%E1%C7%DB%20%DA%E4%20%C7%E1%E3%CE%C7%E1%DD%C7%CA.pdf'],
    ]),
    cta(b('للإبلاغ عن مخالفة', 'To report a violation'), b('راسلنا على البريد الإلكتروني: mail@eidcharity.net', 'Email us at: mail@eidcharity.net'), b('أرسل بريدًا', 'Send an email'), 'mailto:mail@eidcharity.net', 'navy'),
  ]),

  page('committees', 'لجان المؤسسة', 'Committees', [
    cards('لجان المؤسسة', { eyebrow: b('الحوكمة', 'Governance'), title: b('لجان المؤسسة', 'Foundation Committees') }, []),
  ], { visible: false }),

  page('annual-financial-reports', 'التقارير المالية الختامية السنوية', 'Annual Financial Statements', [
    docs('البيانات المالية الختامية', { eyebrow: b('المساءلة والشفافية', 'Accountability & Transparency'), title: b('البيانات المالية الختامية السنوية', 'Annual Financial Statements') }, [
      ['البيانات المالية الختامية لعام 2020م', 'Financial Statements 2020', OLD + '1650019032_1650017616_%26%23199%3B%26%23225%3B%26%23200%3B%26%23237%3B%26%23199%3B%26%23228%3B%26%23199%3B%26%23202%3B%20%26%23199%3B%26%23225%3B%26%23227%3B%26%23199%3B%26%23225%3B%26%23237%3B%26%23201%3B%20%26%23199%3B%26%23225%3B%26%23228%3B%26%23202%3B%26%23229%3B%26%23237%3B%26%23201%3B%20%26%23225%3B%26%23218%3B%26%23199%3B%26%23227%3B%202020%26%23227%3B.pdf'],
      ['البيانات المالية الختامية لعام 2019م', 'Financial Statements 2019', OLD + '1650018908_1602055473_%26%23199%3B%26%23225%3B%26%23200%3B%26%23237%3B%26%23199%3B%26%23228%3B%26%23199%3B%26%23202%3B%20%26%23199%3B%26%23225%3B%26%23227%3B%26%23199%3B%26%23225%3B%26%23237%3B%26%23201%3B%20%26%23225%3B%26%23218%3B%26%23199%3B%26%23227%3B%202019.pdf'],
      ['البيانات المالية الختامية لعام 2018م', 'Financial Statements 2018', OLD + '1650018526_1602051791_%26%23199%3B%26%23225%3B%26%23200%3B%26%23237%3B%26%23199%3B%26%23228%3B%26%23199%3B%26%23202%3B%20%26%23199%3B%26%23225%3B%26%23227%3B%26%23199%3B%26%23225%3B%26%23237%3B%26%23201%3B%20%26%23225%3B%26%23218%3B%26%23199%3B%26%23227%3B%202018.pdf'],
      ['البيانات المالية الختامية لعام 2017م', 'Financial Statements 2017', OLD + '1602052700_%C7%E1%C8%ED%C7%E4%C7%CA%20%C7%E1%E3%C7%E1%ED%C9%20%E1%E1%D3%E4%C9%20%C7%E1%E3%E4%CA%E5%ED%C9%20%E1%DA%C7%E3%202017.pdf'],
      ['البيانات المالية الختامية لعام 2016م', 'Financial Statements 2016', OLD + '1602052789_%C7%E1%C8%ED%E4%C7%E4%C7%CA%20%C7%E1%E3%C7%E1%ED%C9%20%E1%E1%D3%E4%C9%20%C7%E1%E3%E4%CA%E5%ED%C9%20%E1%DA%C7%E3%202016.pdf'],
    ]),
  ]),

  page('waqf-financial-reports', 'التقارير المالية للأوقاف الخيرية', 'Endowment Financial Reports', [
    docs('تقارير الأوقاف', { eyebrow: b('المساءلة والشفافية', 'Accountability & Transparency'), title: b('التقارير المالية للأوقاف الخيرية', 'Charitable Endowment Financial Reports') }, [
      ['وقف علاج المرضى ومساعدة الأرامل', 'Endowment for Treating Patients and Helping Widows', OLD + '1650016716_%C7%E1%E6%DE%DD%20%C7%E1%CE%ED%D1%ED%20%DD%ED%E1%C7%20%C7%E1%E6%DF%D1%C9.pdf'],
      ['وقف كوسوفا', 'Kosovo Endowment', OLD + '1650016916_%C7%E1%E6%DE%DD%20%C7%E1%CE%ED%D1%ED%20%DF%E6%D3%E6%DD%C7.pdf'],
      ['وقف فلسطين', 'Palestine Endowment', OLD + '1650017072_%C7%E1%E6%DE%DD%20%C7%E1%CE%ED%D1%ED%20%DA%E3%C7%D1%C9%20%DD%E1%D3%D8%ED%E4%20%C8%C7%E1%E3%D8%C7%D1.pdf'],
      ['الوقف العام', 'General Endowment', OLD + '1650017135_%C7%E1%E6%DE%DD%20%C7%E1%CE%ED%D1%ED%20%C7%E1%DA%C7%E3.pdf'],
      ['وقف القرآن والتعليم', 'Quran and Education Endowment', OLD + '1650017194_%C7%E1%E6%DE%DD%20%C7%E1%CE%ED%D1%ED%20%C7%E1%CF%DA%E6%ED.pdf'],
    ]),
  ]),

  page('achievements', 'إنجازات النشاط', 'Achievements', [
    { type: 'impact', name: 'الإنجازات في أرقام', content: { anchor: '', eyebrow: b('خلال 22 عامًا', 'Over 22 Years'), title: b('إنجازاتنا في أرقام', 'Our Achievements in Numbers'), subtitle: b('', ''), note: b('', '') },
      items: [
        { num: '70,000', unit: b('', ''), label: b('يتيم وأسرة', 'Orphans & Families'), note: b('كفالة ما يزيد عن 70 ألف يتيم وأسرة', 'More than 70,000 orphans and families sponsored') },
        { num: '1,120', unit: b('', ''), label: b('مدرسة', 'Schools'), note: b('تم تشييد 1120 مدرسة', '1,120 schools built') },
        { num: '22,000', unit: b('', ''), label: b('بئر ماء', 'Water Wells'), note: b('حفر 22 ألف بئر ماء', '22,000 water wells drilled') },
      ] },
    cards('الإنجازات السنوية', { bg: 'warm', eyebrow: b('عامًا بعد عام', 'Year by Year'), title: b('الإنجازات السنوية', 'Annual Achievements'), columns: '2' }, [
      ['2016', 'حاولت المؤسسة في العام 2016 تخفيف الآلام والمعاناة عن المتضررين حول العالم من خلال مشاريعها التي بلغ عدد المستفيدين منها ما يقارب 15 مليون مستفيد، فأقامت مشاريع إغاثية بمبلغ 127,327,201 ريال، وبنت 30 مدرسة و3 دور أيتام و4 مراكز طبية، ونفذت 242 برنامجًا طبيًا، وبنت 638 مسجدًا و101 بيت للفقراء، وكفلت 50,380 يتيمًا وأسرة في 28 دولة، وحفرت 2435 بئرًا، ودشنت 564 مشروعًا تنمويًا للأسر معدومة الدخل.',
        'In 2016 the Foundation worked to ease the suffering of people affected around the world through projects that reached nearly 15 million beneficiaries: relief projects worth QAR 127,327,201, 30 schools, 3 orphanages, 4 medical centers, 242 medical programs, 638 mosques, 101 homes for the poor, 50,380 orphans and families sponsored in 28 countries, 2,435 wells, and 564 development projects for families with no income.'],
      ['2015', 'رسمت المؤسسة في العام 2015 البسمة على وجوه ملايين البشر من خلال مشاريعها، فكفلت 44,507 يتيمًا وأسرة، وبنت داري أيتام، وأقامت 23 مدرسة، وشيدت 359 بيتًا للفقراء، وبنت مركزًا طبيًا ونفذت 209 برامج طبية، وحفرت 2852 بئرًا، وبنت 469 مسجدًا، ونفذت مشاريع إغاثية في 25 دولة استفاد منها الملايين بتكلفة 83,370,448 ريال.',
        'In 2015 the Foundation brought smiles to millions: 44,507 orphans and families sponsored, 2 orphanages, 23 schools, 359 homes for the poor, a medical center and 209 medical programs, 2,852 wells, 469 mosques, and relief projects in 25 countries benefiting millions at a cost of QAR 83,370,448.'],
      ['2014', 'نفذت المؤسسة في العام 2014 مشاريعها في 50 دولة، فرصدت حاجاتهم بعد دراسة واقع مجتمعاتهم عبر شركائها المحليين، واستطاعت بناء 38 مدرسة وداري أيتام و433 مسجدًا و61 بيتًا للفقراء، وحفرت 2089 بئرًا، وكفلت 39,926 يتيمًا وأسرة، وأقامت مشاريع إغاثية بتكلفة 53,560,918 ريال، كما أقامت 6 مراكز صحية ونفذت 190 برنامجًا طبيًا.',
        'In 2014 the Foundation carried out projects in 50 countries, assessing needs with its local partners: 38 schools, 2 orphanages, 433 mosques, 61 homes for the poor, 2,089 wells, 39,926 orphans and families sponsored, relief projects worth QAR 53,560,918, 6 health centers and 190 medical programs.'],
      ['2013', 'واصلت المؤسسة مشاريعها في العام 2013 بهمة وعزيمة واجتهاد، فقامت ببناء 32 مدرسة و9 دور أيتام و11 مركزًا صحيًا، ونفذت 184 برنامجًا طبيًا، وبنت 464 مسجدًا و131 بيتًا للفقراء، كما نفذت 324 مشروعًا تنمويًا للأسر معدومة الدخل، وحفرت 2245 بئرًا، وكفلت 34,859 يتيمًا وأسرة، ونفذت مشاريع إغاثية بتكلفة 70,179,107 ريال في 27 دولة منها فلسطين وسوريا والصومال والفلبين.',
        'In 2013 the Foundation built 32 schools, 9 orphanages and 11 health centers, ran 184 medical programs, built 464 mosques and 131 homes for the poor, carried out 324 development projects for families with no income, drilled 2,245 wells, sponsored 34,859 orphans and families, and delivered relief worth QAR 70,179,107 in 27 countries including Palestine, Syria, Somalia and the Philippines.'],
      ['2012', 'حفل عام 2012 بالعديد من المتغيرات في المنطقة العربية، نتج عنها أوضاع إنسانية صعبة تطلبت حضورًا متميزًا من المؤسسة، فقامت بتنفيذ مشاريع إغاثية بتكلفة 64,929,129 ريال في 26 دولة، وبنت 29 مدرسة و157 بيتًا للفقراء و387 مسجدًا و3 مراكز صحية، ودشنت 362 مشروعًا تنمويًا، وحفرت 1992 بئرًا، وكفلت 44,572 يتيمًا وأسرة.',
        'In 2012, major changes across the Arab region created difficult humanitarian conditions. The Foundation delivered relief worth QAR 64,929,129 in 26 countries, built 29 schools, 157 homes for the poor, 387 mosques and 3 health centers, launched 362 development projects, drilled 1,992 wells and sponsored 44,572 orphans and families.'],
      ['2011', 'حصلت المؤسسة في عام 2011 على شهادة الأيزو تتويجًا لجهودها المستمرة وثمرة لالتزامها بالعمل المؤسسي والشفافية، وكان لها حضور متميز في إغاثة المنكوبين في الصومال ضمن مشاريعها الإغاثية التي بلغت قيمتها 48,919,348 ريال في 30 دولة، كما بنت دورًا للأيتام و382 مسجدًا و6 مراكز صحية، ونفذت 140 برنامجًا طبيًا، وبنت 127 بيتًا للفقراء، وحفرت 1528 بئرًا، وكفلت 24,611 يتيمًا وأسرة.',
        'In 2011 the Foundation earned ISO certification, crowning its commitment to institutional work and transparency. It played a prominent role in relief for Somalia, within relief projects worth QAR 48,919,348 in 30 countries, and built orphanages, 382 mosques and 6 health centers, ran 140 medical programs, built 127 homes for the poor, drilled 1,528 wells and sponsored 24,611 orphans and families.'],
      ['2010', 'في عام 2010 واكبت مشاريع المؤسسة الإنشائية والإغاثية والتنموية الأحداث الكبرى التي مر بها العالم، فزاد نشاطها وتنوعت جهودها، فقامت ببناء داري أيتام و450 مسجدًا و3 مراكز صحية، ونفذت 94 برنامجًا طبيًا، وحفرت 1569 بئرًا، وأقامت مشاريع إغاثية ومساعدات بتكلفة 60,658,026 ريال في 21 دولة.',
        'In 2010 the Foundation\'s construction, relief and development projects kept pace with major world events: 2 orphanages, 450 mosques, 3 health centers, 94 medical programs, 1,569 wells, and relief and aid worth QAR 60,658,026 in 21 countries.'],
    ].map(([y, ar, en]) => ({ title: b(`إنجازات عام ${y}`, `Achievements of ${y}`), desc: b(ar, en) }))),
    DONATE,
  ]),

  center('qatar-guests-center', 'مركز ضيوف قطر', 'Qatar Guests Center',
    'تعريف الوافدين والمقيمين بالثقافة العربية والإسلامية والعادات القطرية، وتثقيف الجاليات ورعايتهم اجتماعيًا وثقافيًا، مع تصحيح المفاهيم الخاطئة حول الإسلام وتوعية غير الناطقين بالعربية.',
    'Introducing expatriates and residents to Arab and Islamic culture and Qatari customs, educating communities and caring for them socially and culturally, correcting misconceptions about Islam, and reaching out to non-Arabic speakers.',
    PARTS + '966_1.jpg'),
  center('eid-cultural-center', 'مركز عيد الثقافي', 'Eid Cultural Center',
    'مركز متخصص في رعاية الشباب وتوعية المجتمع وتربية النشء تربية إسلامية متزنة وشاملة، عبر برامج متخصصة تصقل المواهب وتطور المهارات لإيجاد جيل قادر على تحمل المسؤولية تجاه مجتمعه ووطنه.',
    'A center dedicated to caring for youth, raising community awareness and giving young people a balanced, comprehensive Islamic upbringing, through specialized programs that refine talents and develop skills to raise a generation able to take responsibility for its community and country.',
    PARTS + '967_3.jpg'),
  center('eid-womens-center', 'مركز عيد النسائي', "Eid Women's Center",
    'مركز ثقافي نسائي متخصص في تقديم برامج مجتمعية وتربوية لجميع شرائح الفتيات، مع متخصصات في التربية والتثقيف والعلوم الأخرى، من خلال برامج عامة وعلمية وتربوية موسمية أو فصلية.',
    "A women's cultural center offering community and educational programs for girls of all ages, run by specialists in education, culture and other fields, through general, academic and educational programs held seasonally or each term.",
    PARTS + '968_2.jpg'),

  page('news', 'أخبار المؤسسة', 'News', [
    cards('أخبار المؤسسة', { eyebrow: b('المركز الإعلامي', 'Media Center'), title: b('أخبار المؤسسة', 'Foundation News') }, [
      ['عيد الاجتماعي يوزع 144 كوبونًا لـ "كسوة العيد" على الأسر المتعففة', 'تزامنًا مع قرب حلول عيد الأضحى المبارك، وزع مركز الشيخ عيد الاجتماعي التابع لمؤسسة عيد الخيرية 144 كوبونًا لـ "كسوة العيد" على الأسر المتعففة داخل قطر.', '1503755619_1%20%281%29%20-%20Copy.jpg'],
      ['حفظ النعمة بعيد الخيرية يوزع لحوم 600 خروف على الأسر المتعففة', 'وزع موظفو حفظ النعمة التابع لمركز الشيخ عيد الاجتماعي بعيد الخيرية لحوم 600 خروف عربي على 899 أسرة.', '1503240566_%E3%C8%E4%EC%20%E3%D1%DF%D2%20%C7%E1%D4%ED%CE%20%DA%ED%CF%20%C7%E1%C7%CC%CA%E3%C7%DA%ED%20%282%29%20%281%29.JPG'],
      ['عيد الاجتماعي: 300 ألف ريال لمساعدة وتفريج كربة 30 غارمًا داخل قطر', '', '1502914962_2327e11a-5d73-48cf-a07c-95b029be08e7.jpg'],
      ['عيد الثقافي يختتم فعاليات مركز مواهب الصيفي ويكرم المتميزين', '', '1502801934_%CC%CF%C7%D1%ED%C9%20%CA%E3%ED%E3%20%C7%E1%E3%CC%CF.jpg'],
      ['تدشين جدارية تميم المجد في ختام فعاليات نادي رؤى الصيفي بعيد النسائي', '', '1502748730_1%20%284%29%20%282%29.jpg'],
      ['1.1 مليون ريال مساعدات لعلاج 129 مريضًا داخل قطر', '', '1502663514_1%20%2810%29.jpg'],
      ['عيد الثقافي يقيم برامج وأنشطة لآلاف الطلاب والشباب', '', '1502542775_%E3%D4%D1%E6%DA%20%CD%DD%D9%20%C7%E1%E4%DA%E3%C9%20%282%29%20-%20Copy.jpg'],
      ['أكثر من 2400 أسرة و14700 عامل استفادوا من مشروع حفظ النعمة خلال يوليو', '', '1502542775_%E3%D4%D1%E6%DA%20%CD%DD%D9%20%C7%E1%E4%DA%E3%C9%20%282%29%20-%20Copy.jpg'],
    ].map(([t, d, img]) => ({ image: OLD + img, title: b(t, ''), desc: b(d, '') }))),
  ]),

  page('awards', 'جوائز المؤسسة', 'Awards', [
    cards('جوائز المؤسسة', { eyebrow: b('المركز الإعلامي', 'Media Center'), title: b('جوائز المؤسسة', 'Foundation Awards') }, [
      ['عيد الخيرية تتسلم جائزة العطاء في تنمية المجتمع', 'Eid Charity Receives the Giving Award for Community Development', 'خلال ملتقى عطاء ووفاء الذي نظمه السيد إبراهيم بن عبدالله آل إبراهيم عضو المجلس البلدي المركزي.', 'At the "Ata\'a wa Wafa\'a" forum organized by Mr. Ibrahim bin Abdullah Al Ibrahim, member of the Central Municipal Council.', '1394700296__%D2_%E2___%E8_%E0%20_%E0_%CC_____%D1%20___%E8_%BB%20_%CF___%AB_%E8___%E8_%D1%20%20006.jpg'],
      ['الجائزة الشرفية - دار الإنماء الاجتماعي', 'Honorary Award - Social Development Center', 'منحت دار الإنماء الاجتماعي الجائزة الشرفية للعمل التطوعي لعام 2011.', 'The Social Development Center granted its Honorary Award for Volunteer Work for 2011.', ''],
      ['الجائزة الشرفية - الشارقة', 'Honorary Award - Sharjah', 'تسلم وسام العمل التطوعي من ولي العهد بالشارقة.', 'Received the Volunteer Work Medal from the Crown Prince of Sharjah.', '1474875194_1399213288_thb_1394985512_2.JPG'],
      ['شهادة الأيزو العالمية', 'ISO Certification', 'حصلت المؤسسة على شهادة الأيزو 9001:2008 عام 2011.', 'The Foundation obtained ISO 9001:2008 certification in 2011.', '1474875133_hh.JPG'],
      ['جائزة الدولة التقديرية', 'State Appreciation Award', 'كرّم أمير البلاد الدكتور محمد بن عيد آل ثاني بالجائزة التقديرية.', 'The Emir honored Dr. Mohammed bin Eid Al Thani with the State Appreciation Award.', ''],
      ['جائزة الشهيد فهد الأحمد الدولية للعمل الخيري', 'Martyr Fahad Al-Ahmad International Award for Charitable Work', 'سلّمها الشيخ أحمد الفهد الأحمد الجابر الصباح نائب رئيس مجلس الوزراء، 18 يناير 2010.', 'Presented by Sheikh Ahmad Al-Fahad Al-Ahmad Al-Jaber Al-Sabah, Deputy Prime Minister, 18 January 2010.', ''],
      ['جائزة العمل الإنساني لدول مجلس التعاون الخليجي', 'GCC Humanitarian Work Award', 'قام وزير العدل والشؤون الإسلامية البحريني بتكريم الشيخ الدكتور محمد بن عيد آل ثاني.', 'Bahrain\'s Minister of Justice and Islamic Affairs honored Sheikh Dr. Mohammed bin Eid Al Thani.', '1474878216_yy.jpg'],
      ['جائزة التميز العالمية لركاز 2010 بالبحرين', 'Rakaz International Excellence Award 2010, Bahrain', 'عيد الخيرية تحصل على المركز الأول وجائزة التميز العالمية لركاز 2010.', 'Eid Charity won first place and the Rakaz International Excellence Award 2010.', ''],
    ].map(([t, te, d, de, img]) => ({ image: img ? OLD + img : '', title: b(t, te), desc: b(d, de) }))),
  ]),

  page('annual-harvest', 'الحصاد السنوي', 'Annual Reports', [
    cards('الحصاد السنوي', { eyebrow: b('المركز الإعلامي', 'Media Center'), title: b('الحصاد السنوي', 'Annual Harvest Reports'), columns: '4' }, [
      ['حصاد حفظ النعمة 2021', 'Hifz Al Naama Harvest 2021', '1650974602_969_4.jpg'],
      ['حصاد ضيوف قطر 2021', 'Qatar Guests Harvest 2021', '1650974532_966_1.jpg'],
      ['حصاد عيد الثقافي 2021', 'Eid Cultural Center Harvest 2021', '1650974353_967_3.jpg'],
      ['حصاد عيد النسائي 2021', "Eid Women's Center Harvest 2021", '1650973830_968_2.jpg'],
      ['عشرون عامًا من العطاء', 'Twenty Years of Giving', 'thb_1497356155_presilovepdf-compressed-1.jpg'],
      ['حصاد 2016', 'Harvest 2016', 'thb_1554634827_hasad.jpg'],
      ['الحصاد السنوي 2015', 'Annual Harvest 2015', 'thb_1554634894_hasad.jpg'],
      ['حصاد المؤسسة 2014', 'Harvest 2014', 'thb_1424166560_FINAL%202014%20cover.jpg'],
      ['حصاد المؤسسة عام 2013', 'Harvest 2013', 'thb_1554634923_hasad.jpg'],
      ['حصاد المؤسسة عام 2012', 'Harvest 2012', 'thb_1554634934_hasad.jpg'],
      ['حصاد المؤسسة عام 2011', 'Harvest 2011', 'thb_1554634946_hasad.jpg'],
      ['حصاد المؤسسة عام 2010', 'Harvest 2010', 'thb_1554634956_hasad.jpg'],
      ['حصاد المؤسسة لعام 2008', 'Harvest 2008', 'thb_1554634980_hasad.jpg'],
      ['حصاد المؤسسة لعام 2007', 'Harvest 2007', 'thb_1554634990_hasad.jpg'],
      ['حصاد عام 2006', 'Harvest 2006', 'thb_1554634970_hasad.jpg'],
    ].map(([t, te, img]) => ({ image: OLD + img, title: b(t, te) }))),
  ]),

  page('financial-reports', 'التقارير المالية', 'Financial Reports', [
    cards('التقارير المالية', { eyebrow: b('المركز الإعلامي', 'Media Center'), title: b('التقارير المالية', 'Financial Reports') }, [
      { image: OLD + '1544077791_16.jpg', title: b('ميزانية 2016', 'Budget 2016') },
    ]),
    cta(b('البيانات المالية الختامية', 'Annual Financial Statements'), b('اطلع على البيانات المالية الختامية للمؤسسة لكل عام.', 'View the Foundation\'s annual financial statements.'), b('عرض البيانات المالية', 'View Statements'), '/page/annual-financial-reports', 'navy'),
  ]),

  page('contact', 'تواصل معنا', 'Contact Us', [
    cards('بيانات التواصل', { eyebrow: b('تواصل معنا', 'Contact Us'), title: b('يسعدنا تواصلكم', 'We\'d Love to Hear From You'), columns: '4' }, [
      { title: b('العنوان', 'Address'), desc: b('حزم المرخية - رقم المبنى (2) الشارع (945) المنطقة (33)\nالدوحة - قطر', 'Hazm Al Markhiya - Building 2, Street 945, Zone 33\nDoha - Qatar'),
        link_label: b('افتح الخريطة', 'Open map'), url: 'https://www.google.com/maps?q=25.334411,51.489898' },
      { title: b('الخط الساخن', 'Hotline'), desc: b('+974 4040 5555', '+974 4040 5555'), link_label: b('اتصل الآن', 'Call now'), url: 'tel:+97440405555' },
      { title: b('البريد الإلكتروني', 'Email'), desc: b('mail@eidcharity.net', 'mail@eidcharity.net'), link_label: b('أرسل بريدًا', 'Send an email'), url: 'mailto:mail@eidcharity.net' },
      { title: b('الفاكس', 'Fax'), desc: b('+974 4040 5503', '+974 4040 5503') },
    ]),
  ]),
]

module.exports = pages
