import { footballAPIService } from '../src/services/football-api.service';
import { prisma } from '../src/lib/prisma';
import { logger } from '../src/lib/logger';
import { env } from '../src/config/env';

/**
 * Fetch odds for historical matches that don't have odds data
 * API-Football provides pre-match odds for fixtures
 */

async function fetchOddsForMatch(apiId: string): Promise<any> {
  try {
    const odds = await footballAPIService.getFixtureOdds(parseInt(apiId));
    return odds;
  } catch (error) {
    return null;
  }
}

async function fetchHistoricalOdds(limit: number = 50): Promise<void> {
  if (env.FOOTBALL_DATA_SOURCE !== 'api') {
    console.log('⚠️  FOOTBALL_DATA_SOURCE is not set to "api". Set it in .env file.');
    return;
  }

  console.log(`\n🚀 Fetching odds for historical matches...\n`);

  // Get most recent finished matches (API only has odds for recent matches)
  const matches = await prisma.match.findMany({
    where: { status: 'finished' },
    orderBy: { kickoffTime: 'desc' }, // Most recent first - API only has recent odds
    take: limit,
    select: {
      id: true,
      apiId: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      externalData: true,
      kickoffTime: true,
    },
  });

  console.log(`Found ${matches.length} matches to check for odds\n`);

  let fetchedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const match of matches) {
    // Check if we already have odds in externalData
    const externalData = match.externalData as any;
    const hasOdds = externalData?.odds?.bookmakers?.length > 0;

    if (hasOdds) {
      skippedCount++;
      continue;
    }

    console.log(`📊 Fetching odds for: ${match.homeTeam.name} vs ${match.awayTeam.name} (${match.apiId})`);

    try {
      const odds = await fetchOddsForMatch(match.apiId);

      if (odds && odds.bookmakers && odds.bookmakers.length > 0) {
        // Update match with odds data
        const updatedExternalData = {
          ...externalData,
          odds: odds,
        };

        await prisma.match.update({
          where: { id: match.id },
          data: { externalData: updatedExternalData },
        });

        // Show first bookmaker's 1X2 odds
        const firstBookmaker = odds.bookmakers[0];
        const matchWinnerBet = firstBookmaker?.bets?.find(
          (b: any) => b.name.toLowerCase().includes('match winner') || b.name === 'Home/Away'
        );
        
        if (matchWinnerBet) {
          const homeOdd = matchWinnerBet.values.find((v: any) => v.value === 'Home')?.odd || '-';
          const drawOdd = matchWinnerBet.values.find((v: any) => v.value === 'Draw')?.odd || '-';
          const awayOdd = matchWinnerBet.values.find((v: any) => v.value === 'Away')?.odd || '-';
          console.log(`   ✅ Got odds: 1=${homeOdd} X=${drawOdd} 2=${awayOdd}`);
        } else {
          console.log(`   ✅ Got odds data (${odds.bookmakers.length} bookmakers)`);
        }

        fetchedCount++;
      } else {
        console.log(`   ⚠️  No odds available`);
        skippedCount++;
      }

      // Rate limiting - API allows 10 requests per minute on free tier
      await new Promise(resolve => setTimeout(resolve, 6500)); // ~9 requests per minute

    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`   Odds fetched: ${fetchedCount}`);
  console.log(`   Skipped (already had odds or none available): ${skippedCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log('='.repeat(60) + '\n');
}

async function main() {
  const limitArg = process.argv[2];
  const limit = limitArg ? parseInt(limitArg, 10) : 50;

  if (isNaN(limit) || limit < 1 || limit > 500) {
    console.error('Usage: npx tsx scripts/fetch-historical-odds.ts [limit]');
    console.error('  limit: Number of matches to fetch odds for (1-500, default: 50)');
    process.exit(1);
  }

  try {
    await fetchHistoricalOdds(limit);
    console.log('✅ Historical odds fetch completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to fetch historical odds:', error);
    process.exit(1);
  }
}

main();
