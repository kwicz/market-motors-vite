# Multi-stage Dockerfile for Market Motors Car Dealership
# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY components.json ./

# Install dependencies
RUN npm ci --only=production

# Copy frontend source code
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Build the frontend
RUN npm run build

# Stage 2: Build the backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/tsconfig.json ./server/

# Install all dependencies (including dev dependencies for TypeScript compilation)
RUN npm ci

# Copy backend source code
COPY server/ ./server/
COPY lib/ ./lib/
COPY drizzle.config.ts ./

# Build the backend
RUN npm run build:server

# Stage 3: Production runtime
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist ./dist

# Copy built backend from backend-builder stage
COPY --from=backend-builder --chown=nodejs:nodejs /app/server/dist ./server/dist

# Copy other necessary files
COPY --chown=nodejs:nodejs drizzle.config.ts ./
COPY --chown=nodejs:nodejs lib/ ./lib/

# Create directories for uploads and logs
RUN mkdir -p /app/uploads /app/logs && chown -R nodejs:nodejs /app/uploads /app/logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["dumb-init", "node", "server/dist/index.js"] 