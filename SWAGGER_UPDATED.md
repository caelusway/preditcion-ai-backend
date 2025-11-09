# Swagger API Documentation Updated

## Changes Made

### Updated Schemas

1. **User Schema** - Added new fields:
   - `name` (string, nullable)
   - `surname` (string, nullable)

2. **New Schema: Team**
   - Complete team information with logo URLs
   - API ID references
   - League and country information

3. **New Schema: Match**
   - Full match details with home/away teams
   - Kickoff time, status, scores
   - Venue and referee information
   - Season and round details

4. **New Schema: Standing**
   - League table position and points
   - Win/Draw/Loss records (overall + home/away)
   - Goals for/against statistics
   - Form strings (e.g., "WWWWW")
   - Champions League/Relegation descriptions

5. **New Schema: PlayerStats**
   - Player personal info (name, age, nationality, photo)
   - Position and team
   - Appearance statistics
   - Goals, assists, shots statistics
   - Match ratings

6. **New Schema: Prediction**
   - Win/Draw/Loss probabilities
   - Predicted scores
   - Confidence level
   - AI reasoning and model used

### New API Tags

Added three new tags for better organization:

- **Standings** - League standings and table endpoints
- **Players** - Player statistics endpoints
- **Teams** - Team information endpoints

### View Documentation

Access the updated Swagger documentation at:
```
http://localhost:3000/api-docs
```

Or in production:
```
https://your-domain.com/api-docs
```

## Recommended New Endpoints to Document

Based on the new data models, these endpoints should be created and documented:

### Standings Endpoints

```yaml
GET /api/standings
  - Get full Premier League table
  - Response: Array of Standing objects
  - Query params: ?season=2023

GET /api/standings/top/:n
  - Get top N teams (e.g., top 4 for Champions League)
  - Response: Array of Standing objects

GET /api/standings/relegation
  - Get bottom 3 teams in relegation zone
  - Response: Array of Standing objects
```

### Players Endpoints

```yaml
GET /api/players/top-scorers
  - Get leading goal scorers
  - Query params: ?limit=10&season=2023
  - Response: Array of PlayerStats objects

GET /api/players/top-assists
  - Get leading assist providers
  - Query params: ?limit=10&season=2023
  - Response: Array of PlayerStats objects

GET /api/players/:playerId
  - Get specific player statistics
  - Response: PlayerStats object
```

### Teams Endpoints

```yaml
GET /api/teams
  - Get all Premier League teams
  - Response: Array of Team objects

GET /api/teams/:teamId
  - Get specific team details
  - Response: Team object with standings and top players

GET /api/teams/:teamId/players
  - Get all players for a team
  - Response: Array of PlayerStats objects
```

### Enhanced Match Endpoints

```yaml
GET /api/matches/:matchId
  - Should now include team standings and form
  - Enhanced with team positions in league

GET /api/matches/:matchId/prediction
  - AI prediction using standings + player stats
  - More context for better predictions
```

## Example Swagger Annotations

Here's how to document the new endpoints:

### Standings Route Example

```typescript
/**
 * @swagger
 * /api/standings:
 *   get:
 *     tags:
 *       - Standings
 *     summary: Get Premier League standings
 *     parameters:
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *           default: "2023"
 *         description: Season year
 *     responses:
 *       200:
 *         description: League standings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Standing'
 */
router.get('/', standingsController.getStandings);
```

### Players Route Example

```typescript
/**
 * @swagger
 * /api/players/top-scorers:
 *   get:
 *     tags:
 *       - Players
 *     summary: Get top goal scorers
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of players to return
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *           default: "2023"
 *         description: Season year
 *     responses:
 *       200:
 *         description: Top scorers list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PlayerStats'
 */
router.get('/top-scorers', playersController.getTopScorers);
```

## Testing the Documentation

1. Start your server:
```bash
npm run dev
```

2. Open Swagger UI:
```
http://localhost:3000/api-docs
```

3. Verify:
   - ✅ All schemas visible in "Schemas" section
   - ✅ New tags (Standings, Players, Teams) appear
   - ✅ User schema includes name/surname
   - ✅ All data types and examples correct

## Interactive API Testing

Users can now test API endpoints directly from Swagger UI:

1. Click "Authorize" button
2. Enter JWT token from login
3. Try out endpoints with "Try it out" button
4. See request/response examples

## Mobile App Integration

Mobile developers can:

1. **View API Contract**: See all available endpoints and data structures
2. **Generate Types**: Use Swagger spec to auto-generate TypeScript interfaces
3. **Test Endpoints**: Try endpoints before implementing in mobile app
4. **Copy Examples**: Use example requests/responses for development

## Export OpenAPI Spec

The API specification is available in OpenAPI 3.0 format at:
```
http://localhost:3000/api-docs.json
```

This can be:
- Imported into Postman
- Used with code generators (openapi-generator)
- Shared with frontend developers
- Used for contract testing

---

**Status**: ✅ Swagger Documentation Updated

All schemas and tags are ready. Next step is to create the actual controller/route files for standings and players endpoints.
