import frappe
from urllib.parse import quote
from frappe.utils import strip_html


@frappe.whitelist(allow_guest=True)
def get_login_branding():
    settings = frappe.get_cached_doc("Website Settings")
    logo = settings.app_logo or "/assets/ms_style/images/logo-horizontal-dark-bg.png"
    background = settings.get("custom_login_background") or "/assets/ms_style/images/Main login.png"
    return {
        "logo": quote(logo, safe="/:?=&[]"),
        "background": quote(background, safe="/:?=&[]"),
        "full_screen": bool(settings.get("custom_login_background_full_screen")),
    }


@frappe.whitelist()
def get_my_work_center():
    user = frappe.session.user
    if user == "Guest":
        return {"actions": [], "recent": [], "counts": {"actions": 0, "approvals": 0, "tasks": 0, "drafts": 0}}

    # The drafts section below scans every submittable doctype the user can read
    # (a has_permission check plus a query per doctype), which is the dominant
    # cost of this endpoint - easily 30-80+ round trips on a typical ERPNext
    # install. That scan can't be collapsed into one query (docstatus/owner live
    # in separate per-doctype tables), so instead the whole result is cached per
    # user for a short window: repeat loads (reloads, re-opening the desk) come
    # back instantly, while the data is never more than a minute stale.
    cache_key = "ms_style_my_work_center"
    cached = frappe.cache().get_value(cache_key, user=user)
    if cached is not None:
        return cached

    actions = []
    approvals = frappe.get_all(
        "Workflow Action",
        filters={"user": user, "status": "Open"},
        fields=["name", "reference_doctype", "reference_name", "workflow_state", "modified"],
        order_by="modified desc",
        limit_page_length=6,
    )
    for item in approvals:
        actions.append(
            {
                "kind": "approval",
                "title": item.reference_name,
                "subtitle": f"Approval · {item.reference_doctype} · {item.workflow_state or 'Pending'}",
                "doctype": item.reference_doctype,
                "name": item.reference_name,
                "modified": item.modified,
            }
        )

    todos = frappe.get_all(
        "ToDo",
        filters={"allocated_to": user, "status": "Open"},
        fields=["name", "description", "reference_type", "reference_name", "date", "modified"],
        order_by="modified desc",
        limit_page_length=6,
    )
    for item in todos:
        if item.reference_type and item.reference_name:
            reference_meta = frappe.get_meta(item.reference_type)
            reference_status = None
            if reference_meta.has_field("status"):
                reference_status = frappe.db.get_value(
                    item.reference_type,
                    item.reference_name,
                    "status",
                )
            reference_docstatus = None
            if reference_meta.has_field("docstatus"):
                reference_docstatus = frappe.db.get_value(
                    item.reference_type,
                    item.reference_name,
                    "docstatus",
                )
            if reference_status in {"Closed", "Cancelled", "Completed", "Resolved"} or reference_docstatus == 2:
                continue

        title = strip_html(item.description or item.reference_name or item.name)
        actions.append(
            {
                "kind": "task",
                "title": title,
                "subtitle": f"Task · {item.reference_type or 'General'} · {item.reference_name or ''}".strip(" ·"),
                "doctype": item.reference_type,
                "name": item.reference_name,
                "modified": item.modified,
            }
        )

    draft_keys = set()
    draft_doctypes = frappe.get_all(
        "DocType",
        filters={"istable": 0, "issingle": 0, "is_virtual": 0, "is_submittable": 1},
        fields=["name"],
        order_by="name asc",
        limit_page_length=0,
    )
    for doctype in draft_doctypes:
        if not frappe.has_permission(doctype.name, ptype="read", user=user):
            continue
        try:
            for draft in frappe.get_all(
                    doctype.name,
                    filters={"owner": user, "docstatus": 0},
                    fields=["name", "modified"],
                    order_by="modified desc",
                    limit_page_length=3,
                ):
                draft_key = (doctype.name, draft.name)
                if draft_key in draft_keys:
                    continue
                draft_keys.add(draft_key)
                actions.append(
                    {
                        "kind": "draft",
                        "title": draft.name,
                        "subtitle": f"Draft · {doctype.name}",
                        "doctype": doctype.name,
                        "name": draft.name,
                        "modified": draft.modified,
                    }
                )
        except Exception:
            continue

    recent = frappe.get_all(
        "Activity Log",
        filters={"user": user},
        fields=["subject", "reference_doctype", "reference_name", "operation", "modified"],
        order_by="modified desc",
        limit_page_length=5,
    )

    actions.sort(key=lambda item: item.get("modified") or "", reverse=True)
    result = {
        "actions": actions[:12],
        "recent": [
            {
                "title": item.subject or item.reference_name,
                "subtitle": f"{item.operation or 'Updated'} {item.reference_doctype or ''}".strip(),
                "doctype": item.reference_doctype,
                "name": item.reference_name,
                "modified": item.modified,
            }
            for item in recent
            if item.reference_doctype and item.reference_name
        ],
        "counts": {
            "actions": len(actions),
            "approvals": len(approvals),
            "tasks": sum(1 for action in actions if action["kind"] == "task"),
            "drafts": sum(1 for action in actions if action["kind"] == "draft"),
        },
    }
    frappe.cache().set_value(cache_key, result, user=user, expires_in_sec=60)
    return result
