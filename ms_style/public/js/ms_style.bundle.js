import "./login_branding.js";

(() => {
  const root = document.documentElement;
  const iconBasePath = "/assets/ms_style/Icone/";
  const iconPaths = {
    Framework: "framework.jpeg",
    Home: "Home.jpeg",
    HR: "HR.jpeg",
    "Frappe HR": "HR.jpeg",
    Organization: "organization.jpeg",
    Accounting: "Accounting.jpeg",
    "ERPNext Settings": "ERPNext_Settings.jpeg",
    Manufacturing: "Manufacturing.jpeg",
    Projects: "projects.jpeg",
    Quality: "quality.jpeg",
    Selling: "Selling.jpeg",
    Stock: "Stock.jpeg",
    Assets: "asset.jpeg",
    Subcontracting: "subcontrac.jpeg",
    Buying: "Buying.jpeg",
    CRM: "CRM.jpeg",
    Support: "support.jpeg",
    ERPNext: "erpnext.jpeg",
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

  function getIconPath(name) {
    const fileName = iconPaths[name];
    return fileName ? `${iconBasePath}${fileName}?v=4` : null;
  }

  function syncSidebarState() {
    const container = document.querySelector(".body-sidebar-container");
    if (!container) return;
    root.classList.toggle("ms-sidebar-expanded", container.classList.contains("expanded"));
    root.classList.toggle("ms-sidebar-collapsed", !container.classList.contains("expanded"));
  }

  function applyConfiguredLogo() {
    const logo = document.querySelector("#brand-logo");
    const appLogo = "/assets/ms_style/images/logo-horizontal-dark-bg.png?v=1";
    if (!logo) return;

    const configuredLogo = new URL(appLogo, window.location.origin).href;
    if (logo.src !== configuredLogo) logo.src = appLogo;
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

  function applyWorkspaceIcon() {
    const sidebarIcon = document.querySelector(".body-sidebar > .sidebar-header img");
    if (!sidebarIcon) return;

    const routeName = window.location.pathname.split("/").filter(Boolean).pop();
    const workspaceName = workspaceAliases[routeName];
    const iconPath = getIconPath(workspaceName);
    if (iconPath && sidebarIcon.getAttribute("src") !== iconPath) {
      sidebarIcon.src = iconPath;
      sidebarIcon.alt = workspaceName;
    }
  }

  function applyUserGreeting() {
    const avatar = document.querySelector(".desktop-avatar");
    if (!avatar) return;

    const userName =
      window.frappe?.session?.user_fullname || window.frappe?.session?.user || "User";
    const language = window.frappe?.boot?.lang || document.documentElement.lang || "en";
    const isArabic = language.toLowerCase().startsWith("ar");
    let greeting = avatar.parentElement?.querySelector(".ms-user-greeting");

    if (!greeting) {
      greeting = document.createElement("span");
      greeting.className = "ms-user-greeting";
      avatar.parentElement?.insertBefore(greeting, avatar);
    }

    const direction = isArabic ? "rtl" : "ltr";
    if (greeting.dir !== direction) greeting.dir = direction;
    const greetingText = `${isArabic ? "مرحباً" : "Welcome"}, ${userName}`;
    if (greeting.textContent !== greetingText) greeting.textContent = greetingText;
  }

  function applyLanguageSwitcher() {
    const avatar = document.querySelector(".desktop-avatar");
    const tools = avatar?.parentElement;
    if (!tools || tools.querySelector(".ms-language-switcher")) return;

    tools.classList.add("ms-user-tools");

    const language = window.frappe?.boot?.lang || document.documentElement.lang || "en";
    const switcher = document.createElement("label");
    const button = document.createElement("button");
    switcher.className = "ms-language-switcher";
    switcher.setAttribute("aria-label", "Language");
    button.type = "button";
    button.className = "ms-language-button";
    button.setAttribute("aria-label", "Change language");
    button.innerHTML = '<span class="ms-language-globe">文</span><span class="ms-language-current"></span>';
    const currentLanguage = language.toLowerCase().startsWith("ar") ? "ar" : "en";
    const selectedLanguage = currentLanguage === "ar" ? "en" : "ar";
    button.querySelector(".ms-language-current").textContent = currentLanguage === "ar" ? "ع" : "EN";
    button.title = selectedLanguage === "ar" ? "Switch to Arabic" : "Switch to English";
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

  function getWorkRouteKey() {
    const user = window.frappe?.session?.user || "guest";
    return `ms_style:recent-work:${encodeURIComponent(user)}`;
  }

  function getFrequentRoutes() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(getWorkRouteKey()) || "[]");
      return Array.isArray(saved) ? saved.slice(0, 5) : [];
    } catch (error) {
      return [];
    }
  }

  function recordFrequentRoute() {
    const pathname = window.location.pathname;
    if (!pathname.startsWith("/desk/") || pathname === "/desk/") return;
    const label = pathname.split("/").filter(Boolean).pop().replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    const route = { path: pathname, label, count: 1 };
    const routes = getFrequentRoutes().filter((item) => item.path !== pathname);
    const previous = getFrequentRoutes().find((item) => item.path === pathname);
    route.count += previous?.count || 0;
    routes.unshift(route);
    try {
      window.localStorage.setItem(getWorkRouteKey(), JSON.stringify(routes.sort((first, second) => second.count - first.count).slice(0, 5)));
    } catch (error) {
      // Restricted storage should not affect navigation.
    }
  }

  function getQuickCreateItems() {
    const fallback = ["Purchase Order", "Project"];
    const routeItems = getFrequentRoutes().map((item) => item.path
      .split("/")
      .filter(Boolean)
      .pop()
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()));
    const candidates = [...routeItems, ...fallback];
    return [...new Set(candidates)]
      .filter((doctype) => window.frappe?.model?.can_create?.(doctype))
      .slice(0, 3);
  }

  function renderMyWorkCenter(data) {
    const panel = document.querySelector(".ms-my-work-center, .ms-work-center-modal");
    if (!panel) return;

    const actions = data?.actions || [];
    const recent = data?.recent || [];
    const frequentRoutes = getFrequentRoutes();
    const quickCreateItems = getQuickCreateItems();
    const counts = data?.counts || { actions: 0, approvals: 0, tasks: 0, drafts: 0 };
    const recentMarkup = recent.length
      ? recent.map((item) => `
          <button class="ms-work-recent" type="button" data-doctype="${escapeWorkCenterHtml(item.doctype)}" data-name="${escapeWorkCenterHtml(item.name)}">
            <span>${escapeWorkCenterHtml(item.title)}</span><small>${escapeWorkCenterHtml(item.subtitle)}</small>
          </button>
        `).join("")
      : '<p class="ms-work-empty">Your recent work will appear here.</p>';
    const frequentMarkup = frequentRoutes.length
      ? frequentRoutes.map((item, index) => `<a class="ms-work-route" href="${escapeWorkCenterHtml(item.path)}"><span><b>0${index + 1}</b>${escapeWorkCenterHtml(item.label)}</span><small>${item.count} visits</small></a>`).join("")
      : '<p class="ms-work-empty">Your frequent work will appear here.</p>';
    const quickCreateMarkup = quickCreateItems.length
      ? quickCreateItems.map((doctype) => `<button type="button" data-create-doctype="${escapeWorkCenterHtml(doctype)}">${escapeWorkCenterHtml(doctype)}</button>`).join("")
      : '<p class="ms-work-empty">No create shortcuts available.</p>';

    panel.innerHTML = `
      <div class="ms-work-heading">
        <div><span class="ms-work-eyebrow">PERSONAL WORKSPACE</span><h2>My Work Center</h2><p>Everything that needs your attention.</p></div>
        <span class="ms-work-status-dot" title="Live workspace"></span>
      </div>
      <div class="ms-work-summary">
        <button type="button" data-summary-kind="all"><strong>${counts.actions}</strong><span>Open items</span></button>
        <button type="button" data-summary-kind="approval"><strong>${counts.approvals}</strong><span>Approvals</span></button>
        <button type="button" data-summary-kind="task"><strong>${counts.tasks}</strong><span>Tasks</span></button>
        <button type="button" data-summary-kind="draft"><strong>${counts.drafts}</strong><span>Drafts</span></button>
      </div>
      <section class="ms-work-section"><div class="ms-work-section-title"><h3>Quick create</h3><span>Based on your work</span></div><div class="ms-work-quick-actions">${quickCreateMarkup}</div></section>
      ${recent.length ? `<section class="ms-work-section"><div class="ms-work-section-title"><h3>Recent work</h3><span>${recent.length} latest</span></div><div class="ms-work-recent-list">${recentMarkup}</div></section>` : ""}
      <section class="ms-work-section"><div class="ms-work-section-title"><h3>Most used</h3><span>Top 5</span></div><div class="ms-work-route-list">${frequentMarkup}</div></section>
      <section class="ms-work-support"><span>Need help?</span><p>Talk to Mohamed directly.</p><div><a href="tel:+201001935187"><svg class="icon icon-sm" aria-hidden="true"><use href="#icon-phone"></use></svg>Call</a><a href="https://wa.me/201551533177" target="_blank" rel="noopener"><svg class="icon icon-sm" aria-hidden="true"><use href="#icon-message-circle"></use></svg>WhatsApp</a></div></section>
    `;

    panel.querySelectorAll(".ms-work-item, .ms-work-recent").forEach((item) => {
      item.addEventListener("click", () => openWorkCenterDocument(item.dataset.doctype, item.dataset.name));
    });
    panel.querySelectorAll("[data-create-doctype]").forEach((button) => {
      button.addEventListener("click", () => {
        const doctype = button.dataset.createDoctype;
        const routeName = `new-${doctype.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        window.frappe?.set_route?.("Form", doctype, routeName);
      });
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
        window.msMyWorkCenterData = response?.message || {};
        renderMyWorkCenter(window.msMyWorkCenterData);
      },
      error: () => {
        myWorkCenterLoading = false;
        window.msMyWorkCenterData = { counts: { actions: 0, approvals: 0, tasks: 0 } };
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
    if (!panel) {
      panel = document.createElement("aside");
      panel.className = "ms-my-work-center";
      panel.setAttribute("aria-label", "My Work Center");
      desktop.prepend(panel);
    }
    document.documentElement.classList.add("ms-my-work-center-ready");
    if (!myWorkCenterLoaded) {
      panel.innerHTML = '<div class="ms-work-loading">Loading your work center...</div>';
      window.setTimeout(loadMyWorkCenter, 250);
    }
  }

  function openMyWorkCenterPopup() {
    let overlay = document.querySelector(".ms-work-center-overlay");
    if (overlay) return;

    overlay = document.createElement("div");
    overlay.className = "ms-work-center-overlay";
    overlay.innerHTML = '<div class="ms-work-center-dialog" role="dialog" aria-modal="true" aria-label="My Work Center"><button type="button" class="ms-work-center-close" aria-label="Close">&times;</button><div class="ms-work-center-modal"></div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay || event.target.closest(".ms-work-center-close")) overlay.remove();
    });
    const panel = overlay.querySelector(".ms-work-center-modal");
    if (myWorkCenterLoaded) {
      renderMyWorkCenter(window.msMyWorkCenterData || {});
    } else {
      panel.innerHTML = '<div class="ms-work-loading">Loading your work center...</div>';
      loadMyWorkCenter();
    }
  }

  function openWorkItemsPopup(kind) {
    const data = window.msMyWorkCenterData || {};
    const items = (data.actions || []).filter((item) => kind === "all" || item.kind === kind);
    const title = kind === "approval" ? "Approvals" : kind === "task" ? "Tasks" : kind === "draft" ? "Drafts" : "Open items";
    const overlay = document.createElement("div");
    overlay.className = "ms-work-center-overlay";
    overlay.innerHTML = `<div class="ms-work-center-dialog ms-work-items-dialog" role="dialog" aria-modal="true" aria-label="${title}"><button type="button" class="ms-work-center-close" aria-label="Close">&times;</button><div class="ms-work-items-content"><span class="ms-work-eyebrow">MY WORK CENTER</span><h2>${title}</h2><p>${items.length} item${items.length === 1 ? "" : "s"} linked to your work.</p><div class="ms-work-items-list">${items.length ? items.map((item) => `<button class="ms-work-item" type="button" data-doctype="${escapeWorkCenterHtml(item.doctype)}" data-name="${escapeWorkCenterHtml(item.name)}"><span class="ms-work-item-icon ${item.kind === "approval" ? "is-approval" : "is-task"}"><svg class="icon icon-sm" aria-hidden="true"><use href="#icon-${item.kind === "approval" ? "check" : "check-square"}"></use></svg></span><span class="ms-work-item-copy"><strong>${escapeWorkCenterHtml(item.title)}</strong><small>${escapeWorkCenterHtml(item.subtitle)}</small></span><svg class="icon icon-xs ms-work-item-arrow" aria-hidden="true"><use href="#icon-chevron-right"></use></svg></button>`).join("") : '<p class="ms-work-empty">Nothing needs your attention here.</p>'}</div></div></div>`;
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
    const isDeskHome = /^\/desk\/?$/.test(window.location.pathname);

    if (window.innerWidth > 767) {
      footer?.remove();
      document.body.classList.remove("ms-mobile-footer-active");
      return;
    }

    if (footer) return;

    const mobileFooter = document.createElement("nav");
    mobileFooter.className = "ms-mobile-footer";
    mobileFooter.setAttribute("aria-label", "Mobile navigation");
    mobileFooter.innerHTML = `
      <button type="button" class="ms-mobile-footer-button" data-action="home" aria-label="Home">
        <svg class="icon icon-md" aria-hidden="true"><use href="#icon-home"></use></svg>
        <span>Home</span>
      </button>
      <button type="button" class="ms-mobile-footer-button" data-action="search" aria-label="Search">
        <svg class="icon icon-md" aria-hidden="true"><use href="#icon-search"></use></svg>
        <span>Search</span>
      </button>
      <button type="button" class="ms-mobile-footer-button" data-action="work" aria-label="My Work">
        <svg class="icon icon-md" aria-hidden="true"><use href="#icon-clipboard"></use></svg>
        <span>Work</span>
      </button>
      <button type="button" class="ms-mobile-footer-button" data-action="back" aria-label="Back">
        <svg class="icon icon-md" aria-hidden="true"><use href="#icon-arrow-left"></use></svg>
        <span>Back</span>
      </button>
    `;

    mobileFooter.querySelector('[data-action="home"]').addEventListener("click", () => {
      window.location.assign("/desk");
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
    document.addEventListener("click", (event) => {
      const target = event.target.closest("button, a, [role=\"menuitem\"], li, div");
      const label = target?.textContent?.trim().toLowerCase();
      if (label === "reset layout" || label?.endsWith("reset layout")) showDesktopLoading();
    }, true);
  }

  function initialize() {
    applyConfiguredLogo();
    window.setTimeout(applyConfiguredLogo, 0);
    window.setTimeout(applyConfiguredLogo, 500);
    applyDesktopIcons();
    applyEditorIdentityIcons();
    applyWorkspaceIcon();
    applyUserGreeting();
    applyLanguageSwitcher();
    recordFrequentRoute();
    applyMobileFooter();
    applyMyWorkCenter();
    bindResetLayoutLoading();
    window.frappe?.router?.on?.("change", () => {
      recordFrequentRoute();
      applyMobileFooter();
      applyMyWorkCenter();
      if (myWorkCenterLoaded) renderMyWorkCenter(window.msMyWorkCenterData || {});
    });
    if (!document.documentElement.dataset.msFooterResizeSync) {
      document.documentElement.dataset.msFooterResizeSync = "true";
      window.addEventListener("resize", applyMobileFooter, { passive: true });
    }
    syncSidebarState();
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
        syncSidebarState();
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
