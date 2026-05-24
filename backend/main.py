from __future__ import annotations

import os
from functools import wraps

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass

import auth as A
import data as D
from database import init_db
from flask import Flask, abort, jsonify, request
from flask_cors import CORS

app = Flask(__name__)

# CORS: in production set ALLOWED_ORIGINS="https://your-app.vercel.app"
_origins = os.environ.get("ALLOWED_ORIGINS", "*")
CORS(app, origins=_origins, supports_credentials=True)


# ── Startup ───────────────────────────────────────────────────────────────────

with app.app_context():
    init_db()
    A.ensure_admin()


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
    return jsonify({"username": request.username, "totp_enabled": user.totp_enabled})


@app.post("/api/auth/logout")
def logout_route():
    return jsonify({"ok": True})


# ── Protected data routes ─────────────────────────────────────────────────────

@app.get("/api/machines")
@require_auth
def get_machines():
    return jsonify(D.MACHINES)

@app.get("/api/plant-series")
@require_auth
def get_plant_series():
    return jsonify(D.PLANT_SERIES)

@app.get("/api/history")
@require_auth
def get_history():
    return jsonify(D.HISTORY)

@app.get("/api/shift-history")
@require_auth
def get_shift_history():
    return jsonify(D.SHIFT_HISTORY)

@app.get("/api/recommendations")
@require_auth
def get_recommendations():
    return jsonify(D.RECOMMENDATIONS)

@app.get("/api/anomalies")
@require_auth
def get_anomalies():
    return jsonify(D.ANOMALIES)

@app.get("/api/model-runs")
@require_auth
def get_model_runs():
    return jsonify(D.MODEL_RUNS)

@app.get("/api/features")
@require_auth
def get_features():
    return jsonify(D.FEATURES)

@app.get("/api/clusters")
@require_auth
def get_clusters():
    return jsonify(D.CLUSTERS)

@app.get("/api/upload-log")
@require_auth
def get_upload_log():
    return jsonify(D.UPLOAD_LOG)

@app.get("/api/upload-schema")
@require_auth
def get_upload_schema():
    return jsonify(D.UPLOAD_SCHEMA)

@app.get("/api/sample-parsed-rows")
@require_auth
def get_sample_parsed_rows():
    return jsonify(D.SAMPLE_PARSED_ROWS)

@app.get("/api/backfill")
@require_auth
def get_backfill():
    return jsonify({"grid": D.BACKFILL["grid"], "dates": D.BACKFILL["dates"], "meta": D.BACKFILL_META})

@app.get("/api/db-info")
@require_auth
def get_db_info():
    return jsonify(D.DB_INFO)

@app.get("/api/machine-series/<int:seed>")
@require_auth
def get_machine_series(seed: int):
    if not (0 <= seed <= 10_000_000):
        abort(400, "seed out of range")
    return jsonify(D.build_machine_series(seed))


# ── Health (public) ───────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=os.environ.get("FLASK_DEBUG", "0") == "1")
