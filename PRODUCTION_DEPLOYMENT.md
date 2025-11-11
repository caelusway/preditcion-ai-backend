# Production Deployment Guide

## Steps to Deploy Latest Changes

### 1. SSH into Production Server

```bash
ssh user@decentralabs.tech
```

### 2. Navigate to Project Directory

```bash
cd /path/to/preditcion-ai-backend
```

### 3. Pull Latest Changes

```bash
git pull origin main
```

### 4. Populate Database with Match Data

**IMPORTANT: Run this ONLY ONCE on first deployment**

```bash
npm run populate
```

This will create:
- 17 teams
- 11 matches (2 live, 5 upcoming, 4 finished)
- AI predictions for all matches

### 5. Run Deployment Script

```bash
./deploy.sh
```

This will:
- Install dependencies
- Generate Prisma client
- Run migrations
- Build the project
- Restart PM2

### 6. Verify Deployment

Test the endpoints:

```bash
# Check health
curl https://decentralabs.tech/health

# Check live matches (should return 2)
curl https://decentralabs.tech/matches?status=live | jq '.data | length'

# Check upcoming matches (should return 5)
curl https://decentralabs.tech/matches?status=upcoming | jq '.data | length'

# Check a match with prediction
curl https://decentralabs.tech/matches/match-live-1 | jq '.prediction'
```

## What Changed

### From Dummy Mode to Database Mode

**Before:**
- Used `FOOTBALL_DATA_SOURCE=dummy`
- Data stored in memory
- Predictions not in database

**After:**
- Uses `FOOTBALL_DATA_SOURCE=api` (default)
- Data stored in PostgreSQL
- Predictions fully integrated
- Saved matches work with predictions

### Benefits

✅ Real database queries
✅ Predictions properly stored and queryable
✅ Saved matches include full prediction data
✅ No more dummy mode issues
✅ Same realistic data, better architecture

## Troubleshooting

### If matches don't show up:

1. Check database was populated:
```bash
npm run populate
```

2. Verify database connection:
```bash
npx prisma studio
```

3. Check logs:
```bash
pm2 logs
```

### If predictions are missing:

The populate script creates predictions automatically. If missing, re-run:
```bash
npm run populate
```

## Summary

The production API now uses real database storage with populated dummy data for realistic testing, providing the same match data but with proper database integration for predictions and saved matches.
