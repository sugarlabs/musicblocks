#!/usr/bin/env bash
# -----------------------------------------------------------
# scripts/test-docker.sh — Local integration tests for the
# Docker image build, smoke test, and basic security checks.
#
# Usage:
#   chmod +x scripts/test-docker.sh
#   ./scripts/test-docker.sh
#
# Prerequisites: docker, curl
# -----------------------------------------------------------
set -euo pipefail

IMAGE_NAME="musicblocks-test"
CONTAINER_NAME="mb-integration-test"
PORT=3000
PASS=0
FAIL=0

# --- helpers ------------------------------------------------
green()  { printf "\033[32m✓ %s\033[0m\n" "$1"; }
red()    { printf "\033[31m✗ %s\033[0m\n" "$1"; }
cleanup() {
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm   "$CONTAINER_NAME" 2>/dev/null || true
}
trap cleanup EXIT

assert() {
    local desc="$1"; shift
    if "$@" >/dev/null 2>&1; then
        green "$desc"; ((PASS++))
    else
        red "$desc"; ((FAIL++))
    fi
}

# --- 1. Build -----------------------------------------------
echo "==> Building Docker image…"
docker build -f dockerfile -t "$IMAGE_NAME" .
assert "Docker image builds successfully" true

# --- 2. Image structure -------------------------------------
assert "Image runs as non-root user" \
    docker run --rm "$IMAGE_NAME" whoami | grep -q appuser

assert "Image exposes port $PORT" \
    docker inspect "$IMAGE_NAME" --format='{{json .Config.ExposedPorts}}' | grep -q "$PORT"

assert "Image has a CMD defined" \
    docker inspect "$IMAGE_NAME" --format='{{json .Config.Cmd}}' | grep -q "http.server"

# --- 3. Smoke test ------------------------------------------
echo "==> Starting container…"
docker run -d --name "$CONTAINER_NAME" -p "$PORT:$PORT" "$IMAGE_NAME"
sleep 5

assert "Container is running" \
    docker ps --filter "name=$CONTAINER_NAME" --format '{{.Status}}' | grep -q "Up"

assert "HTTP 200 on localhost:$PORT" \
    curl --fail --silent --max-time 5 "http://localhost:$PORT"

assert "Response contains HTML content" \
    curl --silent --max-time 5 "http://localhost:$PORT" | grep -qiE "<html|DOCTYPE"

# --- 4. No secrets / env leaks -----------------------------
assert "No environment variable leaks (no GITHUB_TOKEN)" \
    ! docker exec "$CONTAINER_NAME" env | grep -qi "GITHUB_TOKEN"

# --- 5. Container stops cleanly ----------------------------
assert "Container stops within 10s" \
    timeout 10 docker stop "$CONTAINER_NAME"

# --- Summary ------------------------------------------------
echo ""
echo "========================================"
echo " Results: $PASS passed, $FAIL failed"
echo "========================================"
[ "$FAIL" -eq 0 ] || exit 1
