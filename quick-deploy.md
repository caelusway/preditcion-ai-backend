# 🚀 Quick Deployment Guide

## Your Current Setup ✅
- Server: decentralabs.tech
- App location: `~/preditcion-ai-backend` (or similar)
- Already running with PM2
- `.env` file configured

---

## Deploy New Changes (2 Steps!)

### 1️⃣ On Your Mac (Local)
```bash
# Commit and push your changes
git add .
git commit -m "Add new features"
git push origin main
```

### 2️⃣ On Your Server (SSH)
```bash
# SSH to server
ssh your-user@your-server-ip

# Run one command to deploy!
cd preditcion-ai-backend && ./deploy.sh
```

**That's it!** 🎉 Your changes are now live!

---

## What the deploy.sh does:
1. ✅ Pulls latest code from GitHub
2. ✅ Installs dependencies
3. ✅ Runs database migrations
4. ✅ Builds TypeScript
5. ✅ Restarts PM2 app

---

## First Time Using This?

Make the script executable:
```bash
ssh your-user@your-server-ip
cd preditcion-ai-backend
chmod +x deploy.sh
```

---

## Today's Update (New Features)

Since you already have the old version running, deploy the new version:

```bash
# SSH to server
ssh your-user@your-server-ip

# Go to app folder
cd preditcion-ai-backend

# Check git status
git status

# If you have uncommitted changes, save them
git stash

# Run deploy (it will pull latest code automatically)
./deploy.sh
```

This will:
- Pull all new changes (password reset, saved matches, stats, etc.)
- Run new database migrations (SavedMatch, UserStats tables)
- Restart the app

---

## Common Commands

```bash
# View app status
pm2 status

# View live logs
pm2 logs football-prediction-api

# Restart app manually
pm2 restart football-prediction-api

# Stop app
pm2 stop football-prediction-api

# Test API
curl https://decentralabs.tech/health
```

---

## Troubleshooting

### If deploy.sh fails:
```bash
# Check what went wrong
pm2 logs football-prediction-api --err

# Try manual restart
pm2 restart football-prediction-api
```

### If you get merge conflicts:
```bash
# Save your local changes
git stash

# Pull latest
git pull origin main

# Run deploy
./deploy.sh
```

### If port is in use:
```bash
pm2 delete football-prediction-api
./deploy.sh
```

---

## Your Workflow Summary

**Local (Mac):**
```bash
# 1. Make changes
# 2. Test locally
npm run dev

# 3. Commit and push
git add .
git commit -m "Description"
git push origin main
```

**Server:**
```bash
# 4. Deploy
cd preditcion-ai-backend && ./deploy.sh
```

Done! 🎊
