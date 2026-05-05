from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db

if TYPE_CHECKING:
    from .audit_log import AuditLog
    from .user import User


class Advisory(db.Model):
    __tablename__ = "advisories"

    id: Mapped[int] = mapped_column(primary_key=True)
    csaf_id: Mapped[str] = mapped_column(String(64), unique=True)
    title: Mapped[str] = mapped_column(String(256))
    description: Mapped[str | None] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(20), default="medium")
    status: Mapped[str] = mapped_column(String(20), default="draft")
    cvss_score: Mapped[float | None] = mapped_column(Float)
    cve_ids: Mapped[list] = mapped_column(JSON, default=list)
    affected_products: Mapped[list] = mapped_column(JSON, default=list)
    csaf_json: Mapped[dict | None] = mapped_column(JSON)

    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    updated_by_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    creator: Mapped[User] = relationship(
        foreign_keys=[created_by_id], back_populates="advisories"
    )
    audit_logs: Mapped[list[AuditLog]] = relationship(
        back_populates="advisory", cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "csaf_id": self.csaf_id,
            "title": self.title,
            "description": self.description,
            "severity": self.severity,
            "status": self.status,
            "cvss_score": self.cvss_score,
            "cve_ids": self.cve_ids or [],
            "affected_products": self.affected_products or [],
            "csaf_json": self.csaf_json,
            "created_by_id": self.created_by_id,
            "created_by": self.creator.username if self.creator else None,
            "updated_by_id": self.updated_by_id,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
