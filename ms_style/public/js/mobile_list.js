import { openActionSheet } from "./mobile_form";
// List views on phones (up to 767px) as an app screen: a hero with the list's name, its
// count and a week strip with a count per day; status chips; one card per document with
// its party, number, due badge, progress, status and next action, grouped by day; and a
// floating "new" button. Frappe's own rows stay in the DOM (hidden) so selection, bulk
// actions, filters, sorting and paging keep working; the card borrows each row's checkbox.
import { getDocGlyph } from "./brand_icons";

const PHONE = 767;

function t(message, args) {
  return typeof window.__ === "function" ? window.__(message, args, "ms_style") : message;
}

function isPhone() {
  return window.innerWidth <= PHONE;
}

// Per doctype: the date the card is about (due), the date it was made (grouping), the
// percentage it shows, and its next step. Doctypes outside the map get the generic card.
const configs = {
  "Purchase Order": {
    due: "schedule_date",
    start: "transaction_date",
    progress: "per_received",
    action: {
      label: "Purchase Receipt",
      icon: "truck",
      when: (doc) => doc.docstatus === 1 && flt(doc.per_received) < 100 && !["Closed", "On Hold"].includes(doc.status),
      run: (doc) => frappe.model.open_mapped_doc({ method: "erpnext.buying.doctype.purchase_order.purchase_order.make_purchase_receipt", source_name: doc.name }),
    },
  },
  "Sales Order": {
    due: "delivery_date",
    start: "transaction_date",
    progress: "per_delivered",
    action: {
      label: "Delivery Note",
      icon: "truck",
      when: (doc) => doc.docstatus === 1 && flt(doc.per_delivered) < 100 && !["Closed", "On Hold"].includes(doc.status),
      run: (doc) => frappe.model.open_mapped_doc({ method: "erpnext.selling.doctype.sales_order.sales_order.make_delivery_note", source_name: doc.name }),
    },
  },
  Quotation: {
    due: "valid_till",
    start: "transaction_date",
    action: {
      label: "Sales Order",
      icon: "shopping-cart",
      when: (doc) => doc.docstatus === 1 && doc.status === "Open",
      run: (doc) => frappe.model.open_mapped_doc({ method: "erpnext.selling.doctype.quotation.quotation.make_sales_order", source_name: doc.name }),
    },
  },
  "Sales Invoice": {
    due: "due_date",
    start: "posting_date",
    progress: (doc) => (flt(doc.grand_total) ? (100 * (flt(doc.grand_total) - flt(doc.outstanding_amount))) / flt(doc.grand_total) : 0),
    fields: ["outstanding_amount", "grand_total", "due_date", "posting_date"],
    action: {
      label: "Payment",
      icon: "banknote",
      when: (doc) => doc.docstatus === 1 && flt(doc.outstanding_amount) > 0,
      run: (doc) => frappe.model.open_mapped_doc({ method: "erpnext.accounts.doctype.payment_entry.payment_entry.get_payment_entry", source_name: doc.name, args: { dt: "Sales Invoice", dn: doc.name } }),
    },
  },
  "Purchase Invoice": { due: "due_date", start: "posting_date", fields: ["due_date", "posting_date"] },
  "Material Request": {
    due: "schedule_date",
    start: "transaction_date",
    progress: "per_ordered",
    fields: ["per_ordered", "schedule_date", "transaction_date"],
  },
  Task: { due: "exp_end_date", start: "exp_start_date", progress: "progress", fields: ["exp_end_date", "exp_start_date", "progress"] },
  Project: { due: "expected_end_date", start: "expected_start_date", progress: "percent_complete", fields: ["expected_end_date", "expected_start_date", "percent_complete"] },
};

function configFor(list) {
  const own = configs[list.doctype] || {};
  const dateFields = list.meta.fields.filter((df) => df.fieldtype === "Date");
  const inList = (name) => list.columns?.some((col) => col.df?.fieldname === name);
  return {
    due: own.due || dateFields.find((df) => inList(df.fieldname) && /due|schedule|end|valid|delivery/i.test(df.fieldname))?.fieldname || null,
    start: own.start || dateFields.find((df) => inList(df.fieldname))?.fieldname || null,
    progress: own.progress || null,
    action: own.action || null,
    fields: own.fields || [own.due, own.start, typeof own.progress === "string" ? own.progress : null].filter(Boolean),
  };
}

