from apiflask import APIBlueprint
from marshmallow import Schema, fields

from ..extensions import auth, db
from ..models.audit_log import AuditLog
from . import require_role

audit_logs_bp = APIBlueprint(
    "audit_logs", __name__, url_prefix="/audit-logs", tag="AuditLogs"
)


class AuditLogQueryIn(Schema):
    page = fields.Int(load_default=1)
    per_page = fields.Int(load_default=50)
    action = fields.Str(load_default=None)
    resource_type = fields.Str(load_default=None)


class AuditLogOut(Schema):
    id = fields.Int()
    user_id = fields.Int(allow_none=True)
    username = fields.Str()
    action = fields.Str()
    resource_type = fields.Str(allow_none=True)
    resource_id = fields.Int(allow_none=True)
    detail = fields.Dict(allow_none=True)
    ip_address = fields.Str(allow_none=True)
    created_at = fields.Str()


class AuditLogListOut(Schema):
    items = fields.List(fields.Nested(AuditLogOut))
    total = fields.Int()
    page = fields.Int()
    per_page = fields.Int()


@audit_logs_bp.get("/")
@audit_logs_bp.auth_required(auth)
@audit_logs_bp.input(AuditLogQueryIn, location="query", arg_name="query")
@audit_logs_bp.output(AuditLogListOut)
@audit_logs_bp.doc(summary="List audit logs (admin only)")
@require_role("admin")
def list_audit_logs(query: dict):
    q = db.session.query(AuditLog)

    if query.get("action"):
        q = q.filter(AuditLog.action == query["action"])
    if query.get("resource_type"):
        q = q.filter(AuditLog.resource_type == query["resource_type"])

    total = q.count()
    page = query["page"]
    per_page = query["per_page"]
    items = (
        q.order_by(AuditLog.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return {
        "items": [log.to_dict() for log in items],
        "total": total,
        "page": page,
        "per_page": per_page,
    }
