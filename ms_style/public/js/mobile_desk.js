// The desk home on phones (up to 767px): the navbar grows into a hero with the user's
// tools on top and, under them, today's date and a greeting by the time of day.
const PHONE = 767;

function t(message, args) {
  return typeof window.__ === "function" ? window.__(message, args, "ms_style") : message;
}

// The desk home: /desk, /desk/desktop, and the site root when the site's home page is
// the desk (Frappe shows the desktop at "/" without changing the URL; the TWA opens there).
function isDeskHome() {
  return /^\/(desk(\/desktop)?\/?)?$/.test(window.location.pathname);
}

function greetingFor(hour) {
  if (hour < 12) return "Good morning, {0}";
  if (hour < 17) return "Good afternoon, {0}";
  return "Good evening, {0}";
}

function todayLabel() {
  const lang = window.frappe?.boot?.lang || document.documentElement.lang || "en";
  try {
    return new Intl.DateTimeFormat(`${lang}-u-nu-latn`, { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  } catch (error) {
    return new Date().toDateString();
  }
}

function apply() {
  const navbar = document.querySelector(".desktop-navbar");
  if (!navbar) return;
  const on = window.innerWidth <= PHONE && isDeskHome();
  navbar.classList.toggle("ms-desk-hero", on);
  let text = navbar.querySelector(":scope > .ms-desk-hero-text");
  if (!on) { text?.remove(); return; }
  if (!text) {
    text = document.createElement("div");
    text.className = "ms-desk-hero-text";
    text.innerHTML = `<div class="ms-desk-hero-date"></div><h1 class="ms-desk-hero-greeting"></h1>`;
    navbar.appendChild(text);
  }
  const name = window.frappe?.session?.user_fullname || window.frappe?.session?.user || "";
  const date = todayLabel();
  const greeting = t(greetingFor(new Date().getHours()), [name]);
  if (text.firstElementChild.textContent !== date) text.firstElementChild.textContent = date;
  if (text.lastElementChild.textContent !== greeting) text.lastElementChild.textContent = greeting;
}

function schedule() { window.setTimeout(apply, 50); window.setTimeout(apply, 600); }

// Frappe rebuilds the desk's navbar when it redraws the desktop (after Edit Layout's
// save or discard, a theme change, ...): a new navbar gets the hero again at once.
let navbarTimer = null;
new MutationObserver(() => {
  if (window.innerWidth > PHONE || !isDeskHome()) return;
  const navbar = document.querySelector(".desktop-navbar");
  if (!navbar || (navbar.classList.contains("ms-desk-hero") && navbar.querySelector(":scope > .ms-desk-hero-text"))) return;
  window.clearTimeout(navbarTimer);
  navbarTimer = window.setTimeout(apply, 0);
}).observe(document.body, { childList: true, subtree: true });
$(document).on("desktop_screen", schedule);

$(() => {
  schedule();
  window.frappe?.router?.on?.("change", schedule);
  let timer = null;
  window.addEventListener("resize", () => { window.clearTimeout(timer); timer = window.setTimeout(apply, 150); }, { passive: true });
  // The greeting follows the clock when the app stays open.
  window.setInterval(apply, 5 * 60 * 1000);
});

// Notifications on phones: Frappe's panel (the sidebar's, or the desk home bell's) is a
// bottom sheet (responsive.scss, mobile_desk.scss). This adds the title and the overlay,
// and closes it on a tap outside, as the other sheets do.
function openNotificationPanel() {
  return document.querySelector(".body-sidebar .dropdown-notifications:not(.hidden) .notifications-list, .desktop-notifications .dropdown-notifications .notifications-list.show");
}

function closeNotificationPanel() {
  document.querySelector(".body-sidebar .dropdown-notifications:not(.hidden)")?.classList.add("hidden");
  const bell = document.querySelector(".desktop-notifications .dropdown-notifications.show > .nav-link");
  if (bell) window.jQuery?.(bell).dropdown("hide");
  document.querySelectorAll(".desktop-notifications .notifications-list.show").forEach((list) => list.classList.remove("show"));
}

function syncNotificationSheet() {
  const panel = window.innerWidth <= PHONE ? openNotificationPanel() : null;
  document.body.classList.toggle("ms-notif-open", !!panel);
  let overlay = document.querySelector(".ms-notif-overlay");
  if (!panel) { overlay?.remove(); return; }
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "ms-notif-overlay";
    overlay.addEventListener("click", (event) => { event.stopPropagation(); closeNotificationPanel(); syncNotificationSheet(); });
  }
  // Beside the panel, in the same stacking context (the sidebar or the navbar), under it.
  if (overlay.nextElementSibling !== panel) panel.before(overlay);
  const header = panel.querySelector(".notification-list-header");
  if (header && !header.querySelector(".ms-notif-title")) {
    const title = document.createElement("h2");
    title.className = "ms-notif-title";
    title.textContent = __("Notifications");
    header.prepend(title);
  }
}

let notifTimer = null;
new MutationObserver((mutations) => {
  if (!mutations.some((m) => m.target.classList?.contains("dropdown-notifications") || m.target.classList?.contains("notifications-list"))) return;
  window.clearTimeout(notifTimer);
  notifTimer = window.setTimeout(syncNotificationSheet, 20);
}).observe(document.documentElement, { attributes: true, attributeFilter: ["class"], subtree: true });

// Search on phones: Frappe's awesomebar modal as a full screen with a green head (title,
// close, the field) and results as rows with an icon by kind (mobile_desk.scss).
function searchKind(li) {
  const href = li.querySelector("a")?.getAttribute("href") || "";
  const text = li.textContent.trim();
  if (/^New\s/.test(text) || text.startsWith(__("New"))) return ["plus", "new"];
  if (/\/view\/report|query-report|\/report\//.test(href)) return ["chart-column", "report"];
  if (/Workspaces|Workspace$/.test(href + " " + text) || /^Open\s/.test(text)) return ["layout-grid", "workspace"];
  if (/\/view\/list|List$/.test(href + " " + text)) return ["list", "list"];
  if (/^\/desk\/[^/]+\/[^/]+$/.test(href)) return ["file-text", "doc"];
  if (/^\/desk\/[^/]+$/.test(href)) return ["list", "list"];
  return ["search", "other"];
}

function decorateSearch() {
  if (window.innerWidth > PHONE) return;
  // Every open search: the desk home's and a page's can both exist.
  document.querySelectorAll(".modal.show .navbar-modal-wrapper").forEach((wrapper) => decorateSearchModal(wrapper.closest(".modal")));
}

function decorateSearchModal(modal) {
  if (!modal) return;
  // Only when missing: classList.add rewrites the attribute even when the class is
  // there, which the observer below saw as a change and answered again, in a loop.
  if (!modal.classList.contains("ms-search-modal")) modal.classList.add("ms-search-modal");
  const body = modal.querySelector(".modal-body");
  if (body && !body.querySelector(".ms-search-head")) {
    const head = document.createElement("div");
    head.className = "ms-search-head";
    head.innerHTML = `<h2>${__("Search")}</h2><button type="button" class="ms-search-close" aria-label="${__("Close")}"><svg class="icon icon-sm"><use href="#icon-x"></use></svg></button>`;
    head.querySelector("button").addEventListener("click", () => window.jQuery?.(modal).modal("hide"));
    body.prepend(head);
  }
  // A back button inside the field: when the keyboard opens, the browser can scroll the
  // head (and its close button) off the screen, but never the field being typed in.
  const row = modal.querySelector(".awesomebar-input-row");
  if (row && !row.querySelector(".ms-search-back")) {
    const back = document.createElement("button");
    back.type = "button";
    back.className = "ms-search-back";
    back.setAttribute("aria-label", __("Back"));
    back.innerHTML = `<svg class="icon icon-sm"><use href="#icon-arrow-left"></use></svg>`;
    back.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); window.jQuery?.(modal).modal("hide"); });
    row.prepend(back);
  }
  modal.querySelectorAll(".awesomplete li").forEach((li) => {
    const a = li.querySelector("a");
    if (!a || a.querySelector(".ms-sr-ico")) return;
    const [icon, kind] = searchKind(li);
    li.dataset.kind = kind;
    a.insertAdjacentHTML("afterbegin", `<span class="ms-sr-ico" aria-hidden="true"><svg class="icon icon-sm"><use href="#icon-${icon}"></use></svg></span>`);
    a.insertAdjacentHTML("beforeend", `<svg class="icon icon-xs ms-sr-chevron" aria-hidden="true"><use href="#icon-chevron-right"></use></svg>`);
  });
}

$(document).on("shown.bs.modal", () => window.setTimeout(decorateSearch, 0));
// Decorated in the observer itself: it runs before the browser paints, so the new
// suggestions never show a frame without their icons (a timer let every keystroke paint
// the bare list first, and the list jumped).
new MutationObserver((mutations) => {
  if (window.innerWidth > PHONE) return;
  if (!mutations.some((m) => m.target.closest?.(".navbar-modal-wrapper") || m.target.classList?.contains("modal"))) return;
  decorateSearch();
}).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
