/**
 * Backtest Report Generator
 * Generates CSV/Excel report for all finished matches with odds
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface MatchData {
  id: string;
  date: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  totalGoals: number;
  actualResult: '1' | 'X' | '2';
  actualBTTS: boolean;
  actualOver25: boolean;
  actualOver15: boolean;
  actualOver35: boolean;
  // Odds
  homeWinOdds: number | null;
  drawOdds: number | null;
  awayWinOdds: number | null;
  over25Odds: number | null;
  under25Odds: number | null;
  over15Odds: number | null;
  under15Odds: number | null;
  over35Odds: number | null;
  under35Odds: number | null;
  bttsYesOdds: number | null;
  bttsNoOdds: number | null;
  // AI Predictions
  aiPredictedResult: string;
  aiHomeWinProb: number;
  aiDrawProb: number;
  aiAwayWinProb: number;
  aiOver25Prob: number;
  aiBTTSProb: number;
  aiExpectedGoals: number;
  aiConfidence: number;
  // Results
  resultCorrect: boolean;
  bttsCorrect: boolean;
  over25Correct: boolean;
  over15Correct: boolean;
  over35Correct: boolean;
  // Profit/Loss (1 unit bet)
  resultProfit: number;
  bttsProfit: number;
  over25Profit: number;
}

// Simple Poisson-based prediction (similar to prediction engine)
function calculatePoisson(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function calculatePredictions(homeOdds: number | null, drawOdds: number | null, awayOdds: number | null) {
  // Use odds to infer probabilities
  if (!homeOdds || !drawOdds || !awayOdds) {
    return {
      homeWinProb: 33.3,
      drawProb: 33.3,
      awayWinProb: 33.3,
      predicted: '1' as const,
      confidence: 0,
      expectedGoals: 2.5,
      over25Prob: 50,
      bttsProb: 50
    };
  }

  // Convert odds to probabilities (removing margin)
  const homeProb = 1 / homeOdds;
  const drawProb = 1 / drawOdds;
  const awayProb = 1 / awayOdds;
  const total = homeProb + drawProb + awayProb;

  const homeWinProb = (homeProb / total) * 100;
  const drawProbNorm = (drawProb / total) * 100;
  const awayWinProb = (awayProb / total) * 100;

  // Determine predicted result
  let predicted: '1' | 'X' | '2' = '1';
  let maxProb = homeWinProb;

  if (drawProbNorm > maxProb) {
    predicted = 'X';
    maxProb = drawProbNorm;
  }
  if (awayWinProb > maxProb) {
    predicted = '2';
    maxProb = awayWinProb;
  }

  // Estimate expected goals based on odds pattern
  // Lower home/away odds = higher scoring expected
  const avgWinOdds = (homeOdds + awayOdds) / 2;
  const expectedGoals = avgWinOdds < 1.5 ? 3.2 : avgWinOdds < 2.0 ? 2.8 : avgWinOdds < 2.5 ? 2.5 : 2.2;

  // Calculate over 2.5 probability using Poisson
  const homeExpected = expectedGoals * (homeWinProb / (homeWinProb + awayWinProb)) * 1.1;
  const awayExpected = expectedGoals - homeExpected;

  let under25Prob = 0;
  for (let h = 0; h <= 2; h++) {
    for (let a = 0; a <= 2 - h; a++) {
      under25Prob += calculatePoisson(homeExpected, h) * calculatePoisson(awayExpected, a);
    }
  }
  const over25Prob = (1 - under25Prob) * 100;

  // BTTS probability
  const homeScoreProb = 1 - calculatePoisson(homeExpected, 0);
  const awayScoreProb = 1 - calculatePoisson(awayExpected, 0);
  const bttsProb = homeScoreProb * awayScoreProb * 100;

  return {
    homeWinProb,
    drawProb: drawProbNorm,
    awayWinProb,
    predicted,
    confidence: maxProb,
    expectedGoals,
    over25Prob,
    bttsProb
  };
}

async function generateReport() {
  console.log('Starting backtest report generation...\n');

  // Fetch all finished matches with odds
  const matches = await prisma.match.findMany({
    where: {
      status: 'finished',
      homeScore: { not: null },
      awayScore: { not: null },
      odds: {
        isNot: null
      }
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      odds: true
    },
    orderBy: { kickoffTime: 'desc' }
  });

  console.log(`Found ${matches.length} finished matches with odds\n`);

  const results: MatchData[] = [];

  // Summary stats
  let totalMatches = 0;
  let resultCorrectCount = 0;
  let bttsCorrectCount = 0;
  let over25CorrectCount = 0;
  let over15CorrectCount = 0;
  let over35CorrectCount = 0;

  let totalResultProfit = 0;
  let totalBTTSProfit = 0;
  let totalOver25Profit = 0;

  for (const match of matches) {
    const homeScore = match.homeScore!;
    const awayScore = match.awayScore!;
    const totalGoals = homeScore + awayScore;

    // Actual results
    const actualResult: '1' | 'X' | '2' = homeScore > awayScore ? '1' : homeScore < awayScore ? '2' : 'X';
    const actualBTTS = homeScore > 0 && awayScore > 0;
    const actualOver25 = totalGoals > 2.5;
    const actualOver15 = totalGoals > 1.5;
    const actualOver35 = totalGoals > 3.5;

    // Get AI predictions
    const predictions = calculatePredictions(
      match.odds?.homeWinOdds || null,
      match.odds?.drawOdds || null,
      match.odds?.awayWinOdds || null
    );

    const aiPredictedResult = predictions.predicted;
    const aiBTTSPredicted = predictions.bttsProb > 50;
    const aiOver25Predicted = predictions.over25Prob > 50;
    const aiOver15Predicted = predictions.over25Prob > 30; // Lower threshold for 1.5
    const aiOver35Predicted = predictions.over25Prob > 70; // Higher threshold for 3.5

    // Check correctness
    const resultCorrect = aiPredictedResult === actualResult;
    const bttsCorrect = aiBTTSPredicted === actualBTTS;
    const over25Correct = aiOver25Predicted === actualOver25;
    const over15Correct = aiOver15Predicted === actualOver15;
    const over35Correct = aiOver35Predicted === actualOver35;

    // Calculate profit/loss (1 unit bet)
    let resultProfit = -1; // Lost bet by default
    if (resultCorrect) {
      const winningOdds = actualResult === '1' ? match.odds?.homeWinOdds :
                         actualResult === '2' ? match.odds?.awayWinOdds :
                         match.odds?.drawOdds;
      resultProfit = (winningOdds || 2) - 1;
    }

    let bttsProfit = -1;
    if (aiBTTSPredicted && match.odds?.bttsYesOdds) {
      bttsProfit = actualBTTS ? (match.odds.bttsYesOdds - 1) : -1;
    } else if (!aiBTTSPredicted && match.odds?.bttsNoOdds) {
      bttsProfit = !actualBTTS ? (match.odds.bttsNoOdds - 1) : -1;
    }

    let over25Profit = -1;
    if (aiOver25Predicted && match.odds?.over25Odds) {
      over25Profit = actualOver25 ? (match.odds.over25Odds - 1) : -1;
    } else if (!aiOver25Predicted && match.odds?.under25Odds) {
      over25Profit = !actualOver25 ? (match.odds.under25Odds - 1) : -1;
    }

    // Update totals
    totalMatches++;
    if (resultCorrect) resultCorrectCount++;
    if (bttsCorrect) bttsCorrectCount++;
    if (over25Correct) over25CorrectCount++;
    if (over15Correct) over15CorrectCount++;
    if (over35Correct) over35CorrectCount++;

    totalResultProfit += resultProfit;
    totalBTTSProfit += bttsProfit;
    totalOver25Profit += over25Profit;

    results.push({
      id: match.id,
      date: match.kickoffTime.toISOString().split('T')[0],
      league: match.league || 'Unknown',
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeScore,
      awayScore,
      totalGoals,
      actualResult,
      actualBTTS,
      actualOver25,
      actualOver15,
      actualOver35,
      homeWinOdds: match.odds?.homeWinOdds || null,
      drawOdds: match.odds?.drawOdds || null,
      awayWinOdds: match.odds?.awayWinOdds || null,
      over25Odds: match.odds?.over25Odds || null,
      under25Odds: match.odds?.under25Odds || null,
      over15Odds: match.odds?.over15Odds || null,
      under15Odds: match.odds?.under15Odds || null,
      over35Odds: match.odds?.over35Odds || null,
      under35Odds: match.odds?.under35Odds || null,
      bttsYesOdds: match.odds?.bttsYesOdds || null,
      bttsNoOdds: match.odds?.bttsNoOdds || null,
      aiPredictedResult,
      aiHomeWinProb: Math.round(predictions.homeWinProb * 10) / 10,
      aiDrawProb: Math.round(predictions.drawProb * 10) / 10,
      aiAwayWinProb: Math.round(predictions.awayWinProb * 10) / 10,
      aiOver25Prob: Math.round(predictions.over25Prob * 10) / 10,
      aiBTTSProb: Math.round(predictions.bttsProb * 10) / 10,
      aiExpectedGoals: Math.round(predictions.expectedGoals * 100) / 100,
      aiConfidence: Math.round(predictions.confidence * 10) / 10,
      resultCorrect,
      bttsCorrect,
      over25Correct,
      over15Correct,
      over35Correct,
      resultProfit: Math.round(resultProfit * 100) / 100,
      bttsProfit: Math.round(bttsProfit * 100) / 100,
      over25Profit: Math.round(over25Profit * 100) / 100
    });
  }

  // Generate CSV
  const headers = [
    'Date',
    'League',
    'Home Team',
    'Away Team',
    'Home Score',
    'Away Score',
    'Total Goals',
    'Actual Result',
    'Actual BTTS',
    'Actual Over 2.5',
    'Actual Over 1.5',
    'Actual Over 3.5',
    'Home Win Odds',
    'Draw Odds',
    'Away Win Odds',
    'Over 2.5 Odds',
    'Under 2.5 Odds',
    'Over 1.5 Odds',
    'Under 1.5 Odds',
    'Over 3.5 Odds',
    'Under 3.5 Odds',
    'BTTS Yes Odds',
    'BTTS No Odds',
    'AI Predicted Result',
    'AI Home Win %',
    'AI Draw %',
    'AI Away Win %',
    'AI Over 2.5 %',
    'AI BTTS %',
    'AI Expected Goals',
    'AI Confidence %',
    'Result Correct',
    'BTTS Correct',
    'Over 2.5 Correct',
    'Over 1.5 Correct',
    'Over 3.5 Correct',
    'Result Profit',
    'BTTS Profit',
    'Over 2.5 Profit'
  ];

  const csvRows = [headers.join(',')];

  for (const r of results) {
    const row = [
      r.date,
      `"${r.league}"`,
      `"${r.homeTeam}"`,
      `"${r.awayTeam}"`,
      r.homeScore,
      r.awayScore,
      r.totalGoals,
      r.actualResult,
      r.actualBTTS ? 'Yes' : 'No',
      r.actualOver25 ? 'Yes' : 'No',
      r.actualOver15 ? 'Yes' : 'No',
      r.actualOver35 ? 'Yes' : 'No',
      r.homeWinOdds || '',
      r.drawOdds || '',
      r.awayWinOdds || '',
      r.over25Odds || '',
      r.under25Odds || '',
      r.over15Odds || '',
      r.under15Odds || '',
      r.over35Odds || '',
      r.under35Odds || '',
      r.bttsYesOdds || '',
      r.bttsNoOdds || '',
      r.aiPredictedResult,
      r.aiHomeWinProb,
      r.aiDrawProb,
      r.aiAwayWinProb,
      r.aiOver25Prob,
      r.aiBTTSProb,
      r.aiExpectedGoals,
      r.aiConfidence,
      r.resultCorrect ? 'Yes' : 'No',
      r.bttsCorrect ? 'Yes' : 'No',
      r.over25Correct ? 'Yes' : 'No',
      r.over15Correct ? 'Yes' : 'No',
      r.over35Correct ? 'Yes' : 'No',
      r.resultProfit,
      r.bttsProfit,
      r.over25Profit
    ];
    csvRows.push(row.join(','));
  }

  // Add summary section
  csvRows.push('');
  csvRows.push('');
  csvRows.push('SUMMARY STATISTICS');
  csvRows.push('');
  csvRows.push(`Total Matches Analyzed,${totalMatches}`);
  csvRows.push('');
  csvRows.push('ACCURACY METRICS');
  csvRows.push(`Match Result Accuracy,${((resultCorrectCount / totalMatches) * 100).toFixed(1)}%,${resultCorrectCount}/${totalMatches}`);
  csvRows.push(`BTTS Accuracy,${((bttsCorrectCount / totalMatches) * 100).toFixed(1)}%,${bttsCorrectCount}/${totalMatches}`);
  csvRows.push(`Over 2.5 Accuracy,${((over25CorrectCount / totalMatches) * 100).toFixed(1)}%,${over25CorrectCount}/${totalMatches}`);
  csvRows.push(`Over 1.5 Accuracy,${((over15CorrectCount / totalMatches) * 100).toFixed(1)}%,${over15CorrectCount}/${totalMatches}`);
  csvRows.push(`Over 3.5 Accuracy,${((over35CorrectCount / totalMatches) * 100).toFixed(1)}%,${over35CorrectCount}/${totalMatches}`);
  csvRows.push('');
  csvRows.push('PROFITABILITY (1 unit bets)');
  csvRows.push(`Match Result Total Profit,${totalResultProfit.toFixed(2)} units`);
  csvRows.push(`Match Result ROI,${((totalResultProfit / totalMatches) * 100).toFixed(1)}%`);
  csvRows.push(`BTTS Total Profit,${totalBTTSProfit.toFixed(2)} units`);
  csvRows.push(`BTTS ROI,${((totalBTTSProfit / totalMatches) * 100).toFixed(1)}%`);
  csvRows.push(`Over 2.5 Total Profit,${totalOver25Profit.toFixed(2)} units`);
  csvRows.push(`Over 2.5 ROI,${((totalOver25Profit / totalMatches) * 100).toFixed(1)}%`);

  // Save CSV
  const outputPath = path.join(__dirname, '..', 'backtest-report.csv');
  fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf-8');

  console.log('='.repeat(60));
  console.log('BACKTEST REPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nTotal Matches: ${totalMatches}`);
  console.log(`Date Range: ${results[results.length - 1]?.date} to ${results[0]?.date}`);
  console.log('\n--- ACCURACY ---');
  console.log(`Match Result: ${((resultCorrectCount / totalMatches) * 100).toFixed(1)}% (${resultCorrectCount}/${totalMatches})`);
  console.log(`BTTS: ${((bttsCorrectCount / totalMatches) * 100).toFixed(1)}% (${bttsCorrectCount}/${totalMatches})`);
  console.log(`Over 2.5: ${((over25CorrectCount / totalMatches) * 100).toFixed(1)}% (${over25CorrectCount}/${totalMatches})`);
  console.log(`Over 1.5: ${((over15CorrectCount / totalMatches) * 100).toFixed(1)}% (${over15CorrectCount}/${totalMatches})`);
  console.log(`Over 3.5: ${((over35CorrectCount / totalMatches) * 100).toFixed(1)}% (${over35CorrectCount}/${totalMatches})`);
  console.log('\n--- PROFITABILITY (1 unit bets) ---');
  console.log(`Match Result: ${totalResultProfit.toFixed(2)} units (ROI: ${((totalResultProfit / totalMatches) * 100).toFixed(1)}%)`);
  console.log(`BTTS: ${totalBTTSProfit.toFixed(2)} units (ROI: ${((totalBTTSProfit / totalMatches) * 100).toFixed(1)}%)`);
  console.log(`Over 2.5: ${totalOver25Profit.toFixed(2)} units (ROI: ${((totalOver25Profit / totalMatches) * 100).toFixed(1)}%)`);
  console.log('\n='.repeat(60));
  console.log(`\nReport saved to: ${outputPath}`);
  console.log('You can open this CSV file in Excel directly.');

  await prisma.$disconnect();
}

generateReport().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
