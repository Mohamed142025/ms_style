// Document forms on phones (up to 767px) as an app screen: a hero with a back arrow, the
// document's title and status, the doctype, the menu and the workflow actions; the
// connections as a grid of cards; a sticky bar at the bottom with the primary action; and
// child tables as a list of cards whose rows open as a sheet. Frappe's own form stays as
// it is: the hero's buttons press Frappe's buttons, the sticky bar presses the page's
// primary action, and the row sheet is Frappe's own row editor restyled.
import { getDocGlyph } from "./brand_icons";

const PHONE = 767;

function t(message, args) {
  return typeof window.__ === "function" ? window.__(message, args, "ms_style") : message;
}

function isPhone() {
  return window.innerWidth <= PHONE;
}

function pageHead(frm) {
  return frm.page?.wrapper?.[0]?.querySelector(".page-head");
}

// The page head is hidden on phones, so a button's own classes say whether it is shown.
function shown(element) {
  if (!element) return false;
  if (element.classList.contains("hide") || element.classList.contains("hidden")) return false;
  if (element.style.display === "none") return false;
  const group = element.closest(".actions-btn-group, .standard-actions, .page-actions");
  return !(group && (group.classList.contains("hide") || group.style.display === "none"));
}

// Hero ------------------------------------------------------------------------------------
function heroFor(frm) {
  const wrapper = frm.page?.wrapper?.[0];
  if (!wrapper) return null;
  let hero = wrapper.querySelector(":scope > .ms-form-hero");
  if (hero) return hero;
  hero = document.createElement("header");
  hero.className = "ms-form-hero";
  hero.innerHTML = `
    <div class="ms-form-hero-row">
      <button type="button" class="ms-hero-btn" data-act="back" aria-label="${__("Back")}"><svg class="icon icon-sm"><use href="#icon-arrow-left"></use></svg></button>
      <div class="ms-form-hero-text">
        <h1 class="ms-form-hero-title"></h1>
        <div class="ms-form-hero-meta"><span class="ms-form-hero-status"></span><span class="ms-form-hero-doctype"></span></div>
      </div>
      <div class="ms-form-hero-tools">
        <button type="button" class="ms-hero-btn" data-act="sidebar" aria-label="${__("Toggle Sidebar")}" hidden><svg class="icon icon-sm"><use href="#icon-info"></use></svg></button>
        <button type="button" class="ms-hero-btn" data-act="actions" aria-label="${__("Actions")}" hidden><svg class="icon icon-sm"><use href="#icon-select"></use></svg></button>
        <button type="button" class="ms-hero-btn" data-act="menu" aria-label="${__("Menu")}"><svg class="icon icon-sm"><use href="#icon-dot-horizontal"></use></svg></button>
      </div>
    </div>`;
  hero.addEventListener("click", (event) => {
    const button = event.target.closest("[data-act]");
    if (!button) return;
    const head = pageHead(frm);
    if (button.dataset.act === "back") (window.history.length > 1 ? window.history.back() : frappe.set_route("List", frm.doctype));
    else if (button.dataset.act === "menu") openActionSheet(frm, head?.querySelector(".menu-btn-group .dropdown-menu"), __("Menu"));
    else if (button.dataset.act === "sidebar") frm.toolbar?.setup_sidebar_toggle?.(frm.sidebar.sidebar.parent());
    else if (button.dataset.act === "actions") openActionSheet(frm, head?.querySelector(".actions-btn-group .dropdown-menu"), __("Actions"));
  });
  wrapper.insertBefore(hero, wrapper.firstChild);
  return hero;
}

