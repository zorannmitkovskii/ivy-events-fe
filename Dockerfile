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

# Copy built files from the build stage
COPY --from=build /frontend/dist /usr/share/nginx/html

# Optional: copy custom nginx config
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
