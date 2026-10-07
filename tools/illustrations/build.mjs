// Draws the desk module illustrations and writes them to ms_style/public/Icone/*.webp.
//
// Every picture shares one frame (the identity's deep green ground, circuit lines in the
// corners, a disc with two arcs and a dotted ring, two cream badges with a small Lucide
// glyph, sparkles) and holds a scene drawn from the shapes below: buildings, documents,
// people, boxes, coins, gears... in the palette of the hand-drawn pictures that came first
// (the storekeeper's warehouse, the fleet van). Run from this directory:
//
//     npm install && npm run build            # all pictures
//     node build.mjs invoicing payroll        # only these
//
// Then bump artVersion in ms_style/public/js/brand_icons.js and `bench build --app ms_style`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "../..");
const outDir = path.join(app, "ms_style/public/Icone");
const svgDir = path.join(here, "svg");
const sprite = fs.readFileSync(path.resolve(app, "../frappe/frappe/public/icons/lucide/icons.svg"), "utf8");

// Palette ----------------------------------------------------------------------------------
const C = {
  outline: "#0f3328",
  deep: "#163a30",
  ring: "#1d5a49",
  arc: "#2f8a6e",
  dots: "#2a7560",
  circuit: "#2b5a4d",
  green: "#2f8d72",
  greenDark: "#24715a",
  greenLight: "#5fd0a6",
  mint: "#a1dbc7",
  cream: "#ece8dc",
  creamDark: "#d8d2c2",
  tan: "#d8b47c",
  tanDark: "#b8925a",
  gold: "#f2d98a",
};

// Frame ------------------------------------------------------------------------------------
function glyph(name) {
  const match = sprite.match(new RegExp(`<symbol[^>]*\\bid="icon-${name}"[^>]*>([\\s\\S]*?)</symbol>`));
  if (!match) throw new Error(`Glyph "${name}" is not in the Lucide sprite`);
  return match[1].replace(/\n\s*/g, "");
}

// A cream disc with a small glyph, as on the first pictures.
function badge(cx, cy, name, r = 25) {
  const scale = (r * 1.15) / 24;
  const offset = (24 * scale) / 2;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.cream}" stroke="${C.outline}" stroke-width="3"/>
<g transform="translate(${cx - offset} ${cy - offset}) scale(${scale.toFixed(3)})" fill="none" stroke="${C.green}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${glyph(name)}</g>`;
}

function sparkle(x, y, s = 1) {
  const a = 3 * s, b = 7 * s;
  return `<path d="M${x} ${y - b - a} l${a} ${b} ${b} ${a} -${b} ${a} -${a} ${b} -${a} -${b} -${b} -${a} ${b} -${a} Z" fill="${C.mint}"/>`;
}

function frame({ badges, scene, sparkles = [[268, 152, 1], [118, 74, 0.7]] }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
<defs>
<radialGradient id="bg" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#175443"/><stop offset="0.6" stop-color="#134033"/><stop offset="1" stop-color="#103a2f"/></radialGradient>
<radialGradient id="disc" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#1d6250"/><stop offset="1" stop-color="#165645"/></radialGradient>
<linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38a07f"/><stop offset="1" stop-color="#2c8268"/></linearGradient>
<linearGradient id="paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3efe4"/><stop offset="1" stop-color="#e2dccb"/></linearGradient>
</defs>
<rect width="320" height="320" fill="url(#bg)"/>
<g stroke="${C.circuit}" stroke-width="2" fill="none" stroke-linecap="round"><path d="M24 60 H62 L74 72"/><path d="M24 236 H58"/><path d="M296 82 H262"/><path d="M296 260 H264 L252 248"/></g>
<g fill="#134033" stroke="#2f6a5a" stroke-width="2"><circle cx="22" cy="60" r="4"/><circle cx="22" cy="236" r="4"/><circle cx="298" cy="82" r="4"/><circle cx="298" cy="260" r="4"/></g>
<circle cx="160" cy="165" r="128" fill="none" stroke="${C.ring}" stroke-width="2"/>
<circle cx="160" cy="165" r="116" fill="url(#disc)"/>
<path d="M60 110 A116 116 0 0 1 214 62" fill="none" stroke="${C.arc}" stroke-width="7" stroke-linecap="round"/>
<path d="M262 214 A116 116 0 0 1 160 281" fill="none" stroke="${C.arc}" stroke-width="7" stroke-linecap="round"/>
<circle cx="160" cy="165" r="104" fill="none" stroke="${C.dots}" stroke-width="1.5" stroke-dasharray="2 7"/>
${scene}
${badge(82, 96, badges[0])}
${badge(240, 92, badges[1])}
${sparkles.map(([x, y, s]) => sparkle(x, y, s)).join("")}
</svg>`;
}

// Shapes -----------------------------------------------------------------------------------
const O = `stroke="${C.outline}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;

// The ground a scene stands on.
const ground = (x1 = 62, x2 = 258, y = 236) =>
  `<path d="M${x1} ${y} H${x2}" stroke="${C.outline}" stroke-width="5" stroke-linecap="round"/>`;

// A building: a body with rows of cream windows and a flat roof line.
function building(x, y, w, h, { cols = 2, rows = 3, fill = "url(#body)", door = true } = {}) {
  const pad = 10, gw = (w - pad * 2 - (cols - 1) * 6) / cols, gh = 13;
  let windows = "";
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      windows += `<rect x="${(x + pad + c * (gw + 6)).toFixed(1)}" y="${y + 14 + r * (gh + 9)}" width="${gw.toFixed(1)}" height="${gh}" rx="2" fill="${C.cream}"/>`;
  const doorMarkup = door ? `<rect x="${x + w / 2 - 9}" y="${y + h - 24}" width="18" height="24" rx="3" fill="${C.outline}"/>` : "";
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" ${O}/>
<path d="M${x + 6} ${y + 5} H${x + w - 6}" stroke="${C.greenLight}" stroke-width="3" stroke-linecap="round"/>${windows}${doorMarkup}`;
}

// A sheet of paper with a folded corner and lines of text.
function doc(x, y, w, h, { lines = 4, fold = true, title = true } = {}) {
  const f = 16;
  const shape = fold
    ? `M${x + 6} ${y} H${x + w - f} L${x + w} ${y + f} V${y + h - 6} Q${x + w} ${y + h} ${x + w - 6} ${y + h} H${x + 6} Q${x} ${y + h} ${x} ${y + h - 6} V${y + 6} Q${x} ${y} ${x + 6} ${y} Z`
    : `M${x + 6} ${y} H${x + w - 6} Q${x + w} ${y} ${x + w} ${y + 6} V${y + h - 6} Q${x + w} ${y + h} ${x + w - 6} ${y + h} H${x + 6} Q${x} ${y + h} ${x} ${y + h - 6} V${y + 6} Q${x} ${y} ${x + 6} ${y} Z`;
  let text = title ? `<path d="M${x + 14} ${y + 22} H${x + w * 0.55}" stroke="${C.green}" stroke-width="5" stroke-linecap="round"/>` : "";
  for (let i = 0; i < lines; i++) {
    const ly = y + (title ? 40 : 22) + i * 14;
    if (ly > y + h - 14) break;
    text += `<path d="M${x + 14} ${ly} H${x + w - 14 - (i % 2) * 18}" stroke="${C.greenLight}" stroke-width="3.5" stroke-linecap="round" opacity=".85"/>`;
  }
  const corner = fold ? `<path d="M${x + w - f} ${y} V${y + f} H${x + w}" fill="${C.creamDark}" ${O}/>` : "";
  return `<path d="${shape}" fill="url(#paper)" ${O}/>${corner}${text}`;
}

// A person: head and rounded shoulders.
function person(cx, topY, { body = C.green, head = C.cream, scale = 1 } = {}) {
  const r = 15 * scale, bw = 46 * scale, bh = 40 * scale;
  const by = topY + r * 2 + 4;
  return `<circle cx="${cx}" cy="${topY + r}" r="${r}" fill="${head}" ${O}/>
<path d="M${cx - bw / 2} ${by + bh} V${by + 18 * scale} Q${cx - bw / 2} ${by} ${cx - bw / 2 + 18 * scale} ${by} H${cx + bw / 2 - 18 * scale} Q${cx + bw / 2} ${by} ${cx + bw / 2} ${by + 18 * scale} V${by + bh} Z" fill="${body}" ${O}/>`;
}

// A cardboard box with tape.
function box(x, y, s, fill = C.tan) {
  return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="3" fill="${fill}" ${O}/>
<path d="M${x + s / 2} ${y} V${y + s}" stroke="${C.tanDark}" stroke-width="5"/><path d="M${x + s / 2} ${y} V${y + s}" stroke="${C.outline}" stroke-width="1.5" opacity=".5"/>`;
}

function coin(cx, cy, r = 16) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.gold}" ${O}/><circle cx="${cx}" cy="${cy}" r="${r * 0.58}" fill="none" stroke="${C.outline}" stroke-width="2.5"/>`;
}

