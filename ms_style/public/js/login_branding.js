import { LOGIN_LOGO, LOGIN_SCENE } from "./login_scene";

(() => {
  // Loaded through web_include_js, which Frappe injects at the end of <body>, so the
  // login markup already exists when this runs. Every other web page bails out here,
  // and nothing below needs to watch the DOM for the login form to appear.
  const init = () => {
    if (!document.querySelector(".for-login")) return;
    addScene();
    setupBranding();
    buildLoginLanguageToggle();
    dressForm();
    addSiteLink();
  };

  const isArabic = () => document.documentElement.dir === "rtl" || currentLanguage() === "ar";

  function addScene() {
    const scene = document.createElement("div");
    scene.className = "ms-login-scene";
    scene.innerHTML = LOGIN_SCENE;
    document.body.prepend(scene);
  }

  function addSiteLink() {
    const link = document.createElement("a");
    link.className = "ms-login-site-link";
    link.href = "https://digitalroots.pro";
    link.dir = "ltr";
    link.textContent = "digitalroots.pro";
    document.body.append(link);
  }

  const EMAIL_ICON =
    '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>';
  const LOCK_ICON =
    '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>';

  function setIcon(svg, paths) {
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.innerHTML = paths;
  }

  // The design's wording and icons on Frappe's own form; its fields, submission and the
  // password eye (whose <use> Frappe swaps) are left as they are.
  function dressForm() {
    const arabic = isArabic();
    const setText = (selector, text) =>
      document.querySelectorAll(selector).forEach((element) => {
        element.textContent = text;
      });

    setText(
      ":is(.for-login, .for-email-login, .for-login-with-email-link) .page-card-subtitle",
      arabic ? "مرحباً بعودتك" : "Welcome back"
    );
    setText(".form-login .btn-login:not(.btn-ldap-login)", arabic ? "دخول" : "Sign in");
    setText(".forgot-password-message a", arabic ? "نسيت كلمة المرور؟" : "Forgot password?");
    setText("a.btn-login-with-email-link", arabic ? "الدخول برابط على البريد" : "Sign in with an email link");

    document.querySelectorAll(".email-icon").forEach((svg) => setIcon(svg, EMAIL_ICON));
    document.querySelectorAll(".password-icon").forEach((svg) => setIcon(svg, LOCK_ICON));
    document.querySelectorAll('.email-field input[placeholder*="@"]').forEach((input) => {
      input.placeholder = "name@company.com";
    });
    document.querySelectorAll("#login_password").forEach((input) => {
      input.placeholder = "••••••••";
    });
  }

  function setupBranding() {
    const fallbackLogo = "/assets/ms_style/images/logo-horizontal-dark-bg.png";
    const brandAsset = (value) => typeof value === "string" && value.startsWith("/assets/ms_style/");
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
        // The brand's own assets are the design's artwork and logo; a logo or background
        // uploaded in Website Settings replaces them.
        const logo = allowedPath(settings?.logo) ? settings.logo : fallbackLogo;
        const brand = document.querySelector(".navbar-brand");
        if (brand && !brand.dataset.msLogo) {
          brand.dataset.msLogo = "1";
          if (brandAsset(logo)) {
            brand.setAttribute("aria-label", "Digital Roots Solutions");
            brand.dir = "ltr";
            brand.insertAdjacentHTML("afterbegin", LOGIN_LOGO);
          } else {
            setBrandingVariable("--ms-login-logo-url", cssUrl(logo));
            brand.insertAdjacentHTML("afterbegin", '<span class="ms-login-logo-custom"></span>');
          }
        }
        const custom = allowedPath(settings?.background) && !brandAsset(settings.background);
        if (custom) setBrandingVariable("--ms-login-background-url", cssUrl(settings.background));
        document.querySelector(".ms-login-scene")?.classList.toggle("ms-login-scene--custom", custom);
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
  const LANG_LABELS = { en: "EN", ar: "عربي" };
  const LANG_NAMES = { en: "English", ar: "العربية" };

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
    button.setAttribute("aria-label", LANG_NAMES[target]);
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
