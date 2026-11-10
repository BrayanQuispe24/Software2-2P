# ==========================================
# Dockerfile - API Gateway (NestJS BFF)
# ==========================================

# Etapa 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Etapa 2: Runtime de producción
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firebase-service-account*.json ./

EXPOSE 3000

CMD ["node", "dist/main"]
