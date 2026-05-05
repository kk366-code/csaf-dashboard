from apiflask import APIFlask
from flask_cors import CORS
from flask_jwt_extended import decode_token

from .config import Config
from .extensions import auth, db, jwt, migrate


def create_app(config_class: type = Config) -> APIFlask:
    app = APIFlask(__name__, title="CSAF Dashboard API", version="1.0.0")
    app.config.from_object(config_class)

    CORS(app, origins=["http://localhost:5173"])

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    @auth.verify_token
    def verify_token(token: str):
        from .models.user import User

        try:
            data = decode_token(token)
            user = db.session.get(User, int(data["sub"]))
            return user if user and user.is_active else None
        except Exception:
            return None

    from .api.advisories import advisories_bp
    from .api.audit_logs import audit_logs_bp
    from .api.auth import auth_bp
    from .api.rss import rss_bp
    from .api.users import users_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(advisories_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(audit_logs_bp)
    app.register_blueprint(rss_bp)

    with app.app_context():
        db.create_all()
        _seed_initial_data()

    return app


def _seed_initial_data() -> None:
    from .models.user import User

    if db.session.query(User).count() > 0:
        return

    for username, email, role, password in [
        ("admin", "admin@example.com", "admin", "admin1234"),
        ("editor", "editor@example.com", "editor", "editor1234"),
        ("viewer", "viewer@example.com", "viewer", "viewer1234"),
    ]:
        user = User(username=username, email=email, role=role)
        user.set_password(password)
        db.session.add(user)

    db.session.commit()
