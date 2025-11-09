import { matchSyncService } from '../src/services/match-sync.service';
import { logger } from '../src/lib/logger';

/**
 * Sync Premier League 2024-2025 season data from API-Football
 *
 * Usage:
 *   npm run sync              - Full sync (teams + 50 finished + 20 upcoming fixtures)
 *   npm run sync:teams        - Sync teams only
 *   npm run sync:fixtures     - Sync fixtures only
 */

async function main() {
  const command = process.argv[2] || 'full';

  try {
    console.log('🚀 Starting Football Data Sync for Premier League 2024-2025...\n');

    switch (command) {
      case 'teams':
        console.log('📋 Syncing teams...');
        await matchSyncService.syncTeams();
        break;

      case 'fixtures':
        console.log('⚽ Syncing fixtures...');
        await matchSyncService.syncFixtures(undefined, 100);
        break;

      case 'full':
      default:
        console.log('🔄 Running full sync...\n');
        await matchSyncService.fullSync(50);
        break;
    }

    console.log('\n✅ Sync completed successfully!');
    console.log('\n📊 Next steps:');
    console.log('  - View data: npm run prisma:studio');
    console.log('  - Check logs above for details');
    console.log('  - Test API endpoints with your mobile app\n');

    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Sync failed');
    console.error('\n❌ Sync failed:', error);
    console.error('\nTroubleshooting:');
    console.error('  - Check your API key in .env');
    console.error('  - Verify FOOTBALL_DATA_SOURCE=api in .env');
    console.error('  - Check API quota: https://dashboard.api-football.com/\n');
    process.exit(1);
  }
}

main();
