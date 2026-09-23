import frappe


LOGIN_BACKGROUND_FIELD = "custom_login_background"
LOGIN_FULLSCREEN_FIELD = "custom_login_background_full_screen"
DEPRECATED_FIELDS = ("custom_login_background_color", "custom_login_background_transparent")

# Desktop tiles ms_style brands with a custom icon (see public/js/ms_style.bundle.js),
# in the order they should appear on the desk home screen. "Reset Layout" throws away
# the per-user Desktop Layout snapshot and falls back to a fresh query of the "Desktop
# Icon" doctype, so that query has to already reflect this exact set/order - otherwise
# resetting scrambles the branded layout instead of just restoring it.
DESKTOP_ICON_ORDER = [
    "Framework",
    "Frappe HR",
    "Organization",
    "Accounting",
    "Buying",
    "Manufacturing",
    "Projects",
    "Quality",
    "Selling",
    "Stock",
    "Assets",
    "Subcontracting",
    "ERPNext Settings",
]


def ensure_desktop_icon_defaults():
    # "Frappe HR" groups the HR sub-workspaces the same way "Framework" and "Accounting"
    # do, but it was created as a per-user (non-standard) icon owned by Administrator.
    # get_desktop_icons() only loads non-standard icons for their own owner, so every
    # other user - and Administrator too, once "Reset Layout" wipes their personal
    # layout - would see the HR sub-workspaces spill out as loose top-level tiles
    # instead of grouped under one HR tile.
    if frappe.db.exists("Desktop Icon", "Frappe HR"):
        hr_icon = frappe.get_doc("Desktop Icon", "Frappe HR")
        if not hr_icon.standard:
            hr_icon.standard = 1
            hr_icon.save(ignore_permissions=True)

    for idx, label in enumerate(DESKTOP_ICON_ORDER):
        if frappe.db.exists("Desktop Icon", label):
            frappe.db.set_value("Desktop Icon", label, "idx", idx, update_modified=False)

    frappe.cache.delete_key("desktop_icons")
    frappe.cache.delete_key("bootinfo")


def after_migrate():
    ensure_desktop_icon_defaults()

    for fieldname in DEPRECATED_FIELDS:
        custom_field = frappe.db.get_value("Custom Field", {"dt": "Website Settings", "fieldname": fieldname})
        if custom_field:
            frappe.delete_doc("Custom Field", custom_field, ignore_permissions=True, force=True)

    fields = [
        {
            "fieldname": LOGIN_BACKGROUND_FIELD,
            "label": "Login Background",
            "fieldtype": "Attach Image",
            "insert_after": "app_logo",
            "description": "Background image used on the Login page.",
        },
        {
            "fieldname": LOGIN_FULLSCREEN_FIELD,
            "label": "Login Background Full Screen",
            "fieldtype": "Check",
            "insert_after": LOGIN_BACKGROUND_FIELD,
            "description": "Make the Login background fill the available screen height.",
        },
    ]
    for field_data in fields:
        if not frappe.db.exists("Custom Field", {"dt": "Website Settings", "fieldname": field_data["fieldname"]}):
            frappe.get_doc({"doctype": "Custom Field", "dt": "Website Settings", **field_data}).insert(
                ignore_permissions=True
            )
    frappe.clear_cache(doctype="Website Settings")
