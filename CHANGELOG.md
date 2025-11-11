# Backend Updates - November 11, 2025

## Summary
Implemented 7 major improvements to the Football Prediction API + database population script for dummy match data.

---

## ✅ Database Population Script

Created `scripts/populate-dummy-data.ts` to populate the database with realistic match data instead of using dummy mode.

### What it does:
- Creates 17 Premier League teams with logos
- Creates 11 matches:
  - 2 live matches (Leicester vs Everton, Wolves vs Palace)
  - 5 upcoming matches (Man Utd vs Liverpool, Man City vs Arsenal, etc.)
  - 4 finished matches with results
- Creates AI predictions for all matches with:
  - Win/Draw probabilities
  - AI confidence level
  - Detailed analysis
  - Quick stats (recent form, goals, injuries, head-to-head)

### Usage:
```bash
npm run populate
```

### Why:
- No need for dummy mode anymore
- Real database queries for better testing
- Predictions properly stored and accessible
- Saved matches work correctly with full prediction data

---

## 1. ✅ Forgot Password Token Update

### Changed:
- Token length: **64 characters → 6 digits**
- Token type: Hex string → Numeric code
- Expiration: 30 minutes → **15 minutes**

### Implementation:
- Updated `auth.service.ts` line 193: `Math.floor(100000 + Math.random() * 900000).toString()`
- Users now receive a simple 6-digit code via email (e.g., `123456`)

### API Changes:
**No changes to existing endpoints**
- `POST /auth/forgot-password` - still works the same
- `POST /auth/reset-password` - now accepts 6-digit token

---

## 2. ✅ Verify Reset Token Endpoint

### New Endpoint:
```
POST /auth/verify-reset-token
Body: { "token": "123456" }
Response: { "message": "Reset code is valid", "valid": true }
```

### Purpose:
- Separate token verification before showing password input screen
- Frontend flow:
  1. User requests reset code
  2. User enters code → **verify token** ✓
  3. If valid, show new password input
  4. User submits code + new password → reset password

### Implementation:
- Service: `auth.service.ts` - `verifyResetToken()`
- Controller: `auth.controller.ts` - `verifyResetToken()`
- Route: `auth.routes.ts` line 188

---

## 3. ✅ Email Verification Required for Login

### Changed:
- Users **MUST verify email** before logging in
- Returns `403` error if email not verified

### Error Response:
```json
{
  "error": "Forbidden",
  "message": "Please verify your email before logging in",
  "statusCode": 403
}
```

### Implementation:
- Updated `auth.service.ts` line 76-79
- Check added in `login()` method after password verification

---

## 4. ✅ Live & Upcoming Matches in Dummy Data

### Added:
- **2 Live Matches** (in progress, with current scores)
- **5 Upcoming Matches** (future dates)
- **4 Finished Matches** (past results)

### Total: 11 matches with different statuses

### Match Statuses:
- `live` - Currently playing (with scores)
- `upcoming` - Not started yet
- `finished` - Completed matches

### Filter by status:
```
GET /matches?status=live
GET /matches?status=upcoming
GET /matches?status=finished
```

### Implementation:
- Updated `src/data/matches.dummy.ts`
- Added complete prediction data for all new matches

---

## 5-7. ✅ Saved Matches Feature

### Database Schema:
New table: `SavedMatch`
```prisma
model SavedMatch {
  id        String   @id @default(uuid())
  userId    String
  matchId   String
  teamId    String?   // Optional: which team user supports
  notes     String?   // Optional: personal notes
  createdAt DateTime @default(now())

  @@unique([userId, matchId])
}
```

### New Endpoints:

#### Save a Match
```
POST /saved-matches
Authorization: Bearer <token>
Body: {
  "matchId": "uuid",
  "teamId": "uuid",     // optional
  "notes": "string"     // optional
}
```

#### Unsave a Match
```
DELETE /saved-matches/:matchId
Authorization: Bearer <token>
```

#### Get All Saved Matches
```
GET /saved-matches
Authorization: Bearer <token>
Query params:
  - status: "upcoming" | "live" | "finished"
```

#### Check if Match is Saved
```
GET /saved-matches/:matchId/check
Authorization: Bearer <token>
Response: {
  "saved": true/false,
  "savedAt": "2025-11-10T..."
}
```

### Implementation:
- Service: `src/services/saved-match.service.ts`
- Controller: `src/controllers/saved-match.controller.ts`
- Routes: `src/routes/saved-match.routes.ts`
- Added to `app.ts` as `/saved-matches`

