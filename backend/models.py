from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Boolean, DateTime, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    username:             Mapped[str]           = mapped_column(String, primary_key=True)
    password_hash:        Mapped[str]           = mapped_column(String, nullable=False)
    totp_secret:          Mapped[str | None]    = mapped_column(String, nullable=True)
    totp_enabled:         Mapped[bool]          = mapped_column(Boolean, default=False)
    pending_totp_secret:  Mapped[str | None]    = mapped_column(String, nullable=True)
    created_at:           Mapped[datetime]      = mapped_column(
                              DateTime(timezone=True), default=_now
                          )


class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    id:           Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    username:     Mapped[str]      = mapped_column(String, nullable=False, index=True)
    success:      Mapped[bool]     = mapped_column(Boolean, nullable=False)
    ip:           Mapped[str | None] = mapped_column(String, nullable=True)
    attempted_at: Mapped[datetime] = mapped_column(
                      DateTime(timezone=True), default=_now, index=True
                  )


class DataStore(Base):
    """Key/value store for dashboard datasets (JSON blobs)."""
    __tablename__ = "data_store"

    key:        Mapped[str]      = mapped_column(String, primary_key=True)
    data:       Mapped[Any]      = mapped_column(JSON, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