// Dates ---------------------------------------------------------------------------------
function toDate(value) {
  if (!value) return null;
  const date = frappe.datetime.str_to_obj(String(value).slice(0, 10));
  return isNaN(date) ? null : date;
}

function dayKey(date) {
  return date ? frappe.datetime.obj_to_str(date) : "";
}

function daysBetween(from, to) {
  return Math.round((to - from) / 86400000);
}

function dayLabel(date) {
  const today = toDate(frappe.datetime.get_today());
  const diff = daysBetween(today, date);
  const relative = diff === 0 ? t("Today") : diff === -1 ? t("Yesterday") : diff === 1 ? t("Tomorrow") : "";
  const long = moment(date).format("dddd D MMMM");
  return relative ? `${relative} · ${long}` : long;
}

function dueBadge(dueValue, doc) {
  const due = toDate(dueValue);
  if (!due || doc.docstatus === 2) return "";
  const done = ["Completed", "Closed", "Delivered", "Paid", "Cancelled", "Stopped", "Ordered", "Transferred", "Received"].includes(doc.status);
  if (done) return "";
  const diff = daysBetween(toDate(frappe.datetime.get_today()), due);
  let tone = "soon", text;
  if (diff < 0) { tone = "late"; text = t("{0} days late", [`<bdi>${Math.abs(diff)}</bdi>`]); }
  else if (diff === 0) { tone = "today"; text = t("Due today"); }
  else if (diff === 1) { text = t("Tomorrow"); }
  else { text = t("In {0} days", [`<bdi>${diff}</bdi>`]); tone = diff > 7 ? "later" : "soon"; }
  return `<span class="ms-due ms-due-${tone}" dir="auto"><svg class="icon icon-xs" aria-hidden="true"><use href="#icon-clock"></use></svg>${text}</span>`;
}

// Hero ----------------------------------------------------------------------------------
function heroFor(list) {
  const section = list.$page?.[0]?.querySelector(".layout-main-section");
  if (!section) return null;
  let hero = section.querySelector(":scope > .ms-list-hero");
  if (hero) return hero;
  hero = document.createElement("header");
  hero.className = "ms-list-hero";
  hero.innerHTML = `
    <div class="ms-list-hero-row">
      <div class="ms-list-hero-text"><h1 class="ms-list-hero-title"></h1><p class="ms-list-hero-sub"></p></div>
      <div class="ms-list-hero-tools">
        <button type="button" class="ms-hero-btn" data-act="menu" aria-label="${t("Menu")}"><svg class="icon icon-sm"><use href="#icon-menu"></use></svg></button>
        <button type="button" class="ms-hero-btn" data-act="search" aria-label="${t("Search")}"><svg class="icon icon-sm"><use href="#icon-search"></use></svg></button>
        <button type="button" class="ms-hero-btn" data-act="more" aria-label="${t("More")}"><svg class="icon icon-sm"><use href="#icon-dot-horizontal"></use></svg></button>
      </div>
    </div>
    <div class="ms-list-week"><div class="ms-list-week-head"><span class="ms-list-week-label"></span><span class="ms-list-week-month"></span></div><div class="ms-list-week-days"></div></div>
    <svg class="ms-list-hero-art" viewBox="0 0 120 60" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 54V30M28 54V18M44 54V38M60 54V10M76 54V26M92 54V34M108 54V20"/><path d="M12 30 28 18 44 38 60 10 76 26 92 34 108 20" stroke-opacity=".6" stroke-dasharray="3 4"/></g></svg>`;
  hero.addEventListener("click", (event) => {
    const button = event.target.closest("[data-act]");
    if (!button) return;
    const act = button.dataset.act;
    const head = list.$page[0].querySelector(".page-head");
    if (act === "menu") (head?.querySelector(".sidebar-toggle-btn") || document.querySelector(".page-head .sidebar-toggle-btn"))?.click();
    else if (act === "search") openFilterSheet(list, true);
    // The page head is hidden on phones, so its menu opens as a sheet of large rows.
    else if (act === "more") openActionSheet(null, head?.querySelector(".menu-btn-group .dropdown-menu"), t("Menu"));
  });
  section.prepend(hero);

  const chips = document.createElement("div");
  chips.className = "ms-list-chips";
  section.insertBefore(chips, hero.nextSibling);
  return hero;
}

