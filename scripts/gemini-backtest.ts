/**
 * Gemini-Based Backtest Script
 * Uses Google Gemini 2.0 Flash for match predictions
 */

import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

interface MatchInfo {
  id: string;
  date: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeWinOdds: number;
  drawOdds: number;
  awayWinOdds: number;
  homeProb: number;
  drawProb: number;
  awayProb: number;
  actualResult: '1' | 'X' | '2';
  actualScore: string;
}

interface PredictionResult {
  match: MatchInfo;
  prediction: '1' | 'X' | '2';
  confidence: number;
  reasoning: string;
  isCorrect: boolean;
  profit: number;
}

// Calculate fair probabilities from odds
function calculateFairProbs(homeOdds: number, drawOdds: number, awayOdds: number) {
  const homeImplied = (1 / homeOdds) * 100;
  const drawImplied = (1 / drawOdds) * 100;
  const awayImplied = (1 / awayOdds) * 100;
  const total = homeImplied + drawImplied + awayImplied;

  return {
    homeProb: Math.round((homeImplied / total) * 100 * 10) / 10,
    drawProb: Math.round((drawImplied / total) * 100 * 10) / 10,
    awayProb: Math.round((awayImplied / total) * 100 * 10) / 10
  };
}

const SYSTEM_PROMPT = `You are an expert football match predictor. Analyze betting odds to predict match outcomes.

KEY FOOTBALL STATISTICS:
- Draws occur in 26% of all matches
- Home teams win 44%, Away teams win 30%
- Favorites lose 35% of the time (upsets are common)

PREDICTION RULES:

PREDICT DRAW (X) when:
- Home odds 2.0-3.5 AND away odds 2.0-3.5 (balanced match)
- Draw odds below 3.30 (bookmakers expect draw)
- Home and away odds within 0.6 of each other
- No clear favorite (all odds between 2.0-4.0)

PREDICT HOME WIN (1) when:
- Home odds below 1.55 (strong favorite)
- Home odds at least 1.5 lower than away odds

PREDICT AWAY WIN (2) when:
- Away odds below 1.70 (strong away favorite)
- Away odds clearly lower than home odds (by 1.0+)

EXAMPLES:
Odds H=2.30 D=3.40 A=3.00 → X (balanced, no clear favorite)
Odds H=3.55 D=3.20 A=2.16 → 2 (away favored)
Odds H=1.65 D=3.75 A=5.25 → X (home slight favorite but not dominant)
Odds H=2.52 D=3.45 A=2.68 → X (very balanced)
Odds H=1.24 D=5.90 A=12.00 → 1 (dominant home favorite)
Odds H=6.25 D=3.80 A=1.57 → 2 (clear away favorite)
Odds H=2.00 D=3.25 A=3.90 → X (home slight edge, but draw likely)

IMPORTANT: When home odds are between 1.60-2.50 and away odds are similar or higher, PREFER DRAW over home win.

Respond ONLY with valid JSON: {"prediction": "1" or "X" or "2", "confidence": 50-85, "reasoning": "brief reason"}`;