function renderHero(frm) {
  const hero = heroFor(frm);
  if (!hero) return;
  const head = pageHead(frm);
  const title = (frm.meta.title_field && frm.doc[frm.meta.title_field]) || frm.docname;
  hero.querySelector(".ms-form-hero-title").textContent = frm.is_new() ? __("New {0}", [__(frm.meta.name)]) : title;
  // The pill's text, else its title; Bootstrap's tooltip keeps the previous document's
  // title in data-original-title, so that comes last.
  const pillText = (el) => (el.textContent.trim() || el.getAttribute("title") || el.getAttribute("data-original-title") || "").trim();
  // Only a pill Frappe shows for this document: the page head is shared by every document
  // of the doctype, and a hidden pill can still hold the previous document's status.
  const indicator = [...(head?.querySelectorAll(".indicator-pill") || [])].find((el) => pillText(el) && shown(el) && !el.closest(".hide, .hidden"));
  const status = hero.querySelector(".ms-form-hero-status");
  if (frm.is_new() && !indicator) {
    status.textContent = __("Not Saved");
    status.className = "ms-form-hero-status orange";
    status.hidden = false;
  } else if (indicator) {
    status.textContent = pillText(indicator);
    status.className = `ms-form-hero-status ${[...indicator.classList].find((c) => ["red", "orange", "green", "blue", "gray", "grey", "yellow", "purple", "cyan", "pink", "darkgrey"].includes(c)) || "gray"}`;
    status.hidden = false;
  } else status.hidden = true;
  hero.querySelector(".ms-form-hero-doctype").textContent = __(frm.meta.name);
  const actions = head?.querySelector(".actions-btn-group");
  hero.querySelector('[data-act="actions"]').hidden = !shown(actions);
  // The document sidebar (assign, attach, tags, share), as a sheet (mobile_form.scss).
  hero.querySelector('[data-act="sidebar"]').hidden = !(frm.sidebar?.sidebar && !frm.page.hide_sidebar && frappe.boot.desk_settings?.form_sidebar && !frm.is_new());
  // The tabs sit under the hero; their list is moved up once.
  const tabs = frm.page?.wrapper?.[0]?.querySelector(".form-tabs-list");
  if (tabs && !hero.contains(tabs) && tabs.querySelectorAll(".nav-item").length > 1) {
    hero.appendChild(tabs);
    tabs.addEventListener("click", (event) => {
      const link = event.target.closest(".nav-link");
      if (link) window.setTimeout(() => link.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }), 30);
    });
  }
}

// A dropdown of the page head, as a sheet of large rows; a row presses the original item.
function openActionSheet(frm, menu, title) {
  if (!menu || document.querySelector(".ms-action-sheet")) return;
  const items = [...menu.querySelectorAll("li")].filter((li) => !li.classList.contains("hide") && li.style.display !== "none");
  const rows = items.map((li, index) => {
    if (li.classList.contains("dropdown-divider")) return `<div class="ms-action-divider"></div>`;
    const link = li.querySelector("a, button");
    if (!link) return "";
    const label = (link.querySelector(".menu-item-label")?.textContent || link.textContent).replace(/\s+/g, " ").trim();
    return `<button type="button" class="ms-action-row" data-index="${index}"><span>${frappe.utils.escape_html(label)}</span></button>`;
  }).join("");
  const overlay = document.createElement("div");
  overlay.className = "ms-action-sheet";
  overlay.innerHTML = `<div class="ms-sheet" role="dialog" aria-modal="true"><div class="ms-sheet-handle"></div><div class="ms-sheet-head"><h2>${title}</h2><button type="button" class="ms-sheet-close" aria-label="${__("Close")}"><svg class="icon icon-sm"><use href="#icon-close"></use></svg></button></div><div class="ms-sheet-body ms-action-list">${rows}</div></div>`;
  document.body.appendChild(overlay);
  document.body.classList.add("ms-sheet-open");
  const close = () => { overlay.remove(); document.body.classList.remove("ms-sheet-open"); };
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest(".ms-sheet-close")) return close();
    const row = event.target.closest(".ms-action-row");
    if (!row) return;
    close();
    items[+row.dataset.index]?.querySelector("a, button")?.click();
  });
}