function gear(cx, cy, r, teeth = 8, fill = C.green) {
  const pts = [];
  for (let i = 0; i < teeth * 2; i++) {
    const a = (Math.PI / teeth) * i, rr = i % 2 ? r : r * 1.3;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `<path d="M${pts.join(" L")} Z" fill="${fill}" ${O}/><circle cx="${cx}" cy="${cy}" r="${r * 0.42}" fill="${C.cream}" ${O}/>`;
}

function check(cx, cy, s = 1, color = C.cream) {
  return `<path d="M${cx - 12 * s} ${cy} l${8 * s} ${8 * s} ${18 * s} -${18 * s}" fill="none" stroke="${color}" stroke-width="${5 * s}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function arrow(x1, y1, x2, y2, color = C.cream, w = 4.5) {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 11;
  const hx1 = x2 - Math.cos(a - 0.6) * h, hy1 = y2 - Math.sin(a - 0.6) * h;
  const hx2 = x2 - Math.cos(a + 0.6) * h, hy2 = y2 - Math.sin(a + 0.6) * h;
  return `<path d="M${x1} ${y1} L${x2} ${y2} M${hx1.toFixed(1)} ${hy1.toFixed(1)} L${x2} ${y2} L${hx2.toFixed(1)} ${hy2.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function calendar(x, y, w, h, { marked = [] } = {}) {
  const cols = 4, rows = 3, cw = (w - 24) / cols, ch = (h - 40) / rows;
  let cells = "";
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      cells += `<rect x="${(x + 12 + c * cw + 2).toFixed(1)}" y="${(y + 32 + r * ch + 2).toFixed(1)}" width="${(cw - 4).toFixed(1)}" height="${(ch - 4).toFixed(1)}" rx="2" fill="${marked.includes(i) ? C.green : C.creamDark}"/>`;
    }
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="url(#paper)" ${O}/>
<path d="M${x} ${y + 24} H${x + w}" stroke="${C.outline}" stroke-width="3.5"/><rect x="${x + 1.5}" y="${y + 1.5}" width="${w - 3}" height="${22}" rx="6" fill="${C.green}"/>
<g stroke="${C.outline}" stroke-width="4" stroke-linecap="round"><path d="M${x + 18} ${y - 8} V${y + 10}"/><path d="M${x + w - 18} ${y - 8} V${y + 10}"/></g>${cells}`;
}

function clock(cx, cy, r) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.cream}" ${O}/><circle cx="${cx}" cy="${cy}" r="${r - 8}" fill="none" stroke="${C.creamDark}" stroke-width="2"/>
<path d="M${cx} ${cy} V${cy - r * 0.55} M${cx} ${cy} L${cx + r * 0.42} ${cy + r * 0.25}" fill="none" stroke="${C.green}" stroke-width="5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="4" fill="${C.outline}"/>`;
}

function envelope(x, y, w, h) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="url(#body)" ${O}/>
<path d="M${x} ${y + 8} L${x + w / 2} ${y + h * 0.58} L${x + w} ${y + 8}" fill="none" ${O}/>
<path d="M${x + 8} ${y + 6} H${x + w - 8}" stroke="${C.greenLight}" stroke-width="3" stroke-linecap="round"/>`;
}

function bars(x, baseY, heights, w = 18, gap = 10, fill = C.green) {
  return heights
    .map((h, i) => `<rect x="${x + i * (w + gap)}" y="${baseY - h}" width="${w}" height="${h}" rx="3" fill="${fill}" ${O}/>`)
    .join("");
}

function trend(points, color = C.mint) {
  return `<path d="M${points.map(([x, y]) => `${x} ${y}`).join(" L")}" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function magnifier(cx, cy, r) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.mint}" fill-opacity=".35" ${O}/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.green}" stroke-width="5"/>
