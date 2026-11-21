// "Explain this screen": a book button on forms, lists, reports and workspaces that opens the
// user guide (/guide, served to system users by ms_style/guide.py) where it explains the
// current DocType or module, plus guide entries in the desk's search bar.
// The index (DocType -> chapters/anchors, workspace -> chapter) is built by the guide project
// (help-index.json); users who cannot read the guide get no index, so no button either.
(() => {
  const GUIDE = "/guide";
  const BOOK =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z"/></svg>';
  let index = null;
  let loading = null;

  const style = document.createElement("style");
  style.textContent = `
    .ms-guide-menu { min-width: 240px; max-width: 340px; padding: 6px; border-radius: 12px; }
    .ms-guide-menu .ms-guide-head { padding: 4px 10px 6px; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .4px; }
    .ms-guide-menu .dropdown-item { display: flex; flex-direction: column; gap: 1px; padding: 7px 10px; border-radius: 8px; white-space: normal; }
    .ms-guide-menu .ms-guide-chapter { font-weight: 600; font-size: 13px; }
    .ms-guide-menu .ms-guide-term { font-size: 12px; color: var(--text-muted); }
    .ms-guide-help svg { display: block; }
    .ms-guide-video .ms-guide-chapter { display: inline-flex; align-items: center; gap: 4px; color: var(--primary, #197B57); }
    .ms-guide-player { position: fixed; inset: 0; z-index: 1070; background: rgba(8, 23, 19, .86); display: grid; place-items: center; padding: 20px; }
    .ms-guide-player-box { width: min(1100px, 100%); background: var(--card-bg, #fff); border-radius: 14px; overflow: hidden; box-shadow: 0 30px 80px -20px rgba(0,0,0,.6); }
    .ms-guide-player-box header { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #0E3B2E; color: #F4F1EA; }
    .ms-guide-player-box header svg { color: #34D399; display: block; }
    .ms-guide-player-box header b { flex: 1; }
    .ms-guide-player-close { color: #F4F1EA !important; background: rgba(244,241,234,.1) !important; }
    .ms-guide-player-box video { display: block; width: 100%; aspect-ratio: 16/10; background: #0B1F19; }`;
  document.head.appendChild(style);

  const t = (message, args = []) =>
    typeof window.__ === "function" ? window.__(message, args, "ms_style") : message;
  const lang = () => (String(window.frappe?.boot?.lang || "en").startsWith("ar") ? "ar" : "en");
  const text = (value) => (value && typeof value === "object" ? value[lang()] || value.en || value.ar : value || "");
  const esc = (value) => frappe.utils.escape_html(String(value ?? ""));

  function load() {
    if (index) return Promise.resolve(index);
    if (window.frappe?.session?.user === "Guest") return Promise.resolve(null);
    loading =
      loading ||
      fetch(`${GUIDE}/assets/data/help-index.json`, { credentials: "same-origin" })
        .then((r) => (r.ok && /json/.test(r.headers.get("content-type") || "") ? r.json() : null))
        .then((data) => (index = data))
        .catch(() => null);
    return loading;
  }

  const urlFor = (entry) => `${GUIDE}?lang=${lang()}#/m/${entry.m}${entry.a ? "/" + entry.a : ""}`;
  const openGuide = (url) => window.open(url, "dr-user-guide");
  const PLAY =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4z"/></svg>';

  // Videos live on a media server (the guide's videos.base, or this site's guide_video_base).
  function videoUrl(id, ext) {
    const v = index?.videos?.items?.[id];
    if (!v) return "";
    const base = window.frappe?.boot?.guide_video_base || index.videos.base || "/assets/guide-media/";
    const l = v.langs.includes(lang()) ? lang() : v.langs[0];
    return `${base.replace(/\/?$/, "/")}${l}/${id}${ext}`;
  }
  // Video entries for a DocType or a report: its own tour, then the connected flows it is part of.
  function videoEntries({ doctype, report }) {
    const vids = index?.videos;
    if (!vids) return [];
    const ids = [];
    if (doctype && vids.doctypes[doctype]) ids.push(vids.doctypes[doctype]);
    if (report && vids.reports[report]) ids.push(vids.reports[report]);
    if (doctype) ids.push(...(vids.flows[doctype] || []));
    return [...new Set(ids)].map((id) => ({ video: id, t: vids.items[id].title, type: vids.items[id].type }));
  }
  function openPlayer(id) {
    closeMenu();
    const v = index.videos.items[id];
    $(".ms-guide-player").remove();
    const player = $(`<div class="ms-guide-player" role="dialog" aria-modal="true">
        <div class="ms-guide-player-box"><header><span>${PLAY}</span><b>${esc(text(v.title))}</b>
        <button type="button" class="btn btn-sm ms-guide-player-close" aria-label="${esc(__("Close"))}">✕</button></header>
        <video controls autoplay playsinline preload="metadata" poster="${videoUrl(id, ".webp")}" src="${videoUrl(id, ".webm")}"></video></div></div>`).appendTo(document.body);
    const close = () => { player.find("video")[0]?.pause(); player.remove(); $(document).off("keydown.msguideplayer"); };
    player.on("click", (e) => { if (e.target === player[0] || $(e.target).closest(".ms-guide-player-close").length) close(); });
    $(document).on("keydown.msguideplayer", (e) => e.key === "Escape" && close());
  }

  function closeMenu() {
    $(".ms-guide-menu").remove();
    $(document).off("mousedown.msguide keydown.msguide");
  }

  function showMenu(button, entries) {
    closeMenu();
    const videos = entries.filter((e) => e.video);
    const guide = entries.filter((e) => !e.video);
    const kind = { screen: t("Screen video"), report: t("Report video"), flow: t("The connected cycle") };
    const videoItems = videos
      .map(
        (entry) => `<a class="dropdown-item ms-guide-video" href="#" data-video="${esc(entry.video)}">
          <span class="ms-guide-chapter">${PLAY}&nbsp;${esc(kind[entry.type] || t("Video"))}</span>
          <span class="ms-guide-term">${esc(text(entry.t))}</span></a>`
      )
      .join("");
    const items = guide
      .map(
        (entry, i) => `<a class="dropdown-item" href="${urlFor(entry)}" target="dr-user-guide" data-i="${i}">
          <span class="ms-guide-chapter">${esc(text(index.modules[entry.m]))}</span>
          <span class="ms-guide-term">${esc(text(entry.t))}</span></a>`
      )
      .join("");
    const menu = $(`<div class="dropdown-menu show ms-guide-menu" role="menu">
        ${videoItems ? `<div class="ms-guide-head">${esc(t("Watch"))}</div>${videoItems}` : ""}
        ${items ? `<div class="ms-guide-head">${esc(t("Explained in the user guide"))}</div>${items}` : ""}</div>`).appendTo(document.body);
    menu.on("click", ".ms-guide-video", (e) => { e.preventDefault(); openPlayer($(e.currentTarget).data("video")); });
    const r = button[0].getBoundingClientRect();
    const width = menu.outerWidth();
    const rtl = document.documentElement.dir === "rtl";
    let left = rtl ? r.left : r.right - width;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    menu.css({ position: "fixed", top: r.bottom + 6, left, zIndex: 1060 });
    menu.on("click", "a", () => setTimeout(closeMenu, 0));
    $(document).on("mousedown.msguide", (e) => {
      if (!$(e.target).closest(".ms-guide-menu, .ms-guide-help").length) closeMenu();
    });
    $(document).on("keydown.msguide", (e) => e.key === "Escape" && closeMenu());
  }

  function addButton(page, entries) {
    const group = page?.icon_group;
    if (!group || !group.length) return;
    group.find(".ms-guide-help").remove();
    if (!entries || !entries.length) return;
    const button = $(
      `<button class="text-muted btn btn-default icon-btn ms-guide-help" type="button" aria-label="${esc(t("Explain this screen"))}">${BOOK}</button>`
    );
    button.attr("title", t("Explain this screen"));
    button.on("click", () => {
      if (button.tooltip) button.tooltip("hide");
      entries.length === 1 && !entries[0].video ? openGuide(urlFor(entries[0])) : showMenu(button, entries);
    });
    button.prependTo(group.removeClass("hide"));
    if (button.tooltip) button.tooltip({ delay: { show: 400, hide: 100 }, trigger: "hover" });
  }

  // Forms.
  $(document).on("form-refresh", (e, frm) => {
    if (!frm?.page || !frm.doctype) return;
    load().then((ix) => ix && addButton(frm.page, [...videoEntries({ doctype: frm.doctype }), ...(ix.doctypes[frm.doctype] || [])]));
  });

  // Lists, reports, trees and workspaces: after each route change, once the view is there.
  function onRoute() {
    closeMenu();
    load().then((ix) => {
      if (!ix) return;
      const route = frappe.get_route() || [];
      let tries = 0;
      const attempt = () => {
        const view = route[0];
        if (view === "List" || view === "Tree") {
          const list = window.cur_list || window.cur_tree;
          if (list && list.doctype === route[1] && list.page) return addButton(list.page, [...videoEntries({ doctype: route[1] }), ...(ix.doctypes[route[1]] || [])]);
        } else if (view === "query-report" && route[1]) {
          const page = window.frappe.query_report?.page;
          if (page?.icon_group && window.frappe.query_report.report_name === route[1]) return addButton(page, videoEntries({ report: route[1] }));
        } else if (view === "Workspaces" && route[1]) {
          const slug = String(route[1]).toLowerCase().replace(/\s+/g, "-");
          const module = ix.workspaces[slug];
          const page = window.cur_page?.page?.page;
          if (page?.icon_group) return addButton(page, module ? [{ m: module, a: "", t: ix.modules[module] }] : null);
        } else {
          return;
        }
        if (++tries < 20) setTimeout(attempt, 150);
      };
      attempt();
    });
  }
  const watchRoutes = () => {
    if (!frappe.router?.on) return false;
    frappe.router.on("change", onRoute);
    return true;
  };
  if (!watchRoutes()) document.addEventListener("DOMContentLoaded", watchRoutes, { once: true });

  // Search bar: "Explained in the guide: …" for matching DocTypes, and "Search the guide for …".
  function guideOptions(txt) {
    if (!index || !txt || txt.length < 2 || txt.charAt(0) === "#") return [];
    const q = txt.trim().toLowerCase();
    const found = [];
    for (const [doctype, entries] of Object.entries(index.doctypes)) {
      const first = entries[0];
      const names = [doctype, __(doctype), text(first.t)].map((s) => String(s).toLowerCase());
      if (names.some((s) => s.includes(q))) found.push([doctype, first]);
      if (found.length >= 3) break;
    }
    const options = found.map(([doctype, entry], i) => ({
      label: `<span class="flex justify-between text-medium"><span class="ellipsis">${BOOK}&nbsp; ${esc(
        t("Guide: {0}", [__(doctype)])
      )}</span><span class="text-muted small">${esc(text(index.modules[entry.m]))}</span></span>`,
      value: t("Guide: {0}", [__(doctype)]),
      match: txt,
      index: 60 + i,
      onclick: () => openGuide(urlFor(entry)),
    }));
    options.push({
      label: `<span class="flex justify-between text-medium"><span class="ellipsis">${BOOK}&nbsp; ${t(
        "Search the user guide for {0}",
        [frappe.utils.xss_sanitise(txt).bold()]
      )}</span></span>`,
      value: t("Search the user guide for {0}", [frappe.utils.xss_sanitise(txt)]),
      match: txt,
      index: 95,
      onclick: () => openGuide(`${GUIDE}?lang=${lang()}#/search/${encodeURIComponent(txt)}`),
    });
    return options;
  }
  function patchSearch() {
    const proto = frappe.search?.AwesomeBar?.prototype;
    if (!proto || proto.msGuide) return Boolean(proto);
    const original = proto.add_defaults;
    proto.add_defaults = function (txt) {
      original.call(this, txt);
      this.options.push(...guideOptions(txt));
    };
    proto.msGuide = true;
    load();
    return true;
  }
  if (!patchSearch()) document.addEventListener("DOMContentLoaded", patchSearch, { once: true });
})();