function renderHero(list, config) {
  const hero = heroFor(list);
  if (!hero) return;
  const label = __(list.meta.name);
  hero.querySelector(".ms-list-hero-title").textContent = list.page?.title || label;
  const count = list.total_count != null ? list.total_count : list.data.length;
  hero.querySelector(".ms-list-hero-sub").textContent = `${__(list.meta.module)} · ${format_number(count, null, 0)} ${label}`;

  // Week strip: the days of this week, with how many documents are due on each.
  const dueField = config.due;
  const week = hero.querySelector(".ms-list-week");
  week.classList.toggle("hidden", !dueField);
  if (!dueField) return;
  const today = toDate(frappe.datetime.get_today());
  const start = moment(today).startOf("week");
  const counts = {};
  list.data.forEach((doc) => { const key = String(doc[dueField] || "").slice(0, 10); if (key) counts[key] = (counts[key] || 0) + 1; });
  const active = list.get_filter_value?.(dueField);
  const activeKey = Array.isArray(active) ? "" : active || "";
  hero.querySelector(".ms-list-week-label").textContent = __(frappe.meta.get_docfield(list.doctype, dueField)?.label || "Due");
  hero.querySelector(".ms-list-week-month").textContent = start.format("MMMM YYYY");
  hero.querySelector(".ms-list-week-days").innerHTML = Array.from({ length: 7 }, (_, i) => {
    const day = moment(start).add(i, "days");
    const key = day.format("YYYY-MM-DD");
    const n = counts[key] || 0;
    const isToday = day.isSame(today, "day");
    return `<button type="button" class="ms-week-day${isToday ? " is-today" : ""}${activeKey === key ? " is-active" : ""}" data-day="${key}"><span class="ms-week-name">${day.format("ddd")}</span><span class="ms-week-num">${day.format("D")}</span><span class="ms-week-dot${n ? " has" : ""}"${n ? ` data-n="${n}" title="${n}"` : ""}></span></button>`;
  }).join("");
  hero.querySelector(".ms-list-week-days").onclick = (event) => {
    const day = event.target.closest(".ms-week-day");
    if (!day) return;
    const key = day.dataset.day;
    if (activeKey === key) list.filter_area.remove(dueField);
    else list.filter_area.remove(dueField).then(() => list.filter_area.add([[list.doctype, dueField, "=", key]]));
  };
}

// Status chips ---------------------------------------------------------------------------
function renderChips(list) {
  const chips = list.$page?.[0]?.querySelector(".layout-main-section > .ms-list-chips");
  if (!chips) return;
  const statusField = list.meta.fields.find((df) => df.fieldname === "status" && df.fieldtype === "Select");
  const options = statusField ? statusField.options.split("\n").filter((o) => o && !["Cancelled"].includes(o)) : [];
  const counts = {};
  list.data.forEach((doc) => { if (doc.status) counts[doc.status] = (counts[doc.status] || 0) + 1; });
  // The statuses present first, then the rest of the options, at most seven chips.
  const ordered = [...options].sort((a, b) => (counts[b] || 0) - (counts[a] || 0)).slice(0, 7);
  const current = list.get_filter_value?.("status");
  const currentValue = Array.isArray(current) ? (current[0] === "=" ? current[1] : "") : current || "";
  const chip = (value, label, active) => `<button type="button" class="ms-chip${active ? " is-active" : ""}" data-status="${frappe.utils.escape_html(value)}"><svg class="icon icon-xs" aria-hidden="true"><use href="#icon-${active ? "check" : "circle"}"></use></svg>${frappe.utils.escape_html(label)}${counts[value] ? `<span class="ms-chip-count">${counts[value]}</span>` : ""}</button>`;
  chips.innerHTML = `<button type="button" class="ms-chip ms-chip-tools" aria-label="${t("Filter & sort")}"><svg class="icon icon-sm" aria-hidden="true"><use href="#icon-sliders-horizontal"></use></svg></button>` +
    chip("", t("All"), !currentValue) + ordered.map((o) => chip(o, __(o), currentValue === o)).join("");
  chips.onclick = (event) => {
    const button = event.target.closest(".ms-chip");
    if (!button) return;
    if (button.classList.contains("ms-chip-tools")) {
      openFilterSheet(list);
      return;
    }
    const value = button.dataset.status;
    list.filter_area.remove("status").then(() => { if (value) list.filter_area.add([[list.doctype, "status", "=", value]]); });
  };
}

