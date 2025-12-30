# Stage 1: Build Vue.js app
FROM node:20-alpine AS build

# Work inside the vue-project directory where package.json and build scripts live
WORKDIR /app/vue-project

# Copy package files and install dependencies
COPY vue-project/package*.json ./
RUN npm install

# Copy the rest of the source code
COPY vue-project .

# Build the app
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
