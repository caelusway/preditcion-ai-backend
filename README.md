# AI Football Prediction API

Backend API for an AI-powered football match prediction mobile application. Built with Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## Features

- **Authentication**
  - Email/password registration and login
  - JWT access tokens (15 min) + rotating refresh tokens (30 days)
  - Password reset flow with email verification
  - Email verification
  - Secure password hashing with argon2id

- **Match Predictions** (Dummy data for MVP)
  - List upcoming matches with AI confidence levels
  - Detailed match predictions with probabilities
  - Quick stats (form, goals, xG, injuries, head-to-head)
  - AI-generated analysis

- **Insights & Analytics** (Dummy data for MVP)
  - Prediction accuracy trends (weekly/monthly)
  - Top performing teams
  - Confidence level distribution

- **Security**
  - Rate limiting (50 req/10min for auth, 300 req/10min for general)
  - CORS configuration
  - Security headers (helmet)
  - Input validation (zod)
  - Token rotation on refresh
  - Uniform error messages to prevent user enumeration

- **Documentation**
  - Swagger/OpenAPI 3 documentation at `/docs`
  - Interactive API testing

## Tech Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript (strict mode)
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** argon2id
- **Validation:** Zod
- **Rate Limiting:** express-rate-limit
- **CORS:** cors
- **Security:** helmet
- **Logging:** Pino
- **API Docs:** Swagger (swagger-jsdoc + swagger-ui-express)
- **Containerization:** Docker

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL 14+ (or use Docker)
- Docker and Docker Compose (optional, for containerized setup)

## Installation

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/preditcion-ai-backend.git
   cd preditcion-ai-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure your environment variables:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/football_predictions
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
   # ... other variables
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev --name init
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3000`

### Option 2: Docker Compose (Recommended)

1. **Clone and set up**
   ```bash
   git clone https://github.com/yourusername/preditcion-ai-backend.git
   cd preditcion-ai-backend
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   This will start both PostgreSQL and the API server. The API will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run lint` - Lint code with ESLint
- `npm run format` - Format code with Prettier

## API Documentation

Once the server is running, visit:

- **Swagger UI:** `http://localhost:3000/docs`
- **Health Check:** `http://localhost:3000/health`

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Logout user | No |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password with token | No |
| GET | `/auth/verify-email?token=...` | Verify email address | No |

### User

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/me` | Get current user profile | Yes |

### Matches

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/matches` | List matches (with filtering) | Yes |
| GET | `/matches/:id` | Get match details with prediction | Yes |

### Insights

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/insights/accuracy` | Get prediction accuracy trends | Yes |
| GET | `/insights/top-teams` | Get top performing teams | Yes |
| GET | `/insights/confidence-distribution` | Get confidence distribution | Yes |

### Health

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |

## Example Requests

### Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailVerified": false
  }
}
```

### Get Matches (Protected)
```bash
curl -X GET http://localhost:3000/matches \
  -H "Authorization: Bearer <accessToken>"
```

### Get Match Details
```bash
curl -X GET http://localhost:3000/matches/match-1 \
  -H "Authorization: Bearer <accessToken>"
```

### Refresh Token
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

## Authentication Flow

### Registration & Email Verification
```
1. User registers → POST /auth/register
2. API creates user with emailVerified=false
3. API generates verification token
4. API sends verification email (console in dev)
5. User clicks link → GET /auth/verify-email?token=xxx
6. API sets emailVerified=true
```

### Login & Token Management
```
1. User logs in → POST /auth/login
2. API verifies credentials
3. API creates refresh token record in DB
4. API returns:
   - accessToken (15 min expiry)
   - refreshToken (30 day expiry)
```

### Token Refresh (Rotation)
```
1. Access token expires (15 min)
2. Client sends refresh token → POST /auth/refresh
3. API verifies refresh token
4. API revokes old refresh token
5. API creates new refresh token record
6. API returns new access + refresh tokens
```