// Filter sheet ------------------------------------------------------------------------------
// "Filter & sort" as a bottom sheet: Frappe's own standard filters and ID search move into
// it while it is open (so every control keeps its behaviour), under status chips and
// sort segments of our own; "Show results" applies and closes, "Clear all" resets.
function sortOptionsFor(list) {
  const seen = new Set();
  const options = [];
  const add = (fieldname, label) => { if (fieldname && !seen.has(fieldname)) { seen.add(fieldname); options.push({ fieldname, label }); } };
  add("modified", __("Last Updated On"));
  const config = configFor(list);
  if (config.due) add(config.due, frappe.meta.get_docfield(list.doctype, config.due)?.label);
  if (config.start) add(config.start, frappe.meta.get_docfield(list.doctype, config.start)?.label);
  if (list.meta.title_field) add(list.meta.title_field, frappe.meta.get_docfield(list.doctype, list.meta.title_field)?.label);
  add("creation", __("Created On"));
  add("name", __("ID"));
  return options.slice(0, 5);
}

function openFilterSheet(list, focusSearch = false) {
  if (document.querySelector(".ms-filter-sheet")) return;
  const pageForm = list.$page[0].querySelector(".page-form");
  const formHome = pageForm?.parentElement;
  const formNext = pageForm?.nextSibling;
  const statusField = list.meta.fields.find((df) => df.fieldname === "status" && df.fieldtype === "Select");
  const statuses = statusField ? statusField.options.split("\n").filter((o) => o && o !== "Cancelled") : [];
  const current = list.get_filter_value?.("status");
  let chosenStatus = Array.isArray(current) ? (current[0] === "=" ? current[1] : "") : current || "";
  const sortOptions = sortOptionsFor(list);
  let sortBy = list.sort_by, sortOrder = list.sort_order;

  const overlay = document.createElement("div");
  overlay.className = "ms-filter-sheet";
  overlay.innerHTML = `
    <div class="ms-sheet" role="dialog" aria-modal="true" aria-label="${t("Filter & sort")}">
      <div class="ms-sheet-handle"></div>
      <div class="ms-sheet-head"><h2>${t("Filter & sort")}</h2><button type="button" class="ms-sheet-close" aria-label="${__("Close")}"><svg class="icon icon-sm"><use href="#icon-close"></use></svg></button></div>
      <div class="ms-sheet-body">
        ${statuses.length ? `<section class="ms-sheet-section"><h3>${__("Status")}</h3><div class="ms-sheet-chips">${["", ...statuses].map((o) => `<button type="button" class="ms-chip${chosenStatus === o ? " is-active" : ""}" data-status="${frappe.utils.escape_html(o)}"><svg class="icon icon-xs" aria-hidden="true"><use href="#icon-${chosenStatus === o ? "check" : "circle"}"></use></svg>${o ? __(o) : t("All")}</button>`).join("")}</div></section>` : ""}
        <section class="ms-sheet-section ms-sheet-fields"><h3>${__("Filters")}</h3><div class="ms-sheet-form"></div></section>
        <section class="ms-sheet-section"><h3>${__("Sort By")}</h3><div class="ms-sheet-segments" data-kind="sort">${sortOptions.map((o) => `<button type="button" class="ms-segment${sortBy === o.fieldname ? " is-active" : ""}" data-sort="${o.fieldname}">${frappe.utils.escape_html(__(o.label || o.fieldname))}</button>`).join("")}</div>
          <div class="ms-sheet-segments" data-kind="order"><button type="button" class="ms-segment${sortOrder === "desc" ? " is-active" : ""}" data-order="desc">${__("Descending")}</button><button type="button" class="ms-segment${sortOrder === "asc" ? " is-active" : ""}" data-order="asc">${__("Ascending")}</button></div></section>
      </div>
      <div class="ms-sheet-foot"><button type="button" class="btn ms-sheet-clear">${__("Clear All")}</button><button type="button" class="btn btn-primary ms-sheet-apply">${t("Show results")}</button></div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.classList.add("ms-sheet-open");
  if (pageForm) overlay.querySelector(".ms-sheet-form").appendChild(pageForm);
  // The standard filters are hidden until the filter button is pressed; in the sheet they
  // are the point.
  pageForm?.querySelector(".standard-filter-section")?.setAttribute("style", "display:flex");
  if (focusSearch) window.setTimeout(() => pageForm?.querySelector("input")?.focus(), 250);

  const close = () => {
    if (pageForm && formHome) formHome.insertBefore(pageForm, formNext);
    overlay.remove();
    document.body.classList.remove("ms-sheet-open");
  };
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest(".ms-sheet-close")) return close();
    const chip = event.target.closest(".ms-sheet-chips .ms-chip");
    if (chip) {
      chosenStatus = chip.dataset.status;
      overlay.querySelectorAll(".ms-sheet-chips .ms-chip").forEach((c) => { const on = c === chip; c.classList.toggle("is-active", on); c.querySelector("use").setAttribute("href", `#icon-${on ? "check" : "circle"}`); });
      return;
    }
    const segment = event.target.closest(".ms-segment");
    if (segment) {
      if (segment.dataset.sort) sortBy = segment.dataset.sort; else sortOrder = segment.dataset.order;
      segment.parentElement.querySelectorAll(".ms-segment").forEach((b) => b.classList.toggle("is-active", b === segment));
      return;
    }
    if (event.target.closest(".ms-sheet-clear")) {
      chosenStatus = ""; sortBy = list.meta.sort_field || "modified"; sortOrder = (list.meta.sort_order || "desc").toLowerCase();
      list.filter_area.clear(false).then(() => { list.sort_selector?.set_value(sortBy, sortOrder); list.refresh(); close(); });
      return;
    }
    if (event.target.closest(".ms-sheet-apply")) {
      list.filter_area.remove("status").then(() => {
        const after = chosenStatus ? list.filter_area.add([[list.doctype, "status", "=", chosenStatus]], false) : Promise.resolve();
        return after;
      }).then(() => {
        if (sortBy !== list.sort_by || sortOrder !== list.sort_order) list.sort_selector?.set_value(sortBy, sortOrder);
        list.sort_by = sortBy; list.sort_order = sortOrder;
        close();
        list.refresh();
      });
    }
  });
}