// Sticky primary action --------------------------------------------------------------------
function renderActionBar(frm) {
  const wrapper = frm.page?.wrapper?.[0];
  const head = pageHead(frm);
  if (!wrapper || !head) return;
  let bar = wrapper.querySelector(":scope > .ms-form-bar");
  const primary = head.querySelector(".standard-actions .primary-action");
  const visible = shown(primary) && primary.textContent.trim();
  if (!visible) { bar?.remove(); document.body.classList.remove("ms-form-bar-active"); return; }
  if (!bar) {
    bar = document.createElement("div");
    bar.className = "ms-form-bar";
    bar.innerHTML = `<button type="button" class="ms-form-bar-primary"><svg class="icon icon-sm" aria-hidden="true"><use href="#icon-check"></use></svg><span></span></button>`;
    bar.querySelector("button").addEventListener("click", () => head.querySelector(".standard-actions .primary-action")?.click());
    wrapper.appendChild(bar);
  }
  bar.querySelector("span").textContent = primary.textContent.trim();
  document.body.classList.add("ms-form-bar-active");
}

// Connections grid ---------------------------------------------------------------------------
function renderLinks(frm) {
  const links = frm.dashboard?.links_area?.[0] || frm.page?.wrapper?.[0]?.querySelector(".form-links");
  if (!links) return;
  const groups = [...links.querySelectorAll(".form-documents .col-md-4")];
  if (!groups.length) return;
  let grid = links.querySelector(":scope > .ms-links-grid");
  if (!grid) {
    grid = document.createElement("div");
    grid.className = "ms-links-grid";
    links.querySelector(".section-body")?.before(grid);
  }
  const cards = [];
  groups.forEach((group) => {
    const title = group.querySelector(".form-link-title")?.textContent.trim() || "";
    group.querySelectorAll(".document-link").forEach((link) => {
      const doctype = link.dataset.doctype;
      const label = link.querySelector(".badge-link")?.textContent.trim() || doctype;
      const count = link.querySelector(".count:not(.hidden)")?.textContent.trim() || "";
      const open = link.querySelector(".open-notification:not(.hidden)")?.textContent.trim() || "";
      const canNew = !!link.querySelector(".btn-new");
      cards.push({ doctype, label, title, count, open, canNew });
    });
  });
  grid.innerHTML = cards.map((c) => `
    <div class="ms-link-card" data-doctype="${frappe.utils.escape_html(c.doctype)}">
      <div class="ms-link-card-top"><span class="ms-card-icon"><svg class="icon icon-sm"><use href="#icon-${getDocGlyph([c.doctype], "DocType")}"></use></svg></span>${c.canNew ? `<button type="button" class="ms-link-new" aria-label="${__("New {0}", [c.label])}"><svg class="icon icon-sm"><use href="#icon-add"></use></svg></button>` : ""}</div>
      <div class="ms-link-card-group">${frappe.utils.escape_html(c.title)}</div>
      <div class="ms-link-card-name">${frappe.utils.escape_html(c.label)}${c.count ? `<span class="ms-link-count">${frappe.utils.escape_html(c.count)}</span>` : ""}${c.open ? `<span class="ms-link-open">${frappe.utils.escape_html(c.open)}</span>` : ""}</div>
    </div>`).join("");
  grid.onclick = (event) => {
    const card = event.target.closest(".ms-link-card");
    if (!card) return;
    const original = links.querySelector(`.document-link[data-doctype="${CSS.escape(card.dataset.doctype)}"]`);
    if (event.target.closest(".ms-link-new")) original?.querySelector(".btn-new")?.click();
    else original?.querySelector(".badge-link")?.click();
  };
  const hint = links.querySelector(":scope > .ms-links-hint") || Object.assign(document.createElement("div"), { className: "ms-links-hint" });
  hint.textContent = t("Tap + to create");
  grid.before(hint);
}

