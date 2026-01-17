FROM node:20-alpine AS build
WORKDIR /frontend

COPY vue-project/package*.json ./
RUN npm ci

COPY vue-project/ ./
RUN npm run build

FROM nginx:alpine
# Install envsubst for runtime env injection
RUN apk add --no-cache gettext

COPY --from=build /frontend/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
# Copy runtime entrypoint to generate env.js from environment variables
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
