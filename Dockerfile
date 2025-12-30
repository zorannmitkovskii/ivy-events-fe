# Stage 1: Build Vue.js app
FROM node:20-alpine AS build
WORKDIR /frontend

# Copy the correct package manifests from the Vue project
COPY vue-project/package*.json ./
RUN npm install

# Explicitly install keycloak-js
RUN npm install keycloak-js --save

# Copy the rest of the Vue project sources
COPY vue-project .

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/vue-project/dist /usr/share/nginx/html

# Optional: Custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
