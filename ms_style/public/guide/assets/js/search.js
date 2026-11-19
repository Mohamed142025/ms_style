/* Digital Roots ERPNext Guide — bilingual client-side search engine.
 * Indexes every piece of the guide (both languages), normalises Arabic
 * (diacritics, alef/ya/ta-marbuta/hamza forms, tatweel), supports prefix and
 * light fuzzy matching, and ranks by where the match was found. */
(function (root) {
  const AR_DIAC = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(AR_DIAC, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  }
  // Arabic definite article and common prefixes: "الفاتوره" ~ "فاتوره", "بالمخزن" ~ "مخزن".
  function stem(t) {
    if (/^[؀-ۿ]/.test(t) && t.length > 4) {
      t = t.replace(/^(وال|بال|كال|فال|لل|ال)/, '');
      if (t.length > 4) t = t.replace(/(ات|ون|ين|ها|يه)$/, '');
    } else if (/^[a-z]/.test(t) && t.length > 4) {
      t = t.replace(/(ies)$/, 'y').replace(/(es|s)$/, '');
    }
    return t;
  }
  const tokens = (s) => norm(s).split(' ').filter(Boolean);

  // Synonyms help users who don't know the system's exact vocabulary.
  const SYN = {
    'فاتوره': ['invoice'], 'invoice': ['فاتوره'], 'عميل': ['customer'], 'customer': ['عميل'],
    'مورد': ['supplier'], 'supplier': ['مورد'], 'صنف': ['item', 'منتج'], 'منتج': ['item', 'صنف'], 'item': ['صنف'],
    'مخزن': ['warehouse', 'stock'], 'warehouse': ['مخزن'], 'stock': ['مخزون'], 'مخزون': ['stock'],
    'قيد': ['journal', 'entry'], 'journal': ['قيد'], 'راتب': ['salary', 'payroll'], 'مرتب': ['salary', 'راتب'], 'salary': ['راتب'],
    'اجازه': ['leave'], 'leave': ['اجازه'], 'حضور': ['attendance', 'checkin'], 'attendance': ['حضور'],
    'صلاحيه': ['permission', 'role'], 'permission': ['صلاحيه'], 'role': ['دور'], 'دور': ['role'],
    'استيراد': ['import', 'رفع'], 'رفع': ['import', 'upload'], 'import': ['استيراد'], 'تنزيل': ['download', 'template', 'export'],
    'نموذج': ['template'], 'template': ['نموذج', 'قالب'], 'قالب': ['template'], 'تصدير': ['export'], 'export': ['تصدير'],
    'اهلاك': ['depreciation'], 'depreciation': ['اهلاك'], 'اصل': ['asset'], 'asset': ['اصل'],
    'تصنيع': ['manufacturing', 'bom', 'work'], 'bom': ['قائمه', 'مكونات'], 'جوده': ['quality'], 'quality': ['جوده'],
    'مشروع': ['project'], 'project': ['مشروع'], 'مهمه': ['task'], 'task': ['مهمه'],
    'كاشير': ['pos'], 'pos': ['نقاط', 'بيع', 'كاشير'], 'جزاء': ['penalty'], 'خصم': ['penalty', 'discount'], 'penalty': ['جزاء'],
    'اضافي': ['overtime'], 'overtime': ['اضافي'], 'اذن': ['permission'], 'استئذان': ['permission'], 'سلفه': ['advance'], 'advance': ['سلفه'],
    'ضريبه': ['tax', 'vat'], 'vat': ['ضريبه', 'مضافه'], 'tax': ['ضريبه'], 'دفع': ['payment'], 'payment': ['دفع'],
    'مستخدم': ['user'], 'user': ['مستخدم'], 'تقرير': ['report'], 'report': ['تقرير'], 'تقييم': ['evaluation', 'appraisal']
  };

  function lev1(a, b) { // true if edit distance <= 1
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, e = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++e > 1) return false;
      if (a.length > b.length) i++; else if (a.length < b.length) j++; else { i++; j++; }
    }
    return e + (a.length - i) + (b.length - j) <= 1;
  }

  const FIELD_W = { title: 10, doctype: 8, text: 2 };

  function build(entries) {
    // entries: {id, mod, anchor, kind, title:{ar,en}, text:{ar,en}, doctype}
    const docs = entries.map((e, i) => {
      const f = {
        title: tokens((e.title.ar || '') + ' ' + (e.title.en || '')).map(stem),
        doctype: tokens(e.doctype || '').map(stem),
        text: tokens((e.text.ar || '') + ' ' + (e.text.en || '')).map(stem)
      };
      return { i, e, f, set: { title: new Set(f.title), doctype: new Set(f.doctype), text: new Set(f.text) } };
    });
    // vocabulary for prefix & fuzzy lookups
    const vocab = new Set();
    docs.forEach((d) => { for (const k in d.set) d.set[k].forEach((t) => vocab.add(t)); });
    const vocabArr = [...vocab];

    function expand(q) {
      const out = new Map(); // term -> weight
      const add = (t, w) => { if (!out.has(t) || out.get(t) < w) out.set(t, w); };
      add(q, 1);
      if (q.length >= 2) for (const v of vocabArr) if (v !== q && v.startsWith(q)) add(v, 0.8);
      if (q.length >= 4) for (const v of vocabArr) if (v !== q && lev1(q, v)) add(v, 0.55);
      (SYN[q] || []).forEach((s) => add(stem(norm(s)), 0.6));
      return out;
    }

    function query(qstr, opts) {
      opts = opts || {};
      const qts = tokens(qstr).map(stem).filter(Boolean);
      if (!qts.length) return [];
      const expansions = qts.map(expand);
      const phrase = norm(qstr);
      const res = [];
      for (const d of docs) {
        if (opts.kind && d.e.kind !== opts.kind) continue;
        let total = 0, ok = true;
        for (const ex of expansions) {
          let best = 0;
          for (const [t, w] of ex) {
            for (const fld in FIELD_W) if (d.set[fld].has(t)) best = Math.max(best, FIELD_W[fld] * w);
            if (best >= FIELD_W.title) break;
          }
          if (!best) { ok = false; break; }
          total += best;
        }
        if (!ok) continue;
        const tn = norm((d.e.title.ar || '') + ' ' + (d.e.title.en || ''));
        if (phrase.length > 2 && tn.includes(phrase)) total += 12;
        total += (KIND_BOOST[d.e.kind] || 0);
        res.push({ score: total, entry: d.e });
      }
      res.sort((a, b) => b.score - a.score);
      return res.slice(0, opts.limit || 60);
    }

    return { query, size: docs.length };
  }
  const KIND_BOOST = { module: 6, concept: 3, workflow: 1, step: 2, section: 2, faq: 1, report: 1, setup: 1, tip: 0 };

  function highlight(text, qstr, maxLen) {
    text = String(text || '');
    const qts = tokens(qstr).map(stem).filter((t) => t.length > 1);
    // locate first match to centre the snippet
    const nt = [...text];
    let snippet = text;
    if (maxLen && text.length > maxLen) {
      let pos = -1;
      const low = norm(text);
      for (const q of qts) { const p = low.indexOf(q); if (p >= 0 && (pos < 0 || p < pos)) pos = p; }
      const start = Math.max(0, Math.min(pos - 40, text.length - maxLen));
      snippet = (start > 0 ? '…' : '') + nt.slice(Math.max(0, start), start + maxLen).join('') + (start + maxLen < text.length ? '…' : '');
    }
    const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    if (!qts.length) return esc(snippet);
    // match word by word using normalised comparison
    return snippet.split(/(\s+)/).map((w) => {
      if (/^\s+$/.test(w)) return w;
      const n = stem(norm(w));
      const hit = n && qts.some((q) => n.startsWith(q) || (q.length > 3 && n.includes(q)));
      return hit ? '<mark>' + esc(w) + '</mark>' : esc(w);
    }).join('');
  }

  root.DRSearch = { build, highlight, norm };
})(window);
