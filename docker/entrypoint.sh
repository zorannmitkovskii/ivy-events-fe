#!/bin/sh
set -e

# Detect the correct HTML directory where index.html is located
HTML_DIR=/usr/share/nginx/html
# Must match the src in index.html, which is "/public/env.js". Vite also copies
# public/env.js to the build root, so $HTML_DIR/env.js exists as an unrendered
# template — it is a decoy. Nothing loads it, and pointing this at it leaves
# /public/env.js missing: window.__ENV__ never gets defined, getRuntimeEnv()
# silently falls back to the values baked in from vue-project/.env at build
# time, and every variable set here stops having any effect.
ENV_FILE="$HTML_DIR/public/env.js"

mkdir -p "$HTML_DIR/public"
# Defaults
: "${APP_ENV:=prod}"
: "${VITE_KEYCLOAK_REALM:=event-app}"
: "${VITE_KEYCLOAK_CLIENT_ID:=eventFE}"

# Derive all URLs based on APP_ENV — prevents localhost leaking into test/prod
APP_ENV_LOWER="$(printf '%s' "$APP_ENV" | tr '[:upper:]' '[:lower:]')"

# Public envs are the ones a localhost URL must never reach.
case "$APP_ENV_LOWER" in
  test|prod|production) IS_PUBLIC_ENV=true ;;
  *)                    IS_PUBLIC_ENV=false ;;
esac

# True when the value is missing, still an unrendered ${...} template, or —
# in a public env only — points at a developer machine.
#
# The localhost check deliberately does NOT apply locally. It used to, and it
# was harmless only because the derived default happened to equal the value
# passed in. It stops being harmless the moment local needs a second address:
# auth now lives on a different port from the rest of the API, and silently
# rewriting either one back to a single default breaks the other half.
needs_default() {
  value="$1"
  [ -z "$value" ] && return 0
  printf '%s' "$value" | grep -q '\${' && return 0
  [ "$IS_PUBLIC_ENV" = true ] \
    && printf '%s' "$value" | grep -qiE '^https?://(localhost|127\.0\.0\.1)' && return 0
  return 1
}

# Default API base URL based on APP_ENV
if needs_default "${VITE_API_BASE_URL}"; then
  case "$APP_ENV_LOWER" in
    test)       VITE_API_BASE_URL="https://api.test.ivyevents.mk" ;;
    prod|production) VITE_API_BASE_URL="https://api.ivyevents.mk" ;;
    *)          VITE_API_BASE_URL="http://localhost:8081" ;;
  esac
  echo "[entrypoint] Derived VITE_API_BASE_URL=$VITE_API_BASE_URL for APP_ENV=$APP_ENV"
fi

# Default IAM URL based on APP_ENV. Auth lives in zm-iam-service, not in
# ivy-events-be, so this is a second address the app needs and not a variant
# of the first.
if needs_default "${VITE_IAM_BASE_URL}"; then
  case "$APP_ENV_LOWER" in
    test)       VITE_IAM_BASE_URL="https://iam.test.ivyevents.mk" ;;
    prod|production) VITE_IAM_BASE_URL="https://iam.ivyevents.mk" ;;
    *)          VITE_IAM_BASE_URL="http://localhost:8282" ;;
  esac
  echo "[entrypoint] Derived VITE_IAM_BASE_URL=$VITE_IAM_BASE_URL for APP_ENV=$APP_ENV"
fi

# Default Keycloak URL based on APP_ENV
if needs_default "${VITE_KEYCLOAK_URL}"; then
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
  envsubst '${APP_ENV} ${VITE_API_BASE_URL} ${VITE_IAM_BASE_URL} ${VITE_KEYCLOAK_URL} ${VITE_KEYCLOAK_REALM} ${VITE_KEYCLOAK_CLIENT_ID} ${VITE_GOOGLE_MAPS_API_KEY}' < "$ENV_FILE" > "$tmpfile"
  mv "$tmpfile" "$ENV_FILE"
else
  echo "[entrypoint] Creating env.js from scratch"
  cat > "$ENV_FILE" <<EOF
// generated at runtime
window.__ENV__ = {
  APP_ENV: "${APP_ENV}",
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}",
  VITE_IAM_BASE_URL: "${VITE_IAM_BASE_URL}",
  VITE_KEYCLOAK_URL: "${VITE_KEYCLOAK_URL}",
  VITE_KEYCLOAK_REALM: "${VITE_KEYCLOAK_REALM}",
  VITE_KEYCLOAK_CLIENT_ID: "${VITE_KEYCLOAK_CLIENT_ID}"
};
EOF
fi

# nginx workers run as an unprivileged user, but everything above ran as root:
# mktemp makes the file 0600 and a heredoc inherits root's umask. Without this
# the browser gets 403 on env.js, window.__ENV__ never exists, and the app
# silently falls back to whatever API URL was baked in at build time — which
# looks like the backend being down rather than a permissions problem.
chmod 644 "$ENV_FILE"

# Print the resulting env.js for debugging
echo "[entrypoint] Final env.js:" && cat "$ENV_FILE" || true

# Start nginx in foreground
exec nginx -g 'daemon off;'
