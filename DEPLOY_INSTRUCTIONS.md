# Easy Deployment Instructions

## Initial Setup (One-time only)

Already done! ✅ Your server has:
- Node.js installed
- PM2 running
- App in `/path/to/preditcion-ai-backend`
- `.env` file configured

## Deploy New Changes - Super Easy! 🚀

### Method 1: One Command (Recommended)

SSH into your server and run:

```bash
cd preditcion-ai-backend
./deploy.sh
```

That's it! The script will:
1. Pull latest code from GitHub
2. Install dependencies
3. Run migrations
4. Build the app
5. Restart PM2

### Method 2: Manual Steps

If deploy.sh doesn't work, run these commands:

```bash
cd preditcion-ai-backend
git pull origin main
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart football-prediction-api
```

## Your Workflow

1. **Make changes locally** (on your Mac)
2. **Commit and push to GitHub**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. **SSH to server**:
   ```bash
   ssh user@your-server-ip
   ```
4. **Run deployment**:
   ```bash
   cd preditcion-ai-backend
   ./deploy.sh
   ```

## Quick Commands

```bash
# Check if app is running
pm2 status

# View live logs
pm2 logs football-prediction-api

# View last 100 lines
pm2 logs football-prediction-api --lines 100

# Restart app manually
pm2 restart football-prediction-api

# Stop app
pm2 stop football-prediction-api

# Start app
pm2 start ecosystem.config.js
```

## For Today's Updates

Since you already have the old version deployed, here's what to do:

```bash
# 1. SSH to your server
ssh user@your-server-ip

# 2. Go to app directory
cd preditcion-ai-backend

# 3. Make sure you're on main branch
git status

# 4. If you have local changes, stash them
git stash

# 5. Pull latest code
git pull origin main

# 6. Run deployment script
chmod +x deploy.sh
./deploy.sh
```

## Troubleshooting

### Error: .env file not found
- Make sure `.env` file exists in the root directory
- Copy from `.env.production` if needed

### Error: Permission denied
```bash
chmod +x deploy.sh
```

### Error: Git conflicts
```bash
git stash              # Save local changes
git pull origin main   # Pull latest
git stash pop         # Restore local changes (if needed)
```

### Error: Port 3000 already in use
```bash
pm2 stop football-prediction-api
./deploy.sh
```

### Check what's running on port 3000
```bash
sudo lsof -i :3000
```

## Automatic Deployment (Optional - Advanced)

Want to deploy automatically when you push to GitHub? Set up a webhook:

1. Install webhook tool on server
2. Configure GitHub webhook
3. Auto-deploy on every push

Let me know if you want this setup!

## Database Migrations

The deploy script automatically runs migrations. But if you need to run them manually:

```bash
# See pending migrations
npx prisma migrate status

# Apply migrations
npx prisma migrate deploy

# Reset database (DANGEROUS - deletes all data)
npx prisma migrate reset
```

## Environment Variables

If you need to update `.env` variables:

```bash
nano .env              # Edit file
pm2 restart football-prediction-api --update-env
```

## Health Check

After deployment, test the API:

```bash
# From server
curl http://localhost:3000/health

# From outside
curl https://decentralabs.tech/health
```

## Rollback to Previous Version

If something breaks:

```bash
# See recent commits
git log --oneline -5

# Rollback to specific commit
git reset --hard COMMIT_HASH
./deploy.sh
```

## Need Help?

- Check logs: `pm2 logs football-prediction-api`
- Check PM2 status: `pm2 status`
- Check Nginx: `sudo systemctl status nginx`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

---

**Remember:** Always commit and push your changes to GitHub first, then deploy on the server!
