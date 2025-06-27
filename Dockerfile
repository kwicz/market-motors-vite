FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set environment variables for production
ENV NODE_ENV=production
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_MAXSOCKETS=1
ENV NODE_OPTIONS="--max-old-space-size=768"

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install dependencies with memory optimization
RUN npm ci --prefer-offline --no-audit --no-fund --maxsockets=1

# Copy source code (excluding server directory)
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY components.json ./

# Build the frontend application
RUN npm run build

# Expose port
EXPOSE 4173

# Start the application using Vite preview
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"] 