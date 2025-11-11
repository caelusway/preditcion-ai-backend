import { prisma } from '../src/lib/prisma';
import { dummyMatches, dummyPredictions } from '../src/data/matches.dummy';

async function populateDummyData() {
  console.log('🌱 Starting to populate dummy data...');

  try {
    // First, create teams
    const teams = new Map<string, any>();

    for (const match of dummyMatches) {
      // Home team
      if (!teams.has(match.homeTeam.id)) {
        const homeTeam = await prisma.team.upsert({
          where: { id: match.homeTeam.id },
          update: {},
          create: {
            id: match.homeTeam.id,
            name: match.homeTeam.name,
            logoUrl: match.homeTeam.logoUrl,
            country: 'England',
            league: 'Premier League',
          },
        });
        teams.set(match.homeTeam.id, homeTeam);
        console.log(`✅ Created team: ${homeTeam.name}`);
      }

      // Away team
      if (!teams.has(match.awayTeam.id)) {
        const awayTeam = await prisma.team.upsert({
          where: { id: match.awayTeam.id },
          update: {},
          create: {
            id: match.awayTeam.id,
            name: match.awayTeam.name,
            logoUrl: match.awayTeam.logoUrl,
            country: 'England',
            league: 'Premier League',
          },
        });
        teams.set(match.awayTeam.id, awayTeam);
        console.log(`✅ Created team: ${awayTeam.name}`);
      }
    }

    console.log(`\n📊 Created ${teams.size} teams`);

    // Create matches
    for (const match of dummyMatches) {
      const createdMatch = await prisma.match.upsert({
        where: { id: match.id },
        update: {
          status: match.status,
          homeScore: match.homeScore || null,
          awayScore: match.awayScore || null,
        },
        create: {
          id: match.id,
          homeTeamId: match.homeTeam.id,
          awayTeamId: match.awayTeam.id,
          kickoffTime: new Date(match.kickoffTime),
          status: match.status,
          homeScore: match.homeScore || null,
          awayScore: match.awayScore || null,
          venue: 'Stadium',
          league: 'Premier League',
          season: '2025',
          round: 'Regular Season',
        },
      });

      console.log(`✅ Created match: ${match.homeTeam.name} vs ${match.awayTeam.name} (${match.status})`);

      // Create prediction for this match
      const predictionData = dummyPredictions[match.id] || dummyPredictions[match.predictionId];

      if (predictionData) {
        // Check if prediction already exists
        const existingPrediction = await prisma.prediction.findFirst({
          where: {
            matchId: match.id,
            userId: null,
          },
        });

        if (!existingPrediction) {
          await prisma.prediction.create({
            data: {
              matchId: match.id,
              userId: null, // AI prediction
              homeWinProbability: predictionData.homeWinProbability,
              drawProbability: predictionData.drawProbability,
              awayWinProbability: predictionData.awayWinProbability,
              confidence: predictionData.aiConfidence,
              reasoning: predictionData.aiAnalysis,
              factors: predictionData.quickStats,
            },
          });
          console.log(`   📈 Created prediction for match`);
        } else {
          console.log(`   ⏭️  Prediction already exists, skipping`);
        }
      }
    }

    console.log('\n✅ Successfully populated all dummy data!');
    console.log(`   - ${teams.size} teams`);
    console.log(`   - ${dummyMatches.length} matches`);
    console.log(`   - ${Object.keys(dummyPredictions).length} predictions`);

  } catch (error) {
    console.error('❌ Error populating data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

populateDummyData();
