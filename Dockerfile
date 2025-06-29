# ---------- Build Frontend ----------
FROM node:20 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json ./
COPY frontend/pnpm-lock.yaml ./
COPY frontend/.npmrc ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile
COPY frontend .
RUN pnpm run build

# ---------- Build Backend ----------
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package.json ./
COPY backend/pnpm-lock.yaml ./
COPY backend/.npmrc ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile
COPY backend .
RUN pnpm run build
RUN pnpm prune --prod

# ---------- Production Image ----------
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy backend build output
COPY --from=backend-build /app/backend/server/dist /app/server/dist
# Copy backend node_modules
COPY --from=backend-build /app/backend/node_modules /app/node_modules

# Copy frontend build into backend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Expose port
EXPOSE 3000

# Healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start backend server
CMD ["node", "server/dist/server/index.js"] 