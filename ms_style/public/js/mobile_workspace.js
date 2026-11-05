// Workspace pages on phones (up to 767px) as an app screen: a green hero with the module's
// illustration, its name and its description (the workspace's opening header and
// paragraph move up into it); number cards and shortcuts as two-column tiles; section
// headers as titles. Frappe's blocks stay where they are; only classes and the hero are
// added (mobile_workspace.scss).
import { getDeskIcon } from "./brand_icons";

const PHONE = 767;

function isPhone() {
  return window.innerWidth <= PHONE;
}

function currentPage() {
  const route = window.frappe?.get_route?.() || [];
  if (route[0] !== "Workspaces") return null;
  return document.querySelector('.page-container[data-page-route="Workspaces"]:not([style*="display: none"])') || document.querySelector('.page-container[data-page-route="Workspaces"]');
}

function decorate() {
  const page = currentPage();
  document.querySelectorAll('.page-container[data-page-route="Workspaces"]').forEach((p) => p !== page && p.classList.remove("ms-app-ws"));
  if (!page) return;
  const on = isPhone();
  page.classList.toggle("ms-app-ws", on);
  let hero = page.querySelector(":scope > .ms-ws-hero");
  if (!on) { hero?.remove(); return; }

  const title = page.querySelector(".page-head .title-area")?.textContent.replace(/\s+/g, " ").trim() || window.frappe?.app?.sidebar?.sidebar_title || "";
  const blocks = [...page.querySelectorAll(".codex-editor__redactor > .ce-block")];
  // The opening header (the workspace's own name) and the paragraph under it.
  let description = "";
  blocks.forEach((b) => b.classList.remove("ms-ws-moved"));
  const first = blocks[0];
  if (first?.querySelector(".ce-header") && first.textContent.trim() === title) {
    first.classList.add("ms-ws-moved");
    const next = blocks[1];
    if (next?.querySelector(".ce-paragraph")) {
      description = next.textContent.trim();
      next.classList.add("ms-ws-moved");
    }
  }
  // Section headers, and the kind of tiles each block holds.
  blocks.forEach((b) => {
    b.classList.toggle("ms-ws-section", !!b.querySelector(".ce-header") && !b.classList.contains("ms-ws-moved"));
    b.classList.toggle("ms-ws-number", !!b.querySelector(".number-widget-box"));
    b.classList.toggle("ms-ws-shortcut", !!b.querySelector(".shortcut-widget-box"));
  });

  if (!hero) {
    hero = document.createElement("header");
    hero.className = "ms-ws-hero";
    hero.innerHTML = `
      <div class="ms-ws-hero-row">
        <button type="button" class="ms-hero-btn" data-act="menu" aria-label="${__("Menu")}"><svg class="icon icon-sm"><use href="#icon-menu"></use></svg></button>
        <span class="ms-ws-hero-art" aria-hidden="true"></span>
        <div class="ms-ws-hero-text"><h1 class="ms-ws-hero-title" dir="auto"></h1><p class="ms-ws-hero-desc" dir="auto"></p></div>
        <button type="button" class="ms-hero-btn" data-act="switch" aria-label="${__("Workspaces")}"><svg class="icon icon-sm"><use href="#icon-chevron-down"></use></svg></button>
      </div>`;
    hero.addEventListener("click", (event) => {
      const act = event.target.closest("[data-act]")?.dataset.act;
      if (act === "menu") page.querySelector(".page-head .sidebar-toggle-btn")?.click();
      // The drawer's header opens the workspace switcher (Desktop, Workspaces, ...).
      else if (act === "switch") {
        const container = document.querySelector(".body-sidebar-container");
        if (container && !container.classList.contains("expanded")) page.querySelector(".page-head .sidebar-toggle-btn")?.click();
        window.setTimeout(() => document.querySelector(".body-sidebar .sidebar-header")?.click(), 260);
      }
    });
    page.insertBefore(hero, page.firstChild);
  }
  hero.querySelector(".ms-ws-hero-title").textContent = __(title);
  const desc = hero.querySelector(".ms-ws-hero-desc");
  desc.textContent = description;
  desc.hidden = !description;
  const art = getDeskIcon(title) || getDeskIcon(window.frappe?.app?.sidebar?.sidebar_title);
  const artEl = hero.querySelector(".ms-ws-hero-art");
  if (art && artEl.dataset.src !== art) { artEl.dataset.src = art; artEl.innerHTML = `<img src="${art}" alt="">`; }
  artEl.hidden = !art;
}

// Number cards with no value: Frappe shortens an undefined number to "NaN".
function patchNumberCard() {
  const Card = window.frappe?.widget?.widget_factory?.number_card;
  if (!Card || Card.prototype.msNaNPatched) return;
  Card.prototype.msNaNPatched = true;
  const render = Card.prototype.render_number;
  Card.prototype.render_number = function (...args) {
    if (typeof this.formatted_number === "string" && /NaN/.test(this.formatted_number)) this.formatted_number = this.formatted_number.replace(/NaN/g, "0");
    return render.apply(this, args);
  };
}

let timer = null;
function schedule(delay = 60) {
  window.clearTimeout(timer);
  timer = window.setTimeout(decorate, delay);
}

$(() => {
  patchNumberCard();
  window.frappe?.router?.on?.("change", () => { patchNumberCard(); schedule(80); schedule(700); });
  window.addEventListener("resize", () => schedule(150), { passive: true });
  // Workspaces render their blocks after the route change, and again after editing.
  new MutationObserver((mutations) => {
    if (!isPhone()) return;
    if (mutations.some((m) => m.target.closest?.(".codex-editor__redactor") && [...m.addedNodes].some((n) => n.classList?.contains("ce-block")))) schedule(60);
  }).observe(document.body, { childList: true, subtree: true });
  schedule(300);
});
