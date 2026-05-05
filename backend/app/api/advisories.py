from datetime import datetime, timezone

from apiflask import APIBlueprint
from flask import abort
from marshmallow import Schema, fields, validate
from sqlalchemy import func

from ..extensions import auth, db
from ..models.advisory import Advisory
from . import log_action, require_role

advisories_bp = APIBlueprint(
    "advisories", __name__, url_prefix="/advisories", tag="Advisories"
)

SEVERITY_VALUES = ["critical", "high", "medium", "low"]
STATUS_VALUES = ["draft", "review", "approved", "published"]


class AdvisoryIn(Schema):
    title = fields.Str(required=True)
    description = fields.Str(load_default=None)
    severity = fields.Str(load_default="medium", validate=validate.OneOf(SEVERITY_VALUES))
    cvss_score = fields.Float(load_default=None, allow_none=True)
    cve_ids = fields.List(fields.Str(), load_default=[])
    affected_products = fields.List(fields.Str(), load_default=[])


class AdvisoryQueryIn(Schema):
    page = fields.Int(load_default=1)
    per_page = fields.Int(load_default=20)
    search = fields.Str(load_default=None)
    severity = fields.Str(load_default=None, validate=validate.OneOf([*SEVERITY_VALUES, ""]))
    status = fields.Str(load_default=None, validate=validate.OneOf([*STATUS_VALUES, ""]))


class AdvisoryOut(Schema):
    id = fields.Int()
    csaf_id = fields.Str()
    title = fields.Str()
    description = fields.Str(allow_none=True)
    severity = fields.Str()
    status = fields.Str()
    cvss_score = fields.Float(allow_none=True)
    cve_ids = fields.List(fields.Str())
    affected_products = fields.List(fields.Str())
    csaf_json = fields.Dict(allow_none=True)
    created_by = fields.Str(allow_none=True)
    created_by_id = fields.Int()
    updated_by_id = fields.Int(allow_none=True)
    published_at = fields.Str(allow_none=True)
    created_at = fields.Str()
    updated_at = fields.Str()


class AdvisoryListOut(Schema):
    items = fields.List(fields.Nested(AdvisoryOut))
    total = fields.Int()
    page = fields.Int()
    per_page = fields.Int()


class StatsOut(Schema):
    total = fields.Int()
    by_severity = fields.Dict(keys=fields.Str(), values=fields.Int())
    by_status = fields.Dict(keys=fields.Str(), values=fields.Int())


def _generate_csaf_id() -> str:
    year = datetime.now(timezone.utc).year
    count = (
        db.session.query(func.count(Advisory.id))
        .filter(func.extract("year", Advisory.created_at) == year)
        .scalar()
        or 0
    )
    return f"CSAF-{year}-{count + 1:06d}"


def _build_csaf_json(advisory: Advisory) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "document": {
            "csaf_version": "2.0",
            "title": advisory.title,
            "tracking": {
                "id": advisory.csaf_id,
                "status": "final" if advisory.status == "published" else "draft",
                "version": "1",
                "revision_history": [
                    {
                        "number": "1",
                        "date": advisory.created_at.isoformat(),
                        "summary": "Initial version",
                    }
                ],
                "initial_release_date": advisory.created_at.isoformat(),
                "current_release_date": now,
            },
            "publisher": {
                "category": "vendor",
                "name": "CSAF Dashboard",
                "namespace": "https://example.com",
            },
        },
        "vulnerabilities": [
            {
                "cve": cve,
                "title": advisory.title,
                "notes": [
                    {"category": "description", "text": advisory.description or ""}
                ],
                "scores": (
                    [
                        {
                            "cvss_v3": {
                                "version": "3.1",
                                "baseScore": advisory.cvss_score,
                                "vectorString": "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
                            },
                            "products": advisory.affected_products or [],
                        }
                    ]
                    if advisory.cvss_score
                    else []
                ),
            }
            for cve in (advisory.cve_ids or ["N/A"])
        ],
        "product_tree": {
            "full_product_names": [
                {"product_id": p.replace(" ", "_").lower(), "name": p}
                for p in (advisory.affected_products or [])
            ]
        },
    }


@advisories_bp.get("/stats")
@advisories_bp.auth_required(auth)
@advisories_bp.output(StatsOut)
@advisories_bp.doc(summary="Get advisory statistics")
def get_stats():
    total = db.session.query(func.count(Advisory.id)).scalar() or 0

    by_severity = {s: 0 for s in SEVERITY_VALUES}
    for row in db.session.query(Advisory.severity, func.count(Advisory.id)).group_by(
        Advisory.severity
    ):
        by_severity[row[0]] = row[1]

    by_status = {s: 0 for s in STATUS_VALUES}
    for row in db.session.query(Advisory.status, func.count(Advisory.id)).group_by(
        Advisory.status
    ):
        by_status[row[0]] = row[1]

    return {"total": total, "by_severity": by_severity, "by_status": by_status}


