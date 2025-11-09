# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (argon2, etc.)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript (transpile only, skip type checking)
RUN npx tsc --noCheck

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies first
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Remove devDependencies
RUN npm prune --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server (run migrations first)
# Note: Ensure the database specified in DATABASE_URL exists before running migrations
# You can create it manually in your PostgreSQL instance with: CREATE DATABASE your_db_name;
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
