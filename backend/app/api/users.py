from datetime import datetime, timezone

from apiflask import APIBlueprint
from flask import abort
from marshmallow import Schema, fields, validate

from ..extensions import auth, db
from ..models.user import User
from . import log_action, require_role

users_bp = APIBlueprint("users", __name__, url_prefix="/users", tag="Users")

ROLE_VALUES = ["admin", "editor", "viewer"]


class UserCreateIn(Schema):
    username = fields.Str(required=True)
    email = fields.Str(required=True)
    password = fields.Str(required=True)
    role = fields.Str(load_default="viewer", validate=validate.OneOf(ROLE_VALUES))


class UserUpdateIn(Schema):
    email = fields.Str()
    role = fields.Str(validate=validate.OneOf(ROLE_VALUES))
    is_active = fields.Bool()
    password = fields.Str()


class UserOut(Schema):
    id = fields.Int()
    username = fields.Str()
    email = fields.Str()
    role = fields.Str()
    is_active = fields.Bool()
    created_at = fields.Str()


class UserListOut(Schema):
    items = fields.List(fields.Nested(UserOut))
    total = fields.Int()


@users_bp.get("/")
@users_bp.auth_required(auth)
@users_bp.output(UserListOut)
@users_bp.doc(summary="List all users (admin only)")
@require_role("admin")
def list_users():
    users = db.session.query(User).order_by(User.created_at.desc()).all()
    return {"items": [u.to_dict() for u in users], "total": len(users)}


@users_bp.post("/")
@users_bp.auth_required(auth)
@users_bp.input(UserCreateIn, arg_name="body")
@users_bp.output(UserOut, status_code=201)
@users_bp.doc(summary="Create a user (admin only)")
@require_role("admin")
def create_user(body: dict):
    if db.session.query(User).filter_by(username=body["username"]).first():
        abort(409, description="Username already exists")
    if db.session.query(User).filter_by(email=body["email"]).first():
        abort(409, description="Email already exists")

    user = User(username=body["username"], email=body["email"], role=body["role"])
    user.set_password(body["password"])
    db.session.add(user)

    log_action("create_user", "user", None, None, {"username": user.username})
    db.session.commit()
    return user.to_dict(), 201


@users_bp.put("/<int:user_id>")
@users_bp.auth_required(auth)
@users_bp.input(UserUpdateIn, arg_name="body")
@users_bp.output(UserOut)
@users_bp.doc(summary="Update a user (admin only)")
@require_role("admin")
def update_user(user_id: int, body: dict):
    user = db.session.get(User, user_id)
    if not user:
        abort(404)

    if "password" in body:
        user.set_password(body.pop("password"))
    for key, value in body.items():
        setattr(user, key, value)

    user.updated_at = datetime.now(timezone.utc)
    log_action("update_user", "user", user_id, None, {"username": user.username})
    db.session.commit()
    return user.to_dict()


@users_bp.delete("/<int:user_id>")
@users_bp.auth_required(auth)
@users_bp.output({}, status_code=204)
@users_bp.doc(summary="Delete a user (admin only)")
@require_role("admin")
def delete_user(user_id: int):
    current = auth.current_user
    if current.id == user_id:
        abort(400, description="Cannot delete yourself")

    user = db.session.get(User, user_id)
    if not user:
        abort(404)

    log_action("delete_user", "user", user_id, None, {"username": user.username})
    db.session.delete(user)
    db.session.commit()
    return {}
