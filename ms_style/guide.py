"""The Digital Roots ERPNext user guide at /guide, for signed-in system users only.

The guide is a static site (pages, scripts, screenshots and Word editions) kept in
ms_style/user_guide, outside public/, so nginx does not serve it to anyone with the link.
Every file goes through this renderer: guests are sent to the login page and come back
to the guide afterwards; website users (customers, suppliers) are refused.

The files are copied from the guide project by its tools/export_ms_style.mjs.
"""

import mimetypes
import os
from urllib.parse import quote

import frappe
from frappe.website.page_renderers.base_renderer import BaseRenderer
from werkzeug.wrappers import Response

ROUTE = "guide"
GUIDE_DIR = "user_guide"
NO_STORE = "no-store, no-cache, must-revalidate, max-age=0"
# Screenshots, fonts and scripts change only when the guide is exported again.
PRIVATE_CACHE = "private, max-age=86400"

mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx")


def guide_root():
	return os.path.realpath(frappe.get_app_path("ms_style", GUIDE_DIR))


def can_read_guide(user=None):
	user = user or frappe.session.user
	if user == "Guest":
		return False
	return frappe.get_cached_value("User", user, "user_type") == "System User"


class GuidePage(BaseRenderer):
	def can_render(self):
		return (self.path == ROUTE or self.path.startswith(ROUTE + "/")) and os.path.isdir(guide_root())

	def render(self):
		request_path = frappe.local.request.path
		if frappe.session.user == "Guest":
			target = request_path if request_path.startswith(f"/{ROUTE}/") else f"/{ROUTE}"
			return redirect("/login?redirect-to=" + quote(target, safe="/"))
		if not can_read_guide():
			return self.build_response(
				frappe.render_template(
					"templates/includes/guide_forbidden.html", {"title": frappe._("User Guide")}
				),
				http_status_code=403,
				headers={"Cache-Control": NO_STORE},
			)
		relative = self.path[len(ROUTE) :].strip("/") or "index.html"
		root = guide_root()
		file_path = os.path.realpath(os.path.join(root, relative))
		if not file_path.startswith(root + os.sep) or not os.path.isfile(file_path):
			return Response("Not found", status=404, mimetype="text/plain")

		mimetype = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
		with open(file_path, "rb") as f:
			data = f.read()
		if relative == "index.html":
			data = page_with_base(data)
		response = Response(data, status=200, mimetype=mimetype)
		response.headers["Cache-Control"] = NO_STORE if mimetype == "text/html" else PRIVATE_CACHE
		if file_path.endswith(".docx"):
			response.headers["Content-Disposition"] = f"attachment; filename={os.path.basename(file_path)}"
		return response


def page_with_base(html: bytes) -> bytes:
	"""The guide's page as served at /guide (nginx drops trailing slashes, so relative links
	would resolve from /): its own links point under /guide/ and its scripts get the base."""
	base = f"/{ROUTE}/"
	text = html.decode("utf-8")
	for attr in ('href="', 'src="'):
		for folder in ("assets/", "downloads/"):
			text = text.replace(attr + folder, attr + base + folder)
	text = text.replace("<head>", f'<head>\n  <script>window.GUIDE_BASE = "{base}";</script>', 1)
	return text.encode("utf-8")


def redirect(location):
	response = Response("", status=302)
	response.headers["Location"] = location
	response.headers["Cache-Control"] = NO_STORE
	return response
