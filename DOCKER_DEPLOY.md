# Docker Deployment Guide

This guide explains how to deploy the Football Prediction API using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB+ RAM available
- 10GB+ disk space

## Quick Start (Production)

### 1. Clone and Configure

```bash
# Clone the repository
git clone <your-repo-url>
cd preditcion-ai-backend

# Create production environment file
cp .env.production.example .env.production

# Edit with your actual values
nano .env.production
```

**Required Environment Variables:**
- `POSTGRES_PASSWORD` - Strong database password
- `JWT_SECRET` - Generate with: `openssl rand -hex 32`
- `JWT_REFRESH_SECRET` - Generate with: `openssl rand -hex 32`
- `RAPIDAPI_KEY` - Get from https://rapidapi.com/api-sports/api/api-football
- `RESEND_API_KEY` - (Optional) Get from https://resend.com for email

### 2. Deploy

```bash
# Load environment variables and start services
docker-compose --env-file .env.production up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 3. Verify Deployment

```bash
# Check health endpoint
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}

# Access Swagger docs
open http://localhost:3000/docs
```

## Production Deployment Options

### Option 1: Docker Compose (Recommended for VPS)

Use the provided `docker-compose.yml` for simple VPS deployment.

**Pros:**
- Simple setup
- Includes PostgreSQL
- Easy to manage
- Persistent data with volumes

**Setup:**
```bash
docker-compose --env-file .env.production up -d
```

### Option 2: Standalone Docker (Use existing database)

If you already have a PostgreSQL database (like in Coolify):

```bash
# Build the image
docker build -t football-api:latest .

# Run with your database URL
docker run -d \
  --name football-api \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="your-postgresql-connection-string" \
  -e JWT_SECRET="your-jwt-secret" \
  -e JWT_REFRESH_SECRET="your-refresh-secret" \
  -e RAPIDAPI_KEY="your-rapidapi-key" \
  -e CORS_ORIGINS="https://yourdomain.com" \
  --restart unless-stopped \
  football-api:latest
```

### Option 3: Coolify with Dockerfile

1. In Coolify, create a new application
2. Connect your Git repository
3. Set **Build Pack** to **"dockerfile"** (not nixpacks!)
4. Configure environment variables in Coolify UI
5. Set database connection to your existing PostgreSQL service
6. Deploy

**Important Coolify Settings:**
- Build Pack: `dockerfile`
- Dockerfile Location: `./Dockerfile`
- Port: `3000`
- Health Check Path: `/health`

## Management Commands

### View Logs
```bash
# All services
docker-compose logs -f

# App only
docker-compose logs -f app

# Database only
docker-compose logs -f postgres
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart app only
docker-compose restart app
```

### Stop Services
```bash
# Stop all (keeps data)
docker-compose stop

# Stop and remove containers (keeps data in volumes)
docker-compose down

# Stop and remove everything including data (DANGER!)
docker-compose down -v
```

### Database Management
```bash
# Access PostgreSQL shell
docker-compose exec postgres psql -U football -d football_predictions

# Backup database
docker-compose exec postgres pg_dump -U football football_predictions > backup.sql

# Restore database
docker-compose exec -T postgres psql -U football football_predictions < backup.sql

# Run migrations manually
docker-compose exec app npx prisma migrate deploy
```

### Update Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build

# Or using Docker directly
docker-compose build app
docker-compose up -d app
```

## Sync Football Data

After deployment, sync data from API-Football:

```bash
# Sync teams
docker-compose exec app npm run sync:teams

# Sync fixtures
docker-compose exec app npm run sync:fixtures

# Full sync (teams + fixtures + standings + players)
docker-compose exec app npm run sync
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs app

# Common issues:
# 1. Missing environment variables
# 2. Database connection failed
# 3. Port 3000 already in use
```

### Database connection errors
```bash
# Verify database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U football -d football_predictions -c "SELECT 1"
```

### Build errors
```bash
# Clean rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### TypeScript/npm errors during build
```bash
# Ensure you're using Dockerfile, not nixpacks
# In Coolify: Change Build Pack to "dockerfile"

# For manual builds, make sure package-lock.json is committed:
git add package-lock.json
git commit -m "Add package-lock.json"
```

## Security Checklist

- [ ] Strong `POSTGRES_PASSWORD` set
- [ ] Unique `JWT_SECRET` generated (min 32 chars)
- [ ] Unique `JWT_REFRESH_SECRET` generated (min 32 chars)
- [ ] `.env.production` not committed to git
- [ ] `CORS_ORIGINS` configured for your domain
- [ ] Database backups scheduled
- [ ] Firewall configured (only expose port 3000)
- [ ] SSL/TLS configured (use reverse proxy like Nginx/Caddy)

## Production Recommendations

### 1. Use a Reverse Proxy

Don't expose port 3000 directly. Use Nginx or Caddy:

**Caddy example (automatic HTTPS):**
```
yourdomain.com {
    reverse_proxy localhost:3000
}
```

### 2. Enable Monitoring

Add health check monitoring:
```bash
# Cron job to check health
*/5 * * * * curl -f http://localhost:3000/health || systemctl restart docker-compose
```

### 3. Automated Backups

Add to crontab:
```bash
# Daily database backup at 2 AM
0 2 * * * cd /path/to/app && docker-compose exec -T postgres pg_dump -U football football_predictions | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz
```

### 4. Resource Limits

Add to `docker-compose.yml`:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

## Support

- API Documentation: `http://localhost:3000/docs`
- Health Check: `http://localhost:3000/health`
- GitHub Issues: [Create an issue](https://github.com/yourusername/preditcion-ai-backend/issues)

## Environment Variables Reference

See `.env.production.example` for all available variables and their descriptions.

**Required:**
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `RAPIDAPI_KEY`

**Optional:**
- `RESEND_API_KEY` (for email)
- `CORS_ORIGINS` (for frontend)
- Rate limiting settings
