(() => {
  // ../ms_style/ms_style/public/js/login_branding.js
  (() => {
    const init = () => {
      if (!document.querySelector(".for-login"))
        return;
      setupBranding();
      buildLoginLanguageToggle();
    };
    function setupBranding() {
      const fallbackLogo = "/assets/ms_style/images/logo-horizontal-dark-bg.png";
      const fallbackBackground = "/assets/ms_style/images/digital-roots-login.webp";
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
      const branding = fetch("/api/method/ms_style.ms_style.api.get_login_branding", { credentials: "same-origin" }).then((response) => response.ok ? response.json() : null).then((payload) => (payload == null ? void 0 : payload.message) || {}).catch(() => null);
      const applyBranding = () => {
        syncLoginDirection();
        branding.then((settings) => {
          const logo = allowedPath(settings == null ? void 0 : settings.logo) ? settings.logo : fallbackLogo;
          const background = allowedPath(settings == null ? void 0 : settings.background) ? settings.background : fallbackBackground;
          setBrandingVariable("--ms-login-logo-url", cssUrl(logo));
          setBrandingVariable("--ms-login-background-url", cssUrl(background));
          document.body.classList.toggle("ms-login-background-full", Boolean(settings == null ? void 0 : settings.full_screen));
        });
      };
      applyBranding();
      window.addEventListener("load", applyBranding, { once: true });
      new MutationObserver(syncLoginDirection).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["dir", "lang"]
      });
    }
    const LANG_LABELS = { en: "English", ar: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629" };
    function getCookie(name) {
      const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
      return match ? decodeURIComponent(match[1]) : null;
    }
    function currentLanguage() {
      const cookie = getCookie("preferred_language");
      if (cookie === "en" || cookie === "ar")
        return cookie;
      return (document.documentElement.lang || "").toLowerCase().startsWith("ar") ? "ar" : "en";
    }
    function switchLanguage(lang, button) {
      button.disabled = true;
      document.cookie = `preferred_language=${lang}; path=/`;
      window.location.reload();
    }
    function buildLoginLanguageToggle() {
      const switcher = document.querySelector("#language-switcher");
      if (!switcher || !switcher.parentElement || document.querySelector(".ms-login-lang-toggle"))
        return;
      const lang = currentLanguage();
      const target = lang === "ar" ? "en" : "ar";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ms-login-lang-toggle";
      button.textContent = LANG_LABELS[target];
      button.lang = target;
      button.title = target === "ar" ? "\u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0625\u0644\u0649 \u0627\u0644\u0639\u0631\u0628\u064A\u0629" : "Switch to English";
      button.addEventListener("click", () => switchLanguage(target, button));
      switcher.insertAdjacentElement("afterend", button);
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
      init();
    }
  })();
})();
//# sourceMappingURL=ms_style_web.bundle.6HZLTHGU.js.map
