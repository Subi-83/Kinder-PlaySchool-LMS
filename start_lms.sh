#!/usr/bin/env bash
# Start the built React app and Flask API together through Waitress.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_ACTIVATE="$PROJECT_DIR/backend/venv/bin/activate"

if [[ ! -f "$VENV_ACTIVATE" ]]; then
    echo "Python virtual environment not found: $VENV_ACTIVATE"
    echo "Run ./setup.sh first, or create it with: python3 -m venv backend/venv"
    exit 1
fi

if [[ ! -f "$PROJECT_DIR/frontend/dist/index.html" ]]; then
    echo "React production build not found. Building it now..."
    (cd "$PROJECT_DIR/frontend" && npm run build)
fi

source "$VENV_ACTIVATE"

if ! python -c 'import waitress' >/dev/null 2>&1; then
    echo "Waitress is not installed in backend/venv. Run: pip install -r backend/requirements.txt"
    exit 1
fi

# Prefer the address used by the default network route; fall back to hostname.
LAN_IP="$(ip route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i <= NF; i++) if ($i == "src") {print $(i + 1); exit}}')"
if [[ -z "$LAN_IP" ]]; then
    LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
fi
if [[ -z "$LAN_IP" ]]; then
    LAN_IP="127.0.0.1"
fi

LMS_URL="http://${LAN_IP}:5000"
# This process-level value takes precedence over backend/.env. Password-reset
# emails therefore point to this server, rather than localhost on the device
# receiving the email.
export FRONTEND_URL="$LMS_URL"
echo "Starting Kinder Park LMS at $LMS_URL"

(sleep 1; xdg-open "$LMS_URL" >/dev/null 2>&1 || true) &
cd "$PROJECT_DIR/backend"
exec python run.py
