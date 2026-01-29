#!/bin/sh
set -e

# Detect the correct HTML directory where index.html is located
HTML_DIR=/usr/share/nginx/html
ENV_FILE="$HTML_DIR/public/env.js"

# Defaults
: "${APP_ENV:=prod}"
: "${VITE_API_BASE_URL:=https://api.ivyevents.mk}"
: "${VITE_KEYCLOAK_REALM:=event-app}"
: "${VITE_KEYCLOAK_CLIENT_ID:=eventFE}"

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
      VITE_KEYCLOAK_URL="http://localhost:8181"
      ;;
  esac
fi

# Normalize API base URL for non-local environments if it's pointing to localhost
case "$(printf '%s' "$APP_ENV" | tr '[:upper:]' '[:lower:]')" in
  test)
    if printf '%s' "$VITE_API_BASE_URL" | grep -qiE '^https?://(localhost|127\.0\.0\.1)(:|/|$)'; then
      echo "[entrypoint] Overriding VITE_API_BASE_URL localhost -> https://api.test.ivyevents.mk for test env"
      VITE_API_BASE_URL="https://api.test.ivyevents.mk"
    fi
    ;;
  prod|production)
    if printf '%s' "$VITE_API_BASE_URL" | grep -qiE '^https?://(localhost|127\.0\.0\.1)(:|/|$)'; then
      echo "[entrypoint] Overriding VITE_API_BASE_URL localhost -> https://api.ivyevents.mk for prod env"
      VITE_API_BASE_URL="https://api.ivyevents.mk"
    fi
    ;;
  *)
    # local or other: keep as provided/default
    ;;
 esac

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
