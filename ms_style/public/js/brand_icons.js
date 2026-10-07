// The brand's icon system. Desk modules show the brand's illustrations (public/Icone,
// painted on the Roots green ground). Modules without one get a picture composed here in
// the same ground and palette from the Lucide glyph Frappe ships in its icon sprite, so a
// new module never falls back to Frappe's grey icons. Also picks a fitting glyph for a
// document, report or page by its name (sidebar items, workspace cards).

const artBasePath = "/assets/ms_style/Icone/";
const artVersion = "v7";

// Desk module -> illustration. Keys are the Desktop Icon labels (untranslated). The
// pictures in tools/illustrations (build.mjs) are drawn in the style of the first ones.
const deskArt = {
  Framework: "framework.webp",
  Organization: "organization.webp",
  "Custom HR": "custom-hr.webp",
  "My Workspaces": "my-workspaces.webp",
  Build: "build.webp",
  Data: "data.webp",
  Email: "email.webp",
  Users: "users.webp",
  System: "system.webp",
  Website: "website.webp",
  Printing: "printing.webp",
  Automation: "automation.webp",
  Integrations: "integrations.webp",
  Invoicing: "invoicing.webp",
  Payments: "payments.webp",
  "Financial Reports": "financial-reports.webp",
  "Accounts Setup": "accounts-setup.webp",
  Taxes: "taxes.webp",
  Banking: "banking.webp",
  Budget: "budget.webp",
  "Share Management": "share-management.webp",
  Subscription: "subscription.webp",
  Leaves: "leaves.webp",
  Tenure: "tenure.webp",
  Payroll: "payroll.webp",
  Expenses: "expenses.webp",
  "HR Setup": "hr-setup.webp",
  Performance: "performance.webp",
  Recruitment: "recruitment.webp",
  "Tax & Benefits": "tax-benefits.webp",
  "Shift & Attendance": "shift-attendance.webp",
  Home: "Home.webp",
  HR: "HR.webp",
  "Frappe HR": "HR.webp",
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
  "أمين المخزن": "ws-storekeeper.webp",
  "المكتب الفني": "ws-technical-office.webp",
  "مهندس الموقع": "ws-site-engineer.webp",
  "فريق المبيعات": "ws-sales-team.webp",
  "المراجع المالي": "ws-financial-auditor.webp",
};

// Desk module -> Lucide glyph for the composed pictures.
const deskGlyphs = {
  Framework: "blocks",
  Build: "hammer",
  Data: "database",
  Email: "mail",
  Users: "users",
  System: "monitor-cog",
  Website: "globe",
  Printing: "printer",
  Automation: "workflow",
  Integrations: "plug-zap",
  "My Workspaces": "layout-dashboard",
  Organization: "building-2",
  Invoicing: "receipt-text",
  Payments: "credit-card",
  "Financial Reports": "chart-pie",
  "Accounts Setup": "sliders-horizontal",
  Taxes: "percent",
  Banking: "landmark",
  Budget: "piggy-bank",
  "Share Management": "chart-candlestick",
  Subscription: "repeat",
  Leaves: "tree-palm",
  Tenure: "route",
  Payroll: "banknote",
  Expenses: "receipt",
  "HR Setup": "user-round-cog",
  Performance: "trophy",
  Recruitment: "user-round-search",
  "Tax & Benefits": "hand-coins",
  "Shift & Attendance": "calendar-clock",
  "Custom HR": "clock-alert",
};

function getSymbol(glyph) {
  const symbol = glyph && document.getElementById(`icon-${glyph}`);
  return symbol?.tagName.toLowerCase() === "symbol" && symbol.getAttribute("viewBox") === "0 0 24 24" ? symbol : null;
}

