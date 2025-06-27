FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set environment variables for production
ENV NODE_ENV=production
ENV NPM_CONFIG_PRODUCTION=true
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_MAXSOCKETS=1
ENV NODE_OPTIONS="--max-old-space-size=512"

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install dependencies with memory optimization
RUN npm ci --prefer-offline --no-audit --no-fund --maxsockets=1

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 4173

# Start the application
CMD ["npm", "run", "preview"] 