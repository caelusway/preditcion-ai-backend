# RapidAPI Football Data Integration

## Current Status

✅ **Completed:**
- Database schema updated with Team, Match, Prediction, and MatchStatistics models
- Environment configuration added for RapidAPI credentials
- Football API client service created with flexible structure
- Your API key is configured: `3eb0a31361msh611b0096397e873p1ce3ccjsn4c683fbe9e40`

⏳ **Next Steps:**
We need to identify the correct API endpoints from your RapidAPI subscription.

## What We Need From You

### 1. Find Available Endpoints

Please go to your RapidAPI dashboard:
1. Visit: https://rapidapi.com/fluis.lacasse/api/free-api-live-football-data
2. Look for the **Endpoints** tab
3. Share screenshots or list of available endpoints

### 2. Key Endpoints We're Looking For

We need endpoints that provide:

- ✅ **Seasons** - Already working: `/football-league-all-seasons`
- ❓ **Matches/Fixtures** - Get upcoming and past matches
  - Likely something like: `/football-matches`, `/football-fixtures`, `/football-league-matches`
- ❓ **Teams** - Get team information
  - Likely: `/football-team`, `/football-teams`, `/football-league-teams`
- ❓ **Match Statistics** - Detailed match stats
  - Likely: `/football-match-stats`, `/football-match-details`
- ❓ **Team Form** - Recent team results
- ❓ **Head-to-Head** - Historical matches between two teams

### 3. Testing Endpoints

Once you identify endpoints, test them using curl:

```bash
# Example pattern:
curl --request GET \
  --url 'https://free-api-live-football-data.p.rapidapi.com/ENDPOINT_NAME?param=value' \
  --header 'x-rapidapi-host: free-api-live-football-data.p.rapidapi.com' \
  --header 'x-rapidapi-key: 3eb0a31361msh611b0096397e873p1ce3ccjsn4c683fbe9e40'
```

## Common RapidAPI Football Endpoint Patterns

Based on typical football APIs, try these patterns:

```bash
# Get league matches
curl --request GET \
  --url 'https://free-api-live-football-data.p.rapidapi.com/football-league-matches?leagueid=2&season=2024/2025' \
  --header 'x-rapidapi-host: free-api-live-football-data.p.rapidapi.com' \
  --header 'x-rapidapi-key: 3eb0a31361msh611b0096397e873p1ce3ccjsn4c683fbe9e40'

# Get today's matches
curl --request GET \
  --url 'https://free-api-live-football-data.p.rapidapi.com/football-matches-today' \
  --header 'x-rapidapi-host: free-api-live-football-data.p.rapidapi.com' \
  --header 'x-rapidapi-key: 3eb0a31361msh611b0096397e873p1ce3ccjsn4c683fbe9e40'

# Get team info
curl --request GET \
  --url 'https://free-api-live-football-data.p.rapidapi.com/football-team?teamid=33' \
  --header 'x-rapidapi-host: free-api-live-football-data.p.rapidapi.com' \
  --header 'x-rapidapi-key: 3eb0a31361msh611b0096397e873p1ce3ccjsn4c683fbe9e40'
```

## League IDs (Common)

If the API uses league IDs, these are typically:
- **Premier League (England)**: 39 or 2
- **La Liga (Spain)**: 140 or 3
- **Serie A (Italy)**: 135 or 4
- **Bundesliga (Germany)**: 78 or 5
- **Ligue 1 (France)**: 61 or 6

## Once We Have Endpoints

After you share the working endpoints, I'll:
1. Update `football-api.service.ts` with correct endpoints
2. Create `match-sync.service.ts` to fetch and store data
3. Update match controllers to use real database data
4. Add cron jobs for automatic data synchronization
5. Test the complete integration

## Database Structure

The database is ready with these tables:
- `teams` - Store team information
- `matches` - Store match fixtures and results
- `predictions` - Store AI predictions
- `match_statistics` - Store detailed match stats

## Configuration

Your `.env` file is configured with:
```env
RAPIDAPI_KEY=3eb0a31361msh611b0096397e873p1ce3ccjsn4c683fbe9e40
RAPIDAPI_HOST=free-api-live-football-data.p.rapidapi.com
FOOTBALL_DATA_SOURCE=api
```

To switch back to dummy data temporarily, change:
```env
FOOTBALL_DATA_SOURCE=dummy
```

## Questions?

If you need help finding the endpoints or testing the API, let me know!
