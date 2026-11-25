/* Digital Roots ERPNext Guide — application (routing, rendering, search UI). */
(function () {
  'use strict';
  const G = window.GUIDE;
  // Where the guide's files live: '' when opened from disk or a static host, '/guide/' inside ms_style.
  const BASE = window.GUIDE_BASE || '';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const html = document.documentElement;
  const store = {
    get(k, d) { try { const v = localStorage.getItem('drg.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('drg.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  let lang = html.lang === 'en' ? 'en' : 'ar';

  const I = {
    skip: { ar: 'تخطَّ إلى المحتوى', en: 'Skip to content' },
    brandSub: { ar: 'دليل ERPNext', en: 'ERPNext Guide' },
    searchPh: { ar: 'ابحث في الدليل… (مثال: فاتورة مبيعات)', en: 'Search the guide… (e.g. sales invoice)' },
    download: { ar: 'تحميل Word', en: 'Download Word' },
    backDesk: { ar: 'العودة للنظام', en: 'Back to the system' },
    edition: { ar: 'إصدار', en: 'Edition' },
    kNav: { ar: 'تنقل', en: 'navigate' }, kOpen: { ar: 'فتح', en: 'open' }, kClose: { ar: 'إغلاق', en: 'close' },
    progress: { ar: 'تقدّمك في التعلم', en: 'Your learning progress' },
    gStart: { ar: 'ابدأ هنا', en: 'Start here' }, gMods: { ar: 'الموديولات', en: 'Modules' }, gAdmin: { ar: 'البيانات والصلاحيات', en: 'Data & Access' }, gAI: { ar: 'الذكاء الاصطناعي', en: 'AI' },
    overview: { ar: 'نظرة عامة', en: 'Overview' }, concepts: { ar: 'المفاهيم والمستندات الأساسية', en: 'Key concepts & documents' },
    setup: { ar: 'الإعداد لأول مرة', en: 'First-time setup' }, workflow: { ar: 'دورة العمل (Workflow)', en: 'Workflow' },
    example: { ar: 'مثال تطبيقي خطوة بخطوة', en: 'Hands-on example, step by step' }, deep: { ar: 'شرح متعمق', en: 'Deep dive' },
    reports: { ar: 'أهم التقارير', en: 'Key reports' }, tips: { ar: 'نصائح وأخطاء شائعة', en: 'Tips & common mistakes' },
    faq: { ar: 'أسئلة شائعة', en: 'FAQ' }, gallery: { ar: 'صور من النظام', en: 'Screens from the system' },
    onPage: { ar: 'في هذه الصفحة', en: 'On this page' }, audience: { ar: 'لمن', en: 'For' },
    markDone: { ar: 'علّم كمكتمل', en: 'Mark as learned' }, done: { ar: 'تم التعلم ✓', en: 'Learned ✓' },
    prev: { ar: 'السابق', en: 'Previous' }, next: { ar: 'التالي', en: 'Next' },
    scenario: { ar: 'السيناريو', en: 'Scenario' }, result: { ar: 'النتيجة', en: 'Result' },
    ledger: { ar: 'الأثر المحاسبي / المخزني', en: 'Accounting / stock impact' },
    account: { ar: 'الحساب', en: 'Account' }, debit: { ar: 'مدين', en: 'Debit' }, credit: { ar: 'دائن', en: 'Credit' }, total: { ar: 'الإجمالي', en: 'Total' },
    field: { ar: 'الحقل', en: 'Field' }, value: { ar: 'القيمة', en: 'Value' },
    wfHint: { ar: 'اضغط على أي مستند لعرض شرحه', en: 'Click any document to see its explanation' },
    lgDoc: { ar: 'مستند', en: 'Document' }, lgDec: { ar: 'قرار', en: 'Decision' }, lgAct: { ar: 'إجراء', en: 'Action' }, lgRep: { ar: 'تقرير', en: 'Report' }, lgSE: { ar: 'بداية / نهاية', en: 'Start / End' },
    copied: { ar: 'تم نسخ رابط القسم', en: 'Section link copied' },
    noRes: { ar: 'لا توجد نتائج مطابقة', en: 'No matching results' },
    trySearch: { ar: 'جرّب البحث عن:', en: 'Try searching for:' },
    recent: { ar: 'عمليات بحث سابقة', en: 'Recent searches' },
    all: { ar: 'الكل', en: 'All' },
    results: { ar: 'نتيجة', en: 'results' },
    k_module: { ar: 'موديول', en: 'Module' }, k_concept: { ar: 'مفهوم', en: 'Concept' }, k_setup: { ar: 'إعداد', en: 'Setup' },
    k_workflow: { ar: 'دورة عمل', en: 'Workflow' }, k_step: { ar: 'مثال', en: 'Example' }, k_section: { ar: 'شرح', en: 'Guide' },
    k_report: { ar: 'تقرير', en: 'Report' }, k_tip: { ar: 'نصيحة', en: 'Tip' }, k_faq: { ar: 'سؤال', en: 'FAQ' },
    heroEyebrow: { ar: 'دليل المستخدم الشامل · ERPNext v16', en: 'The complete user guide · ERPNext v16' },
    heroTitle: { ar: 'تعلّم <em>ERPNext</em> خطوة بخطوة<br>من الإعداد حتى التقارير', en: 'Learn <em>ERPNext</em> step by step<br>from setup to reports' },
    heroText: { ar: 'شرح عملي لكل إدارة في الشركة: دورة العمل مرسومة، ومثال تطبيقي كامل على شركة واحدة، وصور حقيقية من النظام — بالعربي والإنجليزي.', en: 'A practical walkthrough of every department: drawn workflows, a complete worked example on one company, and real screens from the system — in Arabic and English.' },
    startNow: { ar: 'ابدأ التعلم', en: 'Start learning' }, searchNow: { ar: 'ابحث في الدليل', en: 'Search the guide' },
    sMods: { ar: 'فصل', en: 'chapters' }, sWf: { ar: 'دورة عمل مرسومة', en: 'drawn workflows' }, sSteps: { ar: 'خطوة تطبيقية', en: 'hands-on steps' }, sShots: { ar: 'صورة من النظام', en: 'system screens' },
    modsTitle: { ar: 'الموديولات', en: 'Modules' }, modsSub: { ar: 'كل موديول فيه: شرح، ودورة عمل، ومثال، وتقارير، وأسئلة شائعة', en: 'Each module has: explanation, workflow, example, reports and FAQ' },
    pathTitle: { ar: 'مسار التعلم المقترح', en: 'Suggested learning path' }, pathSub: { ar: 'لو أنت جديد على النظام، امشِ بالترتيب ده', en: 'New to the system? Follow this order' },
    storyTitle: { ar: 'شركة واحدة… قصة واحدة', en: 'One company, one story' },
    storyText: { ar: 'كل الأمثلة في الدليل مبنية على شركة واحدة افتراضية هي <b>شركة النيل للأثاث</b>: مصنع في العاشر من رمضان، معرض بيع في مدينة نصر، مشروعات تجهيز مكاتب، وورشة تنجيد خارجية. هتشوف نفس الأصناف والعملاء والمخازن من أول المشتريات لحد القوائم المالية.', en: 'Every example in this guide uses one fictional company, <b>Nile Furniture Co.</b>: a factory in 10th of Ramadan City, a showroom in Nasr City, office fit-out projects and an outside upholstery workshop. You will follow the same items, customers and warehouses from purchasing to financial statements.' },
    fSearch: { ar: 'بحث ذكي', en: 'Smart search' }, fSearchT: { ar: 'يفهم العربي بكل أشكاله والإنجليزي، ويبحث باسم المستند أو بالمعنى. اضغط Ctrl + K من أي مكان.', en: 'Understands Arabic in all its forms and English; search by document name or meaning. Press Ctrl + K anywhere.' },
    fWord: { ar: 'نسخة Word', en: 'Word edition' }, fWordT: { ar: 'الدليل كامل كملف Word بالعربي وملف بالإنجليزي، جاهز للطباعة والتوزيع.', en: 'The full guide as an Arabic and an English Word file, ready to print and share.' },
    fWf: { ar: 'دورات عمل تفاعلية', en: 'Interactive workflows' }, fWfT: { ar: 'اضغط على أي مستند في الرسم للانتقال لشرحه مباشرة.', en: 'Click any document in a diagram to jump to its explanation.' },
    fProg: { ar: 'تابع تقدّمك', en: 'Track progress' }, fProgT: { ar: 'علّم الفصول اللي خلصتها، والدليل هيفتكرها على جهازك.', en: 'Mark chapters you have finished; the guide remembers them on your device.' },
    sugs: { ar: ['فاتورة مبيعات', 'رفع الأصناف', 'صلاحيات المخزن', 'جزاءات التأخير', 'إهلاك', 'قائمة المواد BOM', 'إقفال نقطة البيع'], en: ['sales invoice', 'import items', 'warehouse permission', 'late penalty', 'depreciation', 'BOM', 'POS closing'] },
    peekHint: { ar: 'اضغط للتكبير', en: 'Click to enlarge' },
    quiz: { ar: 'اختبر نفسك', en: 'Test yourself' },
    watch: { ar: 'شاهد الفيديو', en: 'Watch the video' },
    watchScreen: { ar: 'فيديو الشاشة', en: 'Screen video' },
    mediaTitle: { ar: 'فيديوهات الموديول', en: 'Module videos' },
    mediaIntro: { ar: 'فيديو قصير لكل شاشة وتقرير: إزاي توصل لها من الديسك، وأهم خاناتها، وإيه اللي بعدها. والدورة المترابطة من أولها لآخرها.', en: 'A short video for every screen and report: how to reach it from the desk, its key fields and what comes next — plus the connected cycle end to end.' },
    library: { ar: 'مكتبة الفيديوهات', en: 'Video library' },
    libraryIntro: { ar: 'كل فيديوهات النظام في مكان واحد: الدورات المترابطة من أولها لآخرها، وجولة في كل شاشة وكل تقرير. اضغط على أي فيديو، وكمّل على اللي بعده.', en: 'Every video of the system in one place: the connected cycles end to end, and a tour of every screen and report. Play any video and carry on to the next.' },
    libSearch: { ar: 'ابحث في الفيديوهات…', en: 'Search the videos…' },
    openLibrary: { ar: 'كل الفيديوهات في المكتبة', en: 'All videos in the library' },
    k_video: { ar: 'فيديو', en: 'Video' },
    vCount: { flow: { ar: 'دورة مترابطة', en: 'connected cycles' }, screen: { ar: 'شاشة', en: 'screens' }, report: { ar: 'تقرير', en: 'reports' } },
    vFlows: { ar: 'الدورات المترابطة', en: 'Connected cycles' }, vScreens: { ar: 'الشاشات', en: 'Screens' }, vReports: { ar: 'التقارير', en: 'Reports' },
    libAllMods: { ar: 'نتائج البحث في كل الموديولات', en: 'Search results across all modules' }, openChapter: { ar: 'افتح الفصل', en: 'Open the chapter' }, watchCycle: { ar: 'شاهد الدورة', en: 'Watch the cycle' },
    vApp: { ar: 'تطبيق الموظف', en: 'Employee app' },
    vFlow: { ar: 'دورة مترابطة', en: 'Connected cycle' }, vScreen: { ar: 'شاشة', en: 'Screen' }, vReport: { ar: 'تقرير', en: 'Report' },
    videoNote: { ar: 'فيديو قصير من النظام الحقيقي، بدون صوت؛ الشرح مكتوب على الشاشة.', en: 'A short silent video of the real system; the explanation is written on screen.' },
    sVideos: { ar: 'فيديو تعليمي', en: 'videos' },
    quizIntro: { ar: 'جاوب على الأسئلة دي عشان تتأكد إنك فهمت الفصل. لو جبت 80% أو أكتر الفصل هيتعلّم إنه مكتمل.', en: 'Answer these questions to check your understanding. Score 80% or more and the chapter is marked as learned.' },
    quizProgress: { ar: 'جاوبت {a} من {n}', en: 'Answered {a} of {n}' },
    quizScore: { ar: 'نتيجتك: {r} من {n}', en: 'Your score: {r} of {n}' },
    quizPass: { ar: 'ممتاز! الفصل اتعلّم كمكتمل.', en: 'Excellent! The chapter is marked as learned.' },
    quizFail: { ar: 'راجع الأجزاء اللي غلطت فيها وجرّب تاني.', en: 'Review the parts you missed and try again.' },
    quizRetry: { ar: 'إعادة الاختبار', en: 'Retake quiz' },
    quizDone: { ar: 'أحسنت! خلّصت الفصل ✓', en: 'Well done! Chapter completed ✓' },
    pathsTitle: { ar: 'اختار وظيفتك', en: 'Choose your role' },
    pathsSub: { ar: 'هنرتّبلك الفصول اللي تخصّك، والتقدّم هيتحسب على مسارك', en: 'We will line up the chapters you need and track progress on your path' },
    yourPath: { ar: 'مسارك', en: 'Your path' }, inPath: { ar: 'ضمن مسار', en: 'Part of path' },
    changePath: { ar: 'تغيير المسار', en: 'Change path' }, choosePath: { ar: 'اختار مسار حسب وظيفتك', en: 'Pick a path for your role' },
    notFound: { ar: 'الصفحة غير موجودة', en: 'Page not found' }, home: { ar: 'الرئيسية', en: 'Home' }
  };
  const t = (o) => (o == null ? '' : typeof o === 'string' ? o : (o[lang] != null ? o[lang] : (o.ar || o.en || '')));
  const i18 = (k) => t(I[k]);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => (n || n === 0) && Number(n) ? Number(n).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 }) : (n === 0 ? '—' : esc(n));

  const ICON = {
    overview: '<path d="M4 5h16M4 10h16M4 15h10M4 20h7"/>',
    concepts: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    setup: '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    workflow: '<rect x="2" y="9" width="6" height="6" rx="1.5"/><rect x="16" y="3" width="6" height="6" rx="1.5"/><rect x="16" y="15" width="6" height="6" rx="1.5"/><path d="M8 12h4m0 0V6h4m-4 6v6h4"/>',
    example: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
    deep: '<path d="M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z"/>',
    reports: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    tips: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
    faq: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    gallery: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    path: '<path d="M9 18l6-6-6-6"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    story: '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/>',
    tip: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
    note: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    warning: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    word: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13l1.5 5 2.5-4 2.5 4L16 13"/>',
    flow: '<circle cx="5" cy="6" r="3"/><circle cx="19" cy="18" r="3"/><path d="M8 6h5a3 3 0 0 1 3 3v6"/>',
    prog: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    camera: '<rect x="2" y="6" width="20" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2.5h5L16 6"/>',
    play: '<circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4z"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
    report: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 17v-3M12 17v-6M16 17v-4"/>'
  };
  const svg = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k] || ''}</svg>`;

  const MODS = G.modules.slice().sort((a, b) => a.order - b.order);
  const byId = Object.fromEntries(MODS.map((m) => [m.id, m]));
  const groupOf = (m) => (m.id === 'roots-ai' ? 'gAI' : m.order <= 1 ? 'gStart' : m.order >= 14 ? 'gAdmin' : 'gMods');

  /* ---------- learning paths (by job role) ---------- */
  const PATHS = G.paths || [];
  let pathId = store.get('path', '');
  const curPath = () => PATHS.find((p) => p.id === pathId) || null;
  const inPath = (id) => { const p = curPath(); return !p || p.modules.includes(id); };
  function setPath(id) { pathId = pathId === id ? '' : id; store.set('path', pathId); renderNav(); renderProgress(); }

  /* ---------- progress ---------- */
  let done = new Set(store.get('done', []));
  function toggleDone(id) { done.has(id) ? done.delete(id) : done.add(id); store.set('done', [...done]); renderNav(); renderProgress(); }
  function renderProgress() {
    const p = curPath();
    const ids = p ? p.modules.filter((x) => byId[x]) : MODS.map((m) => m.id);
    const pct = Math.round((ids.filter((x) => done.has(x)).length / Math.max(1, ids.length)) * 100);
    $('#progressCard').innerHTML = `<div class="pc-top"><span>${p ? i18('yourPath') + ': <b class="pc-path">' + esc(t(p.title)) + '</b>' : i18('progress')}</span><b>${pct}%</b></div><div class="progress-bar"><i style="width:${pct}%"></i></div>${p ? `<a class="pc-change" href="#/paths">${i18('changePath')}</a>` : `<a class="pc-change" href="#/paths">${i18('choosePath')}</a>`}`;
    // keep home cards in sync
    $$('[data-path-card]').forEach((c) => c.classList.toggle('on', c.dataset.pathCard === pathId));
  }

  /* ---------- nav ---------- */
  function renderNav() {
    const r = parseRoute();
    const nVideos = Object.keys(MEDIA.items).length;
    let out = nVideos ? `<a class="nav-item nav-videos${r.mod === '#videos' ? ' active' : ''}" href="#/videos"><span class="nv-ic">${svg('play')}</span><span class="t">${i18('library')}</span><span class="num">${nVideos}</span></a>` : '', g = '';
    for (const m of MODS) {
      const gg = groupOf(m);
      if (gg !== g) { g = gg; out += `<div class="nav-group">${i18(g)}</div>`; }
      const active = r.mod === m.id;
      out += `<a class="nav-item${active ? ' active' : ''}${inPath(m.id) ? '' : ' off-path'}" href="#/m/${m.id}" ${active ? 'aria-current="page"' : ''}>
        ${m.icon ? `<img src="${BASE}assets/img/icons/${m.icon}" alt="" loading="lazy">` : ''}
        <span class="t">${esc(t(m.title))}</span>
        ${done.has(m.id) ? `<span class="done">${svg('check')}</span>` : `<span class="num">${String(m.order).padStart(2, '0')}</span>`}</a>`;
      if (active) out += `<div class="nav-sub" id="navSub">${sectionList(m).map((s) => `<a href="#/m/${m.id}/${s.id}" data-sec="${s.id}">${esc(s.label)}</a>`).join('')}</div>`;
    }
    $('#nav').innerHTML = out;
  }

  function sectionList(m) {
    const s = [];
    if (m.overview) s.push({ id: 'overview', label: i18('overview') });
    if (m.concepts && m.concepts.length) s.push({ id: 'concepts', label: i18('concepts') });
    if (m.setup && m.setup.length) s.push({ id: 'setup', label: i18('setup') });
    if (m.workflow && m.workflow.nodes) s.push({ id: 'workflow', label: i18('workflow') });
    if (m.example) s.push({ id: 'example', label: i18('example') });
    (m.sections || []).forEach((x, i) => s.push({ id: 'deep-' + (i + 1), label: t(x.title) }));
    if (m.reports && m.reports.length) s.push({ id: 'reports', label: i18('reports') });
    if (m.tips && m.tips.length) s.push({ id: 'tips', label: i18('tips') });
    if (m.faq && m.faq.length) s.push({ id: 'faq', label: i18('faq') });
    if (m.quiz && m.quiz.length) s.push({ id: 'quiz', label: i18('quiz') });
    if (Object.values(MEDIA.items).some((v) => v.module === m.id)) s.push({ id: 'media', label: i18('mediaTitle') });
    if ((m.screenshots || []).some((x) => G.shots[x.id] && !((m.example && m.example.steps) || []).some((st) => st.shot === x.id))) s.push({ id: 'gallery', label: i18('gallery') });
    return s;
  }

  /* ---------- routing ---------- */
  function parseRoute() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const p = h.split('/').filter(Boolean);
    if (p[0] === 'm' && p[1]) return { mod: p[1], anchor: p[2] || '' };
    if (p[0] === 'paths') return { mod: '', anchor: 'paths' };
    if (p[0] === 'search') return { mod: '', anchor: '', search: p.slice(1).join('/') };
    if (p[0] === 'videos') return { mod: '#videos', anchor: '', play: p[1] || '' };
    return { mod: '', anchor: '' };
  }
  let lastMod = null;
  function route() {
    const r = parseRoute();
    document.body.classList.remove('nav-open');
    $('#menuBtn').setAttribute('aria-expanded', 'false');
    if (r.mod !== lastMod) {
      lastMod = r.mod;
      if (!r.mod) renderHome(); else if (r.mod === '#videos') renderVideos(r.play); else if (byId[r.mod]) renderModule(byId[r.mod]); else renderNotFound();
      renderNav();
      if (!r.anchor) window.scrollTo(0, 0);
      $('#main').focus({ preventScroll: true });
    } else { renderNav(); if (r.mod === '#videos' && r.play) openPlayer(r.play, JSON.parse($('#main').dataset.playlist || '[]')); }
    if (r.anchor) requestAnimationFrame(() => goAnchor(r.anchor));
    // #/search/<text>: opened from the desk's search ("search the guide for …").
    if (r.search !== undefined) { history.replaceState(null, '', '#/'); requestAnimationFrame(() => openSearch(r.search)); }
    if (r.mod && byId[r.mod] && byId[r.mod].quiz) quizScore(r.mod);
    document.title = (r.mod && byId[r.mod] ? t(byId[r.mod].title) + ' · ' : '') + (lang === 'ar' ? 'دليل ERPNext · Digital Roots' : 'ERPNext Guide · Digital Roots');
    setupScrollSpy();
  }
  function goAnchor(a) {
    const el = document.getElementById(a);
    if (!el) return;
    // open collapsed FAQ items when targeted
    if (el.tagName === 'DETAILS') el.open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (el.tagName !== 'SECTION') { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  }

  /* ---------- shots ---------- */
  function shotSrc(id) { return `${BASE}assets/img/shots/${lang}/${id}.webp`; }
  function shotAlt(id) { return `${BASE}assets/img/shots/${lang === 'ar' ? 'en' : 'ar'}/${id}.webp`; }
  // Screenshot id for a DocType (hover previews), or '' when none was captured.
  function peekId(dt) { const id = dt && G.dtShots && G.dtShots[dt]; return id && G.shots[id] ? id : ''; }
  function shotFigure(m, id) {
    const s = (m.screenshots || []).find((x) => x.id === id);
    if (!s || !G.shots[id]) return '';
    if (s.device === 'phone') {
      return `<figure class="shot phone" data-zoom><div class="phone-frame"><span class="notch"></span>
        <img src="${shotSrc(id)}" data-alt="${shotAlt(id)}" alt="${esc(t(s.caption))}" loading="lazy" width="390" height="844"></div>
        <figcaption>${esc(t(s.caption))}</figcaption></figure>`;
    }
    return `<figure class="shot" data-zoom><div class="bar"><i></i><i></i><i></i><span>erp.example.com${esc(s.route)}</span></div>
      <img src="${shotSrc(id)}" data-alt="${shotAlt(id)}" alt="${esc(t(s.caption))}" loading="lazy" width="1440" height="900">
      <figcaption>${esc(t(s.caption))}</figcaption></figure>`;
  }

  /* ---------- home ---------- */
  function renderHome() {
    const st = G.stats;
    const pathIds = ['getting-started', 'company-setup', 'accounting', 'stock', 'selling', 'buying', 'data-import', 'permissions'].filter((x) => byId[x]);
    $('#main').innerHTML = `<div class="page">
      <section class="hero">
        <svg class="hero-roots" viewBox="0 0 512 512" aria-hidden="true" style="stroke:none"><g fill="#34D399"><rect x="120" y="168" width="54" height="84" rx="27"/><rect x="229" y="112" width="54" height="140" rx="27"/><rect x="338" y="66" width="54" height="186" rx="27"/><rect x="83" y="273" width="346" height="34" rx="17"/></g><g fill="#F4F1EA"><rect x="132" y="320" width="28" height="70" rx="14"/><circle cx="146" cy="392" r="29"/><rect x="241" y="320" width="28" height="100" rx="14"/><circle cx="255" cy="424" r="29"/><rect x="350" y="320" width="28" height="132" rx="14"/><circle cx="364" cy="456" r="29"/></g></svg>
        <span class="eyebrow">${svg('check')} ${i18('heroEyebrow')}</span>
        <h1>${i18('heroTitle')}</h1>
        <p>${i18('heroText')}</p>
        <div class="hero-cta">
          <a class="btn btn-mint" href="#/m/${MODS[0].id}">${i18('startNow')} ${svg('arrow').replace('<svg', '<svg style="transform:' + (lang === 'ar' ? 'scaleX(-1)' : 'none') + '"')}</a>
          <button class="btn btn-ghost" data-open-search>${svg('search')} ${i18('searchNow')}</button>
        </div>
        <div class="hero-stats">
          <div><b>${st.modules}</b><span>${i18('sMods')}</span></div>
          <div><b>${st.workflows}</b><span>${i18('sWf')}</span></div>
          <div><b>${st.steps}</b><span>${i18('sSteps')}</span></div>
          <div><b>${Object.keys(G.shots).length}</b><span>${i18('sShots')}</span></div>
        </div>
      </section>

      <div class="sec-head"><div><h2>${i18('modsTitle')}</h2><p>${i18('modsSub')}</p></div></div>
      <div class="mod-grid">${MODS.map((m) => `<a class="mod-card" href="#/m/${m.id}">
        ${done.has(m.id) ? `<span class="badge-done">✓</span>` : ''}
        <div class="art">${m.icon ? `<img src="${BASE}assets/img/icons/${m.icon}" alt="" loading="lazy">` : ''}</div>
        <div class="body"><span class="n">${String(m.order).padStart(2, '0')}</span><h3>${esc(t(m.title))}</h3><p>${esc(t(m.tagline))}</p>
        <div class="meta"><span>${(m.example && m.example.steps ? m.example.steps.length : 0)} ${i18('sSteps')}</span><span>${(m.faq || []).length} ${i18('faq')}</span></div></div></a>`).join('')}</div>

      ${pathsSection()}
      <div class="sec-head"><div><h2>${i18('pathTitle')}</h2><p>${i18('pathSub')}</p></div></div>
      <div class="path">${pathIds.map((id) => `<a href="#/m/${id}"><span><b>${esc(t(byId[id].title))}</b><small>${esc(t(byId[id].tagline))}</small></span></a>`).join('')}</div>

      <div class="sec-head"><div><h2>${i18('storyTitle')}</h2></div></div>
      <div class="scenario"><div class="ic">${svg('story')}</div><p>${i18('storyText')}</p></div>

      <div class="feature-row" style="margin-top:16px">
        <div class="feature"><div class="ic">${svg('search')}</div><h4>${i18('fSearch')}</h4><p>${i18('fSearchT')}</p></div>
        <div class="feature"><div class="ic">${svg('flow')}</div><h4>${i18('fWf')}</h4><p>${i18('fWfT')}</p></div>
        <div class="feature"><div class="ic">${svg('word')}</div><h4>${i18('fWord')}</h4><p>${i18('fWordT')}</p></div>
        <div class="feature"><div class="ic">${svg('prog')}</div><h4>${i18('fProg')}</h4><p>${i18('fProgT')}</p></div>
      </div>
    </div>`;
  }
  function renderNotFound() {
    $('#main').innerHTML = `<div class="page"><h1>${i18('notFound')}</h1><a href="#/">${i18('home')}</a></div>`;
  }

  /* ---------- module ---------- */
  function h2(id, icon, label) {
    return `<h2>${'<span class="hn">' + svg(icon) + '</span>'}<span>${esc(label)}</span><button class="anchor" data-copy="${id}" aria-label="link">${svg('link')}</button></h2>`;
  }
  function pathChip(p) { return p && t(p) ? `<span class="menu-path">${svg('path').replace('<svg', '<svg style="transform:' + (lang === 'ar' ? 'scaleX(-1)' : 'none') + '"')}${esc(t(p))}</span>` : ''; }
  function callout(type, text) { return `<div class="callout ${type}">${svg(type)}<p>${esc(text)}</p></div>`; }
  function blocks(list, m) {
    const out = [];
    let phones = [];
    const flush = () => { if (phones.length) { out.push(`<div class="phone-row">${phones.join('')}</div>`); phones = []; } };
    (list || []).forEach((b) => {
      if (b.type === 'shot') {
        const sc = m && (m.screenshots || []).find((x) => x.id === b.id);
        const f = m ? shotFigure(m, b.id) : '';
        if (sc && sc.device === 'phone') phones.push(f); else { flush(); out.push(f); }
        return;
      }
      flush();
      out.push(block1(b));
    });
    flush();
    return out.join('');
  }
  function block1(b) {
    return [b].map((b) => {
      switch (b.type) {
        case 'p': return `<p>${esc(t(b.text))}</p>`;
        case 'steps': return `<ol class="num-list">${(b.items || []).map((x) => `<li>${esc(t(x))}</li>`).join('')}</ol>`;
        case 'list': return `<ul class="ul">${(b.items || []).map((x) => `<li>${esc(t(x))}</li>`).join('')}</ul>`;
        case 'table': return `<div class="tbl-wrap"><table class="data"><thead><tr>${(b.head || []).map((x) => `<th>${esc(t(x))}</th>`).join('')}</tr></thead><tbody>${(b.rows || []).map((r) => `<tr>${r.map((c) => `<td>${esc(t(c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
        case 'tip': case 'note': case 'warning': return callout(b.type, t(b.text));
        case 'code': return `<pre class="code">${esc(typeof b.text === 'string' ? b.text : t(b.text))}</pre>`;
        default: return '';
      }
    }).join('');
  }

  function renderModule(m) {
    const seq = curPath() && curPath().modules.includes(m.id) ? curPath().modules.map((x) => byId[x]).filter(Boolean) : MODS;
    const idx = seq.indexOf(m), prev = seq[idx - 1], next = seq[idx + 1];
    const secs = sectionList(m);
    let body = '';
    if (m.overview) body += `<section class="block prose lead" id="overview">${h2('overview', 'overview', i18('overview'))}${(m.overview[lang] || []).map((p) => `<p>${esc(p)}</p>`).join('')}</section>`;
    if (m.concepts && m.concepts.length) body += `<section class="block" id="concepts">${h2('concepts', 'concepts', i18('concepts'))}<div class="concepts">${m.concepts.map((c, i) => `<div class="concept${peekId(c.doctype) ? ' has-peek' : ''}" id="c-${i}" ${c.doctype ? `data-dt="${esc(c.doctype)}" data-peek-title="${esc(t(c.term))}"` : ''}><b>${esc(t(c.term))}</b>${c.doctype ? `<code>${esc(c.doctype)}${peekId(c.doctype) ? svg('camera') : ''}</code>` : ''}<p>${esc(t(c.desc))}</p>${c.doctype && MEDIA.doctypes[c.doctype] ? `<button class="concept-video" data-play="${MEDIA.doctypes[c.doctype]}">${svg('play')} ${i18('watchScreen')}</button>` : ''}</div>`).join('')}</div></section>`;
    if (m.setup && m.setup.length) body += `<section class="block" id="setup">${h2('setup', 'setup', i18('setup'))}<ol class="steps-v">${m.setup.map((s) => `<li><b>${esc(t(s.title))}</b><p>${esc(t(s.desc))}</p>${pathChip(s.path)}</li>`).join('')}</ol></section>`;
    if (m.workflow && m.workflow.nodes) {
      body += `<section class="block" id="workflow">${h2('workflow', 'workflow', t(m.workflow.title) || i18('workflow'))}<div class="wf-card">
        ${m.workflow.desc ? `<p class="wf-desc">${esc(t(m.workflow.desc))}</p>` : ''}
        <div class="wf-scroll">${window.DRWorkflow.render(m.workflow, lang)}</div>
        <div class="wf-legend"><span><i class="l-se"></i>${i18('lgSE')}</span><span><i class="l-doc"></i>${i18('lgDoc')}</span><span><i class="l-dec"></i>${i18('lgDec')}</span><span><i class="l-act"></i>${i18('lgAct')}</span><span><i class="l-rep"></i>${i18('lgRep')}</span><span class="wf-hint">${i18('wfHint')}</span></div>
      </div></section>`;
    }
    if (m.example) {
      const ex = m.example;
      body += `<section class="block" id="example">${h2('example', 'example', i18('example'))}
        <h3 style="margin-top:0">${esc(t(ex.title))}</h3>
        <div class="scenario"><div class="ic">${svg('story')}</div><div><b>${i18('scenario')}</b><p>${esc(t(ex.scenario))}</p></div></div>
        ${videoBlock(m)}
        <div class="ex-steps">${(ex.steps || []).map((s, i) => `<article class="ex-step" id="step-${i + 1}">
          <header${s.doctype && peekId(s.doctype) ? ` class="has-peek" data-dt="${esc(s.doctype)}" data-peek-title="${esc(t(s.title))}"` : ''}><div><h4>${esc(t(s.title))}</h4>${s.doctype ? `<span class="dtag">${esc(s.doctype)}${peekId(s.doctype) ? svg('camera') : ''}</span>` : ''}</div></header>
          <div class="inner">${pathChip(s.path)}${s.desc ? `<p>${esc(t(s.desc))}</p>` : ''}
          ${s.fields && s.fields.length ? `<table class="fields"><tbody>${s.fields.map((f) => `<tr><td>${esc(t(f.label))}</td><td>${esc(t(f.value))}</td></tr>`).join('')}</tbody></table>` : ''}
          ${s.note && t(s.note) ? callout('tip', t(s.note)) : ''}
          ${s.shot ? shotFigure(m, s.shot) : ''}</div></article>`).join('')}</div>
        ${ex.ledger && ex.ledger.length ? ledgerTable(ex.ledger) : ''}
        ${ex.result ? `<div class="result">${svg('check')}<div><b>${i18('result')}</b><p>${esc(t(ex.result))}</p></div></div>` : ''}
      </section>`;
    }
    (m.sections || []).forEach((x, i) => {
      body += `<section class="block" id="deep-${i + 1}">${h2('deep-' + (i + 1), 'deep', t(x.title))}<div class="deep prose">${blocks(x.blocks, m)}</div></section>`;
    });
    if (m.reports && m.reports.length) body += `<section class="block" id="reports">${h2('reports', 'reports', i18('reports'))}<div class="reports">${m.reports.map((r, i) => `<div class="report" id="r-${i}"><div class="ic">${svg('report')}</div><div><b>${esc(t(r.name))}</b><p>${esc(t(r.desc))}</p></div></div>`).join('')}</div></section>`;
    if (m.tips && m.tips.length) body += `<section class="block" id="tips">${h2('tips', 'tips', i18('tips'))}<ul class="tips">${m.tips.map((x, i) => `<li id="t-${i}">${svg('tip')}<span>${esc(t(x))}</span></li>`).join('')}</ul></section>`;
    if (m.faq && m.faq.length) body += `<section class="block faq" id="faq">${h2('faq', 'faq', i18('faq'))}${m.faq.map((f, i) => `<details id="q-${i}"><summary>${esc(t(f.q))}</summary><div>${esc(t(f.a))}</div></details>`).join('')}</section>`;
    if (m.quiz && m.quiz.length) body += quizBlock(m);
    body += mediaSection(m);
    const usedShots = new Set(((m.example && m.example.steps) || []).map((x) => x.shot).filter(Boolean));
    (m.sections || []).forEach((x) => (x.blocks || []).forEach((b) => { if (b.type === 'shot') usedShots.add(b.id); }));
    const gal = (m.screenshots || []).filter((s) => G.shots[s.id] && !usedShots.has(s.id));
    if (gal.length) body += `<section class="block" id="gallery">${h2('gallery', 'gallery', i18('gallery'))}<div class="gallery">${gal.map((s) => shotFigure(m, s.id)).join('')}</div></section>`;

    $('#main').innerHTML = `<div class="page">
      <header class="mod-hero">
        <div>
          <div class="crumbs"><a href="#/">${i18('home')}</a><span>/</span><span>${i18(groupOf(m))}</span></div>
          <h1>${esc(t(m.title))}</h1>
          <p class="tagline">${esc(t(m.tagline))}</p>
          ${m.audience ? `<div class="chips"><span class="chip">${svg('users')}<b>${i18('audience')}:</b>&nbsp;${esc(t(m.audience))}</span></div>` : ''}
          ${curPath() && curPath().modules.includes(m.id) ? `<div class="chips" style="margin-top:8px"><span class="chip">${svg('flow')}${i18('inPath')}: <b>&nbsp;${esc(t(curPath().title))}</b></span></div>` : ''}
          <button class="learn-btn${done.has(m.id) ? ' on' : ''}" data-done="${m.id}">${svg('check')} ${done.has(m.id) ? i18('done') : i18('markDone')}</button>
        </div>
        ${m.icon ? `<div class="art"><img src="${BASE}assets/img/icons/${m.icon}" alt=""></div>` : ''}
      </header>
      <div class="mod-body">
        <div class="content">${body}
          <nav class="pager">${prev ? `<a class="prev" href="#/m/${prev.id}"><small>${i18('prev')}</small><b>${esc(t(prev.title))}</b></a>` : ''}${next ? `<a class="next" href="#/m/${next.id}"><small>${i18('next')}</small><b>${esc(t(next.title))}</b></a>` : ''}</nav>
        </div>
        <aside class="toc"><h5>${i18('onPage')}</h5>${secs.map((s) => `<a href="#/m/${m.id}/${s.id}" data-sec="${s.id}">${esc(s.label)}</a>`).join('')}</aside>
      </div></div>`;
  }
  /* ---------- media server videos (screen/report tours, connected flows) ---------- */
  const MEDIA = G.media || { base: '', items: {}, doctypes: {}, reports: {}, flows: {} };
  const mediaBase = () => window.GUIDE_VIDEO_BASE || MEDIA.base || '';
  function mediaUrl(id, ext) {
    const v = MEDIA.items[id]; if (!v) return '';
    const l = v.langs.includes(lang) ? lang : v.langs[0];
    return `${mediaBase()}${l}/${id}${ext}${v.v && v.v[l] ? '?v=' + v.v[l] : ''}`;
  }
  const fmtDur = (v) => { const s = (v.seconds && (v.seconds[lang] || v.seconds.en || v.seconds.ar)) || 0; return s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : ''; };
  let playlist = [], pIndex = 0;
  // Play a video; the playlist (ids in order) lets the viewer go on to the next one.
  function openPlayer(id, list) {
    const v = MEDIA.items[id]; if (!v) return;
    playlist = list && list.length ? list : modulePlaylist(v.module);
    pIndex = Math.max(0, playlist.indexOf(id));
    if (playlist.indexOf(id) < 0) { playlist = [id]; pIndex = 0; }
    const box = $('#player'), vid = $('#playerVideo');
    $('#playerTitle').textContent = t(v.title);
    box.querySelector('.player-box').classList.toggle('is-portrait', portrait(v));
    $('#playerPos').textContent = playlist.length > 1 ? `${pIndex + 1} / ${playlist.length}` : '';
    $('#playerPrev').disabled = pIndex <= 0;
    $('#playerNext').disabled = pIndex >= playlist.length - 1;
    $('.player-nav').hidden = playlist.length < 2;
    vid.poster = mediaUrl(id, '.webp');
    vid.src = mediaUrl(id, '.webm');
    box.hidden = false; document.body.style.overflow = 'hidden';
    vid.play().catch(() => {});
  }
  const modulePlaylist = (mod) => Object.keys(MEDIA.items).filter((k) => MEDIA.items[k].module === mod);
  const playStep = (dir) => { const n = pIndex + dir; if (n >= 0 && n < playlist.length) openPlayer(playlist[n], playlist); };
  $('#playerVideo').addEventListener('ended', () => playStep(1));
  $('#playerPrev').addEventListener('click', (e) => { e.stopPropagation(); playStep(-1); });
  $('#playerNext').addEventListener('click', (e) => { e.stopPropagation(); playStep(1); });
  function closePlayer() { const vid = $('#playerVideo'); vid.pause(); vid.removeAttribute('src'); vid.load(); $('#player').hidden = true; document.body.style.overflow = ''; }
  // #/videos: every video of the system. One module at a time (tabs), and inside it the
  // connected cycles first, then the screens in workflow order, then the reports.
  let libFilter = '', libQuery = '', libMod = null;
  const vLabel = () => ({ flow: i18('vFlow'), screen: i18('vScreen'), report: i18('vReport') });
  const vGroup = () => ({ flow: i18('vFlows'), screen: i18('vScreens'), report: i18('vReports') });
  // DocType → its name in the interface language (from the screen tours' titles).
  const dtName = (dt) => { for (const v of Object.values(MEDIA.items)) if (v.type === 'screen' && v.doctype === dt) return t(v.title); return dt; };
  function renderVideos(playId) {
    const all = Object.entries(MEDIA.items);
    const q = window.DRSearch.norm(libQuery);
    const match = ([, v]) => (!libFilter || v.type === libFilter) && (!q || window.DRSearch.norm(t(v.title) + ' ' + (v.title.en || '') + ' ' + (v.doctype || '') + ' ' + (v.report || '')).includes(q));
    const mods = MODS.filter((m) => all.some(([, v]) => v.module === m.id));
    if (playId && MEDIA.items[playId]) libMod = MEDIA.items[playId].module;
    if (libMod === null || (libMod && !mods.some((m) => m.id === libMod))) libMod = (mods[0] || {}).id || '';
    const scope = q ? '' : libMod; // a search looks in every module
    const shown = all.filter(match).filter(([, v]) => !scope || v.module === scope);
    const count = (k) => all.filter(([, v]) => !k || v.type === k).length;
    const modCount = (id) => all.filter(([, v]) => v.module === id).length;
    const sections = MODS.map((m) => [m, shown.filter(([, v]) => v.module === m.id)]).filter(([, l]) => l.length);
    const types = ['flow', 'screen', 'report'];
    $('#main').innerHTML = `<div class="page lib">
      <header class="lib-head"><div class="crumbs"><a href="#/">${i18('home')}</a><span>/</span><span>${i18('library')}</span></div>
        <div class="lib-title"><div><h1>${i18('library')}</h1><p class="tagline">${i18('libraryIntro')}</p></div>
          <dl class="lib-stats">${types.map((k) => `<div><dt>${vGroup()[k]}</dt><dd>${count(k)}</dd></div>`).join('')}</dl></div>
        <div class="lib-tools"><label class="lib-search">${svg('search')}<input id="libSearch" type="search" placeholder="${esc(i18('libSearch'))}" value="${esc(libQuery)}"></label>
          <div class="lib-filters" role="group">${['', ...types].map((k) => `<button data-lib="${k}" class="${k === libFilter ? 'on' : ''}">${k ? vGroup()[k] : i18('all')}</button>`).join('')}</div></div>
      </header>
      ${q ? `<p class="lib-searching">${i18('libAllMods')}</p>` : `<nav class="lib-mods" aria-label="${esc(i18('library'))}">${mods.map((m) => `<button data-libmod="${m.id}" class="${m.id === libMod ? 'on' : ''}">${m.icon ? `<img src="${BASE}assets/img/icons/${m.icon}" alt="">` : ''}<span>${esc(t(m.title))}</span><small>${modCount(m.id)}</small></button>`).join('')}</nav>`}
      ${sections.length ? sections.map(([m, list]) => `<section class="lib-mod">
        <header class="lib-mod-head">${m.icon ? `<img src="${BASE}assets/img/icons/${m.icon}" alt="">` : ''}<div><h2>${esc(t(m.title))}</h2><p>${types.map((k) => { const n = list.filter(([, v]) => v.type === k).length; return n ? `${n} ${t(I.vCount[k])}` : ''; }).filter(Boolean).join(' · ')}</p></div>
          <a class="lib-chapter" href="#/m/${m.id}">${i18('openChapter')} ${svg('arrow')}</a></header>
        ${types.map((k) => { const items = list.filter(([, v]) => v.type === k); if (!items.length) return '';
          return `<div class="lib-group lib-${k}"><h3>${vGroup()[k]} <small>${items.length}</small></h3>
            <div class="${k === 'flow' ? 'flow-grid' : 'media-grid'}">${items.map(([id, v], i) => k === 'flow' ? flowCard(id, v) : mediaCard(id, v, vLabel(), 'lib', i + 1)).join('')}</div></div>`; }).join('')}
      </section>`).join('') : `<p class="search-empty">${i18('noRes')}</p>`}
    </div>`;
    const ids = shown.map(([id]) => id);
    $('#main').dataset.playlist = JSON.stringify(ids);
    const inp = $('#libSearch');
    inp.addEventListener('input', () => { libQuery = inp.value; const pos = inp.selectionStart; renderVideos(); const n = $('#libSearch'); n.focus(); n.setSelectionRange(pos, pos); });
    if (playId && MEDIA.items[playId]) openPlayer(playId, ids.includes(playId) ? ids : null);
  }
  // The poster's language decides which side the desk sidebar is on (cropped away in cards).
  const posterLang = (v) => (v.langs.includes(lang) ? lang : v.langs[0]);
  // A phone recording (the employee app) is portrait: shown whole, as a phone on the brand
  // background, with an "Employee app" tag, instead of cropped like the desk's screens.
  const portrait = (v) => v.orientation === 'portrait';
  const mcArt = (id, v) => `<span class="mc-art${portrait(v) ? ' is-portrait' : ''}" data-vl="${posterLang(v)}"><img src="${mediaUrl(id, '.webp')}" alt="" loading="lazy">${portrait(v) ? `<span class="mc-app">${svg('phone')}${i18('vApp')}</span>` : ''}<span class="mc-play">${svg('play')}</span>${fmtDur(v) ? `<span class="mc-dur">${fmtDur(v)}</span>` : ''}</span>`;
  function mediaCard(id, v, label, list, n) {
    return `<button class="media-card media-${v.type}" data-play="${id}" data-list="${list}">
        ${mcArt(id, v)}
        <span class="mc-body">${n ? `<span class="mc-n">${String(n).padStart(2, '0')}</span>` : ''}<span class="mc-text"><b>${esc(t(v.title))}</b><small>${label[v.type]}${v.type !== 'flow' && (v.doctype || v.report) && lang === 'ar' ? ` · <span dir="ltr">${esc(v.doctype || v.report)}</span>` : ''}</small></span></span></button>`;
  }
  function flowCard(id, v) {
    const steps = (v.doctypes || []).map((dt) => `<span>${esc(dtName(dt))}</span>`).join(`<i>${lang === 'ar' ? '←' : '→'}</i>`);
    return `<button class="flow-card" data-play="${id}" data-list="lib">
        ${mcArt(id, v)}
        <span class="fc-body"><small>${i18('vFlow')}</small><b>${esc(t(v.title))}</b>${steps ? `<span class="fc-steps">${steps}</span>` : ''}<span class="fc-cta">${svg('play')} ${i18('watchCycle')}</span></span></button>`;
  }

  function mediaSection(m) {
    const items = Object.entries(MEDIA.items).filter(([, v]) => v.module === m.id);
    if (!items.length) return '';
    const order = { flow: 0, screen: 1, report: 2 };
    items.sort((a, b) => order[a[1].type] - order[b[1].type]);
    const label = { flow: i18('vFlow'), screen: i18('vScreen'), report: i18('vReport') };
    return `<section class="block" id="media">${h2('media', 'play', i18('mediaTitle'))}<p class="media-intro">${i18('mediaIntro')}</p>
      <div class="media-grid">${items.map(([id, v]) => mediaCard(id, v, label, 'module')).join('')}</div>
      <a class="lib-link" href="#/videos">${svg('play')} ${i18('openLibrary')}</a></section>`;
  }

  /* ---------- videos ---------- */
  function videoBlock(m) {
    const vids = (G.videos || []).filter((v) => v.module === m.id);
    if (!vids.length) return '';
    return `<div class="videos">${vids.map((v) => {
      const l = v.langs.includes(lang) ? lang : v.langs[0];
      return `<figure class="video-card" id="video-${v.id}">
        <div class="video-head">${svg('play')}<b>${i18('watch')}</b><span>${esc(t(v.title))}</span></div>
        <video controls preload="none" playsinline poster="${BASE}assets/video/${l}/${v.id}.webp" src="${BASE}assets/video/${l}/${v.id}.webm"></video>
        <figcaption>${i18('videoNote')}</figcaption></figure>`;
    }).join('')}</div>`;
  }

  /* ---------- quiz ---------- */
  const LETTERS = { ar: ['أ', 'ب', 'ج', 'د'], en: ['A', 'B', 'C', 'D'] };
  function quizBlock(m) {
    const saved = store.get('quiz.' + m.id, {});
    return `<section class="block" id="quiz">${h2('quiz', 'faq', i18('quiz'))}<div class="quiz" data-quiz="${m.id}">
      <p class="quiz-intro">${i18('quizIntro')}</p>
      ${m.quiz.map((q, i) => { const a = saved[i]; const answered = a !== undefined; return `<div class="qz${answered ? (a === q.answer ? ' ok' : ' bad') : ''}" data-q="${i}">
        <div class="qz-q"><span class="qz-n">${i + 1}</span><b>${esc(t(q.q))}</b></div>
        <div class="qz-opts">${q.options.map((o, k) => `<button class="qz-opt${answered && k === q.answer ? ' right' : ''}${answered && k === a && a !== q.answer ? ' wrong' : ''}" data-opt="${k}" ${answered ? 'disabled' : ''}><span>${LETTERS[lang][k]}</span>${esc(t(o))}</button>`).join('')}</div>
        <div class="qz-explain"${answered ? '' : ' hidden'}>${svg(answered && a === q.answer ? 'check' : 'note')}<p>${esc(t(q.explain))}</p></div></div>`; }).join('')}
      <div class="qz-score" id="qzScore"></div></div></section>`;
  }
  function quizScore(mid) {
    const m = byId[mid], saved = store.get('quiz.' + mid, {}), n = m.quiz.length;
    const answered = Object.keys(saved).length, right = m.quiz.filter((q, i) => saved[i] === q.answer).length;
    const el = $('#qzScore'); if (!el) return;
    if (answered < n) { el.innerHTML = `<span>${i18('quizProgress').replace('{a}', answered).replace('{n}', n)}</span>`; return; }
    const pass = right / n >= 0.8;
    el.innerHTML = `<div class="qz-result ${pass ? 'pass' : 'fail'}">${svg(pass ? 'check' : 'tip')}<div><b>${i18('quizScore').replace('{r}', right).replace('{n}', n)}</b><p>${pass ? i18('quizPass') : i18('quizFail')}</p></div><button class="learn-btn" data-quiz-reset="${mid}">${i18('quizRetry')}</button></div>`;
    if (pass && !done.has(mid)) { toggleDone(mid); const b = $('[data-done]'); if (b) { b.classList.add('on'); b.innerHTML = svg('check') + ' ' + i18('done'); } toast(i18('quizDone')); }
  }
  document.addEventListener('click', (e) => {
    const o = e.target.closest('.qz-opt'); if (o && !o.disabled) {
      const box = o.closest('[data-quiz]'), mid = box.dataset.quiz, qi = +o.closest('.qz').dataset.q, k = +o.dataset.opt;
      const q = byId[mid].quiz[qi], saved = store.get('quiz.' + mid, {}); saved[qi] = k; store.set('quiz.' + mid, saved);
      const qz = o.closest('.qz'); qz.classList.add(k === q.answer ? 'ok' : 'bad');
      $$('.qz-opt', qz).forEach((b, j) => { b.disabled = true; if (j === q.answer) b.classList.add('right'); if (j === k && k !== q.answer) b.classList.add('wrong'); });
      const ex = $('.qz-explain', qz); ex.hidden = false; ex.querySelector('svg').outerHTML = svg(k === q.answer ? 'check' : 'note');
      quizScore(mid); return;
    }
    const r = e.target.closest('[data-quiz-reset]'); if (r) { store.set('quiz.' + r.dataset.quizReset, {}); const y = window.scrollY; lastMod = null; route(); window.scrollTo(0, y); return; }
    const pc = e.target.closest('[data-path-card]'); if (pc) { setPath(pc.dataset.pathCard); return; }
  });

  function pathsSection() {
    if (!PATHS.length) return '';
    return `<div class="sec-head" id="paths"><div><h2>${i18('pathsTitle')}</h2><p>${i18('pathsSub')}</p></div></div>
      <div class="paths">${PATHS.map((p) => { const ids = p.modules.filter((x) => byId[x]); const d = ids.filter((x) => done.has(x)).length; return `<button class="path-card${p.id === pathId ? ' on' : ''}" data-path-card="${p.id}">
        <span class="ic">${svg(p.icon || 'users')}</span><span class="pt"><b>${esc(t(p.title))}</b><small>${esc(t(p.desc))}</small>
        <span class="pm">${ids.map((x) => `<i class="${done.has(x) ? 'd' : ''}" title="${esc(t(byId[x].title))}"></i>`).join('')}<em>${d}/${ids.length}</em></span></span>
        <span class="sel">${svg('check')}</span></button>`; }).join('')}</div>`;
  }

  function ledgerTable(rows) {
    let d = 0, c = 0;
    rows.forEach((r) => { d += Number(r.debit) || 0; c += Number(r.credit) || 0; });
    return `<h3>${i18('ledger')}</h3><div class="tbl-wrap"><table class="data"><thead><tr><th>${i18('account')}</th><th class="num">${i18('debit')}</th><th class="num">${i18('credit')}</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${esc(t(r.account))}</td><td class="num">${fmt(r.debit)}</td><td class="num">${fmt(r.credit)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>${i18('total')}</td><td class="num">${fmt(d)}</td><td class="num">${fmt(c)}</td></tr></tfoot></table></div>`;
  }

  /* ---------- scrollspy ---------- */
  let spy;
  function setupScrollSpy() {
    if (spy) spy.disconnect();
    const secs = $$('.content > section.block');
    if (!secs.length) return;
    spy = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (!e.isIntersecting) return;
        const id = e.target.id;
        $$('.toc a, #navSub a').forEach((a) => a.classList.toggle('on', a.dataset.sec === id));
      });
    }, { rootMargin: '-80px 0px -70% 0px' });
    secs.forEach((s) => spy.observe(s));
  }

  /* ---------- search ---------- */
  const entries = [];
  (function buildIndex() {
    const T0 = { ar: '', en: '' };
    const join = (arr) => ({ ar: arr.map((x) => (x && x.ar) || '').join(' '), en: arr.map((x) => (x && x.en) || '').join(' ') });
    for (const m of MODS) {
      entries.push({ mod: m.id, anchor: '', kind: 'module', title: m.title, text: join([m.tagline, { ar: (m.overview && m.overview.ar || []).join(' '), en: (m.overview && m.overview.en || []).join(' ') }]) });
      (m.concepts || []).forEach((c, i) => entries.push({ mod: m.id, anchor: 'c-' + i, kind: 'concept', title: c.term, text: c.desc, doctype: c.doctype }));
      (m.setup || []).forEach((s) => entries.push({ mod: m.id, anchor: 'setup', kind: 'setup', title: s.title, text: join([s.desc, s.path]) }));
      if (m.workflow && m.workflow.nodes) entries.push({ mod: m.id, anchor: 'workflow', kind: 'workflow', title: m.workflow.title || I.workflow, text: join([m.workflow.desc || T0].concat(m.workflow.nodes.map((n) => n.label))), doctype: m.workflow.nodes.map((n) => n.doctype || '').join(' ') });
      if (m.example) (m.example.steps || []).forEach((s, i) => entries.push({ mod: m.id, anchor: 'step-' + (i + 1), kind: 'step', title: s.title, text: join([s.desc, s.path, s.note].concat((s.fields || []).map((f) => ({ ar: t2(f.label, 'ar') + ' ' + t2(f.value, 'ar'), en: t2(f.label, 'en') + ' ' + t2(f.value, 'en') })))), doctype: s.doctype }));
      (m.sections || []).forEach((x, i) => entries.push({ mod: m.id, anchor: 'deep-' + (i + 1), kind: 'section', title: x.title, text: join(flattenBlocks(x.blocks)) }));
      (m.reports || []).forEach((r, i) => entries.push({ mod: m.id, anchor: 'r-' + i, kind: 'report', title: r.name, text: r.desc }));
      (m.tips || []).forEach((x, i) => entries.push({ mod: m.id, anchor: 't-' + i, kind: 'tip', title: x, text: T0 }));
      (m.faq || []).forEach((f, i) => entries.push({ mod: m.id, anchor: 'q-' + i, kind: 'faq', title: f.q, text: f.a }));
    }
    for (const [id, v] of Object.entries(MEDIA.items)) entries.push({ mod: v.module, anchor: '', kind: 'video', vid: id, title: v.title, text: { ar: `${v.doctype || v.report || ''}`, en: `${v.doctype || v.report || ''}` }, doctype: v.doctype || v.report || '' });
    function t2(o, l) { return o ? (typeof o === 'string' ? o : o[l] || '') : ''; }
    function flattenBlocks(bs) {
      const out = [];
      (bs || []).forEach((b) => {
        if (b.text && typeof b.text === 'object') out.push(b.text);
        (b.items || []).forEach((x) => out.push(x));
        (b.head || []).forEach((x) => out.push(x));
        (b.rows || []).forEach((r) => r.forEach((x) => out.push(x)));
      });
      return out;
    }
  })();
  const engine = window.DRSearch.build(entries);
  let sel = 0, kindFilter = '', current = [];
  const modal = $('#searchModal'), input = $('#searchInput'), resBox = $('#searchResults');
  function openSearch(q) {
    modal.hidden = false; document.body.style.overflow = 'hidden';
    input.placeholder = i18('searchPh');
    if (typeof q === 'string') input.value = q;
    input.focus(); renderFilters(); runSearch(); input.select();
  }
  function closeSearch() { modal.hidden = true; document.body.style.overflow = ''; }
  function renderFilters() {
    const kinds = ['', 'module', 'concept', 'step', 'section', 'workflow', 'report', 'faq', 'tip'].concat(Object.keys(MEDIA.items).length ? ['video'] : []);
    $('#searchFilters').innerHTML = kinds.map((k) => `<button data-kind="${k}" class="${k === kindFilter ? 'on' : ''}">${k ? i18('k_' + k) : i18('all')}</button>`).join('');
  }
  function runSearch() {
    const q = input.value.trim();
    sel = 0;
    if (!q) {
      const recent = store.get('recent', []);
      resBox.innerHTML = `<div class="search-empty">${recent.length ? `<div>${i18('recent')}</div><div class="sugs">${recent.map((r) => `<button data-q="${esc(r)}">${esc(r)}</button>`).join('')}</div><br>` : ''}<div>${i18('trySearch')}</div><div class="sugs">${I.sugs[lang].map((s) => `<button data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>`;
      current = []; return;
    }
    current = engine.query(q, { kind: kindFilter, limit: 50 });
    if (!current.length) { resBox.innerHTML = `<div class="search-empty">${i18('noRes')}<div class="sugs">${I.sugs[lang].slice(0, 4).map((s) => `<button data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>`; return; }
    // group by module keeping score order of first appearance
    const groups = new Map();
    current.forEach((r, i) => { const k = r.entry.mod; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(i); });
    let out = '';
    for (const [mid, idxs] of groups) {
      const m = byId[mid];
      out += `<div class="sr-group">${m.icon ? `<img src="${BASE}assets/img/icons/${m.icon}" alt="">` : ''}${esc(t(m.title))}</div>`;
      for (const i of idxs) {
        const e = current[i].entry;
        const title = t(e.title), text = t(e.text);
        out += `<a class="sr" role="option" id="sr-${i}" data-i="${i}" href="${e.kind === 'video' ? '#/videos/' + e.vid : `#/m/${e.mod}${e.anchor ? '/' + e.anchor : ''}`}" aria-selected="false">
          <span class="k">${i18('k_' + e.kind)}</span>
          <span class="tx"><b>${window.DRSearch.highlight(title, q)}</b>${text ? `<p>${window.DRSearch.highlight(text, q, 160)}</p>` : ''}</span>
          <span class="go">${svg('arrow')}</span></a>`;
      }
    }
    resBox.innerHTML = out;
    // DOM order differs from score order after grouping: select by DOM order
    current._order = $$('.sr', resBox).map((a) => +a.dataset.i);
    mark();
  }
  function mark() {
    const els = $$('.sr', resBox);
    els.forEach((a, k) => a.setAttribute('aria-selected', k === sel ? 'true' : 'false'));
    if (els[sel]) els[sel].scrollIntoView({ block: 'nearest' });
  }
  function pick(a) {
    const q = input.value.trim();
    if (q) { const r = store.get('recent', []).filter((x) => x !== q); r.unshift(q); store.set('recent', r.slice(0, 6)); }
    closeSearch();
    if (location.hash === a.getAttribute('href')) route(); else location.hash = a.getAttribute('href');
  }
  input.addEventListener('input', runSearch);
  input.addEventListener('keydown', (e) => {
    const els = $$('.sr', resBox);
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, els.length - 1); mark(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); mark(); }
    else if (e.key === 'Enter') { e.preventDefault(); if (els[sel]) pick(els[sel]); }
  });
  resBox.addEventListener('click', (e) => {
    const a = e.target.closest('.sr'); if (a) { e.preventDefault(); pick(a); return; }
    const b = e.target.closest('[data-q]'); if (b) { input.value = b.dataset.q; runSearch(); input.focus(); }
  });
  resBox.addEventListener('mousemove', (e) => { const a = e.target.closest('.sr'); if (!a) return; const k = $$('.sr', resBox).indexOf(a); if (k !== sel) { sel = k; mark(); } });
  $('#searchFilters').addEventListener('click', (e) => { const b = e.target.closest('[data-kind]'); if (!b) return; kindFilter = b.dataset.kind; renderFilters(); runSearch(); input.focus(); });
  modal.addEventListener('click', (e) => { if (e.target === modal) closeSearch(); });
  $('#searchClose').addEventListener('click', closeSearch);
  $('#searchBtn').addEventListener('click', () => openSearch());

  /* ---------- global events ---------- */
  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); modal.hidden ? openSearch() : closeSearch(); }
    else if (e.key === '/' && !typing && modal.hidden) { e.preventDefault(); openSearch(); }
    else if (e.key === 'Escape') { if (!$('#player').hidden) closePlayer(); else if (!modal.hidden) closeSearch(); else if (!$('#lightbox').hidden) $('#lightbox').hidden = true; closeDl(); }
  });
  document.addEventListener('click', (e) => {
    const os = e.target.closest('[data-open-search]'); if (os) { openSearch(); return; }
    const dn = e.target.closest('[data-done]'); if (dn) { toggleDone(dn.dataset.done); const on = done.has(dn.dataset.done); dn.classList.toggle('on', on); dn.innerHTML = svg('check') + ' ' + (on ? i18('done') : i18('markDone')); return; }
    const cp = e.target.closest('[data-copy]');
    if (cp) {
      const url = location.href.split('#')[0] + '#/m/' + parseRoute().mod + '/' + cp.dataset.copy;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).catch(() => {}).finally(() => toast(i18('copied')));
      history.replaceState(null, '', '#/m/' + parseRoute().mod + '/' + cp.dataset.copy);
      return;
    }
    const z = e.target.closest('[data-zoom]');
    if (z) { const img = $('img', z); const lb = $('#lightbox'); $('img', lb).src = img.currentSrc || img.src; $('figcaption', lb).textContent = img.alt; lb.hidden = false; return; }
    if (e.target.closest('#lightbox')) { $('#lightbox').hidden = true; return; }
    const pv = e.target.closest('[data-play]');
    if (pv) { e.stopPropagation(); hidePeek(); const list = pv.dataset.list === 'lib' ? JSON.parse($('#main').dataset.playlist || '[]') : null; openPlayer(pv.dataset.play, list); return; }
    const lf = e.target.closest('[data-lib]'); if (lf) { libFilter = lf.dataset.lib; renderVideos(); return; }
    const lm = e.target.closest('[data-libmod]'); if (lm) { libMod = lm.dataset.libmod; renderVideos(); window.scrollTo({ top: 0 }); lm.scrollIntoView && $(`[data-libmod="${libMod}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center' }); return; }
    if (e.target.closest('#playerClose') || e.target.id === 'player') { closePlayer(); return; }
    const pk = e.target.closest('.concept.has-peek, .ex-step > header.has-peek');
    if (pk) { hidePeek(); openLightbox(peekId(pk.dataset.dt), pk.dataset.peekTitle); return; }
    const node = e.target.closest('.wf-node[data-doctype]'); if (node) { jumpDoctype(node.dataset.doctype); return; }
    if (!e.target.closest('.dl-wrap')) closeDl();
  });
  document.addEventListener('keydown', (e) => { const n = e.target.closest && e.target.closest('.wf-node[data-doctype]'); if (n && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); jumpDoctype(n.dataset.doctype); } });
  function jumpDoctype(dt) {
    const c = $$('.concept[data-dt]').find((x) => x.dataset.dt.toLowerCase() === dt.toLowerCase());
    if (c) { history.replaceState(null, '', '#/m/' + parseRoute().mod + '/' + c.id); goAnchor(c.id); }
    else openSearch(dt);
  }
  // Fallback for screenshots: try the other language, then hide.
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName !== 'IMG') return;
    if (img.dataset.alt && !img.dataset.tried) { img.dataset.tried = '1'; img.src = img.dataset.alt; }
    else { const f = img.closest('figure'); if (f) f.remove(); }
  }, true);

  function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 1800); }
  function closeDl() { $('#dlMenu').hidden = true; $('#dlBtn').setAttribute('aria-expanded', 'false'); }
  $('#dlBtn').addEventListener('click', () => { const m = $('#dlMenu'); m.hidden = !m.hidden; $('#dlBtn').setAttribute('aria-expanded', String(!m.hidden)); });
  $('#menuBtn').addEventListener('click', () => { const o = document.body.classList.toggle('nav-open'); $('#menuBtn').setAttribute('aria-expanded', String(o)); });
  $('#scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));
  $('#themeBtn').addEventListener('click', () => { const d = html.dataset.theme === 'dark' ? 'light' : 'dark'; html.dataset.theme = d; try { localStorage.setItem('drg.theme', d); } catch (e) {} });
  $('#langBtn').addEventListener('click', () => {
    lang = lang === 'ar' ? 'en' : 'ar';
    try { localStorage.setItem('drg.lang', lang); } catch (e) {}
    applyLang(); lastMod = null; const y = window.scrollY; route(); if (!parseRoute().anchor) window.scrollTo(0, y > 0 && parseRoute().mod ? 0 : 0);
  });
  function applyLang() {
    html.lang = lang; html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach((el) => { el.textContent = i18(el.dataset.i18n); });
    $('#ver').textContent = G.meta.version;
    // Served from an ms_style site (/guide): offer the way back to the desk.
    if (/^\/guide(\/|$)/.test(location.pathname)) $('#backDesk').hidden = false;
  }

  /* ---------- hover previews: screenshot of the screen being explained ---------- */
  const peek = document.createElement('div');
  peek.className = 'peek'; peek.hidden = true; peek.setAttribute('role', 'tooltip');
  document.body.appendChild(peek);
  let peekTimer = 0, peekEl = null;
  const PEEK_SEL = '.concept.has-peek, .ex-step > header.has-peek, .wf-node[data-doctype]';
  function openLightbox(id, caption) {
    if (!id) return;
    const lb = $('#lightbox'), img = $('img', lb);
    img.dataset.alt = shotAlt(id); delete img.dataset.tried; img.src = shotSrc(id);
    $('figcaption', lb).textContent = caption || ''; lb.hidden = false;
  }
  function showPeek(el) {
    const dt = el.dataset.dt || el.dataset.doctype, id = peekId(dt);
    if (!id) return;
    const title = el.dataset.peekTitle || ($('title', el) ? $('title', el).textContent.split(' — ')[0] : dt);
    peek.innerHTML = `<div class="peek-bar"><i></i><i></i><i></i><span>${esc(dt)}</span></div>
      <img src="${shotSrc(id)}" data-alt="${shotAlt(id)}" alt="" width="1440" height="900">
      <div class="peek-cap"><b>${esc(title)}</b><small>${svg('search')}${i18('peekHint')}</small></div>`;
    peek.hidden = false;
    const r = el.getBoundingClientRect(), W = Math.min(460, window.innerWidth - 24), H = W * 0.625 + 70;
    let x = r.left + r.width / 2 - W / 2;
    x = Math.max(12, Math.min(x, window.innerWidth - W - 12));
    let y = r.top - H - 12;
    if (y < 72) y = Math.min(r.bottom + 12, window.innerHeight - H - 12);
    peek.style.width = W + 'px'; peek.style.left = x + 'px'; peek.style.top = Math.max(72, y) + 'px';
    requestAnimationFrame(() => peek.classList.add('on'));
  }
  function hidePeek() { clearTimeout(peekTimer); peekEl = null; peek.classList.remove('on'); peek.hidden = true; }
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const el = e.target.closest && e.target.closest(PEEK_SEL);
    if (!el) { if (peekEl) hidePeek(); return; }
    if (el === peekEl) return;
    hidePeek(); peekEl = el;
    peekTimer = setTimeout(() => showPeek(el), 260);
  });
  document.addEventListener('focusin', (e) => { const el = e.target.closest && e.target.closest('.wf-node[data-doctype]'); if (el) { hidePeek(); peekEl = el; showPeek(el); } });
  document.addEventListener('focusout', () => { if (peekEl) hidePeek(); });
  window.addEventListener('scroll', () => { if (peekEl) hidePeek(); }, { passive: true });

  window.addEventListener('hashchange', route);
  applyLang(); renderProgress(); route();
})();
