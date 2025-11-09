# Build stage
FROM node:23-slim AS builder

WORKDIR /app

# Don't set NODE_ENV yet - we'll set it properly for production build
# This ensures TypeScript and build tools are available without affecting runtime config

# Install build dependencies (includes OpenSSL for Prisma engines)
RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential python3 openssl \
  && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client (placeholder DATABASE_URL for build time)
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npx prisma generate

# Build TypeScript (set NODE_ENV=production to ensure correct runtime config)
RUN NODE_ENV=production npm run build

# Remove dev dependencies to keep runtime image slim
RUN npm prune --omit=dev

# Production stage
FROM node:23-slim

WORKDIR /app

# Default to production runtime settings
ENV NODE_ENV=production

# Install runtime dependencies required by Prisma
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Copy package files and node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy prisma and dist from builder
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Generate Prisma client for this platform (placeholder DATABASE_URL for build time)
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npx prisma generate

# Expose port
EXPOSE 3000

# Start command
CMD npx prisma migrate deploy && node dist/server.js
