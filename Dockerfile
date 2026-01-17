# ==============================
# Stage 1: Build Vue.js app
# ==============================
FROM node:20-alpine AS build

# Set working directory
WORKDIR /frontend

# Copy package files and install dependencies
COPY vue-project/package*.json ./
RUN npm install

# Copy the rest of the Vue project
COPY vue-project/ ./

# Build the Vue app
RUN npm run build

# ==============================
# Stage 2: Serve with Nginx
# ==============================
FROM nginx:alpine

# Install envsubst for runtime variable injection
RUN apk add --no-cache gettext

# Copy built files from the build stage
COPY --from=build /frontend/dist /usr/share/nginx/html

# Copy custom nginx config and entrypoint
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Use entrypoint to inject runtime envs then start NGINX
ENTRYPOINT ["/docker-entrypoint.sh"]
