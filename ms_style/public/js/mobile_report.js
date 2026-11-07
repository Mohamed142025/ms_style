// Query reports on phones (up to 767px) as an app screen: a green hero with the report's
// name and a one-line summary of its filters, buttons for the drawer, the filters (a
// sheet holding Frappe's own filter fields) and the menu (as a sheet), and the report's
// custom buttons as chips. The filters no longer fill the first screen; the table gets a
// narrower first column so the amounts show. Frappe's page stays in charge
// (mobile_report.scss).
import { openActionSheet } from "./mobile_form";
import { isPhone, PhoneObserver } from "./phone";

function t(message, args) {
  return typeof window.__ === "function" ? window.__(message, args, "ms_style") : message;
}

function report() {
  const route = window.frappe?.get_route?.() || [];
  if (route[0] !== "query-report") return null;
  const qr = window.frappe.query_report;
  return qr && qr.report_name === route[1] ? qr : null;
}

function filterValueText(f) {
  const v = f.get_value?.();
  if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) return "";
  if (f.df.fieldtype === "Check") return v ? __(f.df.label) : "";
  if (f.df.fieldtype === "Date") return frappe.datetime.str_to_user(v);
  if (Array.isArray(v)) return v.map((x) => __(x)).join(", ");
  return __(String(v));
}

function summary(qr) {
  // The filters that say what the numbers are: required ones and the period, first.
  const shown = qr.filters.filter((f) => f.df.fieldtype !== "Check" && f.df.fieldtype !== "Section Break" && !f.df.hidden);
  // With a fiscal year chosen, the dates it implies add nothing.
  const byYear = shown.some((f) => /fiscal_year/.test(f.df.fieldname) && filterValueText(f));
  const set = shown.filter((f) => filterValueText(f) && !(byYear && f.df.fieldtype === "Date") && f.df.fieldtype !== "Select" || (f.df.fieldname === "periodicity" && filterValueText(f)));
  const seen = new Set();
  return set.map(filterValueText).filter((v) => !seen.has(v) && seen.add(v)).slice(0, 4).join(" · ");
}

