(() => {
  const root = document.documentElement;
  const iconBasePath = "/assets/ms_style/Icone/";
  const iconPaths = {
    Framework: "framework.webp",
    Home: "Home.webp",
    HR: "HR.webp",
    "Frappe HR": "HR.webp",
    Organization: "organization.webp",
    Accounting: "Accounting.webp",
    "ERPNext Settings": "ERPNext_Settings.webp",
    Manufacturing: "Manufacturing.webp",
    Projects: "projects.webp",
    Quality: "quality.webp",
    Selling: "Selling.webp",
    Stock: "Stock.webp",
    Assets: "asset.webp",
    Subcontracting: "subcontrac.webp",
    Buying: "Buying.webp",
    CRM: "CRM.webp",
    Support: "support.webp",
    ERPNext: "erpnext.webp",
  };
  const workspaceAliases = {
    company: "Organization",
    organization: "Organization",
    hr: "HR",
    "erpnext-settings": "ERPNext Settings",
    "global-defaults": "ERPNext Settings",
    manufacturing: "Manufacturing",
    projects: "Projects",
    quality: "Quality",
    selling: "Selling",
    stock: "Stock",
    assets: "Assets",
    subcontracting: "Subcontracting",
    buying: "Buying",
    crm: "CRM",
  };

  // Translate through Frappe (ms_style/locale/*.po), with {0}-style placeholders. The
  // "ms_style" context keeps these entries from overriding Frappe's own translation of
  // the same words; Frappe falls back to its plain entry (doctype names, etc.).
  function t(message, args = []) {
    if (typeof window.__ === "function") return window.__(message, args, "ms_style");
    return message.replace(/\{(\d+)\}/g, (match, index) => args[index] ?? match);
  }

  function getIconPath(name) {
    const fileName = iconPaths[name];
    return fileName ? `${iconBasePath}${fileName}?v=5` : null;
  }

  let desktopIconUpdateToken = 0;
  let desktopLoadingTimer;

  function waitForImage(image) {
    if (image.complete) return Promise.resolve();
    return new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    });
  }

  async function applyDesktopIcons() {
    const desktop = document.querySelector(".desktop-container");
    if (!desktop) return;

    const updateToken = ++desktopIconUpdateToken;
    const pendingImages = [];
    root.classList.remove("ms-desktop-icons-ready");
    root.classList.add("ms-desktop-icons-loading");
    Object.entries(iconPaths).forEach(([name]) => {
      const desktopIcon = document.querySelector(
        `.desktop-container > .icons-container > .icons > .desktop-icon[data-id="${name}"]`
      );
      if (!desktopIcon) return;

      const icon = desktopIcon.querySelector(":scope > .icon-container > .app-icon");
      const container = desktopIcon.querySelector(":scope > .icon-container");
      const iconPath = getIconPath(name);
      if (!iconPath || !container) return;

      if (name === "Accounting" && !icon) {
        if (!container.querySelector(":scope > .ms-folder-hero")) {
          const hero = document.createElement("img");
          hero.className = "ms-folder-hero";
          hero.src = iconPath;
          hero.alt = name;
          container.prepend(hero);
          pendingImages.push(waitForImage(hero));
        }
        return;
      }

      if (icon) {
        if (icon.getAttribute("src") !== iconPath) icon.src = iconPath;
        icon.alt = name;
        pendingImages.push(waitForImage(icon));
      } else {
        let customIcon = container.querySelector(":scope > .ms-custom-icon-image");
        if (!customIcon) {
          customIcon = document.createElement("img");
          customIcon.className = "ms-custom-icon-image";
          container.prepend(customIcon);
        }
        customIcon.src = iconPath;
        customIcon.alt = name;
        pendingImages.push(waitForImage(customIcon));
        const alphabet = container.querySelector(".desktop-alphabet");
        if (alphabet) alphabet.style.display = "none";
      }
    });

    await Promise.all(pendingImages);
    if (updateToken !== desktopIconUpdateToken || desktop !== document.querySelector(".desktop-container")) return;
    root.classList.remove("ms-desktop-icons-loading");
    root.classList.add("ms-desktop-icons-ready");
  }

  function applyEditorIdentityIcons() {
    ["Home", "Support", "ERPNext"].forEach((name) => {
      const card = document.querySelector(`.desktop-icon[data-id="${name}"]`);
      const container = card?.querySelector(":scope > .icon-container");
      const iconPath = getIconPath(name);
      if (!container || !iconPath) return;

      let image = container.querySelector(":scope > .ms-custom-icon-image");
      const nativeImage = container.querySelector(":scope > img.app-icon");
      if (nativeImage) {
        nativeImage.src = iconPath;
        nativeImage.alt = name;
      } else {
        if (!image) {
          image = document.createElement("img");
          image.className = "ms-custom-icon-image";
          container.prepend(image);
        }
        image.src = iconPath;
        image.alt = name;
      }

      const alphabet = container.querySelector(":scope > .desktop-alphabet");
      if (alphabet) alphabet.style.display = "none";
    });
  }

  // Brand icon for the sidebar header, found by the sidebar's own (untranslated) title,
  // then by the desktop folder that workspace lives in (e.g. Payments -> Accounting),
  // then by the route.
  function getWorkspaceIconName() {
    const title = window.frappe?.app?.sidebar?.sidebar_title;
    if (title && iconPaths[title]) return title;
    const folder = title && window.frappe?.boot?.desktop_icons?.find((icon) => icon.label === title)?.parent_icon;
    if (folder && iconPaths[folder]) return folder;
    const routeName = window.location.pathname.split("/").filter(Boolean).pop();
    return workspaceAliases[routeName] || null;
  }

  function applyWorkspaceIcon() {
    const logo = document.querySelector(".body-sidebar .sidebar-header .header-logo");
    const name = logo && getWorkspaceIconName();
    const iconPath = getIconPath(name);
    if (!iconPath) return;

    let image = logo.querySelector("img");
    if (!image) {
      // Frappe draws a letter avatar when the workspace has no desktop icon of its own.
      image = document.createElement("img");
      logo.replaceChildren(image);
    }
    if (image.getAttribute("src") !== iconPath) image.src = iconPath;
    if (image.alt !== name) image.alt = name;
  }

  // navigation.scss draws the navbar logo as a background; use the logo set in
  // Navbar Settings when there is one instead of always the bundled brand logo.
  function applyNavbarLogo() {
    const logo = window.frappe?.boot?.navbar_settings?.app_logo;
    if (typeof logo !== "string" || !/^\/(files|assets)\//.test(logo)) return;
    const value = `url("${encodeURI(decodeURI(logo))}")`;
    if (root.style.getPropertyValue("--ms-navbar-logo-url") !== value) root.style.setProperty("--ms-navbar-logo-url", value);
  }

  function applyUserGreeting() {
    const avatar = document.querySelector(".desktop-avatar");
    if (!avatar) return;

    const userName =
      window.frappe?.session?.user_fullname || window.frappe?.session?.user || "User";
    let greeting = avatar.parentElement?.querySelector(".ms-user-greeting");

    if (!greeting) {
      greeting = document.createElement("span");
      greeting.className = "ms-user-greeting";
      avatar.parentElement?.insertBefore(greeting, avatar);
    }

    const greetingText = t("Welcome, {0}", [userName]);
    if (greeting.textContent !== greetingText) greeting.textContent = greetingText;
  }

  function applyLanguageSwitcher() {
    const avatar = document.querySelector(".desktop-avatar");
    const tools = avatar?.parentElement;
    if (!tools || tools.querySelector(".ms-language-switcher")) return;

    tools.classList.add("ms-user-tools");

    const language = window.frappe?.boot?.lang || document.documentElement.lang || "en";
    const switcher = document.createElement("div");
    const button = document.createElement("button");
    switcher.className = "ms-language-switcher";
    button.type = "button";
    button.className = "ms-language-button";
    button.innerHTML = '<svg class="icon icon-sm ms-language-globe" aria-hidden="true"><use href="#icon-globe"></use></svg><span class="ms-language-current"></span>';
    const currentLanguage = language.toLowerCase().startsWith("ar") ? "ar" : "en";
    const selectedLanguage = currentLanguage === "ar" ? "en" : "ar";
    // The button switches straight away, so it names the language it switches to
    // (same as the login page toggle).
    const label = button.querySelector(".ms-language-current");
    label.textContent = selectedLanguage === "ar" ? "عربي" : "EN";
    label.lang = selectedLanguage;
    const actionLabel = selectedLanguage === "ar" ? "التبديل إلى العربية" : "Switch to English";
    button.title = actionLabel;
    button.setAttribute("aria-label", actionLabel);
    button.addEventListener("click", () => {
      button.disabled = true;
      window.frappe?.call({
        method: "frappe.client.set_value",
        args: {
          doctype: "User",
          name: window.frappe.session.user,
          fieldname: "language",
          value: selectedLanguage,
        },
        callback: () => {
          const url = new URL(window.location.href);
          url.searchParams.delete("_lang");
          window.location.assign(url.toString());
        },
      });
    });
    switcher.append(button);
    tools.insertBefore(switcher, tools.querySelector(".ms-user-greeting") || avatar);
  }

  let myWorkCenterLoaded = false;
  let myWorkCenterLoading = false;
  // Set when the last load failed. The desk panel then shows the empty fallback and
  // waits for the next visit to the desk home instead of retrying on every DOM change.
  let myWorkCenterFailed = false;
  let myWorkCenterLoadTimer = null;

  function escapeWorkCenterHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    }[character]));
  }

  function openWorkCenterDocument(doctype, name) {
    if (doctype && name) window.frappe?.set_route?.("Form", doctype, name);
  }

  // Desk URL for a Route History entry ("List/Sales Invoice/List", "Workspaces/Selling"...),
  // so the link opens in place through Frappe's router or in a new tab on Ctrl+click.
  function getRouteHref(route) {
    const router = window.frappe?.router;
    if (!router?.make_url) return "#";
    const parts = router.get_route_from_arguments([route]);
    if (parts[0] === "Workspaces" && parts[1]) return `/desk/${router.slug(parts[1])}`;
    return router.make_url(router.convert_from_standard_route(parts));
  }

  function renderMyWorkCenter(data) {
    const panel = document.querySelector(".ms-my-work-center, .ms-work-center-modal");
    if (!panel) return;

    const actions = data?.actions || [];
    const recent = data?.recent || [];
    // Both come from the user's Route History on the server (api._get_quick_create / _get_frequent).
    const frequentRoutes = data?.frequent || [];
    const quickCreateItems = data?.quick_create || [];
    const counts = data?.counts || { actions: 0, approvals: 0, tasks: 0, drafts: 0 };
    const recentMarkup = recent.length
      ? recent.map((item) => `
          <button class="ms-work-recent" type="button" data-doctype="${escapeWorkCenterHtml(item.doctype)}" data-name="${escapeWorkCenterHtml(item.name)}">
            <span>${escapeWorkCenterHtml(item.title)}</span><small>${escapeWorkCenterHtml(item.subtitle)}</small>
          </button>
        `).join("")
      : `<p class="ms-work-empty">${t("Your recent work will appear here.")}</p>`;
    const frequentMarkup = frequentRoutes.length
      ? frequentRoutes.map((item, index) => `<a class="ms-work-route" href="${escapeWorkCenterHtml(getRouteHref(item.route))}"><span><b>0${index + 1}</b>${escapeWorkCenterHtml(item.label)}</span><small>${t("{0} visits", [item.count])}</small></a>`).join("")
      : `<p class="ms-work-empty">${t("Your frequent work will appear here.")}</p>`;
    const support = data?.support || {};
    const supportPhone = String(support.phone || "").replace(/[^\d+]/g, "");
    const supportWhatsapp = String(support.whatsapp || "").replace(/\D/g, "");
    const supportMarkup = supportPhone || supportWhatsapp
      ? `<section class="ms-work-support"><span>${t("Need help?")}</span>${support.message ? `<p>${escapeWorkCenterHtml(support.message)}</p>` : ""}<div>${supportPhone ? `<a href="tel:${supportPhone}"><svg class="icon icon-sm" aria-hidden="true"><use href="#icon-phone"></use></svg>${t("Call")}</a>` : ""}${supportWhatsapp ? `<a href="https://wa.me/${supportWhatsapp}" target="_blank" rel="noopener"><svg class="icon icon-sm" aria-hidden="true"><use href="#icon-message-circle"></use></svg>${t("WhatsApp")}</a>` : ""}</div></section>`
      : "";
    const quickCreateMarkup = quickCreateItems.length
      ? quickCreateItems.map((item) => `<button type="button" data-create-doctype="${escapeWorkCenterHtml(item.doctype)}">${escapeWorkCenterHtml(item.label)}</button>`).join("")
      : `<p class="ms-work-empty">${t("Your create shortcuts will appear here as you work.")}</p>`;

    panel.innerHTML = `
      <div class="ms-work-heading">
        <div><span class="ms-work-eyebrow">${t("Personal workspace")}</span><h2>${t("My Work Center")}</h2><p>${t("Everything that needs your attention.")}</p></div>
        <span class="ms-work-status-dot" title="${t("Live workspace")}"></span>
      </div>
      <div class="ms-work-summary">
        <button type="button" data-summary-kind="all"><strong>${counts.actions}</strong><span>${t("Open items")}</span></button>
        <button type="button" data-summary-kind="approval"><strong>${counts.approvals}</strong><span>${t("Approvals")}</span></button>
        <button type="button" data-summary-kind="task"><strong>${counts.tasks}</strong><span>${t("Tasks")}</span></button>
        <button type="button" data-summary-kind="draft"><strong>${counts.drafts}</strong><span>${t("Drafts")}</span></button>
      </div>
      <section class="ms-work-section"><div class="ms-work-section-title"><h3>${t("Quick create")}</h3><span>${t("Based on your work")}</span></div><div class="ms-work-quick-actions">${quickCreateMarkup}</div></section>
      ${recent.length ? `<section class="ms-work-section"><div class="ms-work-section-title"><h3>${t("Recent work")}</h3><span>${t("{0} latest", [recent.length])}</span></div><div class="ms-work-recent-list">${recentMarkup}</div></section>` : ""}
      <section class="ms-work-section"><div class="ms-work-section-title"><h3>${t("Most used")}</h3><span>${t("Top 5")}</span></div><div class="ms-work-route-list">${frequentMarkup}</div></section>
      ${supportMarkup}
    `;

    panel.querySelectorAll(".ms-work-item, .ms-work-recent").forEach((item) => {
      item.addEventListener("click", () => openWorkCenterDocument(item.dataset.doctype, item.dataset.name));
    });
    panel.querySelectorAll("[data-create-doctype]").forEach((button) => {
      // frappe.new_doc honours the doctype's Quick Entry dialog and custom create routes.
      button.addEventListener("click", () => window.frappe?.new_doc?.(button.dataset.createDoctype));
    });
    panel.querySelectorAll("[data-summary-kind]").forEach((button) => {
      button.addEventListener("click", () => openWorkItemsPopup(button.dataset.summaryKind));
    });
  }

  function loadMyWorkCenter() {
    if (myWorkCenterLoaded || myWorkCenterLoading || !window.frappe?.call) return;
    myWorkCenterLoading = true;
    window.frappe.call({
      method: "ms_style.ms_style.api.get_my_work_center",
      callback: (response) => {
        myWorkCenterLoaded = true;
        myWorkCenterLoading = false;
        myWorkCenterFailed = false;
        window.msMyWorkCenterData = response?.message || {};
        renderMyWorkCenter(window.msMyWorkCenterData);
      },
      error: () => {
        myWorkCenterLoading = false;
        myWorkCenterFailed = true;
        window.msMyWorkCenterData = { counts: { actions: 0, approvals: 0, tasks: 0, drafts: 0 } };
        renderMyWorkCenter(window.msMyWorkCenterData);
      },
    });
  }

  function applyMyWorkCenter() {
    const desktop = document.querySelector(".desktop-container");
    const isDeskHome = /^\/desk\/?$/.test(window.location.pathname);
    const shouldShow = isDeskHome && desktop && window.innerWidth >= 768;
    const existing = document.querySelector(".ms-my-work-center");

    if (!shouldShow) {
      existing?.remove();
      document.documentElement.classList.remove("ms-my-work-center-ready");
      return;
    }
    let panel = desktop.querySelector(":scope > .ms-my-work-center");
    const created = !panel;
    if (created) {
      panel = document.createElement("aside");
      panel.className = "ms-my-work-center";
      panel.setAttribute("aria-label", t("My Work Center"));
      desktop.prepend(panel);
    }
    document.documentElement.classList.add("ms-my-work-center-ready");
    // This runs on every observed DOM change, so only touch the panel when it is new:
    // rewriting it here would itself be a DOM change and re-trigger the observer.
    if (myWorkCenterLoaded || myWorkCenterFailed) {
      if (created) renderMyWorkCenter(window.msMyWorkCenterData || {});
      return;
    }
    if (created) panel.innerHTML = `<div class="ms-work-loading">${t("Loading your work center...")}</div>`;
    // Many DOM changes can land before the delayed load starts; queue it only once.
    if (!myWorkCenterLoading && !myWorkCenterLoadTimer) {
      myWorkCenterLoadTimer = window.setTimeout(() => {
        myWorkCenterLoadTimer = null;
        loadMyWorkCenter();
      }, 250);
    }
  }

  function openMyWorkCenterPopup() {
    let overlay = document.querySelector(".ms-work-center-overlay");
    if (overlay) return;

    overlay = document.createElement("div");
    overlay.className = "ms-work-center-overlay";
    overlay.innerHTML = `<div class="ms-work-center-dialog" role="dialog" aria-modal="true" aria-label="${t("My Work Center")}"><button type="button" class="ms-work-center-close" aria-label="${t("Close")}">&times;</button><div class="ms-work-center-modal"></div></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay || event.target.closest(".ms-work-center-close")) overlay.remove();
    });
    const panel = overlay.querySelector(".ms-work-center-modal");
    if (myWorkCenterLoaded) {
      renderMyWorkCenter(window.msMyWorkCenterData || {});
    } else {
      panel.innerHTML = `<div class="ms-work-loading">${t("Loading your work center...")}</div>`;
      loadMyWorkCenter();
    }
  }

  function openWorkItemsPopup(kind) {
    const data = window.msMyWorkCenterData || {};
    const items = (data.actions || []).filter((item) => kind === "all" || item.kind === kind);
    const title = t(kind === "approval" ? "Approvals" : kind === "task" ? "Tasks" : kind === "draft" ? "Drafts" : "Open items");
    const overlay = document.createElement("div");
    overlay.className = "ms-work-center-overlay";
    overlay.innerHTML = `<div class="ms-work-center-dialog ms-work-items-dialog" role="dialog" aria-modal="true" aria-label="${title}"><button type="button" class="ms-work-center-close" aria-label="${t("Close")}">&times;</button><div class="ms-work-items-content"><span class="ms-work-eyebrow">${t("My Work Center")}</span><h2>${title}</h2><p>${t("Items linked to your work: {0}", [items.length])}</p><div class="ms-work-items-list">${items.length ? items.map((item) => `<button class="ms-work-item" type="button" data-doctype="${escapeWorkCenterHtml(item.doctype)}" data-name="${escapeWorkCenterHtml(item.name)}"><span class="ms-work-item-icon ${item.kind === "approval" ? "is-approval" : "is-task"}"><svg class="icon icon-sm" aria-hidden="true"><use href="#icon-${item.kind === "approval" ? "check" : "check-square"}"></use></svg></span><span class="ms-work-item-copy"><strong>${escapeWorkCenterHtml(item.title)}</strong><small>${escapeWorkCenterHtml(item.subtitle)}</small></span><svg class="icon icon-xs ms-work-item-arrow" aria-hidden="true"><use href="#icon-chevron-right"></use></svg></button>`).join("") : `<p class="ms-work-empty">${t("Nothing needs your attention here.")}</p>`}</div></div></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay || event.target.closest(".ms-work-center-close")) overlay.remove();
    });
    overlay.querySelectorAll(".ms-work-item").forEach((item) => {
      item.addEventListener("click", () => openWorkCenterDocument(item.dataset.doctype, item.dataset.name));
    });
  }

  function applyMobileFooter() {
    const footer = document.querySelector(".ms-mobile-footer");

    if (window.innerWidth > 767) {
      footer?.remove();
      document.body.classList.remove("ms-mobile-footer-active");
      return;
    }

    if (footer) return;

    const mobileFooter = document.createElement("nav");
    mobileFooter.className = "ms-mobile-footer";
    mobileFooter.setAttribute("aria-label", t("Mobile navigation"));
    mobileFooter.innerHTML = `
      <button type="button" class="ms-mobile-footer-button" data-action="home">
        <svg class="icon icon-md" aria-hidden="true"><use href="#icon-home"></use></svg>
        <span>${t("Home")}</span>
      </button>
      <button type="button" class="ms-mobile-footer-button" data-action="search">
        <svg class="icon icon-md" aria-hidden="true"><use href="#icon-search"></use></svg>
        <span>${t("Search")}</span>
      </button>
      <button type="button" class="ms-mobile-footer-button" data-action="work">
        <svg class="icon icon-md" aria-hidden="true"><use href="#icon-clipboard"></use></svg>
        <span>${t("Work")}</span>
      </button>
      <button type="button" class="ms-mobile-footer-button" data-action="back">
        <svg class="icon icon-md" aria-hidden="true"><use href="#icon-arrow-left"></use></svg>
        <span>${t("Back")}</span>
      </button>
    `;

    mobileFooter.querySelector('[data-action="home"]').addEventListener("click", () => {
      if (window.frappe?.set_route) window.frappe.set_route("");
      else window.location.assign("/desk");
    });
    mobileFooter.querySelector('[data-action="search"]').addEventListener("click", () => {
      const searchTrigger =
        document.querySelector(".page-head .search-bar .search-icon") ||
        document.querySelector("#desktop-navbar-modal-search");
      searchTrigger?.click();
    });
    mobileFooter.querySelector('[data-action="work"]').addEventListener("click", openMyWorkCenterPopup);
    mobileFooter.querySelector('[data-action="back"]').addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.assign("/desk");
      }
    });

    document.body.appendChild(mobileFooter);
    document.body.classList.add("ms-mobile-footer-active");
  }

  function showDesktopLoading() {
    root.classList.remove("ms-desktop-icons-ready");
    root.classList.add("ms-desktop-icons-loading");
    window.clearTimeout(desktopLoadingTimer);
    desktopLoadingTimer = window.setTimeout(() => {
      root.classList.remove("ms-desktop-icons-loading");
      root.classList.add("ms-desktop-icons-ready");
    }, 1500);
  }

  function bindResetLayoutLoading() {
    if (document.documentElement.dataset.msResetLayoutLoading) return;
    document.documentElement.dataset.msResetLayoutLoading = "true";
    // "Reset Layout" is an item of the desktop's right-click menu (frappe.ui.create_menu
    // in desk/page/desktop/desktop.js), so only that menu's item title is checked here
    // rather than reading the text of whatever element was clicked.
    document.addEventListener("click", (event) => {
      const title = event.target.closest?.(".frappe-menu .dropdown-menu-item")?.querySelector(".menu-item-title");
      const label = title?.textContent.trim().toLowerCase();
      if (!label) return;
      if (label === "reset layout" || label === window.__?.("Reset Layout")?.toLowerCase()) showDesktopLoading();
    }, true);
  }

  // Earlier versions kept a visit log in localStorage; Route History replaced it.
  function forgetLegacyVisitLog() {
    try {
      window.localStorage.removeItem(`ms_style:recent-work:${encodeURIComponent(window.frappe?.session?.user || "guest")}`);
    } catch (error) {
      // Restricted storage: nothing to clean up.
    }
  }

  function initialize() {
    applyNavbarLogo();
    applyDesktopIcons();
    applyEditorIdentityIcons();
    applyWorkspaceIcon();
    applyUserGreeting();
    applyLanguageSwitcher();
    forgetLegacyVisitLog();
    applyMobileFooter();
    applyMyWorkCenter();
    bindResetLayoutLoading();
    window.frappe?.router?.on?.("change", () => {
      applyMobileFooter();
      // A failed load gets one fresh attempt each time the user comes back to the desk home.
      if (myWorkCenterFailed && /^\/desk\/?$/.test(window.location.pathname)) myWorkCenterFailed = false;
      applyMyWorkCenter();
      if (myWorkCenterLoaded) renderMyWorkCenter(window.msMyWorkCenterData || {});
    });
    if (!document.documentElement.dataset.msFooterResizeSync) {
      document.documentElement.dataset.msFooterResizeSync = "true";
      window.addEventListener("resize", applyMobileFooter, { passive: true });
    }
    const desktop = document.querySelector(".desktop-container");
    const container = document.querySelector(".body-sidebar-container");
    let updateQueued = false;
    const update = () => {
      if (updateQueued) return;
      updateQueued = true;
      window.requestAnimationFrame(() => {
        updateQueued = false;
        applyDesktopIcons();
        applyEditorIdentityIcons();
        applyWorkspaceIcon();
        applyUserGreeting();
        applyLanguageSwitcher();
        applyMyWorkCenter();
      });
    };
    const observer = new MutationObserver(() => {
      update();
    });
    if (desktop) observer.observe(desktop, { childList: true, subtree: true });
    if (container) {
      observer.observe(container, {
        attributes: true,
        attributeFilter: ["class"],
        childList: true,
        subtree: true,
      });
    }
  }

  $(initialize);
})();
