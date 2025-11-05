# Use Node.js LTS version
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy root package files and install root dependencies
COPY package*.json ./
RUN npm ci

# Copy client package files and install client dependencies
COPY client/package*.json ./client/
RUN cd client && npm ci

# Copy server package files
COPY server/package*.json ./server/

# Copy source files needed for building
COPY client/src ./client/src
COPY client/public ./client/public
COPY client/index.html ./client/
COPY client/*.config.* ./client/
COPY client/tsconfig*.json ./client/
COPY server ./server

# Build the server (TypeScript compilation)
RUN npm run server:build

# Build the client (React/Vite)
RUN npm run client:build

# Production stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built server from builder stage
COPY --from=builder /app/server/dist ./server/dist

# Copy built client from builder stage
COPY --from=builder /app/client/dist ./client/dist

# Copy .env.example as reference (users should provide their own .env or environment variables)
COPY .env.example ./

# Expose the port (default is 3001, but can be overridden via PORT env var)
EXPOSE 3001

# Set default environment variables (can be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "server/dist/server.js"]
