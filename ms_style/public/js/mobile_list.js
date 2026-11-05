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
    if (act === "menu") document.querySelector(".page-head .sidebar-toggle-btn")?.click();
    else if (act === "search") { const section = list.$page[0].querySelector(".layout-main-section"); section.classList.add("ms-filters-open"); section.querySelector(".page-form input")?.focus(); }
    else if (act === "more") list.$page[0].querySelector(".page-head .menu-btn-group .btn")?.click();
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
      const section = list.$page[0].querySelector(".layout-main-section");
      section.classList.toggle("ms-filters-open");
      return;
    }
    const value = button.dataset.status;
    list.filter_area.remove("status").then(() => { if (value) list.filter_area.add([[list.doctype, "status", "=", value]]); });
  };
}

// Cards ---------------------------------------------------------------------------------
function initials(text) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || "?").slice(0, 1)).toUpperCase();
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
      <span class="ms-card-avatar" aria-hidden="true">${doc.image ? `<img src="${frappe.utils.escape_html(doc.image)}" alt="">` : `<span>${frappe.utils.escape_html(initials(title))}</span>`}</span>
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
  }
  let pressTimer = null;
  card.addEventListener("touchstart", () => { pressTimer = window.setTimeout(() => { checkbox?.click(); }, 450); }, { passive: true });
  card.addEventListener("touchend", () => window.clearTimeout(pressTimer), { passive: true });
  card.addEventListener("touchmove", () => window.clearTimeout(pressTimer), { passive: true });

  card.addEventListener("click", (event) => {
    if (event.target.closest(".ms-card-check, .ms-card-action, a, button")) return;
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

function syncSelection(list) {
  const section = list.$page?.[0]?.querySelector(".layout-main-section");
  if (!section) return;
  const any = !!section.querySelector(".list-row-checkbox:checked");
  section.classList.toggle("ms-has-selection", any);
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