### Fix for Dummy Data Support:
- Created migration `20251110224416_drop_saved_matches_fk` to drop FK constraints
- Allows saving matches with dummy data IDs (e.g., "match-live-1")
- Foreign keys on `matchId` and `teamId` removed to support both dummy and database modes

---

## 8. ✅ User Stats for Profile Page

### Database Schema:
New table: `UserStats`
```prisma
model UserStats {
  id                    String    @id @default(uuid())
  userId                String    @unique

  // Prediction Statistics
  totalPredictions      Int       @default(0)
  correctPredictions    Int       @default(0)
  wrongPredictions      Int       @default(0)
  accuracyRate          Float     @default(0)

  // Streak Tracking
  currentStreak         Int       @default(0)
  longestStreak         Int       @default(0)

  // Activity
  totalMatchesWatched   Int       @default(0)
  lastPredictionAt      DateTime?
  lastActive            DateTime  @default(now())
}
```

### New Endpoint:
```
GET /stats
Authorization: Bearer <token>
```

### Response:
```json
{
  "totalPredictions": 45,
  "correctPredictions": 32,
  "wrongPredictions": 13,
  "accuracyRate": 71.11,
  "currentStreak": 5,
  "longestStreak": 12,
  "totalMatchesWatched": 78,
  "savedMatchesCount": 8,
  "lastPredictionAt": "2025-11-09T...",
  "lastActive": "2025-11-10T..."
}
```

### Implementation:
- Service: `src/services/user-stats.service.ts`
- Controller: `src/controllers/user-stats.controller.ts`
- Routes: `src/routes/user-stats.routes.ts`
- Added to `app.ts` as `/stats`

### Auto-initialization:
- Stats automatically created on first access
- Updates automatically when user makes predictions

---

## Profile Picture Decision
**Recommendation: Remove from design**
- Not implemented in this update
- Would require file upload, storage (S3), and image processing
- Can be added later if needed

---

## Migration Instructions

### 1. Generate Prisma Client:
```bash
npx prisma generate
```

### 2. Create and Run Migration:
```bash
npx prisma migrate dev --name add_saved_matches_and_user_stats
```

### 3. Build Project:
```bash
npm run build
```

### 4. Deploy:
```bash
./deploy.sh
```

---

## API Documentation

All new endpoints are documented in Swagger:
- Visit: `https://decentralabs.tech/docs`
- New sections:
  - **Saved Matches** - All save/unsave endpoints
  - **User Stats** - Profile statistics endpoint

---

## Testing

### Test Saved Matches:
```bash
# Save a match
curl -X POST https://decentralabs.tech/saved-matches \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"matchId": "match-1"}'

# Get saved matches
curl -X GET https://decentralabs.tech/saved-matches \
  -H "Authorization: Bearer YOUR_TOKEN"

# Unsave a match
curl -X DELETE https://decentralabs.tech/saved-matches/match-1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test User Stats:
```bash
curl -X GET https://decentralabs.tech/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Password Reset Flow:
```bash
# 1. Request reset code
curl -X POST https://decentralabs.tech/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# 2. Verify code
curl -X POST https://decentralabs.tech/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{"token": "123456"}'

# 3. Reset password
curl -X POST https://decentralabs.tech/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "123456", "newPassword": "newpass123"}'
```

---

## Breaking Changes

### ⚠️ Email Verification Now Required
- Existing users without verified emails **CANNOT log in**
- Solution: Manually verify emails in database OR send verification emails

```sql
-- Manually verify all existing users (if needed)
UPDATE users SET "emailVerified" = true WHERE "emailVerified" = false;
```

---

## Files Changed

### New Files:
- `src/services/saved-match.service.ts`
- `src/services/user-stats.service.ts`
- `src/controllers/saved-match.controller.ts`
- `src/controllers/user-stats.controller.ts`
- `src/routes/saved-match.routes.ts`
- `src/routes/user-stats.routes.ts`

### Modified Files:
- `prisma/schema.prisma` - Added SavedMatch and UserStats models
- `src/services/auth.service.ts` - Token update, email verification
- `src/controllers/auth.controller.ts` - New verify token endpoint
- `src/routes/auth.routes.ts` - New verify token route
- `src/data/matches.dummy.ts` - Added live and finished matches
- `src/app.ts` - Registered new routes

---

## Next Steps

1. **Run migration** on production database
2. **Test all endpoints** in Swagger docs
3. **Update frontend** to use new endpoints
4. **Decide on profile picture** feature (keep or remove from design)

---

## Questions?

Contact the backend team for any issues or clarifications.
