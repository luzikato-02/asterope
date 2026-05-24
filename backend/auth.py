"""
Auth — password verification, JWT tokens, TOTP (Google Authenticator).
User data and login attempts are stored in the database (see models.py).
"""
from __future__ import annotations

import base64
import os
import time
from datetime import datetime, timedelta, timezone
from io import BytesIO

import jwt
import pyotp
import qrcode
import qrcode.image.svg
from sqlalchemy import func, select
from werkzeug.security import check_password_hash, generate_password_hash

from database import get_db
from models import LoginAttempt, User

SECRET_KEY  = os.environ.get("ASTEROPE_SECRET", "asterope-dev-secret-change-in-prod")
JWT_ALG     = "HS256"
TOTP_ISSUER = "Asterope"

_RATE_WINDOW_MIN = 15   # minutes
_RATE_MAX_FAILS  = 5    # lockout after this many failures in the window


# ── Bootstrap ─────────────────────────────────────────────────────────────────

def ensure_admin() -> None:
    """Create the default admin user if it doesn't exist in the database."""
    with get_db() as db:
        if db.get(User, "admin") is None:
            default_pass = os.environ.get("ASTEROPE_ADMIN_PASS", "asterope2026")
            db.add(User(
                username="admin",
                password_hash=generate_password_hash(default_pass),
                totp_enabled=False,
            ))
            db.commit()


# ── User lookup ───────────────────────────────────────────────────────────────

def get_user(username: str) -> User | None:
    with get_db() as db:
        return db.get(User, username)


# ── Rate limiting ─────────────────────────────────────────────────────────────

def _is_locked_out(username: str) -> bool:
    since = datetime.now(timezone.utc) - timedelta(minutes=_RATE_WINDOW_MIN)
    with get_db() as db:
        fails = db.scalar(
            select(func.count()).where(
                LoginAttempt.username == username,
                LoginAttempt.success  == False,      # noqa: E712
                LoginAttempt.attempted_at >= since,
            )
        ) or 0
    return fails >= _RATE_MAX_FAILS


def _record(username: str, success: bool, ip: str | None) -> None:
    with get_db() as db:
        db.add(LoginAttempt(username=username, success=success, ip=ip))
        db.commit()


# ── Password ──────────────────────────────────────────────────────────────────

def verify_password(username: str, password: str, ip: str | None = None) -> bool:
    if _is_locked_out(username):
        return False
    user = get_user(username)
    ok   = bool(user and check_password_hash(user.password_hash, password))
    _record(username, ok, ip)
    return ok


# ── JWT ───────────────────────────────────────────────────────────────────────

def create_token(username: str, kind: str = "full") -> str:
    """
    kind="partial" → 5-minute pre-2FA token
    kind="full"    → 8-hour session token (after completed auth)
    """
    ttl     = 5 * 60 if kind == "partial" else 8 * 3600
    payload = {"sub": username, "kind": kind, "exp": time.time() + ttl}
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALG)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALG])


# ── TOTP ──────────────────────────────────────────────────────────────────────

def generate_totp_setup(username: str) -> dict:
    """
    Create a fresh TOTP secret, save it as pending (not yet active),
    and return the secret, provisioning URI, and a base64-encoded SVG QR code.
    """
    secret = pyotp.random_base32()
    uri    = pyotp.TOTP(secret).provisioning_uri(name=username, issuer_name=TOTP_ISSUER)

    with get_db() as db:
        user = db.get(User, username)
        if user:
            user.pending_totp_secret = secret
            db.commit()

    factory = qrcode.image.svg.SvgPathImage
    img     = qrcode.make(uri, image_factory=factory)
    buf     = BytesIO()
    img.save(buf)
    qr_b64  = base64.b64encode(buf.getvalue()).decode()

    return {"secret": secret, "uri": uri, "qr_base64": qr_b64}


def verify_totp(username: str, code: str, pending: bool = False) -> bool:
    user = get_user(username)
    if not user:
        return False
    secret = user.pending_totp_secret if pending else user.totp_secret
    if not secret:
        return False
    return pyotp.TOTP(secret).verify(code, valid_window=1)


def activate_totp(username: str) -> None:
    """Promote pending_totp_secret → totp_secret and mark enabled."""
    with get_db() as db:
        user = db.get(User, username)
        if user and user.pending_totp_secret:
            user.totp_secret         = user.pending_totp_secret
            user.pending_totp_secret = None
            user.totp_enabled        = True
            db.commit()
