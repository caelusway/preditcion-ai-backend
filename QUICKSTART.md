# Quick Start Guide

Get the API running in 5 minutes with Docker Compose!

## Prerequisites

- Docker and Docker Compose installed
- Git

## Steps

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/preditcion-ai-backend.git
cd preditcion-ai-backend
```

### 2. Start the services

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL database
- Run database migrations automatically
- Start the API server on port 3000

### 3. Test the API

Open your browser and visit:
- **Swagger Docs:** http://localhost:3000/docs
- **Health Check:** http://localhost:3000/health

### 4. Try your first requests

**Register a user:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

Copy the `accessToken` from the response.

**Get matches (protected):**
```bash
curl -X GET http://localhost:3000/matches \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 5. View logs

```bash
docker-compose logs -f app
```

### 6. Stop the services

```bash
docker-compose down
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the API at http://localhost:3000/docs
- Check out the [PRD.md](PRD.md) for complete project specifications

## Troubleshooting

**Port 3000 already in use?**
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>
```

**Database issues?**
```bash
# Restart with fresh database
docker-compose down -v
docker-compose up -d
```

**View database with Prisma Studio:**
```bash
# First, install dependencies locally
npm install

# Then open Prisma Studio
npx prisma studio
```

## For Mobile Developers

Your local API will be available at:
```
http://YOUR_LOCAL_IP:3000
```

Find your local IP:
- **Mac:** `ifconfig | grep "inet " | grep -v 127.0.0.1`
- **Windows:** `ipconfig`
- **Linux:** `ip addr show`

Example: `http://192.168.1.100:3000`

Make sure your mobile device is on the same network!
