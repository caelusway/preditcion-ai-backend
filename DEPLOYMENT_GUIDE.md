# Manual Deployment Guide with PM2

This guide explains how to manually deploy the Football Prediction API using PM2 process manager and GitHub.

## Prerequisites on Server

### 1. Install Node.js 20+

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# Verify installation
node -v  # Should show v20.x.x
npm -v
```

### 2. Install PM2

```bash
npm install -g pm2

# Setup PM2 to start on system reboot
pm2 startup
# Follow the instructions from the output
```

### 3. Install PostgreSQL Client (if needed)

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y postgresql-client

# Or use your cloud database
```

## Initial Setup

### 1. Clone Repository

```bash
cd /var/www  # or your preferred directory
git clone https://github.com/yourusername/preditcion-ai-backend.git
cd preditcion-ai-backend
```

### 2. Create Environment File

```bash
cp .env.production .env
nano .env  # or vim .env
```

Fill in your actual values:

```env
NODE_ENV=production
PORT=3000

# Your cloud database URL
DATABASE_URL=postgresql://user:password@host:port/database

# Generate secure secrets (use: openssl rand -base64 32)
JWT_SECRET=your-generated-secret-here
JWT_REFRESH_SECRET=your-generated-refresh-secret-here
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d

# Your frontend domains
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email settings
EMAIL_FROM=noreply@yourdomain.com
EMAIL_PROVIDER=resend
RESEND_API_KEY=your-resend-api-key

# API Football
RAPIDAPI_KEY=your-rapidapi-key-here
FOOTBALL_DATA_SOURCE=api

# Rate limits
AUTH_RATE_LIMIT=50
GENERAL_RATE_LIMIT=300
```

### 3. Make Deploy Script Executable

```bash
chmod +x deploy.sh
```

### 4. Run Initial Deployment

```bash
./deploy.sh
```

This will:
- Check Node.js version
- Install dependencies
- Generate Prisma Client
- Run database migrations
- Build TypeScript code
- Start the application with PM2

## Updates & Redeployment

Whenever you push changes to GitHub:

```bash
cd /var/www/preditcion-ai-backend

# Pull latest changes
git pull origin main

# Deploy
./deploy.sh
```

## PM2 Commands

```bash
# View application status
pm2 status

# View logs (all)
pm2 logs football-prediction-api

# View only error logs
pm2 logs football-prediction-api --err

# View only output logs
pm2 logs football-prediction-api --out

# Restart application
pm2 restart football-prediction-api

# Stop application
pm2 stop football-prediction-api

# Delete application from PM2
pm2 delete football-prediction-api

# Monitor in real-time
pm2 monit

# Show detailed info
pm2 show football-prediction-api
```

## Setup Nginx Reverse Proxy (Optional but Recommended)

### 1. Install Nginx

```bash
sudo apt-get update
sudo apt-get install -y nginx
```

### 2. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/football-api
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/football-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Setup SSL with Let's Encrypt (Optional)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Setup Auto-deployment with GitHub Webhooks (Advanced)

### 1. Install webhook listener

```bash
npm install -g webhook
```

### 2. Create webhook script

```bash
nano /var/www/webhook-deploy.sh
```

```bash
#!/bin/bash
cd /var/www/preditcion-ai-backend
git pull origin main
./deploy.sh
```

```bash
chmod +x /var/www/webhook-deploy.sh
```

### 3. Setup webhook service with PM2

```bash
pm2 start webhook --name "github-webhook" -- -hooks /var/www/hooks.json -verbose
```

Then configure GitHub webhook to point to your server.

## Troubleshooting

### Check Application Logs

```bash
pm2 logs football-prediction-api --lines 100
```

### Check if Port 3000 is in Use

```bash
sudo lsof -i :3000
```

### Database Connection Issues

```bash
# Test database connection
npx prisma db pull
```

### Permission Issues

```bash
# If you get permission errors
sudo chown -R $USER:$USER /var/www/preditcion-ai-backend
```

### View PM2 Logs Location

```bash
ls -la ~/.pm2/logs/
```

## Monitoring & Maintenance

### View Application Metrics

```bash
pm2 monit
```

### Setup Log Rotation

PM2 automatically manages logs, but you can configure rotation:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Database Backups

```bash
# Create backup script
nano backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/football-api"
mkdir -p $BACKUP_DIR

# Extract database details from DATABASE_URL
# Add your backup command here based on your database
```

### Health Check

Your API has a health endpoint at `/health`:

```bash
curl http://localhost:3000/health
```

## Security Checklist

- ✅ Strong JWT secrets generated
- ✅ Database password is secure
- ✅ `.env` file has correct permissions (600)
- ✅ Firewall configured (allow only necessary ports)
- ✅ SSL/TLS enabled (HTTPS)
- ✅ Regular security updates
- ✅ Log monitoring enabled

## Quick Reference

```bash
# One-line deployment
cd /var/www/preditcion-ai-backend && git pull && ./deploy.sh

# Check if app is running
pm2 status | grep football-prediction-api

# Restart app
pm2 restart football-prediction-api

# View recent logs
pm2 logs football-prediction-api --lines 50

# Check API health
curl http://localhost:3000/health
```
