// The unread count on the bell (sidebar and desk home). The badge is drawn by CSS
// (navigation.scss) from --ms-unread-count on the root element, so it survives the sidebar
// redrawing and nothing has to watch the page; this only keeps the number up to date.
const API = "ms_style.ms_style.notifications.get_unread_notification_count";
let request = null;
let timer = null;

function show(count) {
  const root = document.documentElement;
  root.style.setProperty("--ms-unread-count", `"${count > 99 ? "99+" : count}"`);
  root.classList.toggle("ms-has-unread", count > 0);
}

function refresh() {
  if (request || !frappe.session || frappe.session.user === "Guest") return;
  request = frappe
    .xcall(API)
    .then((count) => show(Number(count) || 0))
    .catch(() => {})
    .finally(() => (request = null));
}

// Opening a notification marks it read and moves to its page; one call after the move settles.
function refresh_soon() {
  clearTimeout(timer);
  timer = setTimeout(refresh, 800);
}

$(() => {
  refresh();
  frappe.realtime.on("notification", refresh);
  frappe.realtime.on("indicator_hide", refresh);
  $(document).on("page-change", refresh_soon);
});