### Password Reset
```
1. User requests reset → POST /auth/forgot-password
2. API always returns 200 (prevent user enumeration)
3. If user exists, API creates reset token (30 min expiry)
4. API sends reset email (console in dev)
5. User resets password → POST /auth/reset-password
6. API updates password & revokes all refresh tokens
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | Yes |
| `PORT` | Server port | `3000` | Yes |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `JWT_SECRET` | Access token secret (min 32 chars) | - | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret (min 32 chars) | - | Yes |
| `ACCESS_TOKEN_TTL` | Access token expiry | `15m` | No |
| `REFRESH_TOKEN_TTL` | Refresh token expiry | `30d` | No |
| `CORS_ORIGINS` | Comma-separated allowed origins | - | Yes |
| `EMAIL_FROM` | Sender email address | - | Yes |
| `EMAIL_PROVIDER` | Email provider (`console`, `postmark`, `sendgrid`) | `console` | Yes |
| `AUTH_RATE_LIMIT` | Auth rate limit (per 10 min) | `50` | No |
| `GENERAL_RATE_LIMIT` | General rate limit (per 10 min) | `300` | No |

## Database Schema

The database uses the following tables:

- **users** - User accounts
- **refresh_tokens** - Active refresh tokens with device metadata
- **email_verification_tokens** - Email verification tokens
- **password_reset_tokens** - Password reset tokens

To view the schema:
```bash
npx prisma studio
```

## Mobile Developer Integration Guide

### 1. Base URL
- Development: `http://192.168.x.x:3000` (your local IP)
- Production: `https://api.yourdomain.com`

### 2. Token Storage
Store tokens in secure storage:
- iOS: Keychain
- Android: Keystore
- React Native: `expo-secure-store` or `react-native-keychain`

```typescript
// Example with expo-secure-store
import * as SecureStore from 'expo-secure-store';

// Save tokens
await SecureStore.setItemAsync('accessToken', response.accessToken);
await SecureStore.setItemAsync('refreshToken', response.refreshToken);

// Retrieve tokens
const accessToken = await SecureStore.getItemAsync('accessToken');
```

### 3. Auto Token Refresh
Implement automatic token refresh on 401:

```typescript
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await SecureStore.getItemAsync('refreshToken');

      try {
        const response = await axios.post('/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        await SecureStore.setItemAsync('accessToken', accessToken);
        await SecureStore.setItemAsync('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### 4. Error Handling
The API returns errors in this format:

```json
{
  "error": "ValidationError",
  "message": "body.email: Invalid email format",
  "statusCode": 400
}
```

Common status codes:
- `400` - Validation error
- `401` - Unauthorized (invalid/expired token)
- `404` - Resource not found
- `409` - Conflict (e.g., email already exists)
- `429` - Too many requests (rate limited)
- `500` - Internal server error

### 5. Rate Limiting
If you receive a `429` response, implement exponential backoff:

```typescript
const retryAfter = response.headers['retry-after']; // in seconds
// Wait before retrying
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive production deployment instructions.

### Quick Start

1. **Create PostgreSQL database manually first:**
   ```sql
   CREATE DATABASE football;
   ```

2. **Set environment variables** (see DEPLOYMENT.md for full list)

3. **Deploy** - migrations run automatically on container start

For detailed steps, troubleshooting, and production best practices, refer to [DEPLOYMENT.md](./DEPLOYMENT.md).

## Security Best Practices

1. **Secrets**
   - Never commit `.env` file
   - Use strong, random secrets (min 32 characters)
   - Rotate secrets regularly in production

2. **Rate Limiting**
   - Default: 50 auth requests per 10 min
   - Default: 300 general requests per 10 min
   - Adjust based on your needs

3. **CORS**
   - Only allow trusted origins
   - Don't use `*` in production

4. **Database**
   - Use connection pooling
   - Regular backups
   - Encrypted connections in production

## Troubleshooting

### Database Connection Issues
```bash
# Test database connection
npx prisma db pull

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Prisma Issues
```bash
# Regenerate Prisma client
npx prisma generate

# Format schema
npx prisma format
```

## Project Structure

```
preditcion-ai-backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/
│   │   ├── env.ts            # Environment validation
│   │   └── swagger.ts        # Swagger configuration
│   ├── controllers/          # Request handlers
│   ├── data/                 # Dummy data
│   ├── lib/                  # Utilities (JWT, password, etc.)
│   ├── middleware/           # Express middleware
│   ├── routes/               # API routes
│   ├── schemas/              # Zod validation schemas
│   ├── services/             # Business logic
│   ├── types/                # TypeScript types
│   ├── app.ts                # Express app setup
│   └── server.ts             # Server entry point
├── .env.example              # Environment template
├── docker-compose.yml        # Docker Compose config
├── Dockerfile                # Production Docker image
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/preditcion-ai-backend/issues)
- API Documentation: Visit `/docs` endpoint

---

Built with Node.js, Express, TypeScript, Prisma, and PostgreSQL
