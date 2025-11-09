# Production Deployment Guide

## Prerequisites

Before deploying your application, ensure the following are set up in your hosting environment (Coolify, Railway, Render, etc.):

### 1. PostgreSQL Database Setup

**IMPORTANT**: The database must be created before running the application.

#### In Coolify:
1. Access your PostgreSQL service
2. Connect to PostgreSQL console
3. Create the database:
```sql
CREATE DATABASE football;
```

#### Or via command line:
```bash
psql -h your-postgres-host -U your-postgres-user -c "CREATE DATABASE football;"
```

### 2. Environment Variables

Set the following environment variables in your hosting platform:

```bash
# Server
NODE_ENV=production
PORT=3000

# Database - IMPORTANT: The database name in this URL must exist!
DATABASE_URL=postgresql://user:password@host:5432/football

# JWT Secrets - Generate strong secrets for production
JWT_SECRET=your-secure-jwt-secret-here
JWT_REFRESH_SECRET=your-secure-refresh-secret-here
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d

# CORS - Add your production frontend URL
CORS_ORIGINS=https://your-production-domain.com

# Email - Use Resend for production
EMAIL_FROM=noreply@yourdomain.com
EMAIL_PROVIDER=resend
RESEND_API_KEY=your-resend-api-key

# API-Football (optional - can use dummy data)
RAPIDAPI_KEY=your-rapidapi-key
FOOTBALL_DATA_SOURCE=api  # or 'dummy' for testing

# Rate Limiting
AUTH_RATE_LIMIT=50
GENERAL_RATE_LIMIT=300
```

## Deployment Process

### First-Time Deployment

1. **Create PostgreSQL database** (see Prerequisites above)
2. **Push your code** to your Git repository
3. **Configure environment variables** in your hosting platform
4. **Deploy the application**

The Docker container will automatically:
- Install dependencies
- Generate Prisma client
- Run database migrations (`prisma migrate deploy`)
- Start the Node.js server

### Subsequent Deployments

For code updates:
1. Push changes to Git
2. Trigger rebuild in your hosting platform
3. Migrations will run automatically on container start

## Troubleshooting

### Error: "database does not exist"

**Cause**: The database specified in `DATABASE_URL` hasn't been created in PostgreSQL.

**Solution**: Create the database manually (see Prerequisites section above).

### Error: "tsx: not found"

**Cause**: Development dependency being called in production.

**Solution**: This error should not occur with the current Dockerfile. If you see it, check:
- Ensure you're using the production Dockerfile (not running `npm run dev`)
- Verify no npm scripts are trying to use `tsx` in postinstall hooks

### Database Connection Issues

**Symptoms**:
- "Connection refused"
- "Connection timeout"

**Solutions**:
1. Verify DATABASE_URL format: `postgresql://user:password@host:port/database`
2. Check PostgreSQL service is running
3. Ensure network connectivity between app and database containers
4. Verify credentials are correct

## Health Check

The application includes a health check endpoint at `/health`:

```bash
curl http://your-domain.com/health
```

Should return: `{"status":"healthy"}`

## Post-Deployment Steps

### 1. Sync Football Data

If using `FOOTBALL_DATA_SOURCE=api`, sync data after first deployment:

```bash
# SSH into your container or use Coolify's console
npm run sync
```

This will fetch:
- Teams (20)
- Fixtures (50+ matches)
- Standings (20)
- Players (29)

### 2. Test API

Test your deployment:

```bash
# Check health
curl https://your-domain.com/health

# Check API docs
curl https://your-domain.com/docs

# Test endpoints
curl https://your-domain.com/matches
```

## Monitoring

Monitor your application logs for:
- Database connection status
- API request errors
- Migration execution
- Health check failures

In Coolify, access logs via:
- Container logs tab
- PostgreSQL service logs

## Backup Strategy

Recommended backup approach:
1. Use PostgreSQL automated backups (Coolify provides this)
2. Schedule regular database dumps
3. Store environment variables securely (use Coolify's secrets)

## Scaling Considerations

For production scaling:
1. Enable horizontal scaling (multiple container instances)
2. Use connection pooling (Prisma includes this by default)
3. Consider Redis for session storage
4. Enable CDN for static assets
5. Use environment-specific rate limits

## Security Checklist

- [ ] Strong JWT secrets (min 32 characters)
- [ ] CORS configured for production domains only
- [ ] DATABASE_URL stored as secret (never in code)
- [ ] RESEND_API_KEY and RAPIDAPI_KEY stored as secrets
- [ ] PostgreSQL password is strong
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Container runs as non-root user (already configured)

## Need Help?

Common resources:
- Prisma Docs: https://www.prisma.io/docs/
- API-Football: https://www.api-football.com/documentation-v3
- Resend Email: https://resend.com/docs

For application issues, check:
- `/docs` - API documentation
- Container logs in Coolify
- PostgreSQL logs
- Health check status
