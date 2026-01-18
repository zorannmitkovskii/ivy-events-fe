#!/bin/sh
set -e

HTML_DIR=/usr/share/nginx/html
ENV_FILE="$HTML_DIR/env.js"

# Default values if not provided
: "${VITE_API_BASE_URL:=http://localhost:8084}"
: "${APP_ENV:=local}"

# If env.js exists (from Vite public folder), replace placeholders; otherwise generate a minimal one
if [ -f "$ENV_FILE" ]; then
  echo "[entrypoint] Rendering env.js with APP_ENV=$APP_ENV VITE_API_BASE_URL=$VITE_API_BASE_URL"
  # Replace only the known placeholders to avoid accidental substitutions
  # Use envsubst with an explicit variable list
  tmpfile=$(mktemp)
  # shellcheck disable=SC2016
  envsubst '${APP_ENV} ${VITE_API_BASE_URL}' < "$ENV_FILE" > "$tmpfile"
  mv "$tmpfile" "$ENV_FILE"
else
  echo "[entrypoint] Creating env.js from scratch"
  cat > "$ENV_FILE" <<EOF
// generated at runtime
window.__ENV__ = {
  APP_ENV: "${APP_ENV}",
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}"
};
EOF
fi

# Print the resulting env.js for debugging
echo "[entrypoint] Final env.js:" && cat "$ENV_FILE" || true

# Start nginx in foreground
exec nginx -g 'daemon off;'
