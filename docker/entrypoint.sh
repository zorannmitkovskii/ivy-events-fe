#!/bin/sh
set -e

# Detect the correct HTML directory where index.html is located
HTML_DIR=/usr/share/nginx/html
ENV_FILE="$HTML_DIR/public/env.js"

mkdir -p "$HTML_DIR/public"
# Defaults
: "${APP_ENV:=prod}"
: "${VITE_KEYCLOAK_REALM:=event-app}"
: "${VITE_KEYCLOAK_CLIENT_ID:=eventFE}"

# Derive all URLs based on APP_ENV — prevents localhost leaking into test/prod
APP_ENV_LOWER="$(printf '%s' "$APP_ENV" | tr '[:upper:]' '[:lower:]')"

# Default API base URL based on APP_ENV
if [ -z "${VITE_API_BASE_URL}" ] || printf '%s' "${VITE_API_BASE_URL}" | grep -qiE '(\$\{|^https?://(localhost|127\.0\.0\.1))'; then
  case "$APP_ENV_LOWER" in
    test)       VITE_API_BASE_URL="https://api.test.ivyevents.mk" ;;
    prod|production) VITE_API_BASE_URL="https://api.ivyevents.mk" ;;
    *)          VITE_API_BASE_URL="http://localhost:8081" ;;
  esac
  echo "[entrypoint] Derived VITE_API_BASE_URL=$VITE_API_BASE_URL for APP_ENV=$APP_ENV"
fi

# Default Keycloak URL based on APP_ENV
if [ -z "${VITE_KEYCLOAK_URL}" ] || printf '%s' "${VITE_KEYCLOAK_URL}" | grep -qiE '(\$\{|^https?://(localhost|127\.0\.0\.1))'; then
  case "$APP_ENV_LOWER" in
    test)       VITE_KEYCLOAK_URL="https://auth.test.ivyevents.mk" ;;
    prod|production) VITE_KEYCLOAK_URL="https://auth.ivyevents.mk" ;;
    *)          VITE_KEYCLOAK_URL="http://localhost:8181" ;;
  esac
  echo "[entrypoint] Derived VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL for APP_ENV=$APP_ENV"
fi

# If env.js exists (from Vite public folder), replace placeholders; otherwise generate a full one
if [ -f "$ENV_FILE" ]; then
  echo "[entrypoint] Rendering env.js with APP_ENV=$APP_ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL"
  tmpfile=$(mktemp)
  # shellcheck disable=SC2016
  envsubst '${APP_ENV} ${VITE_API_BASE_URL} ${VITE_KEYCLOAK_URL} ${VITE_KEYCLOAK_REALM} ${VITE_KEYCLOAK_CLIENT_ID} ${VITE_GOOGLE_MAPS_API_KEY}' < "$ENV_FILE" > "$tmpfile"
  mv "$tmpfile" "$ENV_FILE"
else
  echo "[entrypoint] Creating env.js from scratch"
  cat > "$ENV_FILE" <<EOF
// generated at runtime
window.__ENV__ = {
  APP_ENV: "${APP_ENV}",
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}",
  VITE_KEYCLOAK_URL: "${VITE_KEYCLOAK_URL}",
  VITE_KEYCLOAK_REALM: "${VITE_KEYCLOAK_REALM}",
  VITE_KEYCLOAK_CLIENT_ID: "${VITE_KEYCLOAK_CLIENT_ID}"
};
EOF
fi

# Print the resulting env.js for debugging
echo "[entrypoint] Final env.js:" && cat "$ENV_FILE" || true

# Start nginx in foreground
exec nginx -g 'daemon off;'