async function getPrediction(matchInfo: MatchInfo): Promise<{ prediction: '1' | 'X' | '2'; confidence: number; reasoning: string }> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-pro-preview',
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 150
    }
  });

  const prompt = `${SYSTEM_PROMPT}

MATCH TO PREDICT:
${matchInfo.homeTeam} vs ${matchInfo.awayTeam}
League: ${matchInfo.league}

ODDS:
- Home Win (1): ${matchInfo.homeWinOdds.toFixed(2)} → ${matchInfo.homeProb}% probability
- Draw (X): ${matchInfo.drawOdds.toFixed(2)} → ${matchInfo.drawProb}% probability
- Away Win (2): ${matchInfo.awayWinOdds.toFixed(2)} → ${matchInfo.awayProb}% probability

Predict the outcome:`;

  const result = await model.generateContent(prompt);

  // Handle thinking models - get all parts
  let content = '';
  const response = result.response;

  // Try different ways to get content
  if (response.candidates && response.candidates[0]) {
    const parts = response.candidates[0].content?.parts || [];
    for (const part of parts) {
      if (part.text) {
        content += part.text;
      }
    }
  }

  // Fallback to text() method
  if (!content) {
    try {
      content = response.text();
    } catch {}
  }

  content = content.trim();

  // Debug first 3 responses
  if (matchInfo.homeTeam === 'AS Roma' || matchInfo.homeTeam === 'Atalanta' || matchInfo.homeTeam === 'Cremonese') {
    console.log('\nRAW:', content.slice(0, 300));
  }

  try {
    // Try to find JSON in response
    const jsonMatch = content.match(/\{[^{}]*"prediction"[^{}]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        prediction: parsed.prediction as '1' | 'X' | '2',
        confidence: Math.min(85, Math.max(50, parsed.confidence || 60)),
        reasoning: parsed.reasoning || 'No reasoning'
      };
    }

    // Try parsing entire content as JSON
    const parsed = JSON.parse(content);
    return {
      prediction: parsed.prediction as '1' | 'X' | '2',
      confidence: Math.min(85, Math.max(50, parsed.confidence || 60)),
      reasoning: parsed.reasoning || 'No reasoning'
    };
  } catch {
    // Smarter fallback - look for prediction patterns
    let prediction: '1' | 'X' | '2' = 'X'; // Default to draw instead of home

    // Check for explicit predictions
    if (content.includes('"prediction": "2"') || content.includes('"prediction":"2"') ||
        content.includes('Prediction: 2') || content.includes('predict 2') ||
        content.includes('Away Win')) {
      prediction = '2';
    } else if (content.includes('"prediction": "1"') || content.includes('"prediction":"1"') ||
               content.includes('Prediction: 1') || content.includes('predict 1') ||
               content.includes('Home Win')) {
      prediction = '1';
    } else if (content.includes('"prediction": "X"') || content.includes('"prediction":"X"') ||
               content.includes('Prediction: X') || content.includes('Draw')) {
      prediction = 'X';
    }

    return { prediction, confidence: 50, reasoning: content.slice(0, 100) };
  }
}