<path d="M${cx + r * 0.7} ${cy + r * 0.7} L${cx + r * 1.5} ${cy + r * 1.5}" stroke="${C.outline}" stroke-width="10" stroke-linecap="round"/><path d="M${cx + r * 0.75} ${cy + r * 0.75} L${cx + r * 1.45} ${cy + r * 1.45}" stroke="${C.green}" stroke-width="5" stroke-linecap="round"/>`;
}

function receipt(x, y, w, h, { lines = 4 } = {}) {
  // A torn bottom edge: a zigzag from the right corner back to the left.
  const teeth = Math.max(4, Math.round(w / 12)), tw = w / teeth;
  let zig = "";
  for (let i = 0; i < teeth; i++) zig += ` l${(-tw / 2).toFixed(2)} 7 l${(-tw / 2).toFixed(2)} -7`;
  let text = "";
  for (let i = 0; i < lines; i++)
    text += `<path d="M${x + 14} ${y + 24 + i * 15} H${x + w - 14 - (i % 2 ? 10 : 0)}" stroke="${i === lines - 1 ? C.green : C.greenLight}" stroke-width="${i === lines - 1 ? 5 : 3.5}" stroke-linecap="round"/>`;
  return `<path d="M${x} ${y + 4} Q${x} ${y} ${x + 4} ${y} H${x + w - 4} Q${x + w} ${y} ${x + w} ${y + 4} V${y + h}${zig} Z" fill="url(#paper)" ${O}/>${text}`;
}

// An open palm, seen as a shallow bowl, holding what sits in it.
function tray(cx, y, w) {
  return `<path d="M${cx - w / 2} ${y} A${w / 2} ${w / 3} 0 0 0 ${cx + w / 2} ${y} Z" fill="${C.cream}" ${O}/>
<path d="M${cx - w / 2 + 10} ${y + 8} Q${cx} ${y + 22} ${cx + w / 2 - 10} ${y + 8}" fill="none" stroke="${C.creamDark}" stroke-width="3" stroke-linecap="round"/>
<path d="M${cx + w / 2 - 6} ${y - 2} Q${cx + w / 2 + 16} ${y - 14} ${cx + w / 2 + 6} ${y + 10}" fill="${C.cream}" ${O}/>`;
}

function shield(cx, topY, w, h, fill = C.green) {
  return `<path d="M${cx} ${topY} L${cx + w / 2} ${topY + h * 0.18} V${topY + h * 0.5} Q${cx + w / 2} ${topY + h * 0.85} ${cx} ${topY + h} Q${cx - w / 2} ${topY + h * 0.85} ${cx - w / 2} ${topY + h * 0.5} V${topY + h * 0.18} Z" fill="${fill}" ${O}/>`;
}

function bank(x, y, w, h) {
  const cols = 4, cw = 14, gap = (w - 20 - cols * cw) / (cols - 1);
  let columns = "";
  for (let i = 0; i < cols; i++) columns += `<rect x="${(x + 10 + i * (cw + gap)).toFixed(1)}" y="${y + 36}" width="${cw}" height="${h - 50}" rx="3" fill="${C.cream}" ${O}/>`;
  return `<path d="M${x - 8} ${y + 36} L${x + w / 2} ${y} L${x + w + 8} ${y + 36} Z" fill="url(#body)" ${O}/>
<rect x="${x}" y="${y + 30}" width="${w}" height="${10}" rx="2" fill="${C.greenDark}" ${O}/>${columns}
<rect x="${x - 8}" y="${y + h - 14}" width="${w + 16}" height="${14}" rx="3" fill="${C.greenDark}" ${O}/>`;
}

// A factory: a body with a sawtooth roof and a chimney.
function factory(x, y, w, h) {
  const teeth = 3, tw = w / teeth;
  let roof = `M${x} ${y + 26}`;
  for (let i = 0; i < teeth; i++) roof += ` L${x + i * tw} ${y} L${x + (i + 1) * tw} ${y + 26}`;
  return `<rect x="${x}" y="${y + 26}" width="${w}" height="${h - 26}" rx="3" fill="url(#body)" ${O}/>
<path d="${roof} Z" fill="${C.green}" ${O}/>
<rect x="${x + w - 30}" y="${y - 34}" width="18" height="60" rx="3" fill="${C.greenDark}" ${O}/>
<ellipse cx="${x + w - 21}" cy="${y - 44}" rx="14" ry="9" fill="${C.mint}" opacity=".8"/><ellipse cx="${x + w - 8}" cy="${y - 58}" rx="10" ry="7" fill="${C.mint}" opacity=".6"/>
<rect x="${x + 14}" y="${y + 44}" width="22" height="16" rx="2" fill="${C.cream}"/><rect x="${x + 50}" y="${y + 44}" width="22" height="16" rx="2" fill="${C.cream}"/><rect x="${x + 86}" y="${y + 44}" width="22" height="16" rx="2" fill="${C.cream}"/>
<rect x="${x + w / 2 - 12}" y="${y + h - 30}" width="24" height="30" rx="3" fill="${C.outline}"/>`;
}

// Storage shelving: two levels of boxes.
function shelf(x, y, w) {
  return `<rect x="${x}" y="${y}" width="8" height="${124}" rx="2" fill="${C.greenDark}" ${O}/><rect x="${x + w - 8}" y="${y}" width="8" height="${124}" rx="2" fill="${C.greenDark}" ${O}/>
<rect x="${x - 4}" y="${y + 52}" width="${w + 8}" height="8" rx="2" fill="${C.green}" ${O}/><rect x="${x - 4}" y="${y + 116}" width="${w + 8}" height="8" rx="2" fill="${C.green}" ${O}/>
${box(x + 16, y + 14, 38)}${box(x + 60, y + 22, 30, C.tanDark)}${box(x + 14, y + 78, 38, C.tanDark)}${box(x + 58, y + 70, 46)}`;
}

// A kanban board with three columns of cards.
function kanban(x, y, w, h) {
  const cw = (w - 40) / 3;
  let cards = "";
  [[0, 3], [1, 2], [2, 1]].forEach(([c, n]) => {
    for (let i = 0; i < n; i++)
      cards += `<rect x="${(x + 12 + c * (cw + 8)).toFixed(1)}" y="${y + 36 + i * 26}" width="${cw.toFixed(1)}" height="20" rx="4" fill="${i === 0 && c === 1 ? C.green : C.mint}" ${O}/>`;
  });
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="url(#paper)" ${O}/>
<rect x="${x}" y="${y}" width="${w}" height="24" rx="10" fill="${C.green}" ${O}/><rect x="${x}" y="${y + 12}" width="${w}" height="12" fill="${C.green}"/>${cards}`;
}

