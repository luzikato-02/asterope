#!/usr/bin/env bash
set -euo pipefail

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "stopping servers..."
  [ -n "$BACKEND_PID"  ] && kill "$BACKEND_PID"  2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  echo "stopped."
}
trap cleanup INT TERM EXIT

cd "$(dirname "$0")"

echo "starting flask backend on :8000..."
cd backend
python main.py &
BACKEND_PID=$!

cd ../frontend
echo "starting vite frontend on :5173..."
npm run dev &
FRONTEND_PID=$!

# Give Vite a moment to start, then print the URL
sleep 2
echo ""
if [ -n "${CODESPACE_NAME:-}" ]; then
  DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
  echo "  app  → https://${CODESPACE_NAME}-5173.${DOMAIN}"
  echo "  api  → https://${CODESPACE_NAME}-8000.${DOMAIN}/api/health"
else
  echo "  app  → http://localhost:5173"
  echo "  api  → http://localhost:8000/api/health"
fi
echo ""
echo "press Ctrl+C to stop both"

wait "$BACKEND_PID" "$FRONTEND_PID"
