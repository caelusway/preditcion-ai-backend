FROM node:20-alpine

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install ALL dependencies (need typescript for build)
RUN npm install

# Copy everything
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

EXPOSE 3000

CMD ["node", "dist/server.js"]

