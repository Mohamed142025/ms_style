// Light / dark switch: in the desk navbar and at the foot of the module sidebar. Both draw
// from the theme on the root element (theme.scss), so they stay in step with each other and
// with Frappe's own theme dialog; the choice is saved on the user like that dialog does.
const root = document.documentElement;

function t(message) {
  return typeof window.__ === "function" ? window.__(message, null, "ms_style") : message;
}

function currentTheme() {
  return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function setTheme(theme) {
  if (theme === currentTheme()) return;
  const apply = () => {
    root.setAttribute("data-theme-mode", theme);
    root.setAttribute("data-theme", theme);
  };
  // Cross-fade the whole page where the browser can; otherwise switch at once.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (document.startViewTransition && !reduceMotion) document.startViewTransition(apply);
  else apply();
  window.frappe?.xcall?.("frappe.core.doctype.user.user.switch_theme", { theme: theme === "dark" ? "Dark" : "Light" });
}

function syncToggles() {
  const theme = currentTheme();
  document.querySelectorAll(".ms-theme-toggle button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.msTheme === theme));
  });
}

function makeToggle() {
  const toggle = document.createElement("div");
  toggle.className = "ms-theme-toggle";
  toggle.setAttribute("role", "group");
  toggle.setAttribute("aria-label", t("Theme"));
  toggle.innerHTML = [
    ["light", "sun", t("Light"), t("Switch to light mode")],
    ["dark", "moon", t("Dark"), t("Switch to dark mode")],
  ]
    .map(
      ([theme, icon, label, title]) =>
        `<button type="button" data-ms-theme="${theme}" title="${title}" aria-label="${title}"><svg class="icon icon-sm" aria-hidden="true"><use href="#icon-${icon}"></use></svg><span>${label}</span></button>`
    )
    .join("");
  toggle.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-ms-theme]");
    if (button) setTheme(button.dataset.msTheme);
  });
  return toggle;
}

// Desk navbar: beside the language button.
export function applyNavbarThemeToggle() {
  const tools = document.querySelector(".desktop-navbar .ms-user-tools");
  if (!tools || tools.querySelector(".ms-theme-toggle")) return;
  tools.insertBefore(makeToggle(), tools.querySelector(".ms-language-switcher, .ms-user-greeting, .desktop-avatar"));
  syncToggles();
}

// Module sidebar: above the user block.
export function applySidebarThemeToggle() {
  const bottom = document.querySelector(".body-sidebar .body-sidebar-bottom");
  if (!bottom || bottom.querySelector(".ms-theme-toggle")) return;
  bottom.insertBefore(makeToggle(), bottom.querySelector(".dropdown-navbar-user"));
  syncToggles();
}

// The theme also changes from Frappe's dialog and, in automatic mode, with the system.
new MutationObserver(syncToggles).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
