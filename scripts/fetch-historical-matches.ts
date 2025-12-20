import { footballAPIService } from '../src/services/football-api.service';
import { prisma } from '../src/lib/prisma';
import { logger } from '../src/lib/logger';
import { env } from '../src/config/env';

/**
 * Fetch historical finished matches from Top 5 European leagues
 * This will populate the database with more matches for backtesting
 */

const TOP_5_LEAGUES = [39, 140, 135, 78, 61]; // PL, La Liga, Serie A, Bundesliga, Ligue 1

const LEAGUE_NAMES: Record<number, string> = {
  39: 'Premier League',
  140: 'La Liga',
  135: 'Serie A',
  78: 'Bundesliga',
  61: 'Ligue 1',
};

// Current season (2024-2025 = 2024)
const CURRENT_SEASON = 2024;

/**
 * Fetch fixtures for a specific date using correct season
 */
async function fetchFixturesForDate(date: string): Promise<any[]> {
  const allFixtures: any[] = [];

  for (const leagueId of TOP_5_LEAGUES) {
    try {
      // @ts-ignore - accessing private method for custom season
      const fixtures = await (footballAPIService as any).get('/fixtures', {
        date,
        league: leagueId.toString(),
        season: CURRENT_SEASON.toString(),
      });
      allFixtures.push(...fixtures);
    } catch (error) {
      // Silently continue if a league fails
    }
  }

  return allFixtures;
}

async function fetchHistoricalMatches(daysBack: number = 30): Promise<void> {
  if (env.FOOTBALL_DATA_SOURCE !== 'api') {
    console.log('⚠️  FOOTBALL_DATA_SOURCE is not set to "api". Set it in .env file.');
    return;
  }

  console.log(`\n🚀 Fetching historical matches from 2024-2025 season...\n`);

  // For 2024-2025 season, fetch from actual past dates
  // Season started around August 2024, we'll fetch from September 2024 to December 2024
  const endDate = new Date('2024-12-15'); // End of 2024 calendar year
  const startDate = new Date('2024-12-15');
  startDate.setDate(startDate.getDate() - daysBack);

  let totalFetched = 0;
  let totalSaved = 0;
  let totalSkipped = 0;

  // Process each date
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    console.log(`\n📅 Processing ${dateStr}...`);

    try {
      // Use direct API call with correct season (2024 for 2024-2025 season)
      const fixtures = await fetchFixturesForDate(dateStr);

      // Filter finished matches only
      const finishedMatches = fixtures.filter(f => {
        const status = f.fixture?.status?.short;
        return status === 'FT' || status === 'AET' || status === 'PEN';
      });

      console.log(`   Found ${finishedMatches.length} finished matches`);
      totalFetched += finishedMatches.length;

      for (const fixture of finishedMatches) {
        try {
          // Check if teams exist, create if not
          const homeTeamApiId = fixture.teams.home.id.toString();
          const awayTeamApiId = fixture.teams.away.id.toString();
          const leagueId = fixture.league.id;

          let homeTeam = await prisma.team.findUnique({
            where: { apiId: homeTeamApiId },
          });

          if (!homeTeam) {
            homeTeam = await prisma.team.create({
              data: {
                apiId: homeTeamApiId,
                name: fixture.teams.home.name,
                logoUrl: fixture.teams.home.logo,
                country: fixture.league.country,
                league: LEAGUE_NAMES[leagueId] || fixture.league.name,
              },
            });
            console.log(`   ➕ Created team: ${homeTeam.name}`);
          }

          let awayTeam = await prisma.team.findUnique({
            where: { apiId: awayTeamApiId },
          });

          if (!awayTeam) {
            awayTeam = await prisma.team.create({
              data: {
                apiId: awayTeamApiId,
                name: fixture.teams.away.name,
                logoUrl: fixture.teams.away.logo,
                country: fixture.league.country,
                league: LEAGUE_NAMES[leagueId] || fixture.league.name,
              },
            });
            console.log(`   ➕ Created team: ${awayTeam.name}`);
          }

          // Check if match already exists
          const existingMatch = await prisma.match.findUnique({
            where: { apiId: fixture.fixture.id.toString() },
          });

          if (existingMatch) {
            totalSkipped++;
            continue;
          }

          // Create match
          await prisma.match.create({
            data: {
              apiId: fixture.fixture.id.toString(),
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              kickoffTime: new Date(fixture.fixture.date),
              status: 'finished',
              homeScore: fixture.goals.home ?? 0,
              awayScore: fixture.goals.away ?? 0,
              venue: fixture.fixture.venue?.name || null,
              referee: fixture.fixture.referee || null,
              league: LEAGUE_NAMES[leagueId] || fixture.league.name,
              season: fixture.league.season?.toString() || '2024',
              round: fixture.league.round || null,
              externalData: fixture as any,
            },
          });

          totalSaved++;
          console.log(`   ✅ ${fixture.teams.home.name} ${fixture.goals.home}-${fixture.goals.away} ${fixture.teams.away.name}`);

        } catch (matchError) {
          console.error(`   ❌ Error saving match:`, matchError);
        }
      }

      // Small delay to avoid API rate limits
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (dateError) {
      console.error(`   ❌ Error fetching fixtures for ${dateStr}:`, dateError);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`   Total matches found: ${totalFetched}`);
  console.log(`   New matches saved: ${totalSaved}`);
  console.log(`   Skipped (already exist): ${totalSkipped}`);
  console.log('='.repeat(60) + '\n');
}

async function main() {
  const daysArg = process.argv[2];
  const days = daysArg ? parseInt(daysArg, 10) : 45; // Default 45 days

  if (isNaN(days) || days < 1 || days > 365) {
    console.error('Usage: npm run sync:history [days]');
    console.error('  days: Number of days to fetch (1-365, default: 45)');
    process.exit(1);
  }

  try {
    await fetchHistoricalMatches(days);
    console.log('✅ Historical match fetch completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to fetch historical matches:', error);
    process.exit(1);
  }
}

main();
