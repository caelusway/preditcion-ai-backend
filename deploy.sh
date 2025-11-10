#!/bin/bash

# Football Prediction API Deployment Script
# Run this script on your server after pulling from GitHub

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Load environment variables
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file from .env.production template"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Error: Node.js version must be >= 20"
    echo "Current version: $(node -v)"
    echo "Please upgrade Node.js"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Build TypeScript
echo "🏗️  Building application..."
npm run build

# Create logs directory
mkdir -p logs

# Restart PM2 application
echo "🔄 Restarting application with PM2..."
if pm2 list | grep -q "football-prediction-api"; then
    pm2 restart ecosystem.config.js --update-env
else
    pm2 start ecosystem.config.js
fi

# Save PM2 configuration
pm2 save

echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Application status:"
pm2 status
echo ""
echo "📝 View logs:"
echo "  pm2 logs football-prediction-api"
echo ""
echo "🌐 API should be available at: http://your-server-ip:3000"
