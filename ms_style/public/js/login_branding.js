(() => {
  // Loaded through web_include_js, which Frappe injects at the end of <body>, so the
  // login markup already exists when this runs. Every other web page bails out here,
  // and nothing below needs to watch the DOM for the login form to appear.
  const init = () => {
    if (!document.querySelector(".for-login")) return;
    setupBranding();
    buildLoginLanguageToggle();
  };

  function setupBranding() {
    const fallbackLogo = "/assets/ms_style/images/logo-horizontal-dark-bg.png";
    const fallbackBackground = "/assets/ms_style/images/main-login.webp";
    const allowedPath = (value) => typeof value === "string" && (value.startsWith("/files/") || value.startsWith("/assets/"));
    const cssUrl = (value) => `url("${value}")`;
    const setBrandingVariable = (name, value) => {
      document.documentElement.style.setProperty(name, value);
      document.body.style.setProperty(name, value);
    };

    const syncLoginDirection = () => {
      const direction = document.documentElement.dir === "rtl" ? "rtl" : "ltr";
      document.querySelectorAll(".for-login, .for-login .login-content, .for-login .form-login").forEach((element) => {
        element.style.direction = direction;
      });
    };

    // One request per page load; re-applying later reuses the same response.
    const branding = fetch("/api/method/ms_style.ms_style.api.get_login_branding", { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => payload?.message || {})
      .catch(() => null);

    const applyBranding = () => {
      syncLoginDirection();
      branding.then((settings) => {
        const logo = allowedPath(settings?.logo) ? settings.logo : fallbackLogo;
        const background = allowedPath(settings?.background) ? settings.background : fallbackBackground;
        setBrandingVariable("--ms-login-logo-url", cssUrl(logo));
        setBrandingVariable("--ms-login-background-url", cssUrl(background));
        document.body.classList.toggle("ms-login-background-full", Boolean(settings?.full_screen));
      });
    };

    applyBranding();
    window.addEventListener("load", applyBranding, { once: true });
    new MutationObserver(syncLoginDirection).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["dir", "lang"],
    });
  }

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
    // Label the button with the language it switches to, the usual convention.
    button.textContent = LANG_LABELS[target];
    button.lang = target;
    button.title = target === "ar" ? "التبديل إلى العربية" : "Switch to English";
    button.addEventListener("click", () => switchLanguage(target, button));

    switcher.insertAdjacentElement("afterend", button);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