@advisories_bp.get("/")
@advisories_bp.auth_required(auth)
@advisories_bp.input(AdvisoryQueryIn, location="query", arg_name="query")
@advisories_bp.output(AdvisoryListOut)
@advisories_bp.doc(summary="List advisories with filters and pagination")
def list_advisories(query: dict):
    q = db.session.query(Advisory)

    if query.get("search"):
        pattern = f"%{query['search']}%"
        q = q.filter(
            Advisory.title.ilike(pattern) | Advisory.csaf_id.ilike(pattern)
        )
    if query.get("severity"):
        q = q.filter(Advisory.severity == query["severity"])
    if query.get("status"):
        q = q.filter(Advisory.status == query["status"])

    if auth.current_user.role == "viewer":
        q = q.filter(Advisory.status == "published")

    total = q.count()
    page = query["page"]
    per_page = query["per_page"]
    items = (
        q.order_by(Advisory.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return {"items": [a.to_dict() for a in items], "total": total, "page": page, "per_page": per_page}


@advisories_bp.post("/")
@advisories_bp.auth_required(auth)
@advisories_bp.input(AdvisoryIn, arg_name="body")
@advisories_bp.output(AdvisoryOut, status_code=201)
@advisories_bp.doc(summary="Create a new advisory")
def create_advisory(body: dict):
    user = auth.current_user
    if user.role == "viewer":
        abort(403, description="Insufficient permissions")

    advisory = Advisory(
        csaf_id=_generate_csaf_id(),
        created_by_id=user.id,
        **body,
    )
    db.session.add(advisory)
    db.session.flush()
    advisory.csaf_json = _build_csaf_json(advisory)

    log_action("create", "advisory", advisory.id, advisory.id, {"title": advisory.title})
    db.session.commit()
    return advisory.to_dict(), 201


@advisories_bp.get("/<int:advisory_id>")
@advisories_bp.auth_required(auth)
@advisories_bp.output(AdvisoryOut)
@advisories_bp.doc(summary="Get advisory detail")
def get_advisory(advisory_id: int):
    advisory = db.session.get(Advisory, advisory_id)
    if not advisory:
        abort(404)
    if auth.current_user.role == "viewer" and advisory.status != "published":
        abort(403)
    return advisory.to_dict()


@advisories_bp.put("/<int:advisory_id>")
@advisories_bp.auth_required(auth)
@advisories_bp.input(AdvisoryIn, arg_name="body")
@advisories_bp.output(AdvisoryOut)
@advisories_bp.doc(summary="Update an advisory")
def update_advisory(advisory_id: int, body: dict):
    user = auth.current_user
    advisory = db.session.get(Advisory, advisory_id)
    if not advisory:
        abort(404)
    if user.role == "viewer":
        abort(403)
    if advisory.status == "published":
        abort(400, description="Published advisories cannot be edited")

    for key, value in body.items():
        setattr(advisory, key, value)

    advisory.updated_by_id = user.id
    advisory.updated_at = datetime.now(timezone.utc)
    advisory.csaf_json = _build_csaf_json(advisory)

    log_action("update", "advisory", advisory.id, advisory.id, {"title": advisory.title})
    db.session.commit()
    return advisory.to_dict()


@advisories_bp.delete("/<int:advisory_id>")
@advisories_bp.auth_required(auth)
@advisories_bp.output({}, status_code=204)
@advisories_bp.doc(summary="Delete an advisory")
@require_role("admin", "editor")
def delete_advisory(advisory_id: int):
    advisory = db.session.get(Advisory, advisory_id)
    if not advisory:
        abort(404)
    if advisory.status == "published":
        abort(400, description="Published advisories cannot be deleted")

    log_action("delete", "advisory", advisory.id, None, {"csaf_id": advisory.csaf_id})
    db.session.delete(advisory)
    db.session.commit()
    return {}


def _transition(advisory_id: int, from_statuses: list[str], to_status: str, action: str):
    user = auth.current_user
    advisory = db.session.get(Advisory, advisory_id)
    if not advisory:
        abort(404)
    if advisory.status not in from_statuses:
        abort(400, description=f"Cannot {action} from status '{advisory.status}'")

    advisory.status = to_status
    advisory.updated_by_id = user.id
    advisory.updated_at = datetime.now(timezone.utc)

    if to_status == "published":
        advisory.published_at = datetime.now(timezone.utc)
        advisory.csaf_json = _build_csaf_json(advisory)

    log_action(action, "advisory", advisory.id, advisory.id, {"to_status": to_status})
    db.session.commit()
    return advisory.to_dict()


@advisories_bp.post("/<int:advisory_id>/submit")
@advisories_bp.auth_required(auth)
@advisories_bp.output(AdvisoryOut)
@advisories_bp.doc(summary="Submit advisory for review")
def submit_advisory(advisory_id: int):
    return _transition(advisory_id, ["draft"], "review", "submit")


@advisories_bp.post("/<int:advisory_id>/approve")
@advisories_bp.auth_required(auth)
@advisories_bp.output(AdvisoryOut)
@advisories_bp.doc(summary="Approve advisory")
@require_role("admin", "editor")
def approve_advisory(advisory_id: int):
    return _transition(advisory_id, ["review"], "approved", "approve")


@advisories_bp.post("/<int:advisory_id>/reject")
@advisories_bp.auth_required(auth)
@advisories_bp.output(AdvisoryOut)
@advisories_bp.doc(summary="Reject advisory back to draft")
@require_role("admin", "editor")
def reject_advisory(advisory_id: int):
    return _transition(advisory_id, ["review", "approved"], "draft", "reject")


@advisories_bp.post("/<int:advisory_id>/publish")
@advisories_bp.auth_required(auth)
@advisories_bp.output(AdvisoryOut)
@advisories_bp.doc(summary="Publish advisory")
@require_role("admin")
def publish_advisory(advisory_id: int):
    return _transition(advisory_id, ["approved"], "published", "publish")
