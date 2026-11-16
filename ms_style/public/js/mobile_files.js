// Files on phones (up to 767px): a file in a table, a form field or a dialog shows as a
// chip (a thumbnail for an image, a badge with the file's type otherwise, and its name),
// and a tap on any link to a file of this site opens it in a full-screen viewer inside the
// app instead of a new browser tab: images zoom (pinch, double tap) and the files of the
// same table are a swipe apart; other files show Open, Download and Share.
import { isPhone, setClass } from "./phone";

const html = document.documentElement;

function t(message, args) {
  return typeof window.__ === "function" ? window.__(message, args, "ms_style") : message;
}

const IMAGE = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i;
const VIDEO = /\.(mp4|webm|mov|m4v)$/i;
const KINDS = [
  [/\.pdf$/i, "pdf"],
  [/\.(xlsx?|csv|ods)$/i, "sheet"],
  [/\.(docx?|odt|rtf|txt)$/i, "doc"],
  [/\.(dwg|dxf|dwf|skp|rvt)$/i, "cad"],
  [/\.(zip|rar|7z)$/i, "zip"],
];

// A file of this site: /files/... or /private/files/... (the path, without ?query).
export function fileUrl(href) {
  if (!href) return null;
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (!/^\/(private\/)?files\//.test(url.pathname)) return null;
    // Decoded: the markup encodes it once (encodeURI), so Arabic names are not encoded twice.
    let path = url.pathname;
    try { path = decodeURI(path); } catch (error) { /* keeps it encoded */ }
    return path + url.search;
  } catch (error) {
    return null;
  }
}

function fileName(url) {
  return url.split("?")[0].split("/").pop() || url;
}

function extension(url) {
  const match = url.split("?")[0].match(/\.([a-z0-9]{1,5})$/i);
  return match ? match[1].toUpperCase() : "";
}

function kindOf(url) {
  const path = url.split("?")[0];
  if (IMAGE.test(path)) return "image";
  if (VIDEO.test(path)) return "video";
  return (KINDS.find(([re]) => re.test(path)) || [null, "file"])[1];
}

const esc = (value) => frappe.utils.escape_html(String(value ?? ""));

// The chip's inside: the thumbnail or the type badge, then the name.
function chipInner(url) {
  const kind = kindOf(url);
  const thumb = kind === "image"
    ? `<span class="ms-file-thumb"><img src="${esc(encodeURI(url))}" alt="" loading="lazy" decoding="async"></span>`
    : `<span class="ms-file-thumb ms-file-badge" data-kind="${kind}">${esc(extension(url) || "FILE")}</span>`;
  return `${thumb}<span class="ms-file-name">${esc(fileName(url))}</span>`;
}

export function fileChip(url) {
  if (!url) return "";
  return `<a class="ms-file-chip" href="${esc(encodeURI(url))}" target="_blank" rel="noopener" title="${esc(fileName(url))}">${chipInner(url)}</a>`;
}

// Turns the links to files under `root` into chips (once per link and address).
export function decorateFiles(root) {
  if (!root || !isPhone()) return;
  root.querySelectorAll("a[href]").forEach((link) => {
    const url = fileUrl(link.getAttribute("href"));
    if (!url || link.closest(".ms-file-viewer, .attachment-row, .ms-file-keep")) return;
    if (link.dataset.msFile === url && link.querySelector(".ms-file-thumb")) return;
    link.dataset.msFile = url;
    if (!link.title) link.title = fileName(url);
    setClass(link, "ms-file-chip", true);
    link.innerHTML = chipInner(url);
    if (link.classList.contains("attached-file-link") || link.parentElement?.parentElement?.classList.contains("attached-file")) setClass(link.parentElement, "ms-file-holder", true);
    if (link.parentElement?.classList.contains("static-area")) {
      setClass(link.parentElement, "ms-file-cell", true);
      setClass(link.closest(".grid-static-col"), "ms-file-col", true);
    }
  });
}

// Redraws gathered and run once in the next frame.
const pending = new Set();
let frame = 0;
export function decorateFilesSoon(el) {
  if (!el || !isPhone()) return;
  pending.add(el);
  if (!frame) frame = window.requestAnimationFrame(() => {
    frame = 0;
    const roots = [...pending];
    pending.clear();
    roots.forEach((root) => root.isConnected && decorateFiles(root));
  });
}

// The viewer ------------------------------------------------------------------------------

