import "./brand_theme_color";
import "./notification_counter";
import "./mobile_list";
import "./mobile_form";
import "./mobile_menu";
import "./mobile_desk";
import "./mobile_workspace";
import "./mobile_report";
import "./mobile_keyboard";
import "./document_views";
import "./sidebar_icons";
import "./workspace_cards";
import "./grid_suggestions";
import "./avatar_menu";
import { getDeskIcon } from "./brand_icons";
import { applyNavbarThemeToggle, applySidebarThemeToggle } from "./theme_toggle";
import { applySidebarLanguageToggle } from "./language_toggle";

(() => {
  const root = document.documentElement;
  // Workspaces whose route is not their module's name on the desk.
  const workspaceAliases = {
    company: "Organization",
    hr: "HR",
    "erpnext-settings": "ERPNext Settings",
    "global-defaults": "ERPNext Settings",
    assets: "Assets",
    crm: "CRM",
  };

  // Translate through Frappe (ms_style/locale/*.po), with {0}-style placeholders. The
  // "ms_style" context keeps these entries from overriding Frappe's own translation of
  // the same words; Frappe falls back to its plain entry (doctype names, etc.).
  function t(message, args = []) {
    if (typeof window.__ === "function") return window.__(message, args, "ms_style");
    return message.replace(/\{(\d+)\}/g, (match, index) => args[index] ?? match);
  }

  // Desk tiles, folder popups and the sidebar header take their image from
  // frappe.utils.get_desktop_icon while Frappe draws them (ui/desktop_icon.html). Answering
  // with the brand tile there draws it from the start. Swapping it in afterwards showed
  // Frappe's icons first, and missed the desk Frappe draws anew on every visit to it.
  function useBrandDesktopIcons() {
    const utils = window.frappe?.utils;
    const getDesktopIcon = utils?.get_desktop_icon;
    if (typeof getDesktopIcon !== "function" || getDesktopIcon.msBrandIcons) return;
    const brandDesktopIcon = function (name, variant) {
      return getDeskIcon(name) || getDesktopIcon.call(this, name, variant);
    };
    brandDesktopIcon.msBrandIcons = true;
    utils.get_desktop_icon = brandDesktopIcon;
  }

  // Folders on the desk (Accounting) are drawn as thumbnails of the workspaces in them;
  // a folder with a brand tile shows the tile instead (workspace.scss hides the thumbnails).
  function applyFolderHero() {
    document
      .querySelectorAll(".desktop-container > .icons-container > .icons > .desktop-icon > .icon-container.folder-icon")
      .forEach((folder) => {
        if (folder.querySelector(":scope > .ms-folder-hero")) return;
        const name = folder.parentElement.dataset.id;
        const tile = getDeskIcon(name);
        if (!tile) return;
        const hero = document.createElement("img");
        hero.className = "ms-folder-hero";
        hero.src = tile;
        hero.alt = name;
        folder.prepend(hero);
      });
  }

  // Brand icon for the sidebar header, found by the sidebar's own (untranslated) title,
  // then by the desktop folder that workspace lives in (e.g. Payments -> Accounting),
  // then by the route.
  function getWorkspaceIconName() {
    const title = window.frappe?.app?.sidebar?.sidebar_title;
    if (getDeskIcon(title)) return title;
    const folder = title && window.frappe?.boot?.desktop_icons?.find((icon) => icon.label === title)?.parent_icon;
    if (getDeskIcon(folder)) return folder;
    const routeName = window.location.pathname.split("/").filter(Boolean).pop();
    return workspaceAliases[routeName] || null;
  }

  function applyWorkspaceIcon() {
    const logo = document.querySelector(".body-sidebar .sidebar-header .header-logo");
    const name = logo && getWorkspaceIconName();
    const iconPath = getDeskIcon(name);
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
      ? frequentRoutes.map((item, index) => `<a class="ms-work-route" href="${escapeWorkCenterHtml(getRouteHref(item.route))}"><span><b>0${index + 1}</b>${escapeWorkCenterHtml(item.label)}</span><small>${t("{0} visits", [item.count])}</small><svg class="icon icon-xs ms-work-chevron" aria-hidden="true"><use href="#icon-chevron-right"></use></svg></a>`).join("")
      : `<p class="ms-work-empty">${t("Your frequent work will appear here.")}</p>`;
    const support = data?.support || {};
    const supportPhone = String(support.phone || "").replace(/[^\d+]/g, "");
    const supportWhatsapp = String(support.whatsapp || "").replace(/\D/g, "");
    const supportMarkup = supportPhone || supportWhatsapp
      ? `<section class="ms-work-support"><span>${t("Need help?")}</span>${support.message ? `<p>${escapeWorkCenterHtml(support.message)}</p>` : ""}<div>${supportPhone ? `<a href="tel:${supportPhone}"><svg class="icon icon-sm" aria-hidden="true"><use href="#icon-phone"></use></svg>${t("Call")}</a>` : ""}${supportWhatsapp ? `<a href="https://wa.me/${supportWhatsapp}" target="_blank" rel="noopener"><svg class="icon icon-sm" aria-hidden="true"><use href="#icon-message-circle"></use></svg>${t("WhatsApp")}</a>` : ""}</div></section>`
      : "";
    const quickCreateMarkup = quickCreateItems.length
      ? quickCreateItems.map((item) => `<button type="button" data-create-doctype="${escapeWorkCenterHtml(item.doctype)}"><svg class="icon icon-xs ms-work-ico" aria-hidden="true"><use href="#icon-plus"></use></svg><span>${escapeWorkCenterHtml(item.label)}</span></button>`).join("")
      : `<p class="ms-work-empty">${t("Your create shortcuts will appear here as you work.")}</p>`;

    panel.innerHTML = `
      <div class="ms-work-heading">
        <div><span class="ms-work-eyebrow">${t("Personal workspace")}</span><h2>${t("My Work Center")}</h2><p>${t("Everything that needs your attention.")}</p></div>
        <span class="ms-work-status-dot" title="${t("Live workspace")}"></span>
      </div>
      <div class="ms-work-summary">
        <button type="button" data-summary-kind="all"><i class="ms-work-ico" aria-hidden="true"><svg class="icon icon-sm"><use href="#icon-inbox"></use></svg></i><strong>${counts.actions}</strong><span>${t("Open items")}</span></button>
        <button type="button" data-summary-kind="approval"><i class="ms-work-ico" aria-hidden="true"><svg class="icon icon-sm"><use href="#icon-circle-check"></use></svg></i><strong>${counts.approvals}</strong><span>${t("Approvals")}</span></button>
        <button type="button" data-summary-kind="task"><i class="ms-work-ico" aria-hidden="true"><svg class="icon icon-sm"><use href="#icon-list-checks"></use></svg></i><strong>${counts.tasks}</strong><span>${t("Tasks")}</span></button>
        <button type="button" data-summary-kind="draft"><i class="ms-work-ico" aria-hidden="true"><svg class="icon icon-sm"><use href="#icon-file-pen-line"></use></svg></i><strong>${counts.drafts}</strong><span>${t("Drafts")}</span></button>
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
      // A Quick Entry opens in place, without a route change, so the popup closes first.
      button.addEventListener("click", () => {
        closeMobilePanels();
        window.frappe?.new_doc?.(button.dataset.createDoctype);
      });
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
    overlay.innerHTML = `<div class="ms-work-center-dialog" role="dialog" aria-modal="true" aria-label="${t("My Work Center")}"><button type="button" class="ms-work-center-close" aria-label="${t("Close")}"><svg class="icon icon-sm" aria-hidden="true"><use href="#icon-x"></use></svg></button><div class="ms-work-center-modal"></div></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay || event.target.closest(".ms-work-center-close")) overlay.remove();
    });
    const panel = overlay.querySelector(".ms-work-center-modal");
    if (myWorkCenterLoaded) {
      renderMyWorkCenter(window.msMyWorkCenterData || {});
      loadMyWorkCenter(true);
    } else {
      // The sheet's shape while the data loads: the head, then ghost cards.
      panel.innerHTML = `<div class="ms-work-heading"><div><span class="ms-work-eyebrow">${t("Personal workspace")}</span><h2>${t("My Work Center")}</h2><p>${t("Loading your work center...")}</p></div></div><div class="ms-work-ghost" aria-hidden="true"><i></i><i></i><i></i><i></i><b></b><b></b></div>`;
      loadMyWorkCenter();
    }
  }

  function openWorkItemsPopup(kind) {
    const data = window.msMyWorkCenterData || {};
    const items = (data.actions || []).filter((item) => kind === "all" || item.kind === kind);
    const title = t(kind === "approval" ? "Approvals" : kind === "task" ? "Tasks" : kind === "draft" ? "Drafts" : "Open items");
    const overlay = document.createElement("div");
    overlay.className = "ms-work-center-overlay";
    overlay.innerHTML = `<div class="ms-work-center-dialog ms-work-items-dialog" role="dialog" aria-modal="true" aria-label="${title}"><button type="button" class="ms-work-center-close" aria-label="${t("Close")}"><svg class="icon icon-sm" aria-hidden="true"><use href="#icon-x"></use></svg></button><div class="ms-work-items-content"><span class="ms-work-eyebrow">${t("My Work Center")}</span><h2>${title}</h2><p>${t("Items linked to your work: {0}", [items.length])}</p><div class="ms-work-items-list">${items.length ? items.map((item) => `<button class="ms-work-item" type="button" data-doctype="${escapeWorkCenterHtml(item.doctype)}" data-name="${escapeWorkCenterHtml(item.name)}"><span class="ms-work-item-icon ${item.kind === "approval" ? "is-approval" : "is-task"}"><svg class="icon icon-sm" aria-hidden="true"><use href="#icon-${({ approval: "circle-check", task: "list-checks", draft: "file-pen-line" })[item.kind] || "inbox"}"></use></svg></span><span class="ms-work-item-copy"><strong>${escapeWorkCenterHtml(item.title)}</strong><small>${escapeWorkCenterHtml(item.subtitle)}</small></span><svg class="icon icon-xs ms-work-item-arrow" aria-hidden="true"><use href="#icon-chevron-right"></use></svg></button>`).join("") : `<p class="ms-work-empty">${t("Nothing needs your attention here.")}</p>`}</div></div></div>`;
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
    { action: "work", icon: "chart-column-increasing", label: "Work" },
    // "Notifications" does not fit a fifth of a phone screen.
    { action: "notifications", icon: "bell", label: "Alerts" },
    { action: "back", icon: "arrow-left", label: "Back" },
  ];

  const footerActions = {
    home() {
      if (window.frappe?.set_route) window.frappe.set_route("");
      else window.location.assign("/desk");
    },
    // The search of the page on screen: the desk home's own, else the current page's.
    // The first match in the document could be a hidden page's, which opened a second
    // search under the right one.
    search() {
      if (document.querySelector(".modal.show .navbar-modal-wrapper")) return;
      const page = [...document.querySelectorAll(".page-container")].find((p) => p.offsetParent && p.style.display !== "none");
      const searchTrigger = isDeskHome()
        ? document.querySelector("#desktop-navbar-modal-search")
        : page?.querySelector(".page-head .search-bar .search-icon") || document.querySelector("#desktop-navbar-modal-search");
      searchTrigger?.click();
    },
    work: openMyWorkCenterPopup,
    // Frappe's own notification panel: the bell on the desk home, elsewhere the one in the
    // sidebar, which on phones stays inside the closed drawer. responsive.scss shows either
    // as a sheet above this bar.
    notifications() {
      const bell = document.querySelector(".desktop-notifications .dropdown-notifications > .nav-link");
      // On the desk home the bell is hidden in the phone hero (mobile_desk.scss) but still works.
      if (bell && (bell.offsetParent || isDeskHome())) bell.click();
      else document.querySelector(".body-sidebar .dropdown-notifications")?.classList.toggle("hidden");
    },
    back() {
      if (window.history.length > 1) window.history.back();
      else window.location.assign("/desk");
    },
  };

  // Search, Work and Alerts open over the page; going to another page closes them, so
  // the page chosen from one of them is not left hidden underneath.
  function closeMobilePanels() {
    document.querySelectorAll(".ms-work-center-overlay").forEach((overlay) => overlay.remove());
    const $ = window.jQuery;
    if ($) {
      $(".modal.show:has(.navbar-modal-wrapper)").modal("hide");
      $(".desktop-notifications .dropdown-notifications.show > .nav-link").dropdown("hide");
    }
    document.querySelector(".body-sidebar .dropdown-notifications:not(.hidden)")?.classList.add("hidden");
  }

  // One tab is always the current one: Home on the desk home and in workspaces, Work on
  // a document, list or report, and Search or Alerts while their panel is open.
  function currentFooterTab() {
    if (document.querySelector(".modal.show .navbar-modal-wrapper, .modal.show .search-dialog")) return "search";
    if (document.querySelector(".ms-work-center-overlay")) return "work";
    if (document.querySelector(".body-sidebar .dropdown-notifications:not(.hidden), .desktop-notifications .dropdown-notifications.show")) return "notifications";
    if (isDeskHome()) return "home";
    const route = window.frappe?.get_route?.() || [];
    if (["Form", "List", "Tree", "query-report", "print", "dashboard-view"].includes(route[0])) return "work";
    return "home";
  }

  function updateMobileFooter(footer) {
    const current = currentFooterTab();
    footer.querySelectorAll(".ms-mobile-footer-button").forEach((button) => {
      const on = button.dataset.action === current;
      button.classList.toggle("is-active", on);
      if (on) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
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
    // A floating pill with the four tabs, and Back on its own beside it.
    const footerButton = ({ action, icon, label }) => `<button type="button" class="ms-mobile-footer-button" data-action="${action}" aria-label="${t(label)}">
        <svg class="icon icon-md" aria-hidden="true"><use href="#icon-${icon}"></use></svg>
        <span>${t(label)}</span>
      </button>`;
    mobileFooter.innerHTML = `<div class="ms-footer-pill">${footerButtons.filter((b) => b.action !== "back").map(footerButton).join("")}</div>${footerButtons.filter((b) => b.action === "back").map(footerButton).join("")}`;
    mobileFooter.addEventListener("click", (event) => {
      const button = event.target.closest(".ms-mobile-footer-button");
      if (!button) return;
      // Frappe and Bootstrap close open panels on a click elsewhere in the page; this
      // click opens one, so it stops here.
      event.stopPropagation();
      footerActions[button.dataset.action]?.();
      window.setTimeout(() => updateMobileFooter(mobileFooter), 350);
    });
    // Panels closed by a tap elsewhere: the bar follows.
    document.addEventListener("click", () => window.setTimeout(() => { const f = document.querySelector(".ms-mobile-footer"); f && updateMobileFooter(f); }, 350), true);

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
    applyNavbarThemeToggle();
    applyMyWorkCenter();
  }

  function initialize() {
    applyNavbarLogo();
    applyDesk();
    applyWorkspaceIcon();
    applySidebarThemeToggle();
    applySidebarLanguageToggle();
    forgetLegacyVisitLog();
    bindBlockListFocus();
    applyMobileFooter();
    window.frappe?.router?.on?.("change", () => {
      closeMobilePanels();
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
        applySidebarThemeToggle();
        applySidebarLanguageToggle();
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
