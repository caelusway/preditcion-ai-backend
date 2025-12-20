import { prisma } from '../src/lib/prisma';
import { predictionEngineService } from '../src/services/prediction/prediction-engine.service';
import * as fs from 'fs';
import path from 'path';

interface MatchWithOdds {
  id: string;
  apiId: string | null;
  homeTeam: { name: string };
  awayTeam: { name: string };
  homeScore: number | null;
  awayScore: number | null;
  kickoffTime: Date;
  league: string | null;
  venue: string | null;
  round: string | null;
  externalData: any;
}

// Gemini Free Tier: 15 RPM - use 5 second delay to be safe
const RATE_LIMIT_DELAY = 5000;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n🤖 Gemini 3 Pro Preview Backtest\n');
  console.log('='.repeat(50));
  console.log(`Model: gemini-3-pro-preview`);
  console.log(`Rate Limit: ${RATE_LIMIT_DELAY / 1000}s delay (Free Tier: 15 RPM)`);
  console.log('='.repeat(50));

  // Find all finished matches and filter those with odds in JS
  const allMatches = await prisma.match.findMany({
    where: {
      status: 'finished',
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: { kickoffTime: 'desc' },
    take: 200,
  }) as unknown as MatchWithOdds[];

  // Filter to those with odds data
  const matchesWithOdds = allMatches.filter(m => {
    const ext = m.externalData as any;
    return ext?.odds?.bookmakers?.[0]?.bets;
  });

  // Filter to only those with actual odds
  const validMatches = matchesWithOdds.filter(m => {
    const ext = m.externalData as any;
    return ext?.odds?.bookmakers?.[0]?.bets?.[0]?.values;
  });

  console.log(`\nFound ${validMatches.length} matches with odds data\n`);

  if (validMatches.length === 0) {
    console.log('No matches with odds found!');
    return;
  }

  // Limit to 21 matches
  const matches = validMatches.slice(0, 21);

  // Results tracking
  let correctOutcome = 0;
  let correctBTTS = 0;
  let correctOver25 = 0;
  const results: any[] = [];
  let failedPredictions = 0;

  console.log(`Processing ${matches.length} matches with Gemini predictions...\n`);
  const startTime = Date.now();

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const ext = match.externalData as any;

    console.log(`[${i + 1}/${matches.length}] ${match.homeTeam.name} vs ${match.awayTeam.name}`);

    // Extract odds from external data
    const bookmaker = ext?.odds?.bookmakers?.[0];
    let homeOdds = 0, drawOdds = 0, awayOdds = 0;
    let bttsYesOdds = 0, bttsNoOdds = 0;
    let over25Odds = 0, under25Odds = 0;

    if (bookmaker?.bets) {
      for (const bet of bookmaker.bets) {
        if (bet.name === 'Match Winner') {
          for (const val of bet.values || []) {
            if (val.value === 'Home') homeOdds = parseFloat(val.odd) || 0;
            if (val.value === 'Draw') drawOdds = parseFloat(val.odd) || 0;
            if (val.value === 'Away') awayOdds = parseFloat(val.odd) || 0;
          }
        }
        if (bet.name === 'Both Teams Score') {
          for (const val of bet.values || []) {
            if (val.value === 'Yes') bttsYesOdds = parseFloat(val.odd) || 0;
            if (val.value === 'No') bttsNoOdds = parseFloat(val.odd) || 0;
          }
        }
        if (bet.name === 'Goals Over/Under' && bet.values) {
          for (const val of bet.values) {
            if (val.value === 'Over 2.5') over25Odds = parseFloat(val.odd) || 0;
            if (val.value === 'Under 2.5') under25Odds = parseFloat(val.odd) || 0;
          }
        }
      }
    }

    // Get Gemini prediction
    let prediction: any = null;
    try {
      prediction = await predictionEngineService.generatePrediction(match.id, true);
    } catch (err: any) {
      console.log(`   ⚠️ Prediction failed: ${err.message || 'Unknown error'}`);
      failedPredictions++;

      // Still apply rate limit even on failure
      if (i < matches.length - 1) {
        console.log(`   ⏳ Waiting ${RATE_LIMIT_DELAY / 1000}s (rate limit)...`);
        await sleep(RATE_LIMIT_DELAY);
      }
      continue;
    }

    if (!prediction) {
      console.log(`   ⚠️ No prediction returned`);
      failedPredictions++;

      if (i < matches.length - 1) {
        console.log(`   ⏳ Waiting ${RATE_LIMIT_DELAY / 1000}s (rate limit)...`);
        await sleep(RATE_LIMIT_DELAY);
      }
      continue;
    }

    // Calculate actual results
    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;
    const totalGoals = homeScore + awayScore;

    const actualOutcome = homeScore > awayScore ? '1' : homeScore < awayScore ? '2' : 'X';
    const actualBTTS = homeScore > 0 && awayScore > 0;
    const actualOver25 = totalGoals > 2.5;

    // Check predictions
    const outcomeCorrect = prediction.matchOutcome.predicted === actualOutcome;
    const bttsCorrect = (prediction.btts.predicted === 'Yes') === actualBTTS;
    const over25Correct = (prediction.overUnder.lines['2.5'].over > 50) === actualOver25;

    if (outcomeCorrect) correctOutcome++;
    if (bttsCorrect) correctBTTS++;
    if (over25Correct) correctOver25++;

    results.push({
      match,
      homeOdds,
      drawOdds,
      awayOdds,
      bttsYesOdds,
      bttsNoOdds,
      over25Odds,
      under25Odds,
      prediction,
      actualOutcome,
      actualBTTS,
      actualOver25,
      outcomeCorrect,
      bttsCorrect,
      over25Correct,
      homeScore,
      awayScore,
      totalGoals,
    });

    const outcomeEmoji = outcomeCorrect ? '✅' : '❌';
    const bttsEmoji = bttsCorrect ? '✅' : '❌';
    const overEmoji = over25Correct ? '✅' : '❌';

    console.log(`   Score: ${homeScore}-${awayScore} | 1X2: ${prediction.matchOutcome.predicted} ${outcomeEmoji} | BTTS: ${prediction.btts.predicted} ${bttsEmoji} | O2.5: ${prediction.overUnder.lines['2.5'].over > 50 ? 'Yes' : 'No'} ${overEmoji}`);

    // Rate limit delay for Gemini Free Tier (15 RPM)
    if (i < matches.length - 1) {
      console.log(`   ⏳ Waiting ${RATE_LIMIT_DELAY / 1000}s (rate limit)...`);
      await sleep(RATE_LIMIT_DELAY);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  // Build CSV content
  const csvLines: string[] = [];

  // Header for main data
  csvLines.push('GEMINI 3 PRO PREVIEW BACKTEST REPORT');
  csvLines.push(`Generated: ${new Date().toISOString()}`);
  csvLines.push(`Model: gemini-3-pro-preview`);
  csvLines.push(`Total Matches: ${results.length}`);
  csvLines.push(`Failed Predictions: ${failedPredictions}`);
  csvLines.push(`1X2 Accuracy: ${correctOutcome}/${results.length} (${(correctOutcome/results.length*100).toFixed(1)}%)`);
  csvLines.push(`BTTS Accuracy: ${correctBTTS}/${results.length} (${(correctBTTS/results.length*100).toFixed(1)}%)`);
  csvLines.push(`Over 2.5 Accuracy: ${correctOver25}/${results.length} (${(correctOver25/results.length*100).toFixed(1)}%)`);
  csvLines.push(`Processing Time: ${totalTime} minutes`);
  csvLines.push('');
  csvLines.push('');

  // Match details header
  csvLines.push([
    '#',
    'Date',
    'League',
    'Home Team',
    'Away Team',
    'Score',
    'Result',
    'Home Odds',
    'Draw Odds',
    'Away Odds',
    'BTTS Yes Odds',
    'BTTS No Odds',
    'O2.5 Odds',
    'U2.5 Odds',
    'Pred 1X2',
    'Home %',
    'Draw %',
    'Away %',
    '1X2 Correct',
    'Pred BTTS',
    'Actual BTTS',
    'BTTS Correct',
    'O2.5 %',
    'Actual O2.5',
    'O2.5 Correct',
    'Confidence',
    'AI Analysis'
  ].join(','));

  // Data rows
  results.forEach((r, idx) => {
    const analysis = r.prediction.aiAnalysis?.replace(/,/g, ';').replace(/\n/g, ' ').substring(0, 200) || '';
    csvLines.push([
      idx + 1,
      r.match.kickoffTime.toISOString().split('T')[0],
      `"${r.match.league || 'N/A'}"`,
      `"${r.match.homeTeam.name}"`,
      `"${r.match.awayTeam.name}"`,
      `${r.homeScore}-${r.awayScore}`,
      r.actualOutcome,
      r.homeOdds.toFixed(2),
      r.drawOdds.toFixed(2),
      r.awayOdds.toFixed(2),
      r.bttsYesOdds.toFixed(2),
      r.bttsNoOdds.toFixed(2),
      r.over25Odds.toFixed(2),
      r.under25Odds.toFixed(2),
      r.prediction.matchOutcome.predicted,
      r.prediction.matchOutcome.homeWin,
      r.prediction.matchOutcome.draw,
      r.prediction.matchOutcome.awayWin,
      r.outcomeCorrect ? 'YES' : 'NO',
      r.prediction.btts.predicted,
      r.actualBTTS ? 'Yes' : 'No',
      r.bttsCorrect ? 'YES' : 'NO',
      r.prediction.overUnder.lines['2.5'].over,
      r.actualOver25 ? 'Yes' : 'No',
      r.over25Correct ? 'YES' : 'NO',
      r.prediction.confidence,
      `"${analysis}"`
    ].join(','));
  });

  // Save CSV file
  const fileName = `Gemini3_Backtest_${new Date().toISOString().split('T')[0]}.csv`;
  const filePath = path.join(process.cwd(), fileName);
  fs.writeFileSync(filePath, csvLines.join('\n'), 'utf-8');

  console.log('\n' + '='.repeat(50));
  console.log('📊 GEMINI 3 PRO PREVIEW BACKTEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Model: gemini-3-pro-preview`);
  console.log(`Total Matches: ${results.length}`);
  console.log(`Failed Predictions: ${failedPredictions}`);
  console.log(`Processing Time: ${totalTime} minutes`);
  console.log('');
  console.log('📈 ACCURACY RESULTS:');
  console.log(`   1X2 Accuracy:    ${correctOutcome}/${results.length} (${(correctOutcome/results.length*100).toFixed(1)}%)`);
  console.log(`   BTTS Accuracy:   ${correctBTTS}/${results.length} (${(correctBTTS/results.length*100).toFixed(1)}%)`);
  console.log(`   Over 2.5 Accuracy: ${correctOver25}/${results.length} (${(correctOver25/results.length*100).toFixed(1)}%)`);
  console.log('='.repeat(50));
  console.log(`\n✅ CSV report saved: ${filePath}`);
  console.log('📝 Open in Excel: File > Open > Select CSV file\n');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
