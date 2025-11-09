# Build stage
FROM node:23-slim AS builder

WORKDIR /app

# Ensure dev dependencies are installed for build-time tooling
ENV NODE_ENV=development

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

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

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

# Generate Prisma client for this platform
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start command
CMD npx prisma migrate deploy && node dist/server.js