// Section titles ---------------------------------------------------------------------------
// Sections without a head get one from the tab or the doctype, so every card has a title.
function renderSections(frm) {
  const layout = frm.layout?.wrapper?.[0];
  if (!layout) return;
  layout.querySelectorAll(".form-section.card-section").forEach((section) => {
    if (section.querySelector(":scope > .section-head") || section.querySelector(":scope > .ms-section-title")) return;
    const controls = [...section.querySelectorAll(".frappe-control:not(.hide-control)")].filter((c) => !c.closest(".form-grid"));
    // A section that is only a child table is titled by the table itself.
    if (!controls.length || controls.every((c) => c.dataset.fieldtype === "Table")) return;
    if (!(section.dataset.fieldname || "").startsWith("__")) return;
    const pane = section.closest(".tab-pane");
    const tab = pane && frm.page.wrapper[0].querySelector(`.form-tabs .nav-link[aria-controls="${CSS.escape(pane.id)}"]`);
    const label = tab ? tab.textContent.trim().replace(/\s*\d+$/, "") : t("{0} details", [__(frm.meta.name)]);
    if (!label || label === __("Details")) { section.prepend(Object.assign(document.createElement("div"), { className: "ms-section-title", textContent: t("{0} details", [__(frm.meta.name)]) })); return; }
    const head = document.createElement("div");
    head.className = "ms-section-title";
    head.textContent = label;
    section.prepend(head);
  });
}

// Child tables ------------------------------------------------------------------------------
// Each row becomes a card: the first two columns (code / title), the number column as a
// chip, and a chevron. Frappe's row stays underneath and is what the card opens.
function renderGrid(grid) {
  const wrapper = grid.wrapper?.[0];
  if (!wrapper) return;
  const columns = (grid.visible_columns || []).map(([df]) => df);
  const title = columns[0]?.fieldname;
  const subtitle = columns.find((df, i) => i > 0 && ["Data", "Link", "Small Text", "Text", "Read Only"].includes(df.fieldtype))?.fieldname;
  const qty = columns.find((df) => ["Float", "Int", "Currency", "Percent"].includes(df.fieldtype));
  wrapper.querySelectorAll(".grid-body .grid-row").forEach((rowEl) => {
    const row = grid.grid_rows_by_docname?.[rowEl.dataset.name];
    const doc = row?.doc;
    if (!doc) return;
    let card = rowEl.querySelector(":scope > .ms-grid-card");
    if (!card) {
      card = document.createElement("div");
      card.className = "ms-grid-card";
      card.addEventListener("click", (event) => { if (!event.target.closest(".ms-grid-card-check")) row.toggle_view(true); });
      rowEl.prepend(card);
    }
    const titleText = (title && (doc[`${title}_title`] || doc[title])) || "";
    // The row's name: the title link's own name field (item_code -> item_name), else the
    // first text column with a value.
    const nameField = title && [title.replace(/_code$|_id$/, "") + "_name", title + "_name"].find((f) => doc[f]);
    const subText = (nameField && doc[nameField]) || (subtitle && doc[subtitle]) || "";
    const unit = doc.uom || doc.stock_uom || "";
    const qtyValue = qty ? frappe.format(doc[qty.fieldname], qty, { inline: true }, doc) : "";
    const qtyText = qty ? `<b>${qtyValue}</b>${unit && !String(qtyValue).includes(unit) ? ` ${frappe.utils.escape_html(unit)}` : ""}` : "";
    // The other columns as cells in a strip that scrolls sideways within the row.
    const cellValue = (df) => {
      const v = doc[df.fieldname];
      if (df.fieldtype === "Check") return v ? `<span class="ms-cell-yes">✓</span>` : `<span class="ms-cell-no">—</span>`;
      if (v === undefined || v === null || v === "") return `<span class="ms-cell-no">—</span>`;
      const html = frappe.format(v, df, { inline: true }, doc);
      const text = String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return frappe.utils.escape_html(text.length > 60 ? `${text.slice(0, 60)}…` : text) || `<span class="ms-cell-no">—</span>`;
    };
    const cells = columns.filter((df) => df.fieldname !== title && df !== qty).map((df) => {
      const unitSuffix = df === qty && unit && !String(doc[df.fieldname]).includes(unit) ? ` <small>${frappe.utils.escape_html(unit)}</small>` : "";
      return `<div class="ms-cell" data-fieldtype="${df.fieldtype}"><span class="ms-cell-label">${frappe.utils.escape_html(__(df.label || df.fieldname))}</span><span class="ms-cell-value">${cellValue(df)}${unitSuffix}</span></div>`;
    }).join("");
    const html = `
      <div class="ms-grid-card-main">
        <span class="ms-grid-card-idx">${doc.idx}</span>
        <div class="ms-grid-card-text">
          <div class="ms-grid-card-title">${frappe.utils.escape_html(String(titleText))}</div>
          ${subText && String(subText) !== String(titleText) ? `<div class="ms-grid-card-sub">${frappe.utils.escape_html(String(subText).replace(/<[^>]+>/g, ""))}</div>` : ""}
        </div>
        ${qtyText ? `<span class="ms-grid-card-chip">${qtyText}</span>` : ""}
        <svg class="icon icon-sm ms-grid-card-chevron" aria-hidden="true"><use href="#icon-chevron-right"></use></svg>
      </div>
      ${cells ? `<div class="ms-grid-card-cols">${cells}</div>` : ""}`;
    // Rewritten only when the row changed, so the strip keeps its sideways scroll.
    if (card.msHtml !== html) { card.msHtml = html; card.innerHTML = html; }
  });
  // The "Add row" button as a dashed full-width row.
  const add = wrapper.querySelector(".grid-footer .grid-add-row");
  if (add && !add.classList.contains("ms-grid-add")) {
    add.classList.add("ms-grid-add");
    add.innerHTML = `<svg class="icon icon-sm" aria-hidden="true"><use href="#icon-add"></use></svg>${__("Add Row")}`;
  }
  // The row count as a chip beside the table's title.
  const count = wrapper.querySelectorAll(".grid-body .grid-row").length;
  wrapper.querySelector(":scope > .ms-grid-count")?.remove();
  const label = wrapper.querySelector(".control-label") || wrapper.closest(".frappe-control")?.querySelector(".control-label");
  wrapper.classList.toggle("ms-grid-empty", !count);
  if (label) {
    let countEl = label.querySelector(".ms-grid-count");
    if (!countEl) { countEl = document.createElement("span"); countEl.className = "ms-grid-count"; label.appendChild(countEl); }
    const text = count ? t("{0} rows", [count]) : t("No rows yet");
    if (countEl.textContent !== text) countEl.textContent = text;
  }
}

