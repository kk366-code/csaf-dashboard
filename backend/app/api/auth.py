from apiflask import APIBlueprint
from flask import request
from flask_jwt_extended import create_access_token
from marshmallow import Schema, fields

from ..extensions import auth, db
from ..models.audit_log import AuditLog
from ..models.user import User

auth_bp = APIBlueprint("auth", __name__, url_prefix="/auth", tag="Auth")


class LoginIn(Schema):
    username = fields.Str(required=True)
    password = fields.Str(required=True)


class UserOut(Schema):
    id = fields.Int()
    username = fields.Str()
    email = fields.Str()
    role = fields.Str()
    is_active = fields.Bool()
    created_at = fields.Str()


class TokenOut(Schema):
    access_token = fields.Str()
    user = fields.Nested(UserOut)


@auth_bp.post("/login")
@auth_bp.input(LoginIn, arg_name="body")
@auth_bp.output(TokenOut)
@auth_bp.doc(summary="Login and obtain JWT token")
def login(body: dict):
    user = db.session.query(User).filter_by(username=body["username"]).first()
    if not user or not user.check_password(body["password"]):
        return {"message": "Invalid credentials"}, 401
    if not user.is_active:
        return {"message": "Account disabled"}, 403

    token = create_access_token(identity=str(user.id))

    log = AuditLog(
        user_id=user.id,
        action="login",
        resource_type="user",
        resource_id=user.id,
        ip_address=request.remote_addr,
    )
    db.session.add(log)
    db.session.commit()

    return {"access_token": token, "user": user.to_dict()}


@auth_bp.get("/me")
@auth_bp.auth_required(auth)
@auth_bp.output(UserOut)
@auth_bp.doc(summary="Get current authenticated user")
def me():
    return auth.current_user.to_dict()
