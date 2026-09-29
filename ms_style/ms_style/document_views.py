"""Who opened a document, and when.

Every document opened in a desk form is recorded in Frappe's View Log, whether or not
its DocType tracks views, at most once every few minutes per user so that reloading a
form does not flood the log. The roles chosen in System Settings see the list from any
form: Ctrl+M, or "Who opened this document" in the form menu (the ⋯ list on phones).
Views are kept 180 days unless Log Settings says otherwise.
"""

import frappe
from frappe import _
from frappe.query_builder.functions import Count, Max, Min

# A user reopening the same document within this time counts as one view.
REVISIT_SECONDS = 5 * 60
# How long views are kept, until changed in Log Settings.
LOG_DAYS = 180
UNTRACKED_DOCTYPES = {
    # Log records themselves are not worth logging.
    "View Log",
    "Access Log",
    "Activity Log",
    "Error Log",
    "Version",
    "Comment",
    "Route History",
    "Scheduled Job Log",
    "Deleted Document",
    # Desk parts that load their settings the way a form loads a document: workspace
    # cards and charts, report and print views, onboarding, calendars.
    "Workspace",
    "Workspace Sidebar",
    "Desktop Icon",
    "Dashboard",
    "Dashboard Chart",
    "Number Card",
    "Custom HTML Block",
    "Report",
    "Print Format",
    "Module Onboarding",
    "Onboarding Step",
    "Calendar View",
    "Kanban Board",
    "Workflow",
    "Web Template",
    "DocType Layout",
    "Customize Form",
    "Fiscal Year",
}


def log_view(doc, method=None):
    """Runs on every document's onload; only a desk form opening it counts as a view."""
    request = getattr(frappe.local, "request", None)
    if not request or not request.path.endswith("frappe.desk.form.load.getdoc"):
        return
    if frappe.session.user == "Guest" or doc.doctype in UNTRACKED_DOCTYPES:
        return
    # DocTypes with Track Views are logged by Frappe itself right after onload.
    if doc.meta.track_views or doc.meta.istable:
        return

    key = f"ms_viewed:{frappe.session.user}:{doc.doctype}:{doc.name}"
    if frappe.cache.get_value(key):
        return
    frappe.cache.set_value(key, 1, expires_in_sec=REVISIT_SECONDS)
    # Inserted after the response is sent, so opening the form is not slowed down.
    doc.add_viewed(force=True)


def can_see_viewers(user=None):
    user = user or frappe.session.user
    if user == "Administrator":
        return True
    allowed = set(frappe.get_all("Document View Role", filters={"parenttype": "System Settings"}, pluck="role"))
    return bool(allowed & set(frappe.get_roles(user)))


@frappe.whitelist()
def get_viewers(doctype, name):
    if not can_see_viewers():
        frappe.throw(_("Your role cannot see who opened documents.", context="ms_style"), frappe.PermissionError)
    if not frappe.has_permission(doctype, "read", name):
        frappe.throw(_("You do not have permission on this document.", context="ms_style"), frappe.PermissionError)

    log = frappe.qb.DocType("View Log")
    last_viewed = Max(log.creation)
    rows = (
        frappe.qb.from_(log)
        .select(
            log.viewed_by.as_("user"),
            Count("*").as_("views"),
            Min(log.creation).as_("first_viewed"),
            last_viewed.as_("last_viewed"),
        )
        .where((log.reference_doctype == doctype) & (log.reference_name == name))
        .groupby(log.viewed_by)
        .orderby(last_viewed, order=frappe.qb.desc)
        .run(as_dict=True)
    )
    names = dict(
        frappe.get_all(
            "User", filters={"name": ["in", [r.user for r in rows] or [""]]}, fields=["name", "full_name"], as_list=True
        )
    )
    for row in rows:
        row.full_name = names.get(row.user) or row.user
    return rows


def boot_session(bootinfo):
    bootinfo.ms_document_viewers = can_see_viewers()


def setup():
    """After migrate: the roles field in System Settings, System Manager allowed on the
    first setup, and the View Log in Log Settings."""
    from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

    create_custom_fields(
        {
            # In the Permissions section; a section of its own before the Login tab would
            # be moved into that tab.
            "System Settings": [
                {
                    "fieldname": "custom_document_view_roles",
                    "label": "Roles that can see who opened a document",
                    "fieldtype": "Table MultiSelect",
                    "options": "Document View Role",
                    "insert_after": "show_external_link_warning",
                    "description": "Ctrl+M on any document, or Who opened this document in the form menu on phones. How long views are kept is set in Log Settings (View Log).",
                    "module": "MS Style",
                },
            ]
        },
        update=True,
    )

    # Written as a row alone: saving System Settings would re-run all of its validations.
    if not frappe.db.exists("Document View Role", {"parenttype": "System Settings"}):
        frappe.get_doc(
            {
                "doctype": "Document View Role",
                "parent": "System Settings",
                "parenttype": "System Settings",
                "parentfield": "custom_document_view_roles",
                "idx": 1,
                "role": "System Manager",
            }
        ).db_insert()

    if not frappe.db.exists("Logs To Clear", {"parent": "Log Settings", "ref_doctype": "View Log"}):
        log_settings = frappe.get_single("Log Settings")
        log_settings.append("logs_to_clear", {"ref_doctype": "View Log", "days": LOG_DAYS})
        log_settings.save(ignore_permissions=True)