// Cards ---------------------------------------------------------------------------------
// The first letters of the first two words that start with a letter (any script), so
// "1102 - Accumulated depreciation - GESC" gives "AD", not "1-".
function initials(text) {
  const words = String(text || "").trim().split(/\s+/).filter((w) => /^\p{L}/u.test(w));
  if (!words.length) return (String(text || "").match(/\p{L}|\d/u) || ["?"])[0].toUpperCase();
  return (words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 1)).toUpperCase();
}

function cardFor(list, config, doc, row) {
  const titleField = list.meta.title_field;
  const title = (titleField && doc[titleField]) || doc.name;
  const indicator = list.get_indicator_html ? list.get_indicator_html(doc) : "";
  const startDate = config.start ? toDate(doc[config.start]) : null;
  const dueDate = config.due ? toDate(doc[config.due]) : null;
  let progress = null;
  if (typeof config.progress === "function") progress = config.progress(doc);
  else if (config.progress) progress = flt(doc[config.progress]);
  const showProgress = progress != null && (startDate || dueDate) && doc.docstatus !== 2;
  const action = config.action && config.action.when(doc) ? config.action : null;
  const glyph = getDocGlyph([list.doctype], "DocType");

  const card = document.createElement("div");
  card.className = "ms-card";
  card.dataset.name = doc.name;
  card.innerHTML = `
    <div class="ms-card-head">
      <span class="ms-card-check"></span>
      <span class="ms-card-avatar" role="checkbox" aria-checked="false" tabindex="0" aria-label="${__("Select")}">${doc.image ? `<img src="${frappe.utils.escape_html(doc.image)}" alt="">` : `<span>${frappe.utils.escape_html(initials(title))}</span>`}</span>
      <div class="ms-card-text">
        <div class="ms-card-title">${frappe.utils.escape_html(title)}</div>
        ${title !== doc.name ? `<div class="ms-card-name">${frappe.utils.escape_html(doc.name)}</div>` : ""}
      </div>
      ${dueBadge(config.due && doc[config.due], doc)}
    </div>
    ${showProgress ? `<div class="ms-card-progress"><span class="ms-card-date">${startDate ? moment(startDate).format("D MMM") : ""}</span><div class="ms-bar"><div class="ms-bar-fill" style="width:${Math.max(0, Math.min(100, Math.round(progress)))}%"></div></div><span class="ms-card-date">${dueDate ? moment(dueDate).format("D MMM") : ""}</span></div>` : ""}
    <div class="ms-card-foot">
      <span class="ms-card-status">${indicator}</span>
      ${action ? `<button type="button" class="btn btn-default btn-sm ms-card-action"><svg class="icon icon-sm" aria-hidden="true"><use href="#icon-${action.icon || glyph}"></use></svg>${__(action.label)}</button>` : ""}
    </div>`;

  // The row's own checkbox moves into the card, so Frappe's selection keeps working. A
  // long press on a card starts selecting.
  const checkbox = row.querySelector(".list-row-checkbox");
  if (checkbox) {
    card.querySelector(".ms-card-check").appendChild(checkbox);
    checkbox.addEventListener("change", () => syncSelection(list));
    // The tile at the card's start selects it (it turns into a tick), as in mail apps.
    const avatar = card.querySelector(".ms-card-avatar");
    const toggle = (event) => { event.preventDefault(); event.stopPropagation(); checkbox.click(); };
    avatar.addEventListener("click", toggle);
    avatar.addEventListener("keydown", (event) => { if (event.key === " " || event.key === "Enter") toggle(event); });
  }
  let pressTimer = null;
  card.addEventListener("touchstart", () => { pressTimer = window.setTimeout(() => { checkbox?.click(); }, 450); }, { passive: true });
  card.addEventListener("touchend", () => window.clearTimeout(pressTimer), { passive: true });
  card.addEventListener("touchmove", () => window.clearTimeout(pressTimer), { passive: true });

  card.addEventListener("click", (event) => {
    if (event.target.closest(".ms-card-check, .ms-card-avatar, .ms-card-action, a, button")) return;
    // While selecting, a tap on a card adds it to or takes it out of the selection.
    if (card.closest(".ms-has-selection") && checkbox) { checkbox.click(); return; }
    frappe.set_route("Form", list.doctype, doc.name);
  });
  card.querySelector(".ms-card-action")?.addEventListener("click", (event) => {
    event.stopPropagation();
    action.run(doc);
  });
  return card;
}