function openFilters(qr) {
  if (document.querySelector(".ms-filter-sheet")) return;
  const page = qr.page.wrapper[0];
  const form = page.querySelector(".page-form");
  if (!form) return;
  const home = form.parentElement, next = form.nextSibling;
  const overlay = document.createElement("div");
  overlay.className = "ms-filter-sheet ms-report-sheet";
  overlay.innerHTML = `
    <div class="ms-sheet" role="dialog" aria-modal="true" aria-label="${__("Filters")}">
      <div class="ms-sheet-handle"></div>
      <div class="ms-sheet-head"><h2>${__("Filters")}</h2><button type="button" class="ms-sheet-close" aria-label="${__("Close")}"><svg class="icon icon-sm"><use href="#icon-close"></use></svg></button></div>
      <div class="ms-sheet-body"><div class="ms-sheet-form"></div></div>
      <div class="ms-sheet-foot"><button type="button" class="btn btn-primary ms-sheet-apply">${t("Show results")}</button></div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.classList.add("ms-sheet-open");
  overlay.querySelector(".ms-sheet-form").appendChild(form);
  const close = () => {
    home.insertBefore(form, next);
    overlay.remove();
    document.body.classList.remove("ms-sheet-open");
    window.setTimeout(decorate, 50);
  };
  // Frappe refreshes the report as each filter changes; the button only closes the sheet.
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest(".ms-sheet-close, .ms-sheet-apply")) close();
  });
}

function decorate() {
  patchQueryReport();
  const qr = report();
  document.querySelectorAll(".ms-app-report").forEach((p) => (!qr || p !== qr.page.wrapper[0]) && p.classList.remove("ms-app-report"));
  if (!qr) return;
  const page = qr.page.wrapper[0];
  const on = isPhone();
  page.classList.toggle("ms-app-report", on);
  // Watch this report's own buttons and table, on phones only.
  if (watched !== page) { watched = page; reportObserver.sync(); }
  let hero = page.querySelector(":scope > .ms-rp-hero");
  if (!on) { hero?.remove(); return; }
  const head = page.querySelector(".page-head");
  if (!hero) {
    hero = document.createElement("header");
    hero.className = "ms-rp-hero";
    hero.innerHTML = `
      <div class="ms-rp-hero-row">
        <button type="button" class="ms-hero-btn" data-act="drawer" aria-label="${__("Menu")}"><svg class="icon icon-sm"><use href="#icon-menu"></use></svg></button>
        <div class="ms-rp-hero-text"><h1 class="ms-rp-hero-title" dir="auto"></h1><p class="ms-rp-hero-sub" dir="auto"></p></div>
        <button type="button" class="ms-hero-btn ms-rp-filter" data-act="filters" aria-label="${__("Filters")}"><svg class="icon icon-sm"><use href="#icon-sliders-horizontal"></use></svg></button>
        <button type="button" class="ms-hero-btn" data-act="menu" aria-label="${__("Menu")}"><svg class="icon icon-sm"><use href="#icon-dot-horizontal"></use></svg></button>
      </div>
      <div class="ms-rp-chips"></div>`;
    hero.addEventListener("click", (event) => {
      const el = event.target.closest("[data-act]");
      if (!el) return;
      const act = el.dataset.act;
      if (act === "drawer") head?.querySelector(".sidebar-toggle-btn")?.click();
      else if (act === "filters") openFilters(qr);
      else if (act === "menu") openActionSheet(null, head?.querySelector(".menu-btn-group .dropdown-menu"), __("Menu"));
      else if (act === "refresh") qr.refresh();
      else if (act === "group") {
        const group = head?.querySelectorAll(".custom-mobile-actions .custom-btn-group")[+el.dataset.index];
        const menu = group?.querySelector(".dropdown-menu");
        if (menu) openActionSheet(null, menu, el.textContent.trim());
        else group?.querySelector("button")?.click();
      } else if (act === "button") head?.querySelectorAll(".custom-mobile-actions > .btn:not(.hide)")[+el.dataset.index]?.click();
    });
    page.insertBefore(hero, page.firstChild);
  }
  hero.querySelector(".ms-rp-hero-title").textContent = __(qr.report_name);
  const sub = summary(qr);
  const subEl = hero.querySelector(".ms-rp-hero-sub");
  subEl.textContent = sub;
  subEl.hidden = !sub;
  // The report's own buttons (Financial Statements, ...) and Refresh, as chips.
  // Frappe's phone copy of the report's buttons: groups (a button and its menu) and
  // single buttons.
  const groups = [...(head?.querySelectorAll(".custom-mobile-actions .custom-btn-group") || [])].map((g, i) => ({ label: g.querySelector("button")?.textContent.trim(), html: `data-act="group" data-index="${i}"`, caret: !!g.querySelector(".dropdown-menu") }));
  const buttons = [...(head?.querySelectorAll(".custom-mobile-actions > .btn:not(.hide)") || [])].map((b, i) => ({ label: b.textContent.trim(), html: `data-act="button" data-index="${i}"` }));
  const chips = [...groups, ...buttons].filter((c) => c.label);
  const html = `<button type="button" class="ms-rp-chip" data-act="refresh"><svg class="icon icon-xs" aria-hidden="true"><use href="#icon-refresh-cw"></use></svg>${__("Refresh")}</button>` + chips.map((c) => `<button type="button" class="ms-rp-chip" ${c.html}>${frappe.utils.escape_html(c.label)}${c.caret ? `<svg class="icon icon-xs" aria-hidden="true"><use href="#icon-chevron-down"></use></svg>` : ""}</button>`).join("");
  try { narrowFirstColumn(qr); } catch (error) { console.error("ms_style report column", error); }
  const chipsEl = hero.querySelector(".ms-rp-chips");
  if (chipsEl.msHtml !== html) { chipsEl.msHtml = html; chipsEl.innerHTML = html; }
}

// The first data column (account, item, date, ...) is often 300px: on a phone it hides
// every other column. It is set to 190px through the datatable's own column API, which
// keeps the header, the cells, the edit box and the sticky offsets in step.
const NARROW = 190;
function narrowFirstColumn(qr) {
  const dt = qr.datatable;
  if (!dt?.columnmanager || !dt.datamanager) return;
  const columns = dt.datamanager.getColumns();
  const first = columns.find((c) => c.colIndex > 0 && !c.hidden && c.id !== "_rowIndex" && c.id !== "_checkbox");
  if (!first || first.width <= NARROW || first.msNarrowed === first.width) return;
  first.width = NARROW;
  first.msNarrowed = NARROW;
  dt.columnmanager.setColumnHeaderWidth(first.colIndex);
  dt.columnmanager.setColumnWidth(first.colIndex);
}

// The report on screen: its buttons (drawn after it loads) and its table (redrawn when
// filters change) are watched, nothing else.
let watched = null;
const reportObserver = new PhoneObserver(
  () => report() && schedule(200),
  () => (watched ? [watched.querySelector(".page-head .page-actions")].filter(Boolean).map((el) => [el, { childList: true, subtree: true }]) : [])
);

// The table is redrawn on every filter change (with its full-width first column): the
// report's own render_datatable is followed, instead of watching the table's rows.
function patchQueryReport() {
  const QueryReport = window.frappe?.views?.QueryReport;
  if (!QueryReport || QueryReport.prototype.msPatched) return;
  QueryReport.prototype.msPatched = true;
  const render = QueryReport.prototype.render_datatable;
  QueryReport.prototype.render_datatable = function (...args) {
    const out = render.apply(this, args);
    if (isPhone()) schedule(50);
    return out;
  };
}

let timer = null;
function schedule(delay = 80) {
  window.clearTimeout(timer);
  timer = window.setTimeout(decorate, delay);
}

$(() => {
  patchQueryReport();
  window.frappe?.router?.on?.("change", () => { patchQueryReport(); schedule(120); schedule(900); });
  window.addEventListener("resize", () => schedule(150), { passive: true });
  // Filters change the summary; reports also draw their buttons after loading.
  $(document).on("change", ".page-form .frappe-control", () => schedule(300));

  schedule(600);
  schedule(2500);
});
