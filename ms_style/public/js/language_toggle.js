// Arabic / English switch at the foot of the module sidebar, under the light / dark one
// and drawn like it (theme.scss), so the language changes from any page. Each language
// is named in itself. The choice is saved on the user, then the page reloads in it, as
// the button in the desk navbar does.
function t(message) {
  return typeof window.__ === "function" ? window.__(message, null, "ms_style") : message;
}

function currentLanguage() {
  const language = window.frappe?.boot?.lang || document.documentElement.lang || "en";
  return language.toLowerCase().startsWith("ar") ? "ar" : "en";
}

function setLanguage(toggle, language) {
  if (language === currentLanguage()) return;
  const user = window.frappe?.session?.user;
  if (!user || !window.frappe?.call) return;
  toggle.dataset.msLanguage = language;
  toggle.querySelectorAll("button").forEach((button) => (button.disabled = true));
  window.frappe.call({
    method: "frappe.client.set_value",
    args: { doctype: "User", name: user, fieldname: "language", value: language },
    callback: () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("_lang");
      window.location.assign(url.toString());
    },
    error: () => {
      toggle.dataset.msLanguage = currentLanguage();
      toggle.querySelectorAll("button").forEach((button) => (button.disabled = false));
    },
  });
}

function makeToggle() {
  const language = currentLanguage();
  const toggle = document.createElement("div");
  toggle.className = "ms-language-toggle";
  toggle.dataset.msLanguage = language;
  toggle.setAttribute("role", "group");
  toggle.setAttribute("aria-label", t("Language"));
  toggle.innerHTML = [
    ["ar", "ع", "العربية"],
    ["en", "EN", "English"],
  ]
    .map(
      ([code, short, name]) =>
        `<button type="button" data-ms-language="${code}" lang="${code}" title="${name}" aria-label="${name}" aria-pressed="${code === language}"><b aria-hidden="true">${short}</b><span>${name}</span></button>`
    )
    .join("");
  toggle.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-ms-language]");
    if (button) setLanguage(toggle, button.dataset.msLanguage);
  });
  return toggle;
}

// Module sidebar: under the theme switch, above the user block.
export function applySidebarLanguageToggle() {
  const bottom = document.querySelector(".body-sidebar .body-sidebar-bottom");
  if (!bottom || bottom.querySelector(".ms-language-toggle")) return;
  bottom.insertBefore(makeToggle(), bottom.querySelector(".dropdown-navbar-user"));
}
