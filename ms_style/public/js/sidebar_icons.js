// A fitting icon for every document, report and page in a module's sidebar. Frappe draws
// the same list icon for each item without one, and nothing for the items inside a
// section; those get a glyph picked by name (brand_icons.js). An icon chosen on the item
// itself (Workspace Sidebar) stays. Only the drawing changes: the item's data is untouched,
// so editing and saving a sidebar stores nothing new.
import { getDocGlyph } from "./brand_icons";

function drawItemIcon(sidebarItem) {
  const item = sidebarItem.item;
  if (!sidebarItem.wrapper || item?.type !== "Link" || (item.icon && item.icon !== "list")) return;
  const holder = sidebarItem.wrapper[0]?.querySelector(":scope > .standard-sidebar-item .sidebar-item-icon");
  const glyph = getDocGlyph([item.link_to, item.label], item.link_type);
  if (!holder || !document.getElementById(`icon-${glyph}`)) return;
  holder.setAttribute("item-icon", glyph);
  holder.innerHTML = frappe.utils.icon(glyph, "sm", "", "", "text-ink-gray-7 current-color", true);
}

// Every kind of sidebar item draws itself through TypeLink's make().
const TypeLink = window.frappe?.ui?.sidebar_item?.TypeLink;
if (TypeLink && !TypeLink.prototype.make.msDocIcons) {
  const make = TypeLink.prototype.make;
  TypeLink.prototype.make = function (...args) {
    const result = make.apply(this, args);
    drawItemIcon(this);
    return result;
  };
  TypeLink.prototype.make.msDocIcons = true;
}
