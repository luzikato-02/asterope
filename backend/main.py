from __future__ import annotations

import os
from functools import wraps

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass

import auth as A
from database import engine, get_db, init_db
from flask import Flask, abort, jsonify, request, send_from_directory
from flask_cors import CORS
from models import DataStore
from seed import ensure_seeded
from sqlalchemy import inspect as sa_inspect, text

app = Flask(__name__)

# CORS: in production set ALLOWED_ORIGINS="https://your-app.vercel.app"
_origins = os.environ.get("ALLOWED_ORIGINS", "*")
CORS(app, origins=_origins, supports_credentials=True)


# ── Startup ───────────────────────────────────────────────────────────────────

with app.app_context():
    init_db()
    A.ensure_admin()
    ensure_seeded()


# ── DB helpers ────────────────────────────────────────────────────────────────

def _ds(key: str):
    """Fetch a JSON dataset from the data_store table."""
    with get_db() as db:
        row = db.get(DataStore, key)
        return row.data if row else None


def _db_info() -> dict:
    """Return real database/storage statistics."""
    url      = engine.url
    dialect  = url.get_dialect().name

    inspector   = sa_inspect(engine)
    table_names = inspector.get_table_names()

    _descs = {
        "users":          "registered users and TOTP credentials",
        "login_attempts": "auth audit log — rate limiting",
        "data_store":     "dashboard datasets (JSON blobs, local dev only)",
    }

    table_info = []
    with get_db() as db:
        for tbl in sorted(table_names):
            count = db.scalar(text(f"SELECT COUNT(*) FROM \"{tbl}\""))
            table_info.append({
                "name":       tbl,
                "rows":       count or 0,
                "last_write": "live",
                "desc":       _descs.get(tbl, ""),
            })

    if dialect == "sqlite":
        db_path = url.database or ""
        size_mb = round(os.path.getsize(db_path) / 1024 / 1024, 3) if os.path.exists(db_path) else 0
        return {
            "name":    os.path.basename(db_path),
            "path":    os.path.dirname(db_path),
            "size_mb": size_mb,
            "tables":  table_info,
        }
    else:
        with get_db() as db:
            size_bytes = db.scalar(text("SELECT pg_database_size(current_database())")) or 0
        return {
            "name":    url.database or "asterope",
            "path":    f"{url.host}:{url.port or 5432}",
            "size_mb": round(size_bytes / 1024 / 1024, 2),
            "tables":  table_info,
        }


# ── Auth helpers ──────────────────────────────────────────────────────────────

def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"error": "missing token"}), 401
        try:
            payload = A.decode_token(header[7:])
            if payload.get("kind") != "full":
                return jsonify({"error": "incomplete auth"}), 401
            request.username = payload["sub"]
        except Exception:
            return jsonify({"error": "invalid or expired token"}), 401
        return f(*args, **kwargs)
    return wrapper


def require_partial(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"error": "missing token"}), 401
        try:
            payload = A.decode_token(header[7:])
            if payload.get("kind") not in ("partial", "full"):
                return jsonify({"error": "invalid token kind"}), 401
            request.username = payload["sub"]
        except Exception:
            return jsonify({"error": "invalid or expired token"}), 401
        return f(*args, **kwargs)
    return wrapper


# ── Auth routes ───────────────────────────────────────────────────────────────

@app.post("/api/auth/login")
def login():
    body     = request.get_json(silent=True) or {}
    username = body.get("username", "").strip()
    password = body.get("password", "")
    ip       = request.headers.get("X-Forwarded-For", request.remote_addr)

    if not A.verify_password(username, password, ip):
        return jsonify({"error": "invalid credentials"}), 401

    user  = A.get_user(username)
    token = A.create_token(username, kind="partial")

    step = "totp-verify" if user.totp_enabled else "totp-setup"
    return jsonify({"step": step, "token": token})


@app.get("/api/auth/setup-totp")
@require_partial
def get_totp_setup():
    return jsonify(A.generate_totp_setup(request.username))


@app.post("/api/auth/setup-totp")
@require_partial
def post_totp_setup():
    code = (request.get_json(silent=True) or {}).get("code", "")
    if not A.verify_totp(request.username, code, pending=True):
        return jsonify({"error": "invalid code"}), 401
    A.activate_totp(request.username)
    return jsonify({"token": A.create_token(request.username, kind="full")})


@app.post("/api/auth/verify-totp")
@require_partial
def verify_totp_route():
    code = (request.get_json(silent=True) or {}).get("code", "")
    if not A.verify_totp(request.username, code, pending=False):
        return jsonify({"error": "invalid code"}), 401
    return jsonify({"token": A.create_token(request.username, kind="full")})


@app.get("/api/auth/me")
@require_auth
def me():
    user = A.get_user(request.username)
    if not user:
        return jsonify({"error": "user not found"}), 404
    return jsonify({"username": request.username, "totp_enabled": user.totp_enabled})


@app.post("/api/auth/logout")
def logout_route():
    return jsonify({"ok": True})


# ── Protected data routes (all DB-backed) ─────────────────────────────────────

@app.get("/api/machines")
@require_auth
def get_machines():
    return jsonify(_ds("machines") or [])

@app.get("/api/plant-series")
@require_auth
def get_plant_series():
    return jsonify(_ds("plant_series") or [])

@app.get("/api/history")
@require_auth
def get_history():
    return jsonify(_ds("history") or [])

@app.get("/api/shift-history")
@require_auth
def get_shift_history():
    return jsonify(_ds("shift_history") or [])

@app.get("/api/recommendations")
@require_auth
def get_recommendations():
    return jsonify(_ds("recommendations") or [])

@app.get("/api/anomalies")
@require_auth
def get_anomalies():
    return jsonify(_ds("anomalies") or [])

@app.get("/api/model-runs")
@require_auth
def get_model_runs():
    return jsonify(_ds("model_runs") or [])

@app.get("/api/features")
@require_auth
def get_features():
    return jsonify(_ds("features") or [])

@app.get("/api/clusters")
@require_auth
def get_clusters():
    return jsonify(_ds("clusters") or [])

@app.get("/api/upload-log")
@require_auth
def get_upload_log():
    return jsonify(_ds("upload_log") or [])

@app.get("/api/upload-schema")
@require_auth
def get_upload_schema():
    return jsonify(_ds("upload_schema") or [])

@app.get("/api/sample-parsed-rows")
@require_auth
def get_sample_parsed_rows():
    return jsonify(_ds("sample_parsed_rows") or [])

@app.get("/api/backfill")
@require_auth
def get_backfill():
    bf   = _ds("backfill") or {}
    meta = _ds("backfill_meta") or {}
    return jsonify({"grid": bf.get("grid", []), "dates": bf.get("dates", []), "meta": meta})

@app.get("/api/db-info")
@require_auth
def get_db_info():
    return jsonify(_db_info())

@app.get("/api/machine-series/<int:seed>")
@require_auth
def get_machine_series(seed: int):
    if not (0 <= seed <= 10_000_000):
        abort(400, "seed out of range")
    import data as D
    return jsonify(D.build_machine_series(seed))


# ── Health (public) ───────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    try:
        with get_db() as db:
            db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    return jsonify({"status": "ok", "db": "ok" if db_ok else "error"})


# ── Frontend catch-all (must be last) ────────────────────────────────────────
# Serves the Vite build so Vercel can route everything to this function.
# Static assets (JS/CSS) are served from disk; unknown paths return index.html
# for client-side routing.

_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path: str):
    target = os.path.join(_DIST, path)
    if path and os.path.isfile(target):
        return send_from_directory(_DIST, path)
    return send_from_directory(_DIST, "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=os.environ.get("FLASK_DEBUG", "0") == "1")