function renderCards(list, config) {
  const rows = [...list.$result[0].querySelectorAll(":scope > .list-row-container")].filter((r) => !r.querySelector(".list-row-head"));
  list.$result[0].querySelectorAll(":scope > .ms-list-group").forEach((g) => g.remove());
  let lastDay = null;
  rows.forEach((row, index) => {
    const doc = list.data[index];
    if (!doc || row.querySelector(":scope > .ms-card")) return;
    row.classList.add("ms-card-row");
    row.appendChild(cardFor(list, config, doc, row));
    if (config.start) {
      const date = toDate(doc[config.start]);
      const key = dayKey(date);
      if (date && key !== lastDay) {
        const group = document.createElement("div");
        group.className = "ms-list-group";
        group.textContent = dayLabel(date);
        row.before(group);
        lastDay = key;
      }
    }
  });
}

// Selection: a bar over the hero with the count, select all, the bulk actions (Frappe's
// "Actions" menu, as a sheet) and cancel. Frappe's own head stays hidden.
function syncSelection(list) {
  const page = list.$page?.[0];
  const section = page?.querySelector(".layout-main-section");
  if (!section) return;
  const boxes = [...section.querySelectorAll(".ms-card .list-row-checkbox")];
  const checked = boxes.filter((b) => b.checked);
  const any = checked.length > 0;
  section.classList.toggle("ms-has-selection", any);
  boxes.forEach((b) => {
    const card = b.closest(".ms-card");
    card?.classList.toggle("is-selected", b.checked);
    card?.querySelector(".ms-card-avatar")?.setAttribute("aria-checked", String(b.checked));
  });
  let bar = page.querySelector(".ms-select-bar");
  if (!any) { bar?.remove(); return; }
  if (!bar) {
    bar = document.createElement("div");
    bar.className = "ms-select-bar";
    bar.innerHTML = `
      <button type="button" class="ms-hero-btn" data-sel="clear" aria-label="${__("Cancel")}"><svg class="icon icon-sm"><use href="#icon-x"></use></svg></button>
      <div class="ms-select-count"></div>
      <button type="button" class="ms-select-all" data-sel="all"></button>
      <button type="button" class="ms-select-actions" data-sel="actions"><span>${__("Actions")}</span><svg class="icon icon-sm" aria-hidden="true"><use href="#icon-chevron-down"></use></svg></button>`;
    bar.addEventListener("click", (event) => {
      const act = event.target.closest("[data-sel]")?.dataset.sel;
      const all = [...section.querySelectorAll(".ms-card .list-row-checkbox")];
      if (act === "clear") all.filter((b) => b.checked).forEach((b) => b.click());
      else if (act === "all") {
        const allOn = all.every((b) => b.checked);
        all.filter((b) => b.checked === allOn).forEach((b) => b.click());
      } else if (act === "actions") openActionSheet(null, page.querySelector(".page-head .actions-btn-group .dropdown-menu"), __("Actions"));
    });
    (page.querySelector(".ms-list-hero") || section).before(bar);
  }
  bar.querySelector(".ms-select-count").textContent = t("{0} selected", [checked.length]);
  bar.querySelector(".ms-select-all").textContent = checked.length === boxes.length ? t("Deselect all") : t("Select all");
}

