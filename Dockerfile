# ---------- Build Frontend ----------
FROM node:20 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
COPY frontend/.npmrc ./
RUN npm ci --prefer-offline --no-audit --no-fund
COPY frontend .
RUN npm run build

# ---------- Build Backend ----------
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/.npmrc ./
RUN npm ci --prefer-offline --no-audit --no-fund
COPY backend .
RUN npm run build

# ---------- Production Image ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy backend build and node_modules
COPY --from=backend-build /app/backend .
# Remove dev dependencies for production
RUN npm ci --prefer-offline --no-audit --no-fund --omit=dev

# Copy frontend build into backend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Expose port
EXPOSE 3000

# Healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start backend server
CMD ["npm", "start"] 