// A shopping cart.
function cart(x, y) {
  return `<path d="M${x} ${y} H${x + 22} L${x + 40} ${y + 70} H${x + 126} L${x + 144} ${y + 20} H${x + 32}" fill="none" stroke="${C.outline}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M${x + 32} ${y + 20} H${x + 144} L${x + 126} ${y + 70} H${x + 40} Z" fill="url(#body)" ${O}/>
<path d="M${x + 44} ${y + 36} H${x + 128} M${x + 50} ${y + 54} H${x + 122}" stroke="${C.cream}" stroke-width="3" stroke-linecap="round" opacity=".8"/>
<circle cx="${x + 56}" cy="${y + 92}" r="11" fill="${C.deep}" ${O}/><circle cx="${x + 114}" cy="${y + 92}" r="11" fill="${C.deep}" ${O}/><circle cx="${x + 56}" cy="${y + 92}" r="4" fill="${C.cream}"/><circle cx="${x + 114}" cy="${y + 92}" r="4" fill="${C.cream}"/>`;
}

// A safe with a dial.
function safe(x, y, w, h) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${C.greenDark}" ${O}/><rect x="${x + 12}" y="${y + 12}" width="${w - 24}" height="${h - 24}" rx="6" fill="url(#body)" ${O}/>
<circle cx="${x + w / 2}" cy="${y + h / 2}" r="22" fill="${C.cream}" ${O}/><circle cx="${x + w / 2}" cy="${y + h / 2}" r="9" fill="none" stroke="${C.green}" stroke-width="4"/>
<path d="M${x + w / 2} ${y + h / 2 - 22} v8 M${x + w / 2} ${y + h / 2 + 22} v-8 M${x + w / 2 - 22} ${y + h / 2} h8 M${x + w / 2 + 22} ${y + h / 2} h-8" stroke="${C.outline}" stroke-width="3" stroke-linecap="round"/>
<rect x="${x + w - 30}" y="${y + h / 2 - 16}" width="8" height="32" rx="3" fill="${C.cream}" ${O}/>
<rect x="${x + 14}" y="${y + h}" width="14" height="10" fill="${C.outline}"/><rect x="${x + w - 28}" y="${y + h}" width="14" height="10" fill="${C.outline}"/>`;
}

// A speech bubble.
function bubble(x, y, w, h, fill = C.cream, tail = "left") {
  const tx = tail === "left" ? x + 20 : x + w - 20;
  return `<path d="M${x + 10} ${y} H${x + w - 10} Q${x + w} ${y} ${x + w} ${y + 10} V${y + h - 10} Q${x + w} ${y + h} ${x + w - 10} ${y + h} H${tx + 14} L${tx} ${y + h + 14} V${y + h} H${x + 10} Q${x} ${y + h} ${x} ${y + h - 10} V${y + 10} Q${x} ${y} ${x + 10} ${y} Z" fill="${fill}" ${O}/>`;
}

// A headset.
function headset(cx, y, r) {
  return `<path d="M${cx - r} ${y + r + 10} V${y + r} A${r} ${r} 0 0 1 ${cx + r} ${y + r} V${y + r + 10}" fill="none" stroke="${C.outline}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="${cx - r - 12}" y="${y + r}" width="24" height="40" rx="8" fill="${C.green}" ${O}/><rect x="${cx + r - 12}" y="${y + r}" width="24" height="40" rx="8" fill="${C.green}" ${O}/>
<path d="M${cx + r} ${y + r + 40} Q${cx + r} ${y + r + 66} ${cx + 10} ${y + r + 66}" fill="none" stroke="${C.outline}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${cx + 6}" cy="${y + r + 66}" r="7" fill="${C.cream}" ${O}/>`;
}

// Scenes -----------------------------------------------------------------------------------
const scenes = {
  framework: {
    file: "framework",
    badges: ["code", "puzzle"],
    scene: `${ground()}
<rect x="88" y="150" width="60" height="60" rx="8" fill="url(#body)" ${O}/>
<rect x="156" y="150" width="60" height="60" rx="8" fill="url(#body)" ${O}/>
<rect x="88" y="94" width="60" height="48" rx="8" fill="${C.green}" ${O}/>
<rect x="172" y="76" width="60" height="60" rx="8" fill="${C.cream}" ${O}/>
<path d="M190 106 l-8 8 8 8 M214 106 l8 8 -8 8" fill="none" stroke="${C.green}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M100 170 H136 M100 184 H126 M168 170 H204 M168 184 H190" stroke="${C.cream}" stroke-width="4" stroke-linecap="round" opacity=".9"/>
<path d="M100 112 H136 M100 126 H122" stroke="${C.cream}" stroke-width="4" stroke-linecap="round" opacity=".9"/>
<path d="M118 142 V150 M186 136 V150" stroke="${C.outline}" stroke-width="3.5"/>
<rect x="76" y="212" width="152" height="24" rx="5" fill="${C.greenDark}" ${O}/>`,
  },
  organization: {
    file: "organization",
    badges: ["users", "network"],
    scene: `${ground()}
${building(76, 128, 62, 108, { cols: 2, rows: 3, fill: C.green })}
${building(128, 84, 78, 152, { cols: 3, rows: 5 })}
${building(196, 150, 54, 86, { cols: 2, rows: 2, fill: C.greenDark })}
<path d="M167 84 V62" stroke="${C.outline}" stroke-width="3.5" stroke-linecap="round"/><path d="M167 62 l16 6 -16 6 Z" fill="${C.mint}" ${O}/>`,
  },
  "custom-hr": {
    file: "custom-hr",
    badges: ["alarm-clock", "calendar-check"],
    scene: `${ground()}
${person(118, 120, { scale: 1.15 })}
${clock(206, 150, 46)}
<path d="M206 150 V124 M206 150 L226 162" fill="none" stroke="${C.green}" stroke-width="6" stroke-linecap="round"/>
<circle cx="206" cy="150" r="4.5" fill="${C.outline}"/>
<rect x="150" y="196" width="38" height="40" rx="6" fill="url(#paper)" ${O}/>${check(169, 216, 0.7, C.green)}`,
  },
  "my-workspaces": {
    file: "my-workspaces",
    badges: ["layout-grid", "star"],
    scene: `${ground()}
<rect x="74" y="98" width="172" height="124" rx="10" fill="${C.cream}" ${O}/>
<rect x="74" y="98" width="172" height="20" rx="10" fill="${C.green}" ${O}/><rect x="74" y="108" width="172" height="10" fill="${C.green}"/>
<rect x="86" y="130" width="52" height="38" rx="5" fill="${C.green}"/><rect x="146" y="130" width="88" height="38" rx="5" fill="${C.mint}"/>
<rect x="86" y="176" width="88" height="34" rx="5" fill="${C.mint}"/><rect x="182" y="176" width="52" height="34" rx="5" fill="${C.greenDark}"/>
${trend([[152, 160], [170, 146], [190, 152], [212, 136], [228, 140]], C.outline)}
${bars(94, 206, [10, 18, 26, 14], 12, 6, C.cream)}
<rect x="138" y="222" width="44" height="14" rx="3" fill="${C.greenDark}" ${O}/>`,
  },
  build: {
    file: "build",
    badges: ["hammer", "wrench"],
    scene: `${ground()}
${box(78, 176, 60, C.green)}${box(140, 176, 60, C.green)}${box(109, 116, 60, "url(#body)")}
<g transform="rotate(40 196 128)"><rect x="186" y="96" width="20" height="104" rx="6" fill="${C.tan}" ${O}/><rect x="170" y="84" width="52" height="30" rx="8" fill="${C.cream}" ${O}/></g>`,
  },
  data: {
    file: "data",
    badges: ["table", "upload"],
    scene: `${ground()}
${[0, 1, 2].map((i) => `<path d="M94 ${118 + i * 40} V${150 + i * 40} A66 18 0 0 0 226 ${150 + i * 40} V${118 + i * 40}" fill="${i === 1 ? C.greenDark : "url(#body)"}" ${O}/><ellipse cx="160" cy="${118 + i * 40}" rx="66" ry="18" fill="${i === 1 ? C.green : C.greenLight}" ${O}/>`).reverse().join("")}
<circle cx="200" cy="150" r="4" fill="${C.cream}"/><circle cx="200" cy="190" r="4" fill="${C.cream}"/><circle cx="200" cy="230" r="4" fill="${C.cream}"/>`,
  },
  email: {
    file: "email",
    badges: ["send", "bell"],
    scene: `${ground()}
${doc(118, 96, 92, 90, { lines: 3 })}
${envelope(74, 150, 172, 86)}
<path d="M230 120 L286 100 L262 150 L252 128 Z" fill="${C.cream}" ${O}/><path d="M252 128 L286 100" stroke="${C.outline}" stroke-width="3"/>`,
  },
  users: {
    file: "users",
    badges: ["shield", "key"],
    scene: `${ground()}
${person(104, 128, { body: C.greenDark, scale: 0.95 })}
${person(216, 128, { body: C.greenDark, scale: 0.95 })}
${person(160, 104, { scale: 1.2 })}`,
  },
  system: {
    file: "system",
    badges: ["settings", "activity"],
    scene: `${ground()}
<rect x="72" y="96" width="176" height="112" rx="10" fill="${C.cream}" ${O}/><rect x="72" y="96" width="176" height="112" rx="10" fill="none" stroke="${C.green}" stroke-width="6" stroke-opacity=".0"/>
<rect x="84" y="108" width="152" height="88" rx="6" fill="${C.deep}"/>
${trend([[96, 170], [120, 150], [138, 162], [160, 130], [182, 148], [206, 124], [224, 138]], C.mint)}
<rect x="138" y="208" width="44" height="18" fill="${C.greenDark}" ${O}/><rect x="112" y="226" width="96" height="10" rx="4" fill="${C.green}" ${O}/>
${gear(224, 118, 22, 8, C.green)}`,
  },
  website: {
    file: "website",
    badges: ["globe", "layout-template"],
    scene: `${ground()}
<rect x="72" y="104" width="176" height="124" rx="10" fill="${C.cream}" ${O}/><rect x="72" y="104" width="176" height="26" rx="10" fill="${C.green}" ${O}/><rect x="72" y="118" width="176" height="12" fill="${C.green}"/>
<circle cx="88" cy="117" r="4" fill="${C.cream}"/><circle cx="102" cy="117" r="4" fill="${C.cream}"/><circle cx="116" cy="117" r="4" fill="${C.cream}"/>
<circle cx="200" cy="178" r="36" fill="${C.green}" ${O}/><path d="M164 178 H236 M200 142 V214 M172 160 Q200 172 228 160 M172 196 Q200 184 228 196" fill="none" stroke="${C.cream}" stroke-width="3"/><ellipse cx="200" cy="178" rx="16" ry="36" fill="none" stroke="${C.cream}" stroke-width="3"/>
<path d="M88 150 H140 M88 166 H152 M88 182 H132 M88 198 H146" stroke="${C.green}" stroke-width="5" stroke-linecap="round" opacity=".8"/>`,
  },
  printing: {
    file: "printing",
    badges: ["file-text", "printer"],
    scene: `${ground()}
${doc(118, 84, 84, 74, { lines: 2 })}
<rect x="76" y="150" width="168" height="60" rx="10" fill="url(#body)" ${O}/>
<rect x="76" y="150" width="168" height="14" rx="6" fill="${C.greenLight}"/><path d="M76 164 H244" stroke="${C.outline}" stroke-width="3"/>
<circle cx="222" cy="186" r="6" fill="${C.gold}" ${O}/>
<rect x="104" y="196" width="112" height="40" rx="4" fill="url(#paper)" ${O}/><path d="M118 212 H176 M118 224 H160" stroke="${C.greenLight}" stroke-width="3.5" stroke-linecap="round"/>`,
  },
  automation: {
    file: "automation",
    badges: ["workflow", "zap"],
    scene: `${ground()}
${gear(118, 150, 36, 9, "url(#body)")}
${gear(196, 184, 28, 8, C.greenDark)}
${gear(200, 112, 20, 7, C.green)}
<path d="M226 140 l-10 24 h14 l-12 26" fill="none" stroke="${C.gold}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  integrations: {
    file: "integrations",
    badges: ["plug", "link"],
    scene: `${ground()}
<rect x="74" y="136" width="80" height="60" rx="10" fill="url(#body)" ${O}/><rect x="154" y="150" width="20" height="32" fill="${C.greenDark}" ${O}/>
<rect x="92" y="156" width="10" height="20" rx="2" fill="${C.cream}"/><rect x="116" y="156" width="10" height="20" rx="2" fill="${C.cream}"/>
<rect x="196" y="138" width="56" height="56" rx="10" fill="${C.cream}" ${O}/><path d="M212 154 V178 M236 154 V178" stroke="${C.green}" stroke-width="7" stroke-linecap="round"/>
<path d="M174 166 H196" stroke="${C.mint}" stroke-width="4" stroke-dasharray="3 6" stroke-linecap="round"/>
<path d="M252 166 H274" stroke="${C.outline}" stroke-width="6" stroke-linecap="round"/>
<circle cx="114" cy="112" r="6" fill="${C.mint}"/><circle cx="160" cy="98" r="6" fill="${C.mint}"/><circle cx="206" cy="112" r="6" fill="${C.mint}"/><path d="M114 112 L160 98 L206 112" fill="none" stroke="${C.mint}" stroke-width="2.5" stroke-dasharray="2 6"/>`,
  },
  invoicing: {
    file: "invoicing",
    badges: ["receipt", "badge-percent"],
    scene: `${ground()}
${doc(96, 84, 112, 150, { lines: 5 })}
<path d="M110 196 H160" stroke="${C.outline}" stroke-width="2.5"/><path d="M160 210 H194" stroke="${C.green}" stroke-width="6" stroke-linecap="round"/>
${coin(214, 190, 24)}${coin(236, 214, 18)}
${check(142, 212, 0.9, C.green)}`,
  },
  payments: {
    file: "payments",
    badges: ["banknote", "wallet"],
    scene: `${ground()}
<g transform="rotate(-8 160 150)"><rect x="80" y="110" width="160" height="100" rx="12" fill="url(#body)" ${O}/><rect x="80" y="132" width="160" height="22" fill="${C.outline}"/><rect x="96" y="170" width="44" height="22" rx="4" fill="${C.gold}" ${O}/><path d="M152 182 H216" stroke="${C.cream}" stroke-width="5" stroke-linecap="round"/></g>
${coin(222, 214, 20)}${coin(248, 198, 16)}`,
  },
  "financial-reports": {
    file: "financial-reports",
    badges: ["chart-pie", "file-text"],
    scene: `${ground()}
${doc(132, 90, 108, 146, { lines: 0, title: false })}
${bars(150, 214, [34, 58, 46, 78], 16, 8, C.green)}
${trend([[158, 170], [182, 150], [206, 160], [230, 128]], C.outline)}
<circle cx="104" cy="168" r="40" fill="${C.cream}" ${O}/><path d="M104 168 L104 128 A40 40 0 0 1 142 180 Z" fill="${C.green}" ${O}/><path d="M104 168 L142 180 A40 40 0 0 1 72 190 Z" fill="${C.mint}" ${O}/>`,
  },
  "accounts-setup": {
    file: "accounts-setup",
    badges: ["sliders-horizontal", "settings"],
    scene: `${ground()}
<rect x="80" y="96" width="160" height="140" rx="10" fill="${C.greenDark}" ${O}/><rect x="96" y="96" width="144" height="140" rx="8" fill="url(#paper)" ${O}/>
<path d="M88 112 V220" stroke="${C.outline}" stroke-width="3"/>
<g stroke-linecap="round"><path d="M116 134 H220" stroke="${C.creamDark}" stroke-width="6"/><path d="M116 168 H220" stroke="${C.creamDark}" stroke-width="6"/><path d="M116 202 H220" stroke="${C.creamDark}" stroke-width="6"/>
<path d="M116 134 H176" stroke="${C.green}" stroke-width="6"/><path d="M116 168 H142" stroke="${C.green}" stroke-width="6"/><path d="M116 202 H200" stroke="${C.green}" stroke-width="6"/></g>
<circle cx="176" cy="134" r="10" fill="${C.cream}" ${O}/><circle cx="142" cy="168" r="10" fill="${C.cream}" ${O}/><circle cx="200" cy="202" r="10" fill="${C.cream}" ${O}/>`,
  },
  taxes: {
    file: "taxes",
    badges: ["percent", "landmark"],
    scene: `${ground()}
${doc(100, 86, 116, 150, { lines: 4 })}
<circle cx="214" cy="192" r="34" fill="${C.green}" ${O}/><circle cx="202" cy="180" r="7" fill="${C.cream}"/><circle cx="226" cy="204" r="7" fill="${C.cream}"/><path d="M200 208 L228 176" stroke="${C.cream}" stroke-width="6" stroke-linecap="round"/>
${coin(84, 206, 18)}`,
  },
  banking: {
    file: "banking",
    badges: ["landmark", "credit-card"],
    scene: `${ground()}
${bank(90, 100, 140, 136)}
${coin(70, 214, 18)}${coin(252, 214, 18)}`,
  },
  budget: {
    file: "budget",
    badges: ["piggy-bank", "chart-column"],
    scene: `${ground()}
<ellipse cx="156" cy="176" rx="74" ry="52" fill="url(#body)" ${O}/>
<circle cx="222" cy="168" r="26" fill="${C.green}" ${O}/><circle cx="238" cy="166" r="9" fill="${C.greenLight}" ${O}/><circle cx="236" cy="164" r="2" fill="${C.outline}"/><circle cx="240" cy="170" r="2" fill="${C.outline}"/>
<path d="M214 144 L226 130 L232 146" fill="${C.green}" ${O}/>
<circle cx="220" cy="156" r="3.5" fill="${C.outline}"/>
<rect x="106" y="218" width="18" height="18" rx="3" fill="${C.greenDark}" ${O}/><rect x="176" y="218" width="18" height="18" rx="3" fill="${C.greenDark}" ${O}/>
<path d="M136 134 H176" stroke="${C.outline}" stroke-width="5" stroke-linecap="round"/>
${coin(156, 112, 16)}
<path d="M88 170 Q78 176 84 184" fill="none" stroke="${C.outline}" stroke-width="4" stroke-linecap="round"/>`,
  },
  "share-management": {
    file: "share-management",
    badges: ["chart-candlestick", "award"],
    scene: `${ground()}
${doc(84, 90, 150, 146, { lines: 0, title: false })}
<path d="M100 108 H218" stroke="${C.green}" stroke-width="5" stroke-linecap="round"/>
<g stroke="${C.outline}" stroke-width="3"><path d="M118 130 V214 M150 124 V206 M182 136 V220 M214 118 V200"/></g>
<rect x="110" y="150" width="16" height="40" rx="2" fill="${C.green}" ${O}/><rect x="142" y="140" width="16" height="34" rx="2" fill="${C.mint}" ${O}/><rect x="174" y="160" width="16" height="40" rx="2" fill="${C.green}" ${O}/><rect x="206" y="134" width="16" height="36" rx="2" fill="${C.mint}" ${O}/>
<circle cx="226" cy="206" r="22" fill="${C.gold}" ${O}/><path d="M216 228 L222 250 L226 242 L230 250 L236 228" fill="${C.green}" ${O}/><circle cx="226" cy="206" r="11" fill="none" stroke="${C.outline}" stroke-width="2.5"/>`,
  },
  subscription: {
    file: "subscription",
    badges: ["repeat", "calendar-days"],
    scene: `${ground()}
${calendar(84, 102, 120, 120, { marked: [1, 6, 10] })}
<path d="M226 128 A44 44 0 1 1 196 198" fill="none" stroke="${C.mint}" stroke-width="7" stroke-linecap="round"/>
<path d="M190 200 l10 -14 6 16 Z" fill="${C.mint}" ${O}/>
<path d="M226 128 l-14 4 10 10 Z" fill="${C.mint}" ${O}/>`,
  },
  leaves: {
    file: "leaves",
    badges: ["tree-palm", "calendar-check"],
    scene: `${ground()}
${calendar(74, 112, 110, 112, { marked: [5, 6, 7] })}
<path d="M226 236 Q222 190 236 150" fill="none" stroke="${C.tanDark}" stroke-width="10" stroke-linecap="round"/><path d="M226 236 Q222 190 236 150" fill="none" stroke="${C.outline}" stroke-width="3" stroke-dasharray="6 8"/>
<g fill="${C.green}" ${O}><path d="M236 150 Q200 128 180 150 Q210 148 236 150 Z"/><path d="M236 150 Q252 112 290 118 Q260 132 236 150 Z"/><path d="M236 150 Q210 108 222 92 Q240 118 236 150 Z"/><path d="M236 150 Q276 150 288 176 Q256 166 236 150 Z"/><path d="M236 150 Q266 110 282 96 Q262 132 236 150 Z"/></g>
<circle cx="236" cy="150" r="7" fill="${C.tan}" ${O}/>`,
  },
  tenure: {
    file: "tenure",
    badges: ["route", "briefcase"],
    scene: `${ground()}
<path d="M80 212 C 110 150, 150 216, 180 150 S 236 96, 250 100" fill="none" stroke="${C.mint}" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 10"/>
<circle cx="80" cy="212" r="12" fill="${C.cream}" ${O}/><circle cx="180" cy="150" r="12" fill="${C.cream}" ${O}/>
<path d="M250 112 C 242 103, 238 97, 238 91 A12 12 0 0 1 262 91 C 262 97, 258 103, 250 112 Z" fill="${C.gold}" ${O}/>
${person(130, 118, { scale: 1.1 })}
<rect x="150" y="196" width="44" height="34" rx="6" fill="${C.greenDark}" ${O}/><path d="M160 196 V190 Q160 184 166 184 H178 Q184 184 184 190 V196" fill="none" ${O}/>`,
  },
  payroll: {
    file: "payroll",
    badges: ["banknote", "calculator"],
    scene: `${ground()}
<g transform="rotate(-6 150 170)"><rect x="76" y="150" width="150" height="70" rx="8" fill="${C.greenDark}" ${O}/></g>
<rect x="84" y="138" width="150" height="70" rx="8" fill="url(#body)" ${O}/><rect x="98" y="150" width="122" height="46" rx="6" fill="none" stroke="${C.cream}" stroke-width="3"/><circle cx="159" cy="173" r="18" fill="${C.cream}" ${O}/><circle cx="159" cy="173" r="8" fill="none" stroke="${C.green}" stroke-width="3"/>
${coin(228, 208, 20)}${coin(252, 192, 16)}
${person(236, 100, { scale: 0.8 })}`,
  },
  expenses: {
    file: "expenses",
    badges: ["receipt", "hand-coins"],
    scene: `${ground()}
${receipt(92, 84, 96, 136, { lines: 5 })}
${coin(214, 188, 18)}${coin(240, 180, 14)}${coin(228, 164, 12)}
${tray(222, 206, 84)}`,
  },
  "hr-setup": {
    file: "hr-setup",
    badges: ["user-round-cog", "settings"],
    scene: `${ground()}
${person(138, 108, { scale: 1.25 })}
${gear(222, 184, 30, 8, "url(#body)")}
${gear(236, 126, 16, 7, C.green)}`,
  },
  performance: {
    file: "performance",
    badges: ["trophy", "star"],
    scene: `${ground()}
${bars(78, 236, [48, 76, 104], 26, 10, C.greenDark)}
<path d="M160 100 H212 V128 A26 26 0 0 1 160 128 Z" fill="${C.gold}" ${O}/><path d="M160 108 H146 Q142 128 160 132 M212 108 H226 Q230 128 212 132" fill="none" ${O}/>
<path d="M180 154 H192 L196 176 H176 Z" fill="${C.tan}" ${O}/><rect x="164" y="176" width="44" height="12" rx="3" fill="${C.greenDark}" ${O}/>
${trend([[90, 170], [128, 140], [160, 150], [196, 100]], C.mint)}`,
  },
  recruitment: {
    file: "recruitment",
    badges: ["user-round-search", "briefcase"],
    scene: `${ground()}
${doc(92, 90, 100, 146, { lines: 4 })}
${person(142, 104, { scale: 0.75 })}
${magnifier(214, 178, 34)}
${person(214, 160, { scale: 0.6, body: C.greenDark })}`,
  },
  "tax-benefits": {
    file: "tax-benefits",
    badges: ["hand-coins", "percent"],
    scene: `${ground()}
${doc(80, 92, 96, 118, { lines: 3 })}
<circle cx="128" cy="128" r="18" fill="${C.green}" ${O}/><circle cx="122" cy="122" r="3.5" fill="${C.cream}"/><circle cx="134" cy="134" r="3.5" fill="${C.cream}"/><path d="M120 136 L136 120" stroke="${C.cream}" stroke-width="4" stroke-linecap="round"/>
${coin(206, 178, 20)}${coin(236, 186, 15)}${coin(190, 194, 13)}
${tray(214, 212, 90)}`,
  },
  home: {
    file: "home",
    badges: ["house", "layout-grid"],
    scene: `${ground()}
<path d="M86 160 L160 96 L234 160" fill="none" stroke="${C.outline}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M100 150 V236 H220 V150" fill="url(#body)" ${O}/>
<path d="M86 160 L160 96 L234 160" fill="none" stroke="${C.greenLight}" stroke-width="3" stroke-linecap="round"/>
<rect x="144" y="186" width="32" height="50" rx="4" fill="${C.outline}"/><circle cx="170" cy="212" r="3" fill="${C.gold}"/>
<rect x="112" y="166" width="22" height="22" rx="3" fill="${C.cream}" ${O}/><rect x="186" y="166" width="22" height="22" rx="3" fill="${C.cream}" ${O}/>
<rect x="196" y="110" width="16" height="30" rx="2" fill="${C.greenDark}" ${O}/>`,
  },
  crm: {
    file: "crm",
    badges: ["handshake", "messages-square"],
    scene: `${ground()}
${person(116, 122, { scale: 1.1 })}
${person(204, 122, { scale: 1.1, body: C.greenDark })}
${bubble(126, 72, 70, 40, C.cream, "left")}<path d="M140 92 H182" stroke="${C.green}" stroke-width="4" stroke-linecap="round"/>
<path d="M146 198 Q160 212 174 198" fill="none" stroke="${C.cream}" stroke-width="6" stroke-linecap="round"/>
<path d="M150 150 Q160 142 170 150 Q180 160 160 176 Q140 160 150 150 Z" fill="${C.gold}" ${O}/>`,
  },
  support: {
    file: "support",
    badges: ["headset", "life-buoy"],
    scene: `${ground()}
${person(150, 112, { scale: 1.25 })}
${headset(150, 108, 42)}
${bubble(206, 150, 64, 44, C.cream, "left")}${check(238, 172, 0.8, C.green)}`,
  },
  hr: {
    file: "hr",
    badges: ["users-round", "id-card"],
    scene: `${ground()}
${person(104, 134, { body: C.greenDark, scale: 0.9 })}
${person(216, 134, { body: C.greenDark, scale: 0.9 })}
${person(160, 106, { scale: 1.2 })}
<rect x="130" y="196" width="60" height="40" rx="6" fill="url(#paper)" ${O}/><circle cx="146" cy="214" r="8" fill="${C.green}"/><path d="M160 208 H180 M160 220 H176" stroke="${C.greenLight}" stroke-width="3.5" stroke-linecap="round"/>`,
  },
  accounting: {
    file: "accounting",
    badges: ["calculator", "receipt"],
    scene: `${ground()}
${doc(84, 92, 100, 144, { lines: 5 })}
<rect x="156" y="120" width="84" height="116" rx="10" fill="${C.greenDark}" ${O}/><rect x="166" y="130" width="64" height="26" rx="4" fill="${C.cream}" ${O}/>
${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${166 + c * 22}" y="${166 + r * 22}" width="16" height="16" rx="3" fill="${r === 2 && c === 2 ? C.gold : C.mint}"/>`).join("")).join("")}
${coin(236, 206, 16)}`,
  },
  buying: {
    file: "buying",
    badges: ["shopping-bag", "tag"],
    scene: `${ground()}
${box(78, 176, 60)}${box(140, 176, 60, C.tanDark)}
<path d="M172 120 Q172 92 196 92 Q220 92 220 120" fill="none" stroke="${C.outline}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M160 118 H232 L242 236 H150 Z" fill="url(#body)" ${O}/><path d="M172 142 H228" stroke="${C.cream}" stroke-width="4" stroke-linecap="round" opacity=".85"/>
<path d="M82 128 L110 110 L130 130 L112 152 Z" fill="${C.gold}" ${O}/><circle cx="110" cy="126" r="4" fill="${C.outline}"/>`,
  },
  manufacturing: {
    file: "manufacturing",
    badges: ["factory", "cog"],
    scene: `${ground()}
${factory(84, 130, 152, 106)}
${gear(224, 112, 20, 8, C.green)}`,
  },
  projects: {
    file: "projects",
    badges: ["square-kanban", "calendar-check"],
    scene: `${ground()}
${kanban(78, 100, 164, 120)}
<rect x="196" y="190" width="52" height="46" rx="6" fill="url(#paper)" ${O}/>${check(222, 214, 0.9, C.green)}`,
  },
  quality: {
    file: "quality",
    badges: ["badge-check", "search"],
    scene: `${ground()}
${shield(150, 90, 120, 146, "url(#body)")}
${shield(150, 108, 86, 108, C.cream)}
${check(150, 160, 1.8, C.green)}
${magnifier(226, 190, 22)}`,
  },
  selling: {
    file: "selling",
    badges: ["shopping-cart", "trending-up"],
    scene: `${ground()}
