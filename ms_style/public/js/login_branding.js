(() => {
  const syncLoginDirection = () => {
    const direction = document.documentElement.dir === "rtl" ? "rtl" : "ltr";
    document.querySelectorAll(".for-login, .for-login .login-content, .for-login .form-login").forEach((element) => {
      element.style.direction = direction;
    });
  };

  const applyBranding = () => {
    const loginPage = document.querySelector(".for-login");
    if (!loginPage || !document.body) return;
    syncLoginDirection();

  const fallbackLogo = "/assets/ms_style/images/logo-horizontal-dark-bg.png";
  const fallbackBackground = "/assets/ms_style/images/Main%20login.png";
  const allowedPath = (value) => typeof value === "string" && (value.startsWith("/files/") || value.startsWith("/assets/"));
  const cssUrl = (value) => `url("${value}")`;
  const setBrandingVariable = (name, value) => {
    document.documentElement.style.setProperty(name, value);
    document.body.style.setProperty(name, value);
  };

  fetch("/api/method/ms_style.ms_style.api.get_login_branding", { credentials: "same-origin" })
    .then((response) => (response.ok ? response.json() : null))
    .then((payload) => {
      const branding = payload?.message || {};
      const logo = allowedPath(branding.logo) ? branding.logo : fallbackLogo;
      const background = allowedPath(branding.background) ? branding.background : fallbackBackground;
      setBrandingVariable("--ms-login-logo-url", cssUrl(logo));
      setBrandingVariable("--ms-login-background-url", cssUrl(background));
      document.body.classList.toggle("ms-login-background-full", Boolean(branding.full_screen));
    })
    .catch(() => {
      setBrandingVariable("--ms-login-logo-url", cssUrl(fallbackLogo));
      setBrandingVariable("--ms-login-background-url", cssUrl(fallbackBackground));
      document.body.classList.remove("ms-login-background-full");
    });
  };

  const schedule = () => {
    applyBranding();
    window.setTimeout(applyBranding, 300);
  };

  const observer = new MutationObserver(() => {
    if (document.querySelector(".for-login")) {
      observer.disconnect();
      schedule();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule, { once: true });
  } else {
    schedule();
  }
  window.addEventListener("load", schedule, { once: true });
  new MutationObserver(syncLoginDirection).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["dir", "lang"],
  });
})();

(() => {
  // The native #language-switcher (see frappe/templates/includes/navbar/navbar.html
  // and website.js) lists every enabled system language and reloads with a
  // `preferred_language` cookie on change. This product only ships English/Arabic
  // copy, so instead of restyling a 17-option <select> into a two-way toggle, this
  // hides that control (login.scss) and drives the exact same cookie+reload
  // mechanism directly from a plain button showing just the two real options.
  const LANG_LABELS = { en: "English", ar: "العربية" };

  function getCookie(name) {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function currentLanguage() {
    const cookie = getCookie("preferred_language");
    if (cookie === "en" || cookie === "ar") return cookie;
    return (document.documentElement.lang || "").toLowerCase().startsWith("ar") ? "ar" : "en";
  }

  function switchLanguage(lang, button) {
    button.disabled = true;
    document.cookie = `preferred_language=${lang}; path=/`;
    window.location.reload();
  }

  function buildLoginLanguageToggle() {
    const switcher = document.querySelector("#language-switcher");
    if (!switcher || !switcher.parentElement || document.querySelector(".ms-login-lang-toggle")) return;

    const lang = currentLanguage();
    const target = lang === "ar" ? "en" : "ar";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "ms-login-lang-toggle";
    button.textContent = LANG_LABELS[lang];
    button.title = `Switch to ${LANG_LABELS[target]}`;
    button.addEventListener("click", () => switchLanguage(target, button));

    switcher.insertAdjacentElement("afterend", button);
  }

  const observer = new MutationObserver(() => {
    if (document.querySelector("#language-switcher")) buildLoginLanguageToggle();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildLoginLanguageToggle, { once: true });
  } else {
    buildLoginLanguageToggle();
  }
  window.addEventListener("load", buildLoginLanguageToggle, { once: true });
})();
