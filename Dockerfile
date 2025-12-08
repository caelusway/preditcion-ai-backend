FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npx tsc -p tsconfig.build.json

EXPOSE 3000
CMD ["node", "dist/server.js"]