${cart(72, 128)}
${box(132, 100, 34)}${box(170, 96, 30, C.tanDark)}
${trend([[196, 110], [222, 96], [238, 106], [262, 84]], C.mint)}${coin(252, 130, 14)}`,
  },
  stock: {
    file: "stock",
    badges: ["warehouse", "package"],
    scene: `${ground()}
${shelf(80, 112, 118)}
<rect x="210" y="162" width="40" height="52" rx="5" fill="url(#paper)" ${O}/><rect x="222" y="156" width="16" height="10" rx="2" fill="${C.green}" ${O}/>${check(230, 186, 0.6, C.green)}<path d="M220 202 H240" stroke="${C.greenLight}" stroke-width="3" stroke-linecap="round"/>`,
  },
  assets: {
    file: "assets",
    badges: ["vault", "building-2"],
    scene: `${ground()}
${building(76, 100, 56, 126, { cols: 2, rows: 3, fill: C.greenDark, door: false })}
${safe(140, 118, 108, 108)}
${coin(258, 212, 14)}`,
  },
  subcontracting: {
    file: "subcontracting",
    badges: ["waypoints", "handshake"],
    scene: `${ground()}
${person(108, 126, { scale: 1 })}
${person(212, 126, { scale: 1, body: C.greenDark })}
${doc(134, 96, 52, 66, { lines: 2, title: false })}
${arrow(140, 196, 180, 196, C.mint)}${arrow(180, 212, 140, 212, C.mint)}
<rect x="136" y="166" width="48" height="14" rx="4" fill="${C.gold}" ${O}/>`,
  },
  "erpnext-settings": {
    file: "erpnext-settings",
    badges: ["settings", "wrench"],
    scene: `${ground()}
