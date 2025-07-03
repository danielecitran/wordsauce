# Multi-stage Build für WordSauce Monorepo
FROM node:18-alpine AS builder

WORKDIR /app

# Package files kopieren für besseres Caching
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Dependencies installieren
RUN npm ci --workspaces

# Source Code kopieren
COPY . .

# Build beide Projekte
RUN npm run build

# Production Stage
FROM node:18-alpine AS production

WORKDIR /app

# Nur die production dependencies und builds kopieren
COPY package*.json ./
COPY server/package*.json ./server/

# Nur production dependencies installieren
RUN npm ci --workspace server --omit=dev

# Built files kopieren
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/data ./server/data

# Port exposieren (Railway wird automatisch die PORT env variable setzen)
EXPOSE 3000

# Environment Variable für Production setzen
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3000; require('http').get('http://localhost:' + port + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Server starten
CMD ["npm", "run", "start"] 