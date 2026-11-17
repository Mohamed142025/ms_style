import json

import frappe
import redis
from frappe import _
from frappe.deferred_insert import queue_prefix
from urllib.parse import quote
from frappe.utils import add_days, now_datetime, nowdate, strip_html

from ms_style.ms_style.setup import DEFAULT_LOGIN_BACKGROUND

QUICK_CREATE_LIMIT = 4
FREQUENT_LIMIT = 5
ROUTE_HISTORY_DAYS = 30
# Visits the browser still holds are sent with the request; cap what one call may add.
PENDING_ROUTES_LIMIT = 50
# Frappe's own doctypes are framework setup (DocType, Custom Field, Workspace, User...)
# rather than day-to-day work, apart from these.
FRAPPE_WORK_DOCTYPES = {"ToDo", "Event", "Note", "Contact", "Address"}


def get_pwa_branding(brand):
    """The employee PWA's branding (ms_hrms_pwa_branding hook): the desk navbar's logo on
    a Roots green bar, as ms_style draws the navbar (ms_style_pwa.bundle.scss)."""
    logo = frappe.db.get_single_value("Navbar Settings", "app_logo") or "/assets/ms_style/images/logo-horizontal-dark-bg.png"
    return {
        "logo": quote(logo, safe="/:?=&[]"),
        "dark_header": True,
        "theme_color": "#0E3B2E",
    }


def show_login_navbar(context):
    """update_website_context: Frappe draws the login page's navbar only with the language
    picker on (www/login.html), and the brand's login keeps its logo and language toggle
    there. Turned on for the login page alone, so the site's other pages are unchanged."""
    path = (getattr(frappe.local, "path", None) or context.get("path") or "").strip("/")
    if path == "login":
        return {"show_language_picker": 1}


@frappe.whitelist(allow_guest=True)
def get_login_branding():
    settings = frappe.get_cached_doc("Website Settings")
    logo = settings.app_logo or "/assets/ms_style/images/logo-horizontal-dark-bg.png"
    background = settings.get("custom_login_background") or DEFAULT_LOGIN_BACKGROUND
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
def get_my_work_center(pending_routes=None):
    user = frappe.session.user
    if user == "Guest":
        return {"actions": [], "recent": [], "counts": {"actions": 0, "approvals": 0, "tasks": 0, "drafts": 0}}

    # Support details are read outside the per-user cache below so an edit in
    # Website Settings shows up immediately instead of up to a minute later.
    # "Most used" is read outside it too (one grouped query): the visit counts go up as
    # soon as the user comes back to the desk, including visits not yet written.
    routes = _get_route_history(user, _get_unsaved_routes(user, pending_routes))
    return {
        **_get_my_work_center(user),
        "frequent": _get_frequent(user, routes),
        "support": get_work_center_support(),
    }


def _get_unsaved_routes(user, pending_routes=None):
    """Visits Route History does not have yet.

    Frappe writes them in batches: the browser sends its visits 10 seconds after the
    last navigation (`pending_routes`, sent by ms_style), and the server queues them
    for a deferred insert that runs every 15 minutes.
    """
    routes = []
    try:
        queued = frappe.cache.lrange(f"{queue_prefix}Route History", 0, -1)
    except redis.exceptions.RedisError:
        queued = []
    for batch in queued:
        records = json.loads(batch)
        for record in records if isinstance(records, list) else [records]:
            if record.get("user") == user and record.get("route"):
                routes.append(record["route"])

    pending = frappe.parse_json(pending_routes) if pending_routes else []
    if isinstance(pending, list):
        routes.extend(route for route in pending[:PENDING_ROUTES_LIMIT] if isinstance(route, str) and route)
    return routes


def _user_doctypes():
    """The doctypes the session user can read and create, from Frappe's own per-user
    lists (frappe.get_user(): a few queries over DocPerm and DocType). A has_permission
    or get_all per doctype loads that doctype's whole meta first, which across the
    100-250 doctypes below was most of this endpoint's time on a fresh request."""
    user = frappe.get_user()
    user.get_can_read()
    return set(user.all_read), set(user.can_create)


