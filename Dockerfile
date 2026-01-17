FROM node:20-alpine AS build
WORKDIR /frontend

COPY vue-project/package*.json ./
RUN npm ci

COPY vue-project/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /frontend/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
