import { footballAPIService, TOP_5_LEAGUES } from '../src/services/football-api.service';
import { prisma } from '../src/lib/prisma';
import { logger } from '../src/lib/logger';
import { env } from '../src/config/env';

const LEAGUE_NAMES: Record<number, string> = {
  39: 'Premier League',
  140: 'La Liga',
  135: 'Serie A',
  78: 'Bundesliga',
  61: 'Ligue 1',
};

const SEASON = 2024; // 2024-2025 season

async function fetchLeagueFixtures(leagueId: number): Promise<number> {
  console.log(`\n📊 Fetching ${LEAGUE_NAMES[leagueId]}...`);
  
  try {
    // @ts-ignore - accessing private method
    const fixtures = await (footballAPIService as any).get('/fixtures', {
      league: leagueId.toString(),
      season: SEASON.toString(),
    });
    
    console.log(`   Found ${fixtures.length} fixtures`);
    
    let saved = 0;
    for (const fixture of fixtures) {
      const status = fixture.fixture?.status?.short;
      const isFinished = status === 'FT' || status === 'AET' || status === 'PEN';
      
      if (!isFinished) continue;
      
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
        
        // Upsert match
        await prisma.match.upsert({
          where: { apiId: fixture.fixture.id.toString() },
          update: {
            homeScore: fixture.goals.home ?? 0,
            awayScore: fixture.goals.away ?? 0,
            status: 'finished',
            externalData: fixture as any,
          },
          create: {
            apiId: fixture.fixture.id.toString(),
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            kickoffTime: new Date(fixture.fixture.date),
            status: 'finished',
            homeScore: fixture.goals.home ?? 0,
            awayScore: fixture.goals.away ?? 0,
            venue: fixture.fixture.venue?.name || null,
            referee: fixture.fixture.referee || null,
            league: LEAGUE_NAMES[leagueId],
            season: SEASON.toString(),
            round: fixture.league.round || null,
            externalData: fixture as any,
          },
        });
        
        saved++;
      } catch (err) {
        // Skip errors for individual matches
      }
    }
    
    console.log(`   ✅ Saved ${saved} finished matches`);
    return saved;
  } catch (error) {
    console.error(`   ❌ Error: ${error}`);
    return 0;
  }
}

async function main() {
  if (env.FOOTBALL_DATA_SOURCE !== 'api') {
    console.log('⚠️  Set FOOTBALL_DATA_SOURCE=api in .env');
    return;
  }
  
  console.log('🚀 Fetching all Top 5 European League fixtures for 2024-2025 season\n');
  
  let totalSaved = 0;
  
  for (const leagueId of TOP_5_LEAGUES) {
    const saved = await fetchLeagueFixtures(leagueId);
    totalSaved += saved;
    
    // Rate limit delay
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 TOTAL: ${totalSaved} finished matches saved/updated`);
  console.log('='.repeat(50));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