def _get_own_drafts(user, doctypes):
    """The user's latest drafts (three per doctype) in one query over the doctypes'
    tables. They are the user's own documents (owner = user) in doctypes they can read."""
    tables = set(frappe.db.get_tables())
    parts = [
        f"(select {frappe.db.escape(doctype)} as doctype, name, modified from `tab{doctype}` "
        f"where owner = %(user)s and docstatus = 0 order by modified desc limit 3)"
        for doctype in doctypes
        if f"tab{doctype}" in tables and "`" not in doctype
    ]
    if not parts:
        return []
    try:
        return frappe.db.sql(" union all ".join(parts), {"user": user}, as_dict=True)
    except Exception:
        # A table out of step with its doctype: fall back to one query per doctype.
        drafts = []
        for doctype in doctypes:
            try:
                drafts += [
                    frappe._dict(doctype=doctype, **row)
                    for row in frappe.get_all(
                        doctype,
                        filters={"owner": user, "docstatus": 0},
                        fields=["name", "modified"],
                        order_by="modified desc",
                        limit_page_length=3,
                    )
                ]
            except Exception:
                continue
        return drafts


def _get_my_work_center(user):
    # Cached per user for a short window: repeat loads (reloads, re-opening the desk)
    # come back at once, while the data is never more than a minute stale. The desk
    # also shows the last result it saw while this runs (ms_style.bundle.js).
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

    readable, creatable = _user_doctypes()
    draft_doctypes = frappe.get_all(
        "DocType",
        filters={"istable": 0, "issingle": 0, "is_virtual": 0, "is_submittable": 1},
        order_by="name asc",
        pluck="name",
        limit_page_length=0,
    )
    draft_keys = set()
    for draft in _get_own_drafts(user, [doctype for doctype in draft_doctypes if doctype in readable]):
        draft_key = (draft.doctype, draft.name)
        if draft_key in draft_keys:
            continue
        draft_keys.add(draft_key)
        actions.append(
            {
                "kind": "draft",
                "title": draft.name,
                "subtitle": " · ".join([_("Draft", context="ms_style"), _(draft.doctype)]),
                "doctype": draft.doctype,
                "name": draft.name,
                "modified": draft.modified,
            }
        )

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
        "quick_create": _get_quick_create(user, routes, actions, creatable),
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


def _get_route_history(user, unsaved_routes=()):
    """Visits per route from Frappe's own Route History, most visited first.

    Frappe logs list, report, tree and workspace views there for every user (never
    form routes), so this reflects where the user works, on any device. `count` is the
    last ROUTE_HISTORY_DAYS days, or all time for someone with no recent visits, so a
    user back after a break still gets their older habits. Routes outside that window
    stay in the list with count 0: they still show which doctypes the user has opened.
    `unsaved_routes` are visits Frappe has not written yet; each counts as one visit now.
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
    by_route = {row.route: row for row in rows}
    now = now_datetime()
    for route in unsaved_routes:
        row = by_route.get(route)
        if not row:
            row = by_route[route] = frappe._dict(route=route, recent=0, total=0, last_visit=now)
            rows.append(row)
        row.recent = int(row.recent or 0) + 1
        row.total = int(row.total or 0) + 1
        row.last_visit = now
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


def _get_quick_create(user, routes, actions, creatable=None):
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
    if creatable is None:
        creatable = _user_doctypes()[1]
    # The doctypes' own settings in one query, instead of each doctype's meta.
    candidates_meta = list(visits) + [action["doctype"] for action in actions if action["kind"] == "draft"]
    info = {
        row.name: row
        for row in frappe.get_all(
            "DocType",
            filters={"name": ["in", candidates_meta or [""]]},
            fields=["name", "module", "istable", "issingle", "is_virtual", "in_create"],
        )
    }
    since = add_days(nowdate(), -ROUTE_HISTORY_DAYS)
    scored = []
    for doctype, visit_count in visits.items():
        if not _can_quick_create(doctype, info, creatable, module_apps):
            continue
        created_days = _count_creation_days(doctype, user, since)
        if created_days or visit_count:
            scored.append((created_days, visit_count, last_visit[doctype], doctype))
    # Ties go to the doctype used most recently.
    scored.sort(key=lambda score: score[:3], reverse=True)
    candidates = [score[3] for score in scored]

    for action in actions:
        if action["kind"] == "draft" and action["doctype"] not in candidates:
            if _can_quick_create(action["doctype"], info, creatable, module_apps):
                candidates.append(action["doctype"])

    return [{"doctype": doctype, "label": _(doctype)} for doctype in candidates[:QUICK_CREATE_LIMIT]]


def _can_quick_create(doctype, info, creatable, module_apps):
    """`info`: the doctype's DocType row; `creatable`: the doctypes the user may create
    (Frappe's list leaves out child, single and in_create doctypes already)."""
    row = info.get(doctype)
    if not row or row.istable or row.issingle or row.is_virtual or row.in_create:
        return False
    if module_apps.get(row.module) == "frappe" and doctype not in FRAPPE_WORK_DOCTYPES:
        return False
    return doctype in creatable


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

