// Who opened the open document, and when: Ctrl+M on any desk form, or the form menu (the
// ⋯ list on phones). Only for the roles chosen in System Settings, which the server puts
// in the boot; the server records the views (ms_style.ms_style.document_views).
const API = "ms_style.ms_style.document_views.get_viewers";

function t(message, args = []) {
  return __(message, args, "ms_style");
}

// The form on screen, if it is a saved document.
function current_form() {
  const route = frappe.get_route();
  const frm = window.cur_frm;
  if (route[0] !== "Form" || !frm || frm.is_new() || frm.doctype !== route[1]) return null;
  return frm;
}

function show_viewers(frm) {
  frappe.xcall(API, { doctype: frm.doctype, name: frm.docname }).then((rows) => {
    const dialog = new frappe.ui.Dialog({
      title: t("Who opened this document"),
      size: "large",
      fields: [{ fieldtype: "HTML", fieldname: "viewers" }],
    });
    dialog.fields_dict.viewers.$wrapper.html(render(frm, rows || []));
    dialog.show();
  });
}

function render(frm, rows) {
  const title = frappe.utils.escape_html(frm.get_title?.() || frm.docname);
  const note = `<p class="ms-viewers-note">${t(
    "A visit is recorded from desk forms, once every 5 minutes per user."
  )}</p>`;
  if (!rows.length) {
    return `<div class="ms-viewers"><p class="ms-viewers-doc">${title}</p><p class="text-muted">${t(
      "Nobody has opened this document since visits started being recorded."
    )}</p>${note}</div>`;
  }

  const body = rows
    .map(
      (row) => `<tr>
        <td><span class="ms-viewers-user">${frappe.avatar(row.user, "avatar-small")}
          <span>${frappe.utils.escape_html(row.full_name)}</span></span></td>
        <td>${frappe.datetime.str_to_user(row.last_viewed)}
          <div class="text-muted small">${comment_when(row.last_viewed)}</div></td>
        <td class="text-center">${cint(row.views)}</td>
        <td>${frappe.datetime.str_to_user(row.first_viewed)}</td>
      </tr>`
    )
    .join("");

  return `<div class="ms-viewers">
    <p class="ms-viewers-doc">${title}</p>
    <div class="table-responsive">
      <table class="table table-bordered ms-viewers-table">
        <thead><tr>
          <th>${t("User")}</th>
          <th>${t("Last opened")}</th>
          <th class="text-center">${t("Times")}</th>
          <th>${t("First opened")}</th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    ${note}
  </div>`;
}

$(() => {
  if (!frappe.boot?.ms_document_viewers) return;

  frappe.ui.keys.add_shortcut({
    shortcut: "ctrl+m",
    action: () => {
      const frm = current_form();
      if (!frm) return false; // Not on a document: leave the key to the browser.
      show_viewers(frm);
    },
    description: t("Who opened this document"),
    ignore_inputs: true,
  });

  // The menu is rebuilt on every refresh; the same label is only added once. No shortcut
  // here: the page would register Ctrl+M a second time and open the list twice.
  $(document).on("form-refresh", (event, frm) => {
    if (!frm || frm.is_new()) return;
    frm.page.add_menu_item(t("Who opened this document"), () => show_viewers(frm), true);
  });
});
