from datetime import datetime, timezone
from functools import wraps

from flask import abort, request

from ..extensions import auth, db
from ..models.audit_log import AuditLog


def require_role(*roles: str):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if auth.current_user.role not in roles:
                abort(403, description="Insufficient permissions")
            return f(*args, **kwargs)

        return decorated

    return decorator


def log_action(
    action: str,
    resource_type: str | None = None,
    resource_id: int | None = None,
    advisory_id: int | None = None,
    detail: dict | None = None,
) -> None:
    user = auth.current_user
    log = AuditLog(
        user_id=user.id if user else None,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        advisory_id=advisory_id,
        detail=detail,
        ip_address=request.remote_addr,
    )
    db.session.add(log)
