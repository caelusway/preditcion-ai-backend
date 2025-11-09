# Product Requirements Document (PRD)
## AI Football Prediction Mobile App Backend

**Version:** 1.0.0
**Date:** November 7, 2025
**Status:** MVP Development

---

## 1. Executive Summary

Build a secure, production-ready Node.js/Express backend API for an AI-powered football match prediction mobile application. The backend will provide real JWT-based authentication, while business domain endpoints (matches, predictions, insights) will return realistic dummy data in Stage 1 to enable parallel mobile development.

**App Name:** AI Football - Insight & Prediction
**Platform:** Mobile (iOS/Android via React Native/Expo)
**Deployment:** Docker containerized, ready for Coolify deployment

---

## 2. App Overview (Based on Mobile Screens)

### 2.1 Core Features
The mobile app provides:
- **Authentication:** Email/password login, registration, forgot password, Google Sign-in (Stage 2)
- **Onboarding:** 3-screen carousel introducing app features
- **Match Predictions:** AI-powered predictions for upcoming football matches
- **Match Details:** Detailed analysis including win/draw probabilities, statistics, AI analysis
- **Insights Dashboard:** Analytics showing prediction accuracy trends, top performing teams
- **User Profile:** Account management and settings

### 2.2 Key User Flows (From Screens)
1. Splash screen → Onboarding (skippable) → Login/Sign Up
2. Home screen: List of upcoming matches with AI confidence badges
3. Tap match → View detailed prediction with probabilities, stats, and AI analysis
4. Insights tab: View weekly/monthly prediction accuracy trends and team performance
5. Profile tab: Manage account, view stats, logout

---

## 3. Technical Stack

### 3.1 Backend Technologies
- **Runtime:** Node.js 20+
- **Language:** TypeScript (strict mode)
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (access + refresh tokens)
- **Password Hashing:** argon2id
- **Validation:** Zod
- **Rate Limiting:** express-rate-limit
- **CORS:** cors middleware
- **Logging:** Pino or Morgan (minimal)
- **API Documentation:** Swagger (OpenAPI 3) via swagger-jsdoc + swagger-ui-express
- **Email:** Abstraction layer (console in dev, Postmark/SendGrid-ready for prod)
- **Testing:** Supertest (optional but recommended)
- **Containerization:** Docker (multi-stage build with Node 20-alpine)

### 3.2 Environment Variables
```bash
# Server
NODE_ENV=development|production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/football_predictions

# JWT
JWT_SECRET=<strong-random-secret-for-access-tokens>
JWT_REFRESH_SECRET=<strong-random-secret-for-refresh-tokens>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d

# CORS
CORS_ORIGINS=http://localhost:19000,http://localhost:8081
# For production: https://yourdomain.com

# Email
EMAIL_FROM=noreply@aifootball.com
EMAIL_PROVIDER=console|postmark|sendgrid
POSTMARK_TOKEN=<optional>
SENDGRID_API_KEY=<optional>

# Rate Limiting (requests per 10 minutes)
AUTH_RATE_LIMIT=50
GENERAL_RATE_LIMIT=300
```

---

## 4. Data Models (Prisma Schema)

### 4.1 Authentication Models

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  emailVerified Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  refreshTokens           RefreshToken[]
  emailVerificationTokens EmailVerificationToken[]
  passwordResetTokens     PasswordResetToken[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  revoked   Boolean  @default(false)
  expiresAt DateTime
  createdAt DateTime @default(now())

  // Device metadata
  device    String?
  ip        String?
  userAgent String?

  @@index([userId])
  @@map("refresh_tokens")
}

model EmailVerificationToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@map("email_verification_tokens")
}

model PasswordResetToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@map("password_reset_tokens")
}
```

### 4.2 Domain Models (Optional for Stage 1 - for future reference)

```prisma
// These models are NOT required for Stage 1
// They are included for reference when implementing real predictions in Stage 2

model Team {
  id       String @id @default(uuid())
  name     String
  logoUrl  String?

  homeMatches Match[] @relation("HomeTeam")
  awayMatches Match[] @relation("AwayTeam")

  @@map("teams")
}