async function runBacktest() {
  console.log('════════════════════════════════════════════════════════');
  console.log('   GEMINI 2.0 FLASH BACKTEST');
  console.log('════════════════════════════════════════════════════════\n');

  const matches = await prisma.match.findMany({
    where: {
      status: 'finished',
      homeScore: { not: null },
      awayScore: { not: null },
      odds: { isNot: null }
    },
    include: { homeTeam: true, awayTeam: true, odds: true },
    orderBy: { kickoffTime: 'desc' },
    take: 51
  });

  console.log(`Processing ${matches.length} matches...\n`);

  const results: PredictionResult[] = [];
  let correct = 0;
  let totalProfit = 0;
  let drawsCorrect = 0;
  let drawsTotal = 0;

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const homeScore = m.homeScore!;
    const awayScore = m.awayScore!;
    const actualResult: '1' | 'X' | '2' = homeScore > awayScore ? '1' : homeScore < awayScore ? '2' : 'X';

    if (actualResult === 'X') drawsTotal++;

    const probs = calculateFairProbs(m.odds!.homeWinOdds!, m.odds!.drawOdds!, m.odds!.awayWinOdds!);

    const matchInfo: MatchInfo = {
      id: m.id,
      date: m.kickoffTime.toISOString().split('T')[0],
      league: m.league || 'Unknown',
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
      homeWinOdds: m.odds!.homeWinOdds!,
      drawOdds: m.odds!.drawOdds!,
      awayWinOdds: m.odds!.awayWinOdds!,
      homeProb: probs.homeProb,
      drawProb: probs.drawProb,
      awayProb: probs.awayProb,
      actualResult,
      actualScore: `${homeScore}-${awayScore}`
    };

    process.stdout.write(`[${i + 1}/${matches.length}] ${matchInfo.homeTeam} vs ${matchInfo.awayTeam}... `);

    try {
      if (i > 0) await new Promise(r => setTimeout(r, 250));

      const pred = await getPrediction(matchInfo);
      const isCorrect = pred.prediction === actualResult;
      if (isCorrect) {
        correct++;
        if (actualResult === 'X') drawsCorrect++;
      }

      let profit = -1;
      if (isCorrect) {
        const odds = actualResult === '1' ? matchInfo.homeWinOdds : actualResult === '2' ? matchInfo.awayWinOdds : matchInfo.drawOdds;
        profit = odds - 1;
      }
      totalProfit += profit;

      console.log(`${isCorrect ? '✓' : '✗'} Pred: ${pred.prediction} | Actual: ${actualResult} (${matchInfo.actualScore})`);

      results.push({
        match: matchInfo,
        prediction: pred.prediction,
        confidence: pred.confidence,
        reasoning: pred.reasoning,
        isCorrect,
        profit: Math.round(profit * 100) / 100
      });
    } catch (err: any) {
      console.log(`ERROR: ${err.message || err}`);
      results.push({
        match: matchInfo,
        prediction: '1',
        confidence: 0,
        reasoning: 'Error',
        isCorrect: false,
        profit: -1
      });
      totalProfit -= 1;
    }
  }

  // Generate CSV
  const headers = ['Date', 'League', 'Home Team', 'Away Team', 'Home Odds', 'Draw Odds', 'Away Odds', 'Home %', 'Draw %', 'Away %', 'Prediction', 'Confidence', 'Reasoning', 'Actual', 'Score', 'Correct', 'Profit'];
  const rows = [headers.join(',')];

  for (const r of results) {
    rows.push([
      r.match.date,
      `"${r.match.league}"`,
      `"${r.match.homeTeam}"`,
      `"${r.match.awayTeam}"`,
      r.match.homeWinOdds.toFixed(2),
      r.match.drawOdds.toFixed(2),
      r.match.awayWinOdds.toFixed(2),
      r.match.homeProb,
      r.match.drawProb,
      r.match.awayProb,
      r.prediction,
      r.confidence,
      `"${r.reasoning.replace(/"/g, "'")}"`,
      r.match.actualResult,
      r.match.actualScore,
      r.isCorrect ? 'Yes' : 'No',
      r.profit.toFixed(2)
    ].join(','));
  }

  const accuracy = (correct / results.length) * 100;
  const roi = (totalProfit / results.length) * 100;

  rows.push('', '', 'SUMMARY');
  rows.push(`Total Matches,${results.length}`);
  rows.push(`Correct,${correct}`);
  rows.push(`Accuracy,${accuracy.toFixed(1)}%`);
  rows.push(`Profit,${totalProfit.toFixed(2)} units`);
  rows.push(`ROI,${roi.toFixed(1)}%`);
  rows.push('');
  rows.push(`Draws in Dataset,${drawsTotal}`);
  rows.push(`Draws Predicted Correctly,${drawsCorrect}`);

  // High confidence
  const highConf = results.filter(r => r.confidence >= 70);
  if (highConf.length > 0) {
    const hcCorrect = highConf.filter(r => r.isCorrect).length;
    const hcProfit = highConf.reduce((s, r) => s + r.profit, 0);
    rows.push('', 'HIGH CONFIDENCE (>=70%)');
    rows.push(`Bets,${highConf.length}`);
    rows.push(`Correct,${hcCorrect}`);
    rows.push(`Accuracy,${((hcCorrect / highConf.length) * 100).toFixed(1)}%`);
    rows.push(`Profit,${hcProfit.toFixed(2)} units`);
    rows.push(`ROI,${((hcProfit / highConf.length) * 100).toFixed(1)}%`);
  }

  const outPath = path.join(__dirname, '..', 'gemini-backtest-report.csv');
  fs.writeFileSync(outPath, rows.join('\n'), 'utf-8');

  console.log('\n════════════════════════════════════════════════════════');
  console.log('RESULTS');
  console.log('════════════════════════════════════════════════════════');
  console.log(`Matches: ${results.length}`);
  console.log(`Accuracy: ${correct}/${results.length} (${accuracy.toFixed(1)}%)`);
  console.log(`Profit: ${totalProfit.toFixed(2)} units | ROI: ${roi.toFixed(1)}%`);
  console.log(`\nDraws: ${drawsCorrect}/${drawsTotal} correct`);

  if (highConf.length > 0) {
    const hcCorrect = highConf.filter(r => r.isCorrect).length;
    const hcProfit = highConf.reduce((s, r) => s + r.profit, 0);
    console.log(`\nHigh Confidence (>=70%): ${hcCorrect}/${highConf.length} (${((hcCorrect / highConf.length) * 100).toFixed(1)}%)`);
    console.log(`High Conf Profit: ${hcProfit.toFixed(2)} units | ROI: ${((hcProfit / highConf.length) * 100).toFixed(1)}%`);
  }

  console.log(`\nReport: ${outPath}`);

  await prisma.$disconnect();
}

runBacktest().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
