import "./notification_counter";
import "./document_views";

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
    "إدارة الحركة": "fleet.webp",
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

  // Desk tiles, folder popups and the sidebar header take their image from
  // frappe.utils.get_desktop_icon while Frappe draws them (ui/desktop_icon.html). Answering
  // with the brand artwork there draws it from the start. Swapping it in afterwards showed
  // Frappe's icons first, and missed the desk Frappe draws anew on every visit to it.
  function useBrandDesktopIcons() {
    const utils = window.frappe?.utils;
    const getDesktopIcon = utils?.get_desktop_icon;
    if (typeof getDesktopIcon !== "function" || getDesktopIcon.msBrandIcons) return;
    const brandDesktopIcon = function (name, variant) {
      return getIconPath(name) || getDesktopIcon.call(this, name, variant);
    };
    brandDesktopIcon.msBrandIcons = true;
    utils.get_desktop_icon = brandDesktopIcon;
  }

  // Accounting is a folder on the desk, drawn as thumbnails of the workspaces in it; the
  // brand artwork goes over them (workspace.scss).
  function applyFolderHero() {
    const folder = document.querySelector(
      '.desktop-container > .icons-container > .icons > .desktop-icon[data-id="Accounting"] > .icon-container.folder-icon'
    );
    if (!folder || folder.querySelector(":scope > .ms-folder-hero")) return;
    const hero = document.createElement("img");
    hero.className = "ms-folder-hero";
    hero.src = getIconPath("Accounting");
    hero.alt = "Accounting";
    folder.prepend(hero);
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

  // `refresh` re-reads data that is already shown (on coming back to the desk home);
  // the current data stays on screen until the answer arrives, and if that request
  // fails.
  function loadMyWorkCenter(refresh = false) {
    if ((myWorkCenterLoaded && !refresh) || myWorkCenterLoading || !window.frappe?.call) return;
    myWorkCenterLoading = true;
    window.frappe.call({
      method: "ms_style.ms_style.api.get_my_work_center",
      // Visits Frappe's router has not sent yet (it batches them for 10 seconds), so
      // "Most used" already counts the page the user just came back from.
      args: { pending_routes: (window.frappe.route_history_queue || []).map((entry) => entry.route) },
      callback: (response) => {
        myWorkCenterLoaded = true;
        myWorkCenterLoading = false;
        myWorkCenterFailed = false;
        window.msMyWorkCenterData = response?.message || {};
        renderMyWorkCenter(window.msMyWorkCenterData);
      },
      error: () => {
        myWorkCenterLoading = false;
        if (refresh && myWorkCenterLoaded) return;
        myWorkCenterFailed = true;
        window.msMyWorkCenterData = { counts: { actions: 0, approvals: 0, tasks: 0, drafts: 0 } };
        renderMyWorkCenter(window.msMyWorkCenterData);
      },
    });
  }

  // The desk home is /desk; Frappe also serves its desktop page at /desk/desktop.
  function isDeskHome() {
    return /^\/desk(\/desktop)?\/?$/.test(window.location.pathname);
  }

  function applyMyWorkCenter() {
    const desktop = document.querySelector(".desktop-container");
    const shouldShow = isDeskHome() && desktop && window.innerWidth >= 768;
    const existing = document.querySelector(".ms-my-work-center");

    if (!shouldShow) {
      existing?.remove();
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
      loadMyWorkCenter(true);
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

  // Phones (up to 767px, Frappe's own mobile width): a bottom bar within thumb reach.
  const footerButtons = [
    { action: "home", icon: "home", label: "Home" },
    { action: "search", icon: "search", label: "Search" },
    { action: "work", icon: "clipboard", label: "Work" },
    // "Notifications" does not fit a fifth of a phone screen.
    { action: "notifications", icon: "bell", label: "Alerts" },
    { action: "back", icon: "arrow-left", label: "Back" },
  ];

  const footerActions = {
    home() {
      if (window.frappe?.set_route) window.frappe.set_route("");
      else window.location.assign("/desk");
    },
    search() {
      const searchTrigger =
        document.querySelector(".page-head .search-bar .search-icon") ||
        document.querySelector("#desktop-navbar-modal-search");
      searchTrigger?.click();
    },
    work: openMyWorkCenterPopup,
    // Frappe's own notification panel: the bell on the desk home, elsewhere the one in the
    // sidebar, which on phones stays inside the closed drawer. responsive.scss shows either
    // as a sheet above this bar.
    notifications() {
      const bell = document.querySelector(".desktop-notifications .dropdown-notifications > .nav-link");
      if (bell?.offsetParent) bell.click();
      else document.querySelector(".body-sidebar .dropdown-notifications")?.classList.toggle("hidden");
    },
    back() {
      if (window.history.length > 1) window.history.back();
      else window.location.assign("/desk");
    },
  };

  function updateMobileFooter(footer) {
    const home = footer.querySelector('[data-action="home"]');
    const onHome = isDeskHome();
    home.classList.toggle("is-active", onHome);
    if (onHome) home.setAttribute("aria-current", "page");
    else home.removeAttribute("aria-current");
  }

  function applyMobileFooter() {
    const footer = document.querySelector(".ms-mobile-footer");

    if (window.innerWidth > 767) {
      footer?.remove();
      document.body.classList.remove("ms-mobile-footer-active");
      return;
    }

    if (footer) {
      updateMobileFooter(footer);
      return;
    }

    const mobileFooter = document.createElement("nav");
    mobileFooter.className = "ms-mobile-footer";
    mobileFooter.setAttribute("aria-label", t("Mobile navigation"));
    mobileFooter.innerHTML = footerButtons
      .map(
        ({ action, icon, label }) => `<button type="button" class="ms-mobile-footer-button" data-action="${action}">
        <svg class="icon icon-md" aria-hidden="true"><use href="#icon-${icon}"></use></svg>
        <span>${t(label)}</span>
      </button>`
      )
      .join("");
    mobileFooter.addEventListener("click", (event) => {
      const button = event.target.closest(".ms-mobile-footer-button");
      if (!button) return;
      // Frappe and Bootstrap close open panels on a click elsewhere in the page; this
      // click opens one, so it stops here.
      event.stopPropagation();
      footerActions[button.dataset.action]?.();
    });

    document.body.appendChild(mobileFooter);
    document.body.classList.add("ms-mobile-footer-active");
    updateMobileFooter(mobileFooter);
  }

  // Earlier versions kept a visit log in localStorage; Route History replaced it.
  function forgetLegacyVisitLog() {
    try {
      window.localStorage.removeItem(`ms_style:recent-work:${encodeURIComponent(window.frappe?.session?.user || "guest")}`);
    } catch (error) {
      // Restricted storage: nothing to clean up.
    }
  }

  // Workspace edit mode: Frappe hides a paragraph's "Templates" list when the paragraph
  // blurs, unless the pointer is already over an item. Pressing anywhere in the list
  // blurred the paragraph first, so the list could vanish before the click arrived.
  // Keeping focus in the paragraph during that press lets the item's click run as usual.
  function bindBlockListFocus() {
    if (root.dataset.msBlockListFocus) return;
    root.dataset.msBlockListFocus = "true";
    document.addEventListener("mousedown", (event) => {
      if (event.target.closest?.(".codex-editor .block-list-container.dropdown-list")) event.preventDefault();
    }, true);
  }

  // The desk home is drawn anew every time it is shown (desktop.js empties the page and
  // renders it again), then Frappe triggers "desktop_screen". Running here, before the
  // browser paints, puts the additions in place without a flash or a DOM observer.
  function applyDesk() {
    applyFolderHero();
    applyUserGreeting();
    applyLanguageSwitcher();
    applyMyWorkCenter();
  }

  function initialize() {
    applyNavbarLogo();
    applyDesk();
    applyWorkspaceIcon();
    forgetLegacyVisitLog();
    bindBlockListFocus();
    applyMobileFooter();
    window.frappe?.router?.on?.("change", () => {
      applyMobileFooter();
      // A failed load gets one fresh attempt each time the user comes back to the desk home.
      if (myWorkCenterFailed && isDeskHome()) myWorkCenterFailed = false;
      applyMyWorkCenter();
      if (myWorkCenterLoaded) renderMyWorkCenter(window.msMyWorkCenterData || {});
      // Back on the desk home: show the last data at once, then fetch the current one.
      if (myWorkCenterLoaded && isDeskHome()) loadMyWorkCenter(true);
    });
    if (!document.documentElement.dataset.msFooterResizeSync) {
      document.documentElement.dataset.msFooterResizeSync = "true";
      window.addEventListener("resize", applyMobileFooter, { passive: true });
    }
    // The sidebar redraws its header on every workspace change.
    const container = document.querySelector(".body-sidebar-container");
    let updateQueued = false;
    const update = () => {
      if (updateQueued) return;
      updateQueued = true;
      window.requestAnimationFrame(() => {
        updateQueued = false;
        applyWorkspaceIcon();
      });
    };
    const observer = new MutationObserver(() => {
      update();
    });
    if (container) {
      observer.observe(container, {
        attributes: true,
        attributeFilter: ["class"],
        childList: true,
        subtree: true,
      });
    }
  }

  // Charts without their own colors fall back to Frappe's default palette (pink, light
  // blue). Fill only the missing entries from the brand palette, so a color chosen in a
  // Dashboard Chart or a report still wins. The palette follows the theme at render time.
  const chartPalettes = {
    light: ["#197B57", "#0E3B2E", "#287A9B", "#B7791F", "#A73833", "#34D399"],
    dark: ["#34D399", "#F4F1EA", "#4AAAD0", "#DC952D", "#D88480", "#197B57"],
  };

  function withBrandChartColors(options, replaceDefault) {
    if (!options || options.type === "heatmap") return options;
    const palette = chartPalettes[root.getAttribute("data-theme") === "dark" ? "dark" : "light"];
    const colors = Array.isArray(options.colors) ? options.colors : [];
    const isSet = (color) => (typeof color === "string" ? color.trim() : color?.length);
    if (!colors.some(isSet) || (replaceDefault && colors.length === 1 && colors[0] === "light-blue")) {
      return { ...options, colors: palette };
    }
    return { ...options, colors: colors.map((color, index) => (isSet(color) ? color : palette[index % palette.length])) };
  }

  function applyBrandCharts() {
    const frappe = window.frappe;
    const Chart = frappe?.Chart;
    if (!Chart || Chart.msBrandColors) return;
    // frappe-charts' constructor returns the chart for the given type, so a plain
    // function works with `new` and callers get the same object as before.
    const BrandChart = function (parent, options) {
      return new Chart(parent, withBrandChartColors(options, false));
    };
    Object.setPrototypeOf(BrandChart, Chart);
    BrandChart.prototype = Chart.prototype;
    BrandChart.msBrandColors = true;
    frappe.Chart = BrandChart;

    const makeChart = frappe.utils?.make_chart;
    if (makeChart) {
      // make_chart pre-fills ["light-blue"] before merging the caller's options.
      frappe.utils.make_chart = function (wrapper, customOptions = {}) {
        return makeChart.call(this, wrapper, withBrandChartColors({ type: "bar", ...customOptions }, true));
      };
    }
  }

  applyBrandCharts();
  useBrandDesktopIcons();
  $(document).on("desktop_screen", applyDesk);
  $(initialize);
})();
