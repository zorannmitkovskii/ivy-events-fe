#!/bin/sh
set -e

# Default value for VITE_API_BASE_URL if not provided at runtime
: "${VITE_API_BASE_URL:=http://localhost:8081}"

# Inject runtime environment variables into env.js using envsubst
if [ -f /usr/share/nginx/html/env.js ]; then
  echo "Injecting runtime env into /usr/share/nginx/html/env.js"
  envsubst < /usr/share/nginx/html/env.js > /usr/share/nginx/html/env.js.tmp && mv /usr/share/nginx/html/env.js.tmp /usr/share/nginx/html/env.js
else
  echo "Warning: /usr/share/nginx/html/env.js not found"
fi

# Start NGINX in the foreground
nginx -g 'daemon off;'
