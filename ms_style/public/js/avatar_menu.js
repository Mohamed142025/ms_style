// The avatar menu on the desk's home (frappe/desk/page/desktop/desktop.js): without
// Frappe's About and Frappe Support, and with the employee app (ms_hrms, at /hrms) under
// the theme switch. Frappe builds the menu's items in the page and hands them to
// frappe.ui.create_menu, so they are changed on their way there.
(() => {
  const HIDDEN = ["About", "Frappe Support"];

  function t(message) {
    return typeof window.__ === "function" ? window.__(message, null, "ms_style") : message;
  }

  function hasHrApp() {
    return Boolean(window.frappe?.boot?.versions?.ms_hrms) && window.frappe.user?.has_role?.("Employee");
  }

  function patch() {
    const create = window.frappe?.ui?.create_menu;
    if (!create || create.msAvatarMenu) return Boolean(create);
    const patched = function (opts) {
      if (opts?.menu_items && $(opts.parent).is(".desktop-avatar")) {
        const items = opts.menu_items.filter((item) => !HIDDEN.includes(item.label));
        if (hasHrApp() && !items.some((item) => item.url === "/hrms")) {
          const theme = items.findIndex((item) => item.label === "Toggle Theme");
          items.splice(theme + 1, 0, { icon: "id-card", label: t("HR App"), url: "/hrms" });
        }
        opts = { ...opts, menu_items: items };
      }
      return create.call(this, opts);
    };
    patched.msAvatarMenu = true;
    window.frappe.ui.create_menu = patched;
    return true;
  }

  // frappe.ui.create_menu is defined by the desk bundle, before or after this one.
  if (!patch()) document.addEventListener("DOMContentLoaded", patch, { once: true });
})();
