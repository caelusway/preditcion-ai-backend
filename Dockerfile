# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files first (for better caching)
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy TypeScript config files
COPY tsconfig.json tsconfig.build.json ./

# Copy source code
COPY src ./src

# Build TypeScript - use the installed typescript directly
RUN node ./node_modules/typescript/bin/tsc --project tsconfig.build.json

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install OpenSSL for Prisma (required at runtime)
RUN apk add --no-cache openssl libssl3

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy prisma and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/server.js"]