model Match {
  id            String   @id @default(uuid())
  homeTeamId    String
  awayTeamId    String
  homeTeam      Team     @relation("HomeTeam", fields: [homeTeamId], references: [id])
  awayTeam      Team     @relation("AwayTeam", fields: [awayTeamId], references: [id])

  kickoffTime   DateTime
  status        String   // upcoming, live, finished

  predictions   Prediction[]

  @@map("matches")
}

model Prediction {
  id             String  @id @default(uuid())
  matchId        String
  match          Match   @relation(fields: [matchId], references: [id])

  homeWinProb    Float   // 0-100
  drawProb       Float   // 0-100
  awayWinProb    Float   // 0-100

  confidence     String  // High, Medium, Low
  aiAnalysis     String

  createdAt      DateTime @default(now())

  @@map("predictions")
}
```

---

## 5. API Endpoints Specification

### 5.1 Authentication Endpoints (REAL IMPLEMENTATION)

All auth endpoints must have REAL functionality with proper security.

#### POST `/auth/register`
**Purpose:** Create a new user account

**Request Body:**
```typescript
{
  email: string;      // Valid email format
  password: string;   // Min 8 characters
}
```

**Validation Rules:**
- Email: Valid format, unique
- Password: Minimum 8 characters

**Success Response (201):**
```typescript
{
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    createdAt: string;
  }
}
```

**Error Responses:**
- `400` - Validation error
- `409` - Email already exists

**Side Effects:**
- Hash password with argon2id
- Create EmailVerificationToken
- Send verification email (console log in dev)

---

#### POST `/auth/login`
**Purpose:** Authenticate user and issue tokens

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Success Response (200):**
```typescript
{
  accessToken: string;   // JWT, 15min TTL
  refreshToken: string;  // JWT, 30day TTL
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Invalid credentials (uniform message: "Invalid email or password")

**Security:**
- Rate limit: 50 requests per 10 minutes per IP
- Use constant-time comparison for password verification
- Store RefreshToken record in database with device metadata
- Uniform error messages (don't reveal if email exists)

---

#### POST `/auth/refresh`
**Purpose:** Get new access token using refresh token

**Request Body:**
```typescript
{
  refreshToken: string;
}
```

**Success Response (200):**
```typescript
{
  accessToken: string;
  refreshToken: string;  // New refresh token (rotation)
}
```

**Error Responses:**
- `401` - Invalid, expired, or revoked refresh token

**Security:**
- Verify refresh token JWT
- Check database record: not revoked, not expired
- Rotate token: revoke old, create new record
- Return new access + refresh tokens

---

#### POST `/auth/logout`
**Purpose:** Revoke refresh token

**Request Body:**
```typescript
{
  refreshToken: string;
}
```

**Success Response (204):**
- No content

**Error Responses:**
- `400` - Invalid token format

**Implementation:**
- Mark refresh token as revoked in database
- Return 204 even if token doesn't exist (idempotent)

---

#### POST `/auth/forgot-password`
**Purpose:** Initiate password reset flow

**Request Body:**
```typescript
{
  email: string;
}
```

**Success Response (200):**
```typescript
{
  message: "If an account exists with that email, a reset link has been sent."
}
```

**Security:**
- ALWAYS return 200, even if email doesn't exist
- Create PasswordResetToken with 30min expiry
- Send reset email with token (console log in dev)

---

#### POST `/auth/reset-password`
**Purpose:** Reset password using token

**Request Body:**
```typescript
{
  token: string;
  newPassword: string;  // Min 8 characters
}
```

**Success Response (200):**
```typescript
{
  message: "Password successfully reset"
}
```

**Error Responses:**
- `400` - Validation error or invalid/expired token

**Implementation:**
- Verify token exists and not expired
- Hash new password with argon2id
- Update user password
- Revoke ALL refresh tokens for user
- Delete used password reset token

---

#### GET `/auth/verify-email`
**Purpose:** Verify email address

**Query Parameters:**
- `token` (string) - Email verification token

**Success Response (200):**
```typescript
{
  message: "Email successfully verified"
}
```

**Error Responses:**
- `400` - Invalid or expired token

**Implementation:**
- Verify token exists and not expired
- Set user.emailVerified = true
- Delete verification token
- Return success message

---

### 5.2 Protected User Endpoint

#### GET `/me`
**Purpose:** Get current user profile

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```typescript
{
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}
```

**Error Responses:**
- `401` - Missing or invalid access token

**Middleware:**
- Verify JWT access token
- Attach decoded user to request object

---

### 5.3 Matches Endpoints (DUMMY DATA FOR MVP)

These endpoints return realistic dummy/static data for mobile development.

#### GET `/matches`
**Purpose:** List upcoming football matches

**Query Parameters:**
- `limit` (optional, number, default: 20) - Number of matches to return
- `status` (optional, string) - Filter by status: `upcoming` | `live` | `finished`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```typescript
{
  matches: [
    {
      id: string;
      homeTeam: {
        id: string;
        name: string;
        logoUrl: string;
      };
      awayTeam: {
        id: string;
        name: string;
        logoUrl: string;
      };
      kickoffTime: string;  // ISO 8601
      status: "upcoming" | "live" | "finished";
      aiConfidence: "High" | "Medium" | "Low";
      predictionId: string;
    }
  ]
}
```

**Dummy Data Example:**
```typescript
[
  {
    id: "match-1",
    homeTeam: {
      id: "team-mu",
      name: "Manchester United",
      logoUrl: "https://example.com/mu-logo.png"
    },
    awayTeam: {
      id: "team-liv",
      name: "Liverpool",
      logoUrl: "https://example.com/liv-logo.png"
    },
    kickoffTime: "2025-11-10T20:00:00Z",
    status: "upcoming",
    aiConfidence: "Medium",
    predictionId: "pred-1"
  },
  {
    id: "match-2",
    homeTeam: {
      id: "team-mci",
      name: "Manchester City",
      logoUrl: "https://example.com/mci-logo.png"
    },
    awayTeam: {
      id: "team-ars",
      name: "Arsenal",
      logoUrl: "https://example.com/ars-logo.png"
    },
    kickoffTime: "2025-11-11T15:00:00Z",
    status: "upcoming",
    aiConfidence: "High",
    predictionId: "pred-2"
  }
  // Add 3-5 more matches
]
```

---

#### GET `/matches/:id`
**Purpose:** Get detailed match information and prediction

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```typescript
{
  id: string;
  homeTeam: {
    id: string;
    name: string;
    logoUrl: string;
  };
  awayTeam: {
    id: string;
    name: string;
    logoUrl: string;
  };
  kickoffTime: string;
  status: string;

  prediction: {
    id: string;
    homeWinProbability: number;    // 0-100
    drawProbability: number;        // 0-100
    awayWinProbability: number;     // 0-100
    aiConfidence: "High" | "Medium" | "Low";
    aiAnalysis: string;

    quickStats: {
      recentForm: {
        home: string[];  // ["W", "W", "D", "L", "W"] - last 5 games
        away: string[];  // ["W", "D", "L", "W", "D"]
      };
      goalsLast10: {
        home: number;
        away: number;
      };
      expectedGoals: {
        home: number;  // xG
        away: number;  // xG
      };
      injuries: {
        home: number;
        away: number;
      };
      headToHead: {
        homeWins: number;
        draws: number;
        awayWins: number;
      };
    };
  };
}
```

**Dummy Data Example:**
```typescript
{
  id: "match-1",
  homeTeam: {
    id: "team-new",
    name: "Newcastle",
    logoUrl: "https://example.com/new-logo.png"
  },
  awayTeam: {
    id: "team-bri",
    name: "Brighton",
    logoUrl: "https://example.com/bri-logo.png"
  },
  kickoffTime: "2025-11-08T14:00:00Z",
  status: "upcoming",

  prediction: {
    id: "pred-1",
    homeWinProbability: 55,
    drawProbability: 25,
    awayWinProbability: 20,
    aiConfidence: "Medium",
    aiAnalysis: "Newcastle's home advantage and recent winning streak give them the edge. Brighton's tactical flexibility could cause problems, but Newcastle's momentum should prevail.",

    quickStats: {
      recentForm: {
        home: ["W", "W", "D", "W", "L"],
        away: ["D", "L", "W", "D", "W"]
      },
      goalsLast10: {
        home: 16,
        away: 10
      },
      expectedGoals: {
        home: 2.2,
        away: 1.7
      },
      injuries: {
        home: 1,
        away: 2
      },
      headToHead: {
        homeWins: 8,
        draws: 4,
        awayWins: 6
      }
    }
  }
}
```

---

### 5.4 Insights Endpoints (DUMMY DATA FOR MVP)

#### GET `/insights/accuracy`
**Purpose:** Get prediction accuracy trends

**Query Parameters:**
- `period` (optional, string, default: `week`) - `week` | `month`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```typescript
{
  period: "week" | "month";
  accuracyByDay: [
    {
      day: string;        // "Mon", "Tue", "Wed", etc.
      accuracy: number;   // 0-100
      category: "Excellent" | "Good" | "Fair";  // 80+, 60-80, <60
    }
  ];
}
```

**Dummy Data Example:**
```typescript
{
  period: "week",
  accuracyByDay: [
    { day: "Mon", accuracy: 75, category: "Good" },
    { day: "Tue", accuracy: 82, category: "Excellent" },
    { day: "Wed", accuracy: 58, category: "Fair" },
    { day: "Thu", accuracy: 88, category: "Excellent" },
    { day: "Fri", accuracy: 79, category: "Good" },
    { day: "Sat", accuracy: 91, category: "Excellent" },
    { day: "Sun", accuracy: 95, category: "Excellent" }
  ]
}
```

---

#### GET `/insights/top-teams`
**Purpose:** Get top performing teams based on prediction accuracy

**Query Parameters:**
- `limit` (optional, number, default: 5)

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```typescript
{
  teams: [
    {
      rank: number;
      teamName: string;
      accuracy: number;        // 0-100
      totalPredictions: number;
    }
  ];
}
```

**Dummy Data Example:**
```typescript
{
  teams: [
    { rank: 1, teamName: "Manchester City", accuracy: 85, totalPredictions: 12 },
    { rank: 2, teamName: "Arsenal", accuracy: 78, totalPredictions: 10 },
    { rank: 3, teamName: "Liverpool", accuracy: 75, totalPredictions: 11 },
    { rank: 4, teamName: "Newcastle", accuracy: 72, totalPredictions: 9 },
    { rank: 5, teamName: "Chelsea", accuracy: 70, totalPredictions: 10 }
  ]
}
```

---

#### GET `/insights/confidence-distribution`
**Purpose:** Get distribution of prediction confidence levels

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```typescript
{
  distribution: [
    {
      level: "High" | "Medium" | "Low";
      percentage: number;  // 0-100
    }
  ];
}
```

**Dummy Data Example:**
```typescript
{
  distribution: [
    { level: "High", percentage: 45 },
    { level: "Medium", percentage: 38 },
    { level: "Low", percentage: 17 }
  ]
}
```

---

### 5.5 Utility Endpoints

#### GET `/health`
**Purpose:** Health check for monitoring

**Success Response (200):**
```typescript
{
  status: "ok",
  timestamp: string,
  uptime: number
}
```

---

## 6. Security Requirements

### 6.1 Authentication Security
- **Password Hashing:** argon2id with recommended parameters (memory: 65536 KB, iterations: 3, parallelism: 4)
- **JWT Configuration:**
  - Access tokens: 15 minute TTL, include claims: `sub` (userId), `email`, `iat`, `exp`
  - Refresh tokens: 30 day TTL, include claims: `sub` (userId), `tid` (token ID), `iat`, `exp`
  - Use separate secrets for access and refresh tokens
  - Clock skew tolerance: 30 seconds
- **Token Storage:**
  - Mobile app stores tokens in secure storage (iOS Keychain, Android Keystore)
  - Refresh tokens stored in database with metadata
- **Token Rotation:**
  - On refresh, revoke old token and issue new one
  - Implement refresh token reuse detection
- **Session Management:**
  - Revoke all refresh tokens on password change/reset
  - Support multiple active sessions (different devices)

### 6.2 Rate Limiting
- **Auth routes** (`/auth/*`): 50 requests per 10 minutes per IP
- **General routes**: 300 requests per 10 minutes per IP
- Return `429 Too Many Requests` with `Retry-After` header
- Store rate limit data in memory (acceptable for MVP)

### 6.3 CORS Configuration
- **Allowed Origins:** Environment variable `CORS_ORIGINS` (comma-separated)
- **Allowed Methods:** GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Allowed Headers:** Content-Type, Authorization
- **Credentials:** Not needed for Bearer token auth (set to false)

### 6.4 Input Validation
- **Use Zod** for all request validation (body, params, query)
- **Sanitize inputs** to prevent injection attacks
- **Strict validation** on all auth endpoints
- **Return clear error messages** without exposing system details

### 6.5 Error Handling
- **Uniform error responses:**
  ```typescript
  {
    error: string;
    message: string;
    statusCode: number;
  }
  ```
- **Don't leak sensitive info** (stack traces only in dev)
- **Auth errors:** Use uniform messages to prevent user enumeration
- **Log errors** with context (request ID, user ID if available)

### 6.6 Security Headers
Implement via helmet or manually:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## 7. Project Structure

```
preditcion-ai-backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seeds.ts                 # Dummy data seeds
├── src/
│   ├── app.ts                   # Express app setup
│   ├── server.ts                # Server bootstrap
│   ├── config/
│   │   ├── env.ts              # Environment validation
│   │   └── swagger.ts          # Swagger configuration
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── matches.routes.ts
│   │   ├── insights.routes.ts
│   │   └── health.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── matches.controller.ts
│   │   └── insights.controller.ts
│   ├── services/
│   │   ├── auth.service.ts     # Business logic
│   │   └── email.service.ts    # Email abstraction
│   ├── middleware/
│   │   ├── auth.middleware.ts  # JWT verification
│   │   ├── rateLimits.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── lib/
│   │   ├── jwt.ts              # JWT sign/verify
│   │   ├── password.ts         # Argon2 hash/verify
│   │   ├── prisma.ts           # Prisma client
│   │   └── logger.ts           # Pino logger
│   ├── schemas/
│   │   └── auth.schemas.ts     # Zod schemas
│   ├── types/
│   │   ├── express.d.ts        # Express type extensions
│   │   └── common.types.ts
│   └── data/
│       ├── matches.dummy.ts    # Dummy match data
│       └── insights.dummy.ts   # Dummy insights data
├── tests/
│   └── auth.test.ts            # Supertest auth tests
├── .env.example
├── .env
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

---

## 8. Swagger Documentation

### 8.1 Setup
- **Library:** `swagger-jsdoc` + `swagger-ui-express`
- **Endpoint:** `GET /docs`
- **OpenAPI Version:** 3.0.0

### 8.2 Documentation Requirements
- Document ALL endpoints (auth, matches, insights)
- Include request/response schemas
- Provide example requests and responses
- Document authentication (Bearer token)
- Include error response examples
- Add descriptions for all parameters
- Tag endpoints by domain (Auth, Matches, Insights)

### 8.3 Example Swagger Annotation
```typescript
/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Authenticate user
 *     description: Login with email and password to receive access and refresh tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     emailVerified:
 *                       type: boolean
 *       401:
 *         description: Invalid credentials
 */
```

---

## 9. Docker Configuration

### 9.1 Dockerfile (Multi-stage Build)
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && npm cache clean --force

RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
```

### 9.2 docker-compose.yml (Development)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: football
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: football_predictions
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://football:devpassword@postgres:5432/football_predictions
      JWT_SECRET: dev_jwt_secret_change_in_production
      JWT_REFRESH_SECRET: dev_refresh_secret_change_in_production
    depends_on:
      - postgres
    volumes:
      - .:/app
      - /app/node_modules

volumes:
  postgres_data:
```

---

## 10. Development Guidelines

### 10.1 Code Quality
- **TypeScript:** Strict mode enabled
- **Linting:** ESLint with recommended rules
- **Formatting:** Prettier
- **Naming Conventions:**
  - Files: kebab-case (auth.service.ts)
  - Classes: PascalCase
  - Functions/variables: camelCase
  - Constants: UPPER_SNAKE_CASE

### 10.2 Error Handling Pattern
```typescript
// Custom error classes
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

// Usage
throw new AppError(401, 'Invalid credentials');

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  logger.error({
    err,
    req: {
      method: req.method,
      url: req.url,
      userId: req.user?.id
    }
  });

  res.status(statusCode).json({
    error: err.name,
    message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

### 10.3 Logging Standards
```typescript
// Log levels: trace, debug, info, warn, error, fatal
logger.info({ userId: user.id }, 'User logged in');
logger.error({ err, userId: user.id }, 'Login failed');

// Don't log sensitive data
// ❌ logger.info({ password: user.password })
// ✅ logger.info({ email: user.email })
```

---

## 11. Testing Strategy (Optional but Recommended)

### 11.1 Test Coverage Goals
- **Auth flows:** 100% coverage
- **Middleware:** 100% coverage
- **Utility functions:** 100% coverage

### 11.2 Test Examples
```typescript
describe('POST /auth/register', () => {
  it('should create a new user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123'
      });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('should reject duplicate email', async () => {
    // Create first user
    await request(app).post('/auth/register').send({
      email: 'test@example.com',
      password: 'SecurePass123'
    });

    // Try duplicate
    const res = await request(app)
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'AnotherPass456'
      });

    expect(res.status).toBe(409);
  });
});
```

---

## 12. Deployment Checklist

### 12.1 Pre-deployment
- [ ] All environment variables set
- [ ] Strong JWT secrets generated
- [ ] Database migrations run
- [ ] CORS origins configured for production
- [ ] Rate limits appropriate for production traffic
- [ ] Email provider configured (Postmark/SendGrid)
- [ ] Health check endpoint working
- [ ] Swagger docs accessible
- [ ] Error logging configured

### 12.2 Coolify Deployment Steps
1. Create new Docker service in Coolify
2. Connect GitHub repository
3. Set environment variables via Coolify dashboard
4. Configure PostgreSQL database (Coolify managed or external)
5. Set build pack to Dockerfile
6. Configure domain and SSL
7. Deploy
8. Run database migrations: `npx prisma migrate deploy`
9. Verify health check: `curl https://yourdomain.com/health`
10. Test auth flow via Swagger docs

---

## 13. README Requirements

The README.md should include:

### 13.1 Sections
- **Project Description:** AI Football Prediction API
- **Features:** List of implemented features
- **Tech Stack:** Technologies used
- **Prerequisites:** Node.js 20+, PostgreSQL, Docker
- **Installation:**
  ```bash
  npm install
  cp .env.example .env
  # Edit .env with your values
  npx prisma generate
  npx prisma migrate dev
  npm run dev
  ```
- **Environment Variables:** Document all required vars
- **API Documentation:** Link to `/docs` endpoint
- **Docker Usage:**
  ```bash
  docker-compose up -d
  ```
- **Database Migrations:**
  ```bash
  npx prisma migrate dev --name init
  ```
- **Testing:**
  ```bash
  npm test
  ```
- **Auth Flow Explanation:**
  - Registration flow diagram
  - Login flow diagram
  - Token refresh flow
  - Password reset flow
- **Example cURL Requests:**
  ```bash
  # Register
  curl -X POST http://localhost:3000/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"SecurePass123"}'

  # Login
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"SecurePass123"}'

  # Get matches (protected)
  curl -X GET http://localhost:3000/matches \
    -H "Authorization: Bearer <accessToken>"
  ```
- **Mobile Developer Integration Guide:**
  - How to use Swagger docs
  - Token storage recommendations
  - Error handling examples
  - Refresh token rotation explanation

---

## 14. Acceptance Criteria

### 14.1 Authentication
- [x] User can register with email/password
- [x] User can login and receive access + refresh tokens
- [x] User can refresh access token using refresh token
- [x] User can logout (revoke refresh token)
- [x] User can request password reset
- [x] User can reset password with token
- [x] User can verify email address
- [x] Passwords are hashed with argon2id
- [x] Refresh tokens are rotated on use
- [x] All refresh tokens revoked on password change
- [x] Rate limiting applied to auth routes
- [x] Uniform error messages (no user enumeration)

### 14.2 Protected Routes
- [x] Access token required for `/me` and `/matches/*` and `/insights/*`
- [x] Invalid/expired tokens return 401
- [x] Token verification middleware works correctly

### 14.3 Dummy Data Endpoints
- [x] `GET /matches` returns realistic match list
- [x] `GET /matches/:id` returns detailed match prediction
- [x] `GET /insights/accuracy` returns accuracy trend data
- [x] `GET /insights/top-teams` returns team rankings
- [x] `GET /insights/confidence-distribution` returns confidence stats
- [x] All responses have consistent structure
- [x] Data matches mobile app screen designs

### 14.4 Documentation
- [x] Swagger docs accessible at `/docs`
- [x] All endpoints documented with examples
- [x] README includes setup instructions
- [x] README includes auth flow explanations
- [x] README includes cURL examples
- [x] Environment variables documented

### 14.5 Security
- [x] CORS configured correctly
- [x] Rate limiting enforced
- [x] Security headers set
- [x] No sensitive data in logs
- [x] Error messages don't leak system info
- [x] Input validation on all endpoints

### 14.6 Infrastructure
- [x] Dockerfile builds successfully
- [x] Docker Compose works for local dev
- [x] Health check endpoint returns 200
- [x] Database migrations work
- [x] App can be deployed to Coolify
- [x] Environment variables injected via .env

---

## 15. Future Enhancements (Stage 2+)

### 15.1 Authentication
- [ ] Google OAuth integration
- [ ] Apple Sign In
- [ ] Two-factor authentication (2FA)
- [ ] Session management dashboard
- [ ] Device management (view/revoke sessions)
- [ ] Account deletion

### 15.2 Real Predictions
- [ ] Integrate real football data API (e.g., Football-Data.org, API-Football)
- [ ] Implement actual AI/ML prediction engine
- [ ] Store predictions in database
- [ ] Track prediction accuracy over time
- [ ] Real-time match updates via WebSocket
- [ ] Push notifications for match start/results

### 15.3 Features
- [ ] User preferences (favorite teams, leagues)
- [ ] Bookmarking matches
- [ ] Prediction history
- [ ] Social features (share predictions)
- [ ] Premium subscription tiers
- [ ] Admin dashboard

### 15.4 Infrastructure
- [ ] Redis for rate limiting and caching
- [ ] Message queue for background jobs (email sending)
- [ ] CDN for static assets
- [ ] Monitoring and alerting (Sentry, DataDog)
- [ ] Automated backups
- [ ] CI/CD pipeline

---

## 16. Mobile Developer Handoff

### 16.1 What Mobile Developer Needs
- Base URL (local: `http://192.168.x.x:3000`, production: `https://api.yourdomain.com`)
- Swagger documentation URL: `/docs`
- Example tokens for testing
- Error response format
- Token refresh strategy
- Assets: Team logos (provide CDN URLs or use placeholder service)

### 16.2 Integration Checklist for Mobile Team
- [ ] Install secure storage library (expo-secure-store or react-native-keychain)
- [ ] Implement token storage in secure storage
- [ ] Implement auto token refresh on 401
- [ ] Handle rate limit errors (429)
- [ ] Implement retry logic with exponential backoff
- [ ] Add loading states for API calls
- [ ] Display appropriate error messages
- [ ] Test offline scenarios

### 16.3 Communication Protocol
- API changes will be communicated via Slack/Discord
- Breaking changes will be versioned (e.g., `/v2/matches`)
- Swagger docs are source of truth
- Report issues via GitHub Issues with request/response examples

---

## 17. Glossary

- **Access Token:** Short-lived JWT used to authenticate API requests (15 min TTL)
- **Refresh Token:** Long-lived JWT used to obtain new access tokens (30 day TTL)
- **Token Rotation:** Security practice of issuing new refresh token on each use
- **argon2id:** Memory-hard password hashing algorithm resistant to attacks
- **xG (Expected Goals):** Statistical measure of goal-scoring chance quality
- **AI Confidence:** System's confidence in prediction (High/Medium/Low)
- **JWT Claims:** Data embedded in token (sub=userId, exp=expiry, etc.)

---

## 18. Contact & Support

- **Project Manager:** [Name]
- **Backend Lead:** [Name]
- **Mobile Lead:** [Name]
- **GitHub Repo:** `https://github.com/yourusername/preditcion-ai-backend`
- **API Docs:** `https://api.yourdomain.com/docs`
- **Support Channel:** Slack #football-prediction-api

---

**Document Version:** 1.0.0
**Last Updated:** November 7, 2025
**Status:** Ready for Development