function renderGrids(frm) {
  Object.values(frm.fields_dict || {}).forEach((field) => { if (field.df?.fieldtype === "Table" && field.grid && field.grid.wrapper) renderGrid(field.grid); });
}

// An open row: Frappe's editor, shown as a sheet with its own title, a close button, and
// Delete / Done at the bottom. A tap on the dark overlay or Escape closes it.
function closeOpenRow(rowEl) {
  rowEl?.querySelector(".grid-collapse-row")?.click();
}

function rowOverlay() {
  let overlay = document.querySelector(".ms-row-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "ms-row-overlay";
    overlay.addEventListener("click", () => closeOpenRow(document.querySelector(".grid-row.grid-row-open")));
    document.body.appendChild(overlay);
  }
  return overlay;
}

function syncRowOverlay() {
  const open = isPhone() && document.querySelector(".ms-app-form .grid-row.grid-row-open");
  const overlay = document.querySelector(".ms-row-overlay");
  if (open) rowOverlay().classList.add("is-on");
  else overlay?.classList.remove("is-on");
  document.body.classList.toggle("ms-row-sheet-open", !!open);
}

function decorateOpenRow(rowEl) {
  const form = rowEl.querySelector(".form-in-grid");
  if (!form || form.querySelector(":scope > .ms-row-sheet-foot")) return;
  const heading = form.querySelector(".grid-form-heading .panel-title");
  const index = heading?.querySelector(".grid-form-row-index")?.textContent || "";
  if (heading) heading.innerHTML = `<span class="ms-row-sheet-title">${t("Edit row #{0}", [index])}</span>`;
  // The heading's own click collapses the row (Frappe); the sheet keeps that for the X only.
  const toolbar = form.querySelector(".grid-form-heading .toolbar");
  if (toolbar && !toolbar.querySelector(".ms-row-close")) {
    const close = document.createElement("button");
    close.type = "button";
    close.className = "ms-row-close";
    close.setAttribute("aria-label", __("Close"));
    close.innerHTML = `<svg class="icon icon-sm"><use href="#icon-close"></use></svg>`;
    close.addEventListener("click", (event) => { event.stopPropagation(); closeOpenRow(rowEl); });
    toolbar.appendChild(close);
  }
  // Number fields get − / + beside them.
  form.querySelectorAll('.frappe-control[data-fieldtype="Float"], .frappe-control[data-fieldtype="Int"]').forEach((control) => {
    const input = control.querySelector("input.form-control");
    if (!input || input.readOnly || control.querySelector(".ms-stepper")) return;
    const wrap = document.createElement("div");
    wrap.className = "ms-stepper";
    const make = (sign) => { const b = document.createElement("button"); b.type = "button"; b.className = "ms-stepper-btn"; b.setAttribute("aria-label", sign > 0 ? "+1" : "-1"); b.textContent = sign > 0 ? "+" : "−"; b.addEventListener("click", () => { const v = (parseFloat(input.value) || 0) + sign; input.value = Math.max(0, v); input.dispatchEvent(new Event("change", { bubbles: true })); }); return b; };
    input.parentElement.insertBefore(wrap, input);
    wrap.append(make(-1), input, make(1));
  });
  const canDelete = !!form.querySelector(".grid-delete-row");
  const foot = document.createElement("div");
  foot.className = "ms-row-sheet-foot";
  foot.innerHTML = `${canDelete ? `<button type="button" class="ms-row-delete"><svg class="icon icon-sm" aria-hidden="true"><use href="#icon-delete"></use></svg>${__("Delete")}</button>` : ""}<button type="button" class="ms-row-done"><svg class="icon icon-sm" aria-hidden="true"><use href="#icon-check"></use></svg>${__("Done")}</button>`;
  foot.querySelector(".ms-row-done").addEventListener("click", () => closeOpenRow(rowEl));
  foot.querySelector(".ms-row-delete")?.addEventListener("click", () => form.querySelector(".grid-delete-row")?.click());
  form.appendChild(foot);
  // Stops Frappe's heading click (which toggles the row) from firing on the title area.
  form.querySelector(".grid-form-heading")?.addEventListener("click", (event) => { if (!event.target.closest(".ms-row-close, .row-actions")) event.stopImmediatePropagation(); }, true);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isPhone()) closeOpenRow(document.querySelector(".ms-app-form .grid-row.grid-row-open"));
});

