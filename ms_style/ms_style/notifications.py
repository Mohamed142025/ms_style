"""Desk notifications: the unread count on the bell, and a notification when a document changes.

When a document is saved with a change (or submitted, updated after submit, or cancelled), the
user who created it and the users it is assigned to get a Notification Log, except the user who
made the change. Only enabled desk users who have notifications on are told, and the logs are
created after the transaction commits. This runs on every save, so everything that can be
decided without the database is decided first.
"""

import json

import frappe
from frappe import _
from frappe.desk.doctype.notification_log.notification_log import (
    enqueue_create_notification,
    get_title,
    get_title_html,
)
from frappe.desk.doctype.notification_settings.notification_settings import is_notifications_enabled
from frappe.utils import get_fullname

# Records the framework keeps for itself; a change to them is not news for anyone.
SKIPPED_DOCTYPES = {
    "Notification Log", "Notification Settings", "ToDo", "Version", "Comment", "Communication",
    "Activity Log", "Access Log", "Error Log", "Route History", "DocShare", "File", "Deleted Document",
    "Scheduled Job Log", "Scheduled Job Type", "Prepared Report", "Data Import", "Data Import Log",
    "Email Queue", "Email Queue Recipient", "Integration Request", "Webhook Request Log", "Submission Queue",
    "RQ Job", "Energy Point Log", "Session Default Settings", "User", "User Permission", "DocType",
    "Custom Field", "Property Setter", "Workspace", "Workspace Sidebar", "Dashboard Chart", "Number Card",
    "Report", "Print Format", "Module Def", "Installed Applications", "Private Comment",
}
# Fields that change on every save or are kept by the framework.
IGNORED_FIELDS = {"modified", "modified_by", "_assign", "_comments", "_liked_by", "_seen", "_user_tags", "idx"}
VERBS = {
    "save": "عدّل",
    "submit": "اعتمد",
    "update_after_submit": "عدّل",
    "cancel": "ألغى",
}


def notify_on_update(doc, method=None):
    if not _worth_checking(doc):
        return
    action = getattr(doc, "_action", None) or "save"
    if action != "cancel":
        before = doc.get_doc_before_save()
        if not before or _snapshot(before) == _snapshot(doc):
            return

    recipients = {doc.get("owner"), *_assigned_to(doc)} - {frappe.session.user, "Guest", "", None}
    if not recipients:
        return
    users = [
        user
        for user in frappe.get_all(
            "User",
            filters={"name": ["in", list(recipients)], "enabled": 1, "user_type": "System User"},
            pluck="name",
        )
        if is_notifications_enabled(user)
    ]
    if not users:
        return

    subject = _("{0} {1} {2} {3}").format(
        frappe.bold(get_fullname(frappe.session.user)),
        _(VERBS.get(action, VERBS["save"])),
        frappe.bold(_(doc.doctype)),
        get_title_html(get_title(doc.doctype, doc.name)),
    )
    enqueue_create_notification(
        users,
        {
            "type": "Alert",
            "document_type": doc.doctype,
            "document_name": doc.name,
            "subject": subject,
            "from_user": frappe.session.user,
            "email_header": _("Document Updated"),
        },
    )


def _worth_checking(doc):
    flags = frappe.flags
    return not (
        doc.flags.in_insert
        or flags.in_install
        or flags.in_migrate
        or flags.in_import
        or flags.in_patch
        or doc.doctype in SKIPPED_DOCTYPES
        or doc.meta.istable
        or doc.meta.issingle
        or not doc.name
    )


def _assigned_to(doc):
    """The users with an open assignment, as Frappe keeps them on the document itself."""
    try:
        return json.loads(doc.get("_assign") or "[]")
    except ValueError:
        return []


def _snapshot(doc):
    return _clean(doc.as_dict(no_default_fields=True, convert_dates_to_str=True))


def _clean(value):
    if isinstance(value, dict):
        return {k: _clean(v) for k, v in value.items() if k not in IGNORED_FIELDS and v not in (None, "")}
    if isinstance(value, list):
        return [_clean(v) for v in value]
    return value


@frappe.whitelist()
def get_unread_notification_count():
    return frappe.db.count("Notification Log", filters={"for_user": frappe.session.user, "read": 0})
