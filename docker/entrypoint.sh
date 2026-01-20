#!/bin/sh
set -e

HTML_DIR=/usr/share/nginx/html
ENV_FILE="$HTML_DIR/env.js"

# Defaults
: "${APP_ENV:=local}"
: "${VITE_API_BASE_URL:=http://localhost:8081}"
: "${VITE_KEYCLOAK_REALM:=event-app}"
: "${VITE_KEYCLOAK_CLIENT_ID:=eventsFE}"

# Default Keycloak URL based on APP_ENV if not provided
if [ -z "${VITE_KEYCLOAK_URL}" ] || printf '%s' "${VITE_KEYCLOAK_URL}" | grep -q '\${'; then
  case "$APP_ENV" in
    test)
      VITE_KEYCLOAK_URL="https://auth.test.ivyevents.mk"
      ;;
    prod|production)
      VITE_KEYCLOAK_URL="https://auth.ivyevents.mk"
      ;;
    *)
      VITE_KEYCLOAK_URL="http://localhost:8080"
      ;;
  esac
fi

# If env.js exists (from Vite public folder), replace placeholders; otherwise generate a full one
if [ -f "$ENV_FILE" ]; then
  echo "[entrypoint] Rendering env.js with APP_ENV=$APP_ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL"
  tmpfile=$(mktemp)
  # shellcheck disable=SC2016
  envsubst '${APP_ENV} ${VITE_API_BASE_URL} ${VITE_KEYCLOAK_URL} ${VITE_KEYCLOAK_REALM} ${VITE_KEYCLOAK_CLIENT_ID}' < "$ENV_FILE" > "$tmpfile"
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
