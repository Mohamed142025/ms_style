// The on-screen keyboard on phones, app-style: the right keyboard for each field (numbers
// for amounts and quantities, email, phone), an Enter key that says Next or Done, and a
// bar above the keyboard with previous / next field, the field's name and Done.
const PHONE = 767;
const FIELDS = 'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="file"]):not([readonly]):not([disabled]), textarea:not([readonly]):not([disabled]), select:not([disabled]), .ql-editor[contenteditable="true"]';

function isPhone() {
  return window.innerWidth <= PHONE;
}

function t(message) {
  return typeof window.__ === "function" ? window.__(message, null, "ms_style") : message;
}

// Where the user is typing: the open sheet or dialog, else the page on screen.
function scopeOf(el) {
  return el.closest(".modal.show, .ms-filter-sheet, .grid-row-open .form-in-grid, .page-container") || document.body;
}

function fieldsIn(scope) {
  return [...scope.querySelectorAll(FIELDS)].filter((f) => f.offsetParent !== null && !f.closest(".hide, .hidden, [hidden]"));
}

// The keyboard each field needs.
function tune(el) {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
  const control = el.closest(".frappe-control");
  const type = control?.dataset.fieldtype;
  const options = (control?.fieldobj?.df?.options || "").toLowerCase();
  if (!el.hasAttribute("inputmode")) {
    if (["Float", "Currency", "Percent"].includes(type)) el.setAttribute("inputmode", "decimal");
    else if (type === "Int") el.setAttribute("inputmode", "numeric");
    else if (type === "Phone" || options === "phone") el.setAttribute("inputmode", "tel");
    else if (options === "email" || el.type === "email") el.setAttribute("inputmode", "email");
  }
  if (["Date", "Datetime", "Time"].includes(type)) el.setAttribute("inputmode", "none");
  if (el.tagName === "INPUT") {
    const list = fieldsIn(scopeOf(el));
    el.setAttribute("enterkeyhint", list.indexOf(el) < list.length - 1 ? "next" : "done");
  }
}

function labelOf(el) {
  const control = el.closest(".frappe-control, .grid-static-col");
  const text = control?.dataset.label || control?.querySelector(".control-label")?.textContent || el.getAttribute("placeholder") || el.getAttribute("aria-label") || control?.getAttribute("data-original-title") || "";
  return text.replace(/\s*\*\s*$/, "").trim();
}

let bar = null;
let current = null;

function makeBar() {
  bar = document.createElement("div");
  bar.className = "ms-kb-bar";
  bar.innerHTML = `
    <button type="button" class="ms-kb-btn" data-kb="prev" aria-label="${t("Previous field")}"><svg class="icon icon-sm"><use href="#icon-chevron-up"></use></svg></button>
    <button type="button" class="ms-kb-btn" data-kb="next" aria-label="${t("Next field")}"><svg class="icon icon-sm"><use href="#icon-chevron-down"></use></svg></button>
    <span class="ms-kb-label"></span>
    <button type="button" class="ms-kb-done" data-kb="done">${__("Done")}</button>`;
  // The bar must not take the focus from the field.
  bar.addEventListener("pointerdown", (event) => event.preventDefault());
  bar.addEventListener("click", (event) => {
    const act = event.target.closest("[data-kb]")?.dataset.kb;
    if (!act || !current) return;
    if (act === "done") { current.blur(); hide(); return; }
    const list = fieldsIn(scopeOf(current));
    const next = list[list.indexOf(current) + (act === "next" ? 1 : -1)];
    if (next) { next.focus(); next.scrollIntoView({ block: "center", behavior: "smooth" }); }
  });
  document.body.appendChild(bar);
}

function place() {
  if (!bar || !current) return;
  const vv = window.visualViewport;
  const keyboard = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
  bar.style.transform = `translateY(${-keyboard}px)`;
  // No keyboard (a hardware keyboard, or a picker): no bar.
  bar.classList.toggle("is-on", keyboard > 80);
  document.body.classList.toggle("ms-kb-open", keyboard > 80);
}

function show(el) {
  if (!bar) makeBar();
  current = el;
  const list = fieldsIn(scopeOf(el));
  const i = list.indexOf(el);
  bar.querySelector('[data-kb="prev"]').disabled = i <= 0;
  bar.querySelector('[data-kb="next"]').disabled = i < 0 || i >= list.length - 1;
  bar.querySelector(".ms-kb-label").textContent = labelOf(el);
  place();
  // The keyboard animates in; follow it.
  [120, 300, 600].forEach((ms) => window.setTimeout(place, ms));
}

function hide() {
  current = null;
  bar?.classList.remove("is-on");
  document.body.classList.remove("ms-kb-open");
}

document.addEventListener("focusin", (event) => {
  if (!isPhone()) return;
  const el = event.target;
  if (!(el instanceof Element) || !el.matches(FIELDS)) return;
  tune(el);
  show(el);
});

document.addEventListener("focusout", () => {
  window.setTimeout(() => {
    const el = document.activeElement;
    if (!el || !(el instanceof Element) || !el.matches(FIELDS)) hide();
  }, 80);
});

// Enter moves to the next field, as the keyboard's Next key says.
document.addEventListener("keydown", (event) => {
  if (!isPhone() || event.key !== "Enter" || !current || current.tagName !== "INPUT") return;
  if (current.getAttribute("enterkeyhint") !== "next") return;
  // Awesomplete (links) uses Enter to pick a suggestion.
  if (current.closest(".awesomplete")?.querySelector("ul:not([hidden]) li[aria-selected='true']")) return;
  const list = fieldsIn(scopeOf(current));
  const next = list[list.indexOf(current) + 1];
  if (next) { event.preventDefault(); next.focus(); }
});

window.visualViewport?.addEventListener("resize", place);
window.visualViewport?.addEventListener("scroll", place);