// Wiring -------------------------------------------------------------------------------------
function decorate(frm) {
  const wrapper = frm.page?.wrapper?.[0];
  if (!wrapper) return;
  const on = isPhone();
  wrapper.classList.toggle("ms-app-form", on);
  if (!on) {
    wrapper.querySelectorAll(":scope > .ms-form-hero, :scope > .ms-form-bar").forEach((e) => e.remove());
    document.body.classList.remove("ms-form-bar-active");
    syncRowOverlay();
    return;
  }
  try { renderHero(frm); renderActionBar(frm); renderLinks(frm); renderSections(frm); renderGrids(frm); } catch (error) { console.error("ms_style mobile form", error); }
}

$(document).on("form-refresh", (event, frm) => { decorate(frm); hideFormSkeleton(); window.setTimeout(() => decorate(frm), 60); window.setTimeout(() => decorate(frm), 700); });

// Loading ----------------------------------------------------------------------------------
// While a document loads (a reload, or opening one not yet cached), a skeleton in the
// screen's shape stands in: the green hero and ghost cards, instead of Frappe's empty
// page head. Frappe's own form is styled from its first render, not after it.
function isFormRoute() {
  const route = window.frappe?.get_route?.() || [];
  if (route.length) return route[0] === "Form";
  return /^\/desk\/[^/]+\/[^/]+\/?$/.test(window.location.pathname) && !/\/view\//.test(window.location.pathname);
}

