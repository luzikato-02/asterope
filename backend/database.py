"""
Database engine — SQLAlchemy 2.x.
Uses NullPool for serverless (Vercel) compatibility.
Falls back to SQLite when DATABASE_URL is not set (local dev).
"""
from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session
from sqlalchemy.pool import NullPool, StaticPool

_DATABASE_URL = os.environ.get("DATABASE_URL", "")

if _DATABASE_URL:
    # Vercel Postgres / Neon ship "postgres://" URIs; SQLAlchemy requires "postgresql://"
    _url = _DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(_url, poolclass=NullPool)
else:
    _SQLITE_PATH = os.path.join(os.path.dirname(__file__), "asterope.db")
    engine = create_engine(
        f"sqlite:///{_SQLITE_PATH}",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )


class Base(DeclarativeBase):
    pass


@contextmanager
def get_db() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


def init_db() -> None:
    """Create all tables if they don't exist."""
    from models import Base as _Base  # noqa: F401 — import triggers model registration
    _Base.metadata.create_all(engine)
