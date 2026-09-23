import frappe
from frappe import _
from urllib.parse import quote
from frappe.utils import add_days, nowdate, strip_html

QUICK_CREATE_LIMIT = 4
FREQUENT_LIMIT = 5
ROUTE_HISTORY_DAYS = 30
# Frappe's own doctypes are framework setup (DocType, Custom Field, Workspace, User...)
# rather than day-to-day work, apart from these.
FRAPPE_WORK_DOCTYPES = {"ToDo", "Event", "Note", "Contact", "Address"}


@frappe.whitelist(allow_guest=True)
def get_login_branding():
    settings = frappe.get_cached_doc("Website Settings")
    logo = settings.app_logo or "/assets/ms_style/images/logo-horizontal-dark-bg.png"
    background = settings.get("custom_login_background") or "/assets/ms_style/images/main-login.webp"
    return {
        "logo": quote(logo, safe="/:?=&[]"),
        "background": quote(background, safe="/:?=&[]"),
        "full_screen": bool(settings.get("custom_login_background_full_screen")),
    }


def get_work_center_support():
    """Support contact shown in My Work Center, configured in Website Settings (see setup.py)."""
    settings = frappe.get_cached_doc("Website Settings")
    return {
        "message": settings.get("custom_ms_support_message") or "",
        "phone": settings.get("custom_ms_support_phone") or "",
        "whatsapp": settings.get("custom_ms_support_whatsapp") or "",
    }


@frappe.whitelist()
def get_my_work_center():
    user = frappe.session.user
    if user == "Guest":
        return {"actions": [], "recent": [], "counts": {"actions": 0, "approvals": 0, "tasks": 0, "drafts": 0}}

    # Support details are read outside the per-user cache below so an edit in
    # Website Settings shows up immediately instead of up to a minute later.
    return {**_get_my_work_center(user), "support": get_work_center_support()}


def _get_my_work_center(user):
    # The drafts section below scans every submittable doctype the user can read
    # (a has_permission check plus a query per doctype), which is the dominant
    # cost of this endpoint - easily 30-80+ round trips on a typical ERPNext
    # install. That scan can't be collapsed into one query (docstatus/owner live
    # in separate per-doctype tables), so instead the whole result is cached per
    # user for a short window: repeat loads (reloads, re-opening the desk) come
    # back instantly, while the data is never more than a minute stale.
    # Per language as well: the subtitles below are translated.
    cache_key = f"ms_style_my_work_center:{frappe.local.lang}"
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
                "subtitle": " · ".join([_("Approval", context="ms_style"), _(item.reference_doctype), (_(item.workflow_state) if item.workflow_state else _("Pending", context="ms_style"))]),
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
            # One lookup for both. docstatus is a standard column, so meta.has_field()
            # never reports it; submittable doctypes are the ones that can be cancelled.
            reference_meta = frappe.get_meta(item.reference_type)
            reference_fields = ["status"] if reference_meta.has_field("status") else []
            if reference_meta.is_submittable:
                reference_fields.append("docstatus")
            reference = (
                frappe.db.get_value(item.reference_type, item.reference_name, reference_fields, as_dict=True)
                if reference_fields
                else None
            ) or {}
            if reference.get("status") in {"Closed", "Cancelled", "Completed", "Resolved"} or reference.get("docstatus") == 2:
                continue

        title = strip_html(item.description or item.reference_name or item.name)
        actions.append(
            {
                "kind": "task",
                "title": title,
                "subtitle": " · ".join(
                    part for part in (_("Task", context="ms_style"), (_(item.reference_type) if item.reference_type else _("General", context="ms_style")), item.reference_name) if part
                ),
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
                        "subtitle": " · ".join([_("Draft", context="ms_style"), _(doctype.name)]),
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
    routes = _get_route_history(user)
    result = {
        "quick_create": _get_quick_create(user, routes, actions),
        "frequent": _get_frequent(user, routes),
        "actions": actions[:12],
        "recent": [
            {
                "title": item.subject or item.reference_name,
                "subtitle": " ".join(part for part in ((_(item.operation) if item.operation else _("Updated", context="ms_style")), _(item.reference_doctype or "")) if part),
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


def _get_route_history(user):
    """Visits per route from Frappe's own Route History, most visited first.

    Frappe logs list, report, tree and workspace views there for every user (never
    form routes), so this reflects where the user works, on any device. `count` is the
    last ROUTE_HISTORY_DAYS days, or all time for someone with no recent visits, so a
    user back after a break still gets their older habits. Routes outside that window
    stay in the list with count 0: they still show which doctypes the user has opened.
    """
    since = add_days(nowdate(), -ROUTE_HISTORY_DAYS)
    rows = frappe.db.sql(
        """
        select route, sum(creation >= %(since)s) as recent, count(*) as total, max(creation) as last_visit
        from `tabRoute History`
        where user = %(user)s
        group by route
        """,
        {"user": user, "since": since},
        as_dict=True,
    )
    use_recent = any(row.recent for row in rows)
    for row in rows:
        row.count = int((row.recent if use_recent else row.total) or 0)
    rows.sort(key=lambda row: (row.count, row.last_visit), reverse=True)
    return rows


def _route_doctype(route):
    # "dashboard-view/<name>" is a Dashboard (e.g. Selling, CRM), not a doctype.
    parts = (route or "").split("/")
    if len(parts) > 1 and parts[0] in ("List", "Tree"):
        return parts[1]
    return None


def _get_meta(doctype):
    # Check first: frappe.get_meta on a missing doctype queues a "DocType ... not
    # found" message that would reach the desk as a popup even when caught here.
    if not doctype or not frappe.db.exists("DocType", doctype, cache=True):
        return None
    return frappe.get_meta(doctype)


def _get_quick_create(user, routes, actions):
    """Doctypes the user creates in and works in most, that they are allowed to create.

    Only doctypes the user has opened themselves count, which leaves out records the
    system makes in their name (e.g. scheduled Process Subscription runs owned by
    Administrator). Ranked by the number of days in the last ROUTE_HISTORY_DAYS on
    which they created a record of that doctype (a bulk import or company setup is one
    or two days, however many records it adds), then by visits. Falls back to the
    doctypes of their own drafts when there is no history yet.
    """
    visits, last_visit = {}, {}
    for row in routes:
        doctype = _route_doctype(row.route)
        if doctype:
            visits[doctype] = visits.get(doctype, 0) + row.count
            last_visit[doctype] = max(last_visit.get(doctype, row.last_visit), row.last_visit)

    module_apps = dict(frappe.get_all("Module Def", fields=["name", "app_name"], as_list=True))
    since = add_days(nowdate(), -ROUTE_HISTORY_DAYS)
    scored = []
    for doctype, visit_count in visits.items():
        if not _can_quick_create(doctype, user, module_apps):
            continue
        created_days = _count_creation_days(doctype, user, since)
        if created_days or visit_count:
            scored.append((created_days, visit_count, last_visit[doctype], doctype))
    # Ties go to the doctype used most recently.
    scored.sort(key=lambda score: score[:3], reverse=True)
    candidates = [score[3] for score in scored]

    for action in actions:
        if action["kind"] == "draft" and action["doctype"] not in candidates:
            if _can_quick_create(action["doctype"], user, module_apps):
                candidates.append(action["doctype"])

    return [{"doctype": doctype, "label": _(doctype)} for doctype in candidates[:QUICK_CREATE_LIMIT]]


def _can_quick_create(doctype, user, module_apps):
    meta = _get_meta(doctype)
    if not meta or meta.istable or meta.issingle or meta.is_virtual or meta.in_create:
        return False
    if module_apps.get(meta.module) == "frappe" and doctype not in FRAPPE_WORK_DOCTYPES:
        return False
    return frappe.has_permission(doctype, "create", user=user)


def _count_creation_days(doctype, user, since):
    """Distinct days since `since` on which `user` created a `doctype` record."""
    try:
        return frappe.db.sql(
            f"select count(distinct date(creation)) from `tab{doctype}` where creation >= %s and owner = %s",
            (since, user),
        )[0][0]
    except Exception:
        return 0


def _get_frequent(user, routes):
    """The user's most visited views that they can still open, with readable labels."""
    items = []
    for row in routes:
        if not row.count:
            break
        label = _route_label(row.route, user)
        if label:
            items.append({"route": row.route, "label": label, "count": row.count})
        if len(items) == FREQUENT_LIMIT:
            break
    return items


def _route_label(route, user):
    view, _sep, name = (route or "").partition("/")
    name = name.split("/")[0]
    if not name:
        return None
    if view in ("List", "Tree"):
        return _(name) if _get_meta(name) and frappe.has_permission(name, "read", user=user) else None
    if view == "dashboard-view":
        return _(name) if frappe.db.exists("Dashboard", name) else None
    if view == "query-report":
        if not frappe.db.exists("Report", name):
            return None
        return _(name) if frappe.get_cached_doc("Report", name).is_permitted() else None
    if view == "Workspaces":
        return _(name) if frappe.db.exists("Workspace", name) else None
    return None