let skeletonTimer = null;
function showFormSkeleton() {
  if (!isPhone() || !isFormRoute()) return hideFormSkeleton();
  // A form already on screen for this route needs no skeleton.
  const current = window.cur_frm;
  const route = window.frappe?.get_route?.() || [];
  if (current && route[1] === current.doctype && route[2] && String(route.slice(2).join("/")) === String(current.docname) && current.page?.wrapper?.[0]?.offsetParent) return;
  let skel = document.querySelector(".ms-form-skeleton");
  if (!skel) {
    skel = document.createElement("div");
    skel.className = "ms-form-skeleton";
    skel.setAttribute("aria-hidden", "true");
    skel.innerHTML = `<div class="ms-skel-hero"><div class="ms-skel-row"><i class="ms-skel-btn"></i><div class="ms-skel-lines"><b></b><b></b></div><i class="ms-skel-btn"></i><i class="ms-skel-btn"></i></div><div class="ms-skel-tabs"><b></b><b></b><b></b><b></b></div></div><div class="ms-skel-body"><div class="ms-skel-card is-short"></div><div class="ms-skel-card"><b></b><i></i><b></b><i></i><b></b><i></i></div></div>`;
    document.body.appendChild(skel);
  }
  document.body.classList.add("ms-form-loading");
  window.clearTimeout(skeletonTimer);
  skeletonTimer = window.setTimeout(hideFormSkeleton, 10000);
}

function hideFormSkeleton() {
  document.body.classList.remove("ms-form-loading");
  document.querySelector(".ms-form-skeleton")?.remove();
}

function patchForm() {
  const Form = window.frappe?.ui?.form?.Form;
  if (!Form || Form.prototype.msPhonePatched) return;
  Form.prototype.msPhonePatched = true;
  const refresh = Form.prototype.refresh;
  Form.prototype.refresh = function (...args) {
    if (isPhone() && this.page?.wrapper?.[0]) {
      this.page.wrapper[0].classList.add("ms-app-form");
      heroFor(this);
    }
    return refresh.apply(this, args);
  };
}

if (isPhone() && isFormRoute()) showFormSkeleton();
$(() => {
  patchForm();
  window.frappe?.router?.on?.("change", () => { patchForm(); if (isFormRoute()) showFormSkeleton(); else hideFormSkeleton(); });
});
// The primary action changes with the document's state and after saves.
$(document).on("page-change", () => { syncRowOverlay(); window.setTimeout(() => window.cur_frm && decorate(window.cur_frm), 300); });

const observer = new MutationObserver((mutations) => {
  if (!isPhone()) return;
  for (const m of mutations) {
    if (m.type === "attributes" && m.target.classList?.contains("grid-row")) {
      if (m.target.classList.contains("grid-row-open")) decorateOpenRow(m.target);
      syncRowOverlay();
    }
  }
  if (window.cur_frm && mutations.some((m) => m.type === "childList" && m.target.closest?.(".grid-body") && !m.target.closest(".ms-grid-card"))) {
    window.clearTimeout(observer.timer);
    observer.timer = window.setTimeout(() => renderGrids(window.cur_frm), 80);
  }
});
$(() => observer.observe(document.body, { attributes: true, attributeFilter: ["class"], childList: true, subtree: true }));

let resizeTimer = null;
window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => window.cur_frm && decorate(window.cur_frm), 200);
}, { passive: true });