// New button -------------------------------------------------------------------------------
function renderFab(list) {
  const section = list.$page?.[0]?.querySelector(".layout-main-section");
  if (!section || section.querySelector(":scope > .ms-fab")) return;
  if (!frappe.model.can_create(list.doctype)) return;
  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "ms-fab";
  fab.innerHTML = `<svg class="icon icon-sm" aria-hidden="true"><use href="#icon-add"></use></svg><span>${__(list.meta.name)}</span>`;
  fab.addEventListener("click", () => (list.settings?.primary_action ? list.settings.primary_action() : frappe.new_doc(list.doctype)));
  section.appendChild(fab);
}

// Wiring -----------------------------------------------------------------------------------
function decorate(list) {
  const section = list.$page?.[0]?.querySelector(".layout-main-section");
  if (!section) return;
  const on = isPhone() && list.view_name === "List";
  section.classList.toggle("ms-app-list", on);
  if (!on) {
    section.querySelectorAll(":scope > .ms-list-hero, :scope > .ms-list-chips, :scope > .ms-fab").forEach((e) => e.remove());
    return;
  }
  const config = configFor(list);
  renderHero(list, config);
  renderChips(list);
  renderCards(list, config);
  renderFab(list);
  syncSelection(list);
}

const ListView = window.frappe?.views?.ListView;
if (ListView && !ListView.prototype.render_list.msAppList) {
  const setFields = ListView.prototype.set_fields;
  ListView.prototype.set_fields = async function (...args) {
    const result = await setFields.apply(this, args);
    if (isPhone()) configFor(this).fields.forEach((f) => frappe.meta.has_field(this.doctype, f) && this._add_field(f));
    return result;
  };

  // The screen takes its shape before the first rows arrive, so the loading state is
  // already the app list (ghost cards instead of the desktop placeholder).
  const renderSkeleton = ListView.prototype.render_skeleton;
  ListView.prototype.render_skeleton = function (...args) {
    const result = renderSkeleton.apply(this, args);
    if (isPhone() && this.view_name === "List") {
      this.$page?.[0]?.querySelector(".layout-main-section")?.classList.add("ms-app-list");
      for (let i = 0; i < 3; i++) this.$result.append(this.get_list_row_html_skeleton('<div><input type="checkbox" class="render-list-checkbox"/></div>'));
      try { heroFor(this); renderHero(this, configFor(this)); } catch (error) { /* meta not ready yet */ }
    }
    return result;
  };

  const renderList = ListView.prototype.render_list;
  ListView.prototype.render_list = function (...args) {
    const result = renderList.apply(this, args);
    try { decorate(this); } catch (error) { console.error("ms_style mobile list", error); }
    return result;
  };
  ListView.prototype.render_list.msAppList = true;

  // The hero's count arrives with Frappe's own count.
  const getCountStr = ListView.prototype.get_count_str;
  ListView.prototype.get_count_str = function (...args) {
    return getCountStr.apply(this, args).then((count) => {
      if (isPhone()) { const sub = this.$page?.[0]?.querySelector(".ms-list-hero-sub"); if (sub) sub.textContent = `${__(this.meta.module)} · ${format_number(this.total_count ?? this.data.length, null, 0)} ${__(this.meta.name)}`; }
      return count;
    });
  };

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => { const list = window.cur_list; if (list?.view_name === "List" && list.render_list) list.refresh(); }, 200);
  }, { passive: true });
}
