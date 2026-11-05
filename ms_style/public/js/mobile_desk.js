// The desk home on phones (up to 767px): the navbar grows into a hero with the user's
// tools on top and, under them, today's date and a greeting by the time of day.
const PHONE = 767;

function t(message, args) {
  return typeof window.__ === "function" ? window.__(message, args, "ms_style") : message;
}

function isDeskHome() {
  return /^\/desk(\/desktop)?\/?$/.test(window.location.pathname);
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

$(() => {
  schedule();
  window.frappe?.router?.on?.("change", schedule);
  let timer = null;
  window.addEventListener("resize", () => { window.clearTimeout(timer); timer = window.setTimeout(apply, 150); }, { passive: true });
  // The greeting follows the clock when the app stays open.
  window.setInterval(apply, 5 * 60 * 1000);
});
