# =========================
# Build stage (Vue build)
# =========================
FROM node:20-alpine AS build
WORKDIR /frontend

COPY vue-project/package*.json ./
RUN npm ci

COPY vue-project/ ./
RUN npm run build


# =========================
# Runtime stage (Nginx)
# =========================
FROM nginx:alpine

# Install envsubst for runtime env injection
RUN apk add --no-cache gettext

# Copy built frontend
COPY --from=build /frontend/dist /usr/share/nginx/html

# Copy static resources (e.g., favicon/logo) referenced from index.html
COPY vue-project/resources /usr/share/nginx/html/resources

# Copy nginx config (simple static server)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy runtime entrypoint to generate env.js from environment variables
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

# First run entrypoint (creates env.js), then start nginx
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
