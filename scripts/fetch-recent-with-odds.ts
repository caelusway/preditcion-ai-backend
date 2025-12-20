import { footballAPIService, TOP_5_LEAGUES } from '../src/services/football-api.service';
import { prisma } from '../src/lib/prisma';
import { env } from '../src/config/env';

const LEAGUE_NAMES: Record<number, string> = {
  39: 'Premier League',
  140: 'La Liga', 
  135: 'Serie A',
  78: 'Bundesliga',
  61: 'Ligue 1',
};

async function fetchFixturesForDateRange(startDate: string, endDate: string): Promise<void> {
  console.log(`\n🚀 Fetching matches from ${startDate} to ${endDate}\n`);
  
  let totalMatches = 0;
  let totalOdds = 0;
  
  // Generate dates
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  
  for (const date of dates) {
    console.log(`\n📅 Processing ${date}...`);
    
    for (const leagueId of TOP_5_LEAGUES) {
      try {
        // Fetch fixtures for this date and league
        // @ts-ignore
        const fixtures = await (footballAPIService as any).get('/fixtures', {
          date,
          league: leagueId.toString(),
          season: '2024',
        });
        
        const finishedFixtures = fixtures.filter((f: any) => {
          const status = f.fixture?.status?.short;
          return status === 'FT' || status === 'AET' || status === 'PEN';
        });
        
        if (finishedFixtures.length === 0) continue;
        
        console.log(`   ${LEAGUE_NAMES[leagueId]}: ${finishedFixtures.length} finished matches`);
        
        for (const fixture of finishedFixtures) {
          try {
            const homeTeamApiId = fixture.teams.home.id.toString();
            const awayTeamApiId = fixture.teams.away.id.toString();
            
            // Find or create teams
            let homeTeam = await prisma.team.findUnique({ where: { apiId: homeTeamApiId } });
            if (!homeTeam) {
              homeTeam = await prisma.team.create({
                data: {
                  apiId: homeTeamApiId,
                  name: fixture.teams.home.name,
                  logoUrl: fixture.teams.home.logo,
                  country: fixture.league.country,
                  league: LEAGUE_NAMES[leagueId],
                },
              });
            }
            
            let awayTeam = await prisma.team.findUnique({ where: { apiId: awayTeamApiId } });
            if (!awayTeam) {
              awayTeam = await prisma.team.create({
                data: {
                  apiId: awayTeamApiId,
                  name: fixture.teams.away.name,
                  logoUrl: fixture.teams.away.logo,
                  country: fixture.league.country,
                  league: LEAGUE_NAMES[leagueId],
                },
              });
            }
            
            // Fetch odds for this fixture
            const fixtureId = fixture.fixture.id;
            let oddsData = null;
            try {
              oddsData = await footballAPIService.getFixtureOdds(fixtureId);
              if (oddsData?.bookmakers?.[0]) {
                totalOdds++;
              }
            } catch (e) {
              // Odds not available
            }
            
            // Save match with odds
            const externalDataWithOdds = {
              ...fixture,
              odds: oddsData,
            };
            
            await prisma.match.upsert({
              where: { apiId: fixtureId.toString() },
              update: {
                homeScore: fixture.goals.home ?? 0,
                awayScore: fixture.goals.away ?? 0,
                status: 'finished',
                externalData: externalDataWithOdds,
              },
              create: {
                apiId: fixtureId.toString(),
                homeTeamId: homeTeam.id,
                awayTeamId: awayTeam.id,
                kickoffTime: new Date(fixture.fixture.date),
                status: 'finished',
                homeScore: fixture.goals.home ?? 0,
                awayScore: fixture.goals.away ?? 0,
                venue: fixture.fixture.venue?.name || null,
                referee: fixture.fixture.referee || null,
                league: LEAGUE_NAMES[leagueId],
                season: '2024',
                round: fixture.league.round || null,
                externalData: externalDataWithOdds,
              },
            });
            
            totalMatches++;
            
            // Rate limit
            await new Promise(r => setTimeout(r, 200));
            
          } catch (err) {
            // Skip individual match errors
          }
        }
        
      } catch (err) {
        // Skip league errors
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total matches saved: ${totalMatches}`);
  console.log(`Matches with odds: ${totalOdds}`);
  console.log('='.repeat(50));
}

async function main() {
  if (env.FOOTBALL_DATA_SOURCE !== 'api') {
    console.log('⚠️  Set FOOTBALL_DATA_SOURCE=api in .env');
    return;
  }
  
  // Last 7 days
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  
  await fetchFixturesForDateRange(startStr, endStr);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