// A square picture on the illustrations' ground: a soft Mint glow and rays behind the
// glyph, growth rings and sparks around it, the glyph itself large in Sand fading to Mint.
function drawPicture(symbol) {
  const rays = Array.from({ length: 12 }, (_, index) => {
    const angle = (index * 30 * Math.PI) / 180;
    const [x1, y1, x2, y2] = [60 + Math.cos(angle) * 46, 60 + Math.sin(angle) * 46, 60 + Math.cos(angle) * 52, 60 + Math.sin(angle) * 52];
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }).join("");
  const sparks = [[18, 24, 2.2], [102, 20, 1.6], [16, 98, 1.5], [106, 92, 2], [94, 108, 1.2], [28, 108, 1.4]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
<defs>
<linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#17493B"/><stop offset="1" stop-color="#0E3B2E"/></linearGradient>
<radialGradient id="b" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#34D399" stop-opacity=".42"/><stop offset=".55" stop-color="#34D399" stop-opacity=".1"/><stop offset="1" stop-color="#34D399" stop-opacity="0"/></radialGradient>
<linearGradient id="c" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#F4F1EA"/><stop offset="1" stop-color="#6FE3B8"/></linearGradient>
</defs>
<rect width="120" height="120" fill="url(#a)"/>
<circle cx="60" cy="60" r="58" fill="url(#b)"/>
<g fill="none" stroke="#34D399" stroke-width="1.5"><circle cx="60" cy="60" r="38" stroke-opacity=".22"/><circle cx="60" cy="60" r="56" stroke-opacity=".1"/></g>
<g stroke="#34D399" stroke-opacity=".45" stroke-width="2" stroke-linecap="round">${rays}</g>
<g fill="#9AF3CE" fill-opacity=".7">${sparks}</g>
<g transform="translate(27 27) scale(2.75)" fill="none" stroke="#0E3B2E" stroke-opacity=".55" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">${symbol.innerHTML}</g>
<g transform="translate(27 27) scale(2.75)" fill="none" stroke="url(#c)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${symbol.innerHTML}</g>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\n\s*/g, ""))}`;
}

const pictures = new Map();

// The picture for a desk module, as an image URL: its illustration, else a picture composed
// from its glyph (the map above, else the module's own Desktop Icon > Icon). Modules with
// artwork of their own and nothing here keep it; null leaves the icon to Frappe.
export function getDeskIcon(label) {
  if (!label) return null;
  if (deskArt[label]) return `${artBasePath}${deskArt[label]}?${artVersion}`;
  if (pictures.has(label)) return pictures.get(label);
  let symbol = getSymbol(deskGlyphs[label]);
  if (!symbol && !deskGlyphs[label]) {
    const icon = window.frappe?.boot?.desktop_icons?.find((entry) => entry.label === label);
    if (icon && !icon.logo_url) symbol = getSymbol(icon.icon);
  }
  if (!symbol) return null;
  const picture = drawPicture(symbol);
  pictures.set(label, picture);
  return picture;
}

// Documents by name (lowercase doctype).
const docGlyphs = {
  lead: "user-plus",
  opportunity: "lightbulb",
  prospect: "telescope",
  customer: "users-round",
  "customer group": "users",
  contact: "contact",
  address: "map-pin",
  appointment: "calendar-check",
  contract: "signature",
  competitor: "swords",
  quotation: "file-text",
  "sales order": "shopping-cart",
  "sales invoice": "receipt",
  "delivery note": "truck",
  "sales person": "user-round-check",
  "sales partner": "handshake",
  "sales stage": "milestone",
  territory: "map",
  campaign: "megaphone",
  "email campaign": "mail",
  "email group": "mails",
  communication: "messages-square",
  supplier: "building-2",
  "supplier quotation": "file-text",
  "request for quotation": "file-search",
  "purchase order": "shopping-bag",
  "purchase invoice": "receipt-text",
  "purchase receipt": "package-check",
  "material request": "clipboard-list",
  item: "package",
  "item group": "boxes",
  "item price": "tag",
  "price list": "tags",
  "pricing rule": "badge-percent",
  "promotional scheme": "megaphone",
  "coupon code": "ticket-percent",
  "blanket order": "layers",
  "product bundle": "package-plus",
  "shipping rule": "ship",
  warehouse: "warehouse",
  "stock entry": "arrow-left-right",
  "stock reconciliation": "scale",
  batch: "layers",
  "serial no": "barcode",
  "payment entry": "banknote",
  "journal entry": "book-open",
  account: "list-tree",
  "cost center": "target",
  company: "building-2",
  "fiscal year": "calendar-range",
  "monthly distribution": "calendar-range",
  "terms and conditions": "scroll-text",
  "pos profile": "scan-barcode",
  "pos invoice": "receipt",
  "pos opening entry": "door-open",
  "pos closing entry": "door-closed",
  "point-of-sale": "store",
  "loyalty program": "gift",
  "loyalty point entry": "coins",
  employee: "id-card",
  attendance: "calendar-check",
  "leave application": "tree-palm",
  "salary slip": "wallet",
  "expense claim": "receipt",
  project: "folder-kanban",
  task: "square-check-big",
  timesheet: "timer",
  issue: "circle-alert",
  "warranty claim": "shield-check",
  "maintenance schedule": "calendar-cog",
  "maintenance visit": "wrench",
  bom: "list-tree",
  "work order": "hammer",
  "job card": "clipboard-list",
  workstation: "cog",
  asset: "vault",
  vehicle: "car",
  driver: "id-card",
  user: "user",
  role: "shield",
  "utm source": "link",
  "sales-funnel": "funnel",
};

// Then by a word in the name, first match wins: specific words before general ones.
const docGlyphRules = [
  // Workspace card titles arrive translated; the common Arabic ones first.
  [/إعدادات|الإعدادات/, "settings"],
  [/تقارير|تقرير|تحليل/, "chart-column"],
  [/نقطة البيع|نقاط البيع/, "scan-barcode"],
  [/فاتورة|فواتير/, "receipt"],
  [/عرض سعر|عروض/, "file-text"],
  [/دفع|سداد|مدفوعات/, "banknote"],
  [/ضريب/, "percent"],
  [/سعر|تسعير|أسعار/, "tag"],
  [/مخزون|مخزن|مستودع/, "boxes"],
  [/صنف|أصناف|سلع|منتج/, "package"],
  [/مورد/, "building-2"],
  [/عميل|عملاء/, "users-round"],
  [/مبيعات|بيع/, "shopping-cart"],
  [/مشتريات|شراء/, "shopping-bag"],
  [/حساب|قيد|محاسب/, "wallet-cards"],
  [/بنك|بنوك/, "landmark"],
  [/راتب|رواتب/, "wallet"],
  [/إجاز|اجاز/, "tree-palm"],
  [/حضور|انصراف/, "calendar-check"],
  [/موظف|موارد بشرية/, "id-card"],
  [/مشروع|مشاريع/, "folder-kanban"],
  [/مهمة|مهام/, "square-check-big"],
  [/جودة/, "badge-check"],
  [/أصول|اصول/, "vault"],
  [/عقد|عقود/, "signature"],
  [/حملة|تسويق/, "megaphone"],
  [/مركبة|سيارة|شحن|تسليم|نقل/, "truck"],
  [/مستخدم/, "user"],
  [/صلاحي|دور/, "shield"],
  [/طباعة/, "printer"],
  [/بريد/, "mail"],
  [/سجل/, "scroll-text"],
  [/إعداد|اعداد|ضبط|بيانات أساسية/, "database"],
  [/settings|defaults|configuration/, "settings"],
  [/funnel|pipeline/, "funnel"],
  [/analytics|trends?\b|variance|performance/, "chart-line"],
  [/register|ledger|statement/, "book-text"],
  [/ageing|aging|expir|overdue/, "hourglass"],
  [/balance|reconcil|valuation/, "scale"],
  [/summary|analysis|report|efficiency|commission/, "chart-column"],
  [/dashboard/, "layout-dashboard"],
  [/merge log|\blog\b|history/, "scroll-text"],
  [/template/, "layout-template"],
  [/invoice|receipt|bill/, "receipt"],
  [/quotation|quote/, "file-text"],
  [/payment|advance/, "banknote"],
  [/loan/, "hand-coins"],
  [/order/, "shopping-cart"],
  [/delivery|shipment|shipping|trip|vehicle|fleet/, "truck"],
  [/tax|vat|discount|percent/, "percent"],
  [/price|pricing/, "tag"],
  [/budget/, "piggy-bank"],
  [/bank/, "landmark"],
  [/account|cost center|journal/, "wallet-cards"],
  [/warehouse|store/, "warehouse"],
  [/stock|inventory|packing/, "boxes"],
  [/item|product|material/, "package"],
  [/supplier|vendor/, "building-2"],
  [/customer|client/, "users-round"],
  [/lead|prospect/, "user-plus"],
  [/contact/, "contact"],
  [/address|location|territory|branch/, "map-pin"],
  [/salary|payroll|wage/, "wallet"],
  [/attendance|check-?in/, "calendar-check"],
  [/shift|schedule|appointment|calendar|holiday/, "calendar-clock"],
  [/leave/, "tree-palm"],
  [/expense|claim/, "receipt"],
  [/appraisal|goal|feedback/, "star"],
  [/training|course|program/, "graduation-cap"],
  [/job|applicant|interview|recruit|opening/, "briefcase"],
  [/employee|staff|driver|designation/, "id-card"],
  [/department|organi[sz]ation|company/, "building-2"],
  [/project/, "folder-kanban"],
  [/task|todo|checklist/, "square-check-big"],
  [/timesheet|time log|activity/, "timer"],
  [/quality|inspection|audit|review/, "badge-check"],
  [/issue|ticket|complaint|warranty/, "life-buoy"],
  [/maintenance|repair|tool/, "wrench"],
  [/asset|equipment/, "vault"],
  [/contract|agreement|license|licence/, "signature"],
  [/campaign|promotion|marketing/, "megaphone"],
  [/email|newsletter/, "mail"],
  [/sms|message|chat|communication/, "message-square"],
  [/notification|alert|reminder/, "bell"],
  [/user|profile/, "user"],
  [/role|permission|security/, "shield"],
  [/print|letter ?head/, "printer"],
  [/workflow|automation|rule/, "workflow"],
  [/import|export|upload/, "arrow-down-up"],
  [/group|category|tree/, "folder-tree"],
  [/sales|selling|sell/, "shopping-cart"],
  [/purchas|buying/, "shopping-bag"],
  [/pos\b|point of sale/, "scan-barcode"],
  [/entry|note|record/, "notebook-pen"],
  [/master|setup|data/, "database"],
  [/document|file|form/, "file-text"],
];

const kindGlyphs = {
  Report: "chart-column",
  Dashboard: "layout-dashboard",
  Page: "panel-top",
  Workspace: "layout-grid",
  URL: "external-link",
};

// A Lucide glyph name for a document, report or page. `names` are tried in order (the
// document's own name before its label), then `kind` (the link type) decides.
export function getDocGlyph(names, kind) {
  const candidates = names.filter(Boolean).map((name) => String(name).toLowerCase().trim());
  for (const name of candidates) {
    if (docGlyphs[name]) return docGlyphs[name];
  }
  for (const name of candidates) {
    const rule = docGlyphRules.find(([pattern]) => pattern.test(name));
    if (rule) return rule[1];
  }
  return kindGlyphs[kind] || "file-text";
}
