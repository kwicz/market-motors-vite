FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install dependencies (including dev dependencies for building)
RUN npm ci --prefer-offline --no-audit --no-fund

# Copy source files for building
COPY server ./server
COPY lib ./lib
COPY scripts ./scripts
COPY drizzle.config.ts ./

# Build the TypeScript project
RUN npm run build

# Remove dev dependencies after building
RUN npm ci --prefer-offline --no-audit --no-fund --omit=dev

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the server directly
CMD ["node", "server/dist/server/index.js"] 