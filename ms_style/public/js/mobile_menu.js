// Frappe's context menus (the sidebar header's app switcher and its "Workspaces",
// "Display" and "Help" submenus) on phones: the menu takes the drawer's width and
// scrolls, and a submenu opens inline under its item instead of beside the menu, where
// a phone has no room for it.
const PHONE = 767;

function isPhone() {
  return window.innerWidth <= PHONE;
}

function patch() {
  const Menu = window.frappe?.ui?.menu;
  if (!Menu || Menu.prototype.msPhonePatched) return;
  Menu.prototype.msPhonePatched = true;
  const show = Menu.prototype.show;
  const hide = Menu.prototype.hide;

  Menu.prototype.show = function (event) {
    show.call(this, event);
    if (!isPhone() || this.opts.right_click || !this.template?.[0]) return;
    const item = this.parent?.get(0);
    if (this.opts.nested && this.opts.parent_menu && item) {
      // Inline, right under its item, inside the parent menu.
      this.template.addClass("ms-menu-inline");
      this.template.css({ position: "static", top: "", left: "", width: "100%", maxWidth: "none" });
      item.after(this.template[0]);
      item.classList.add("ms-menu-item-open");
      if (!this.msInlineBound) {
        this.msInlineBound = true;
        // A leaf of the submenu closes the whole chain, as a click outside did when the
        // submenu floated beside the menu.
        this.template.on("click", ".dropdown-menu-item", (e) => {
          if (e.currentTarget.querySelector(".frappe-menu")) return;
          window.setTimeout(() => {
            let menu = window.frappe.menu_map[this.opts.parent_menu];
            while (menu) {
              if (menu.visible) { menu.hide(); menu.opts.onHide && menu.opts.onHide(menu.opts.parent); }
              menu = menu.opts.parent_menu ? window.frappe.menu_map[menu.opts.parent_menu] : null;
            }
          }, 0);
        });
      }
      this.template[0].scrollIntoView?.({ block: "nearest" });
    } else if (item) {
      const rect = item.getBoundingClientRect();
      const top = rect.bottom + 4;
      this.template.addClass("ms-menu-phone");
      this.template.css({ left: "12px", right: "12px", width: "auto", maxWidth: "calc(100vw - 24px)", top: `${top}px`, maxHeight: `calc(100vh - ${Math.round(top) + 12}px)`, overflowY: "auto" });
    }
  };

  Menu.prototype.hide = function () {
    hide.call(this);
    const item = this.parent?.get(0);
    if (item && this.opts.nested) item.classList.remove("ms-menu-item-open");
  };
}

$(patch);
window.setTimeout(patch, 1500);
