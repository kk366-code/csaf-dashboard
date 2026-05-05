from apiflask import HTTPTokenAuth
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()
auth = HTTPTokenAuth(scheme="Bearer", description="JWT Bearer token")