${gear(150, 160, 48, 10, "url(#body)")}
${gear(226, 196, 22, 8, C.greenDark)}
<g transform="rotate(45 100 120)"><rect x="92" y="78" width="16" height="78" rx="5" fill="${C.cream}" ${O}/><path d="M86 74 h28 v18 l-8 8 h-12 l-8 -8 Z" fill="${C.cream}" ${O}/></g>`,
  },
  "shift-attendance": {
    file: "shift-attendance",
    badges: ["calendar-clock", "check"],
    scene: `${ground()}
${calendar(74, 104, 118, 118, { marked: [0, 1, 2, 4, 5, 6] })}
${clock(216, 176, 44)}
<circle cx="112" cy="222" r="20" fill="${C.green}" ${O}/>${check(112, 222, 0.75)}`,
  },
};

// Render -----------------------------------------------------------------------------------
const only = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(svgDir, { recursive: true });
for (const [key, scene] of Object.entries(scenes)) {
  if (only.length && !only.includes(key)) continue;
  const svg = frame(scene);
  fs.writeFileSync(path.join(svgDir, `${scene.file}.svg`), svg);
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 480 } }).render().asPng();
  const out = path.join(outDir, `${scene.file}.webp`);
  await sharp(png).webp({ quality: 82 }).toFile(out);
  console.log(`${scene.file}.webp`);
}
console.log(`done: ${Object.keys(scenes).length} scenes, pictures in ${path.relative(app, outDir)}`);