let viewer = null;

// The files beside the tapped one: the same table, dialog or attachments list.
function groupFor(link) {
  const scope = link.closest(".form-grid, .modal-body, .form-attachments, .form-sidebar, .ms-docsidebar, .frappe-control") || link.parentElement;
  const urls = [];
  scope.querySelectorAll("a[href]").forEach((a) => {
    const url = fileUrl(a.getAttribute("href"));
    if (url && !urls.includes(url)) urls.push(url);
  });
  const own = fileUrl(link.getAttribute("href"));
  if (!urls.includes(own)) urls.unshift(own);
  return { urls, index: urls.indexOf(own) };
}

function icon(name, size = "sm") {
  return `<svg class="icon icon-${size}" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
}

function stageFor(url, asCard) {
  const kind = asCard ? kindOf(url.replace(/\.[a-z0-9]+$/i, ".bin")) : kindOf(url);
  const src = esc(encodeURI(url));
  if (kind === "image") return `<div class="ms-fv-zoom"><img class="ms-fv-img" src="${src}" alt="${esc(fileName(url))}" draggable="false"></div>`;
  if (kind === "video") return `<video class="ms-fv-video" src="${src}" controls playsinline preload="metadata"></video>`;
  return `
    <div class="ms-fv-card">
      <span class="ms-fv-card-badge ms-file-badge" data-kind="${kind}">${esc(extension(url) || "FILE")}</span>
      <div class="ms-fv-card-name">${esc(fileName(url))}</div>
      <div class="ms-fv-card-hint">${esc(t("This file opens in another app"))}</div>
      <a class="ms-fv-card-open" href="${src}" target="_blank" rel="noopener">${icon("external-link")}${esc(t("Open file"))}</a>
    </div>`;
}

function show(index) {
  const v = viewer;
  if (!v) return;
  const count = v.urls.length;
  v.index = (index + count) % count;
  const url = v.urls[v.index];
  v.el.querySelector(".ms-fv-name").textContent = fileName(url);
  v.el.querySelector(".ms-fv-meta").textContent = [count > 1 ? t("{0} of {1}", [v.index + 1, count]) : "", extension(url)].filter(Boolean).join(" · ");
  const stage = v.el.querySelector(".ms-fv-stage");
  stage.dataset.kind = kindOf(url);
  stage.innerHTML = stageFor(url);
  const img = stage.querySelector(".ms-fv-img");
  if (img) {
    stage.classList.add("is-loading");
    const done = () => stage.classList.remove("is-loading");
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", () => { done(); stage.dataset.kind = "file"; stage.innerHTML = stageFor(url, true); }, { once: true });
  }
  v.zoom = { scale: 1, x: 0, y: 0 };
  const download = v.el.querySelector(".ms-fv-download");
  download.href = encodeURI(url);
  download.setAttribute("download", fileName(url));
  v.el.querySelector(".ms-fv-open").href = encodeURI(url);
  v.el.querySelectorAll(".ms-fv-prev, .ms-fv-next").forEach((b) => (b.hidden = count < 2));
}

function applyZoom() {
  const img = viewer?.el.querySelector(".ms-fv-img");
  if (!img) return;
  const { scale, x, y } = viewer.zoom;
  img.style.transform = scale === 1 ? "" : `translate(${x}px, ${y}px) scale(${scale})`;
  setClass(viewer.el, "is-zoomed", scale > 1);
}

// Keeps a zoomed image over the screen: it can be moved no further than its own edges.
function clampZoom() {
  const z = viewer.zoom;
  const img = viewer.el.querySelector(".ms-fv-img");
  if (!img) return;
  z.scale = Math.min(5, Math.max(1, z.scale));
  if (z.scale === 1) { z.x = 0; z.y = 0; return; }
  const maxX = (img.offsetWidth * (z.scale - 1)) / 2;
  const maxY = (img.offsetHeight * (z.scale - 1)) / 2;
  z.x = Math.min(maxX, Math.max(-maxX, z.x));
  z.y = Math.min(maxY, Math.max(-maxY, z.y));
}

function rtl() {
  return document.dir === "rtl" || html.dir === "rtl" || document.body.dir === "rtl";
}

// Touch on the stage: pinch and drag zoom the image, a double tap zooms in or out, and a
// sideways swipe of the whole image goes to the next or previous file.
function bindGestures(stage) {
  let start = null;
  let lastTap = 0;
  const distance = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  stage.addEventListener("touchstart", (event) => {
    const z = viewer.zoom;
    const [a, b] = event.touches;
    if (b) start = { pinch: distance(a, b), scale: z.scale, x: z.x, y: z.y };
    else start = { px: a.clientX, py: a.clientY, x: z.x, y: z.y, time: Date.now(), moved: false };
  }, { passive: true });
  stage.addEventListener("touchmove", (event) => {
    if (!start || !stage.querySelector(".ms-fv-img")) return;
    const z = viewer.zoom;
    const [a, b] = event.touches;
    if (b && start.pinch) {
      event.preventDefault();
      z.scale = start.scale * (distance(a, b) / start.pinch);
      clampZoom();
      applyZoom();
    } else if (a && start.px !== undefined) {
      const dx = a.clientX - start.px;
      const dy = a.clientY - start.py;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) start.moved = true;
      if (z.scale > 1) {
        event.preventDefault();
        z.x = start.x + dx;
        z.y = start.y + dy;
        clampZoom();
        applyZoom();
      } else if (viewer.urls.length > 1) {
        const img = stage.querySelector(".ms-fv-zoom");
        if (img) img.style.transform = `translateX(${dx}px)`;
      }
    }
  }, { passive: false });
  stage.addEventListener("touchend", (event) => {
    if (!start || event.touches.length) { if (event.touches.length === 1) start = null; return; }
    const z = viewer.zoom;
    const touch = event.changedTouches[0];
    const holder = stage.querySelector(".ms-fv-zoom");
    if (start.px !== undefined && z.scale === 1) {
      const dx = touch.clientX - start.px;
      if (holder) holder.style.transform = "";
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(touch.clientY - start.py) && viewer.urls.length > 1) {
        // The finger moves toward the start of the reading direction: the next file.
        const forward = rtl() ? dx > 0 : dx < 0;
        show(viewer.index + (forward ? 1 : -1));
        start = null;
        return;
      }
    }
    if (start.px !== undefined && !start.moved && stage.querySelector(".ms-fv-img")) {
      const now = Date.now();
      if (now - lastTap < 300) {
        // Double tap: zoom in around the finger, or back out.
        if (z.scale > 1) { z.scale = 1; z.x = 0; z.y = 0; }
        else {
          const rect = stage.getBoundingClientRect();
          z.scale = 2.5;
          z.x = (rect.left + rect.width / 2 - touch.clientX) * 1.5;
          z.y = (rect.top + rect.height / 2 - touch.clientY) * 1.5;
          clampZoom();
        }
        stage.classList.add("is-animating");
        applyZoom();
        window.setTimeout(() => stage.classList.remove("is-animating"), 220);
        lastTap = 0;
      } else lastTap = now;
    }
    start = null;
  });
}

export function openFileViewer(urls, index = 0) {
  if (!urls?.length) return;
  if (viewer) closeViewer(true);
  const el = document.createElement("div");
  el.className = "ms-file-viewer";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.innerHTML = `
    <div class="ms-fv-bar">
      <button type="button" class="ms-fv-btn ms-fv-close" aria-label="${esc(__("Close"))}">${icon("x", "md")}</button>
      <div class="ms-fv-title"><div class="ms-fv-name"></div><div class="ms-fv-meta"></div></div>
      <a class="ms-fv-btn ms-fv-open" target="_blank" rel="noopener" aria-label="${esc(t("Open file"))}">${icon("external-link", "md")}</a>
    </div>
    <div class="ms-fv-stage"></div>
    <button type="button" class="ms-fv-btn ms-fv-prev" aria-label="${esc(__("Previous"))}">${icon("chevron-left", "md")}</button>
    <button type="button" class="ms-fv-btn ms-fv-next" aria-label="${esc(__("Next"))}">${icon("chevron-right", "md")}</button>
    <div class="ms-fv-actions">
      <a class="ms-fv-action ms-fv-download">${icon("download")}<span>${esc(__("Download"))}</span></a>
      ${navigator.share ? `<button type="button" class="ms-fv-action ms-fv-share">${icon("share")}<span>${esc(t("Share"))}</span></button>` : ""}
    </div>`;
  document.body.appendChild(el);
  viewer = { el, urls, index, zoom: { scale: 1, x: 0, y: 0 }, history: false };
  el.querySelector(".ms-fv-close").addEventListener("click", () => closeViewer());
  // Previous and next follow the reading direction: in Arabic, next is on the left.
  el.querySelector(".ms-fv-prev").addEventListener("click", () => show(viewer.index + (rtl() ? 1 : -1)));
  el.querySelector(".ms-fv-next").addEventListener("click", () => show(viewer.index + (rtl() ? -1 : 1)));
  el.querySelector(".ms-fv-share")?.addEventListener("click", () => {
    const url = viewer.urls[viewer.index];
    navigator.share({ title: fileName(url), url: new URL(encodeURI(url), window.location.origin).href }).catch(() => {});
  });
  bindGestures(el.querySelector(".ms-fv-stage"));
  show(index);
  setClass(html, "ms-fv-open", true);
  window.requestAnimationFrame(() => el.classList.add("is-in"));
  // The phone's Back button closes the viewer: an entry with the same address, taken back
  // when the viewer closes (the popstate listener below keeps Frappe from re-routing).
  try { window.history.pushState({ msFileViewer: true }, "", window.location.href); viewer.history = true; } catch (error) { /* stays without */ }
}

function closeViewer(fromHistory) {
  if (!viewer) return;
  const { el, history } = viewer;
  viewer = null;
  setClass(html, "ms-fv-open", false);
  el.classList.remove("is-in");
  window.setTimeout(() => el.remove(), 200);
  if (history && !fromHistory) { closingByCode = true; window.history.back(); }
}

let closingByCode = false;

// A step back (the phone's Back button, or closeViewer above) only closes the viewer.
// Frappe re-routes on every popstate from its own listener, which runs first, so its
// route() is wrapped: a popstate while the viewer is open, or the viewer's own step back,
// stops there.
function backClosesViewer() {
  if (window.event?.type !== "popstate") return false;
  if (closingByCode) { closingByCode = false; return true; }
  if (viewer) { closeViewer(true); return true; }
  return false;
}

window.addEventListener("popstate", () => { if (!window.frappe?.router) backClosesViewer(); });

document.addEventListener("keydown", (event) => {
  if (!viewer) return;
  if (event.key === "Escape") { event.stopPropagation(); closeViewer(); }
  else if (event.key === "ArrowRight") show(viewer.index + (rtl() ? -1 : 1));
  else if (event.key === "ArrowLeft") show(viewer.index + (rtl() ? 1 : -1));
}, true);

// A tap on a link to a file opens the viewer; caught on the way down, so a table cell is not
// put in edit mode and the row does not open.
document.addEventListener("click", (event) => {
  if (!isPhone() || event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey) return;
  const link = event.target.closest?.("a[href]");
  if (!link || link.closest(".ms-file-viewer") || link.hasAttribute("download")) return;
  const url = fileUrl(link.getAttribute("href"));
  if (!url) return;
  event.preventDefault();
  event.stopPropagation();
  const { urls, index } = groupFor(link);
  openFileViewer(urls, index);
}, true);

// Frappe's file fields: the attach field's link, and read-only file values everywhere
// (tables, lists, read-only fields) as chips.
function patchFrappe() {
  const router = window.frappe?.router;
  if (router?.route && !router.msFiles) {
    router.msFiles = true;
    const route = router.route;
    router.route = function (...args) {
      return backClosesViewer() ? undefined : route.apply(this, args);
    };
  }
  const formatters = window.frappe?.form?.formatters;
  if (formatters && !formatters.msFiles) {
    formatters.msFiles = true;
    ["Attach", "AttachImage"].forEach((type) => {
      const original = formatters[type];
      if (!original) return;
      formatters[type] = function (value, ...rest) {
        return isPhone() && fileUrl(value) ? fileChip(value) : original.call(this, value, ...rest);
      };
    });
  }
  const Attach = window.frappe?.ui?.form?.ControlAttach;
  if (Attach && !Attach.prototype.msFiles) {
    Attach.prototype.msFiles = true;
    const setInput = Attach.prototype.set_input;
    Attach.prototype.set_input = function (...args) {
      const out = setInput.apply(this, args);
      if (isPhone()) decorateFiles(this.$wrapper?.[0]);
      return out;
    };
  }
}

patchFrappe();
$(() => patchFrappe());
// A dialog's tables are drawn before it opens, not always through Grid.refresh.
$(document).on("shown.bs.modal", (event) => decorateFilesSoon(event.target));
