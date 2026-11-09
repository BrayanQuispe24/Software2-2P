# ==========================================
# Dockerfile - MS Auth (NestJS + Prisma + OIDC)
# ==========================================

# Etapa 1: Construcción
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar herramientas necesarias para compilación nativa si aplica
RUN apk add --no-cache openssl python3 make g++

ENV DATABASE_URL="postgresql://auth_user:auth_dev_password@db-auth:5432/ms_auth_db?schema=public"

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm install

COPY . .

# Generar llaves OIDC si no existen y compilar TypeScript
RUN node scripts/generate-oidc-keys.mjs
RUN npx prisma generate
RUN npm run build

# Etapa 2: Runtime de producción
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=4000

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/keys ./keys

EXPOSE 4000

CMD ["node", "dist/main.js"]
