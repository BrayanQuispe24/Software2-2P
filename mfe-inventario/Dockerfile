# ==========================================
# Dockerfile - MFE Inventario (Angular 21 + Nginx)
# ==========================================

# Etapa 1: Build de Angular
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Etapa 2: Servidor Web Nginx
FROM nginx:alpine

COPY --from=builder /app/dist/mfe-inventario/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 9104

CMD ["nginx", "-g", "daemon off;"]
