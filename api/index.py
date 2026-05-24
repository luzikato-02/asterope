"""
Vercel Python serverless function entry point.
All /api/* requests are rewritten here by vercel.json.
"""
import os
import sys

# Add backend/ to the module search path
_here    = os.path.dirname(os.path.abspath(__file__))
_backend = os.path.join(_here, "..", "backend")
sys.path.insert(0, os.path.abspath(_backend))

# Load .env if present (local dev — production env vars are set in Vercel dashboard)
try:
    from dotenv import load_dotenv
    _env_file = os.path.join(_backend, ".env")
    if os.path.exists(_env_file):
        load_dotenv(_env_file)
except ImportError:
    pass

from main import app  # noqa: E402 — must come after sys.path update
