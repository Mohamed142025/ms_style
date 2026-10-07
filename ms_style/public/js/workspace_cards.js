// Workspace cards: a glyph beside the title of a links card and of a shortcut, picked by
// name (brand_icons.js), and the number of links on a links card. Drawn as part of the
// widget's own rendering, so they are there on the first paint and after every refresh.
import { getDocGlyph } from "./brand_icons";

function glyphMarkup(glyph) {
  if (!document.getElementById(`icon-${glyph}`)) return "";
  return `<span class="ms-card-icon" aria-hidden="true"><svg class="icon icon-sm"><use href="#icon-${glyph}"></use></svg></span>`;
}

function decorateLinksCard(widget) {
  const title = widget.title_field?.[0];
  if (!title || title.querySelector(".ms-card-icon")) return;
  title.insertAdjacentHTML("afterbegin", glyphMarkup(getDocGlyph([widget.label, widget.title], "Workspace")));
  const count = widget.body?.[0]?.querySelectorAll(".link-item").length;
  if (count) title.insertAdjacentHTML("beforeend", `<span class="ms-card-count">${count}</span>`);
}

function decorateShortcut(widget) {
  const title = widget.title_field?.[0];
  if (!title || title.querySelector(".ms-card-icon")) return;
  title.insertAdjacentHTML("afterbegin", glyphMarkup(getDocGlyph([widget.link_to, widget.label], widget.type)));
}

function after(widgetClass, method, decorate) {
  const original = widgetClass?.prototype?.[method];
  if (!original || original.msDecorated) return;
  widgetClass.prototype[method] = function (...args) {
    const result = original.apply(this, args);
    decorate(this);
    return result;
  };
  widgetClass.prototype[method].msDecorated = true;
}

const factory = window.frappe?.widget?.widget_factory;
after(factory?.links, "set_body", decorateLinksCard);
after(factory?.shortcut, "set_body", decorateShortcut);
