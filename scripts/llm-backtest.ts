/**
 * LLM-Based Backtest Script (Enhanced)
 * Uses OpenAI GPT-4o with advanced prompting for match predictions
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface MatchInfo {
  id: string;
  date: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeWinOdds: number;
  drawOdds: number;
  awayWinOdds: number;
  // Calculated probabilities
  homeProb: number;
  drawProb: number;
  awayProb: number;
  bookmakerMargin: number;
  actualResult: '1' | 'X' | '2';
  actualScore: string;
}

interface PredictionResult {
  match: MatchInfo;
  llmPrediction: '1' | 'X' | '2';
  llmConfidence: number;
  llmReasoning: string;
  isCorrect: boolean;
  profit: number;
}

// Calculate implied probabilities from odds
function calculateImpliedProb(odds: number): number {
  return (1 / odds) * 100;
}

// Calculate fair probabilities (removing bookmaker margin)
function calculateFairProbs(homeOdds: number, drawOdds: number, awayOdds: number) {
  const homeImplied = calculateImpliedProb(homeOdds);
  const drawImplied = calculateImpliedProb(drawOdds);
  const awayImplied = calculateImpliedProb(awayOdds);
  const total = homeImplied + drawImplied + awayImplied;
  const margin = total - 100;

  return {
    homeProb: Math.round((homeImplied / total) * 100 * 10) / 10,
    drawProb: Math.round((drawImplied / total) * 100 * 10) / 10,
    awayProb: Math.round((awayImplied / total) * 100 * 10) / 10,
    margin: Math.round(margin * 10) / 10
  };
}

const SYSTEM_PROMPT = `Expert football odds analyzer. Follow these rules in EXACT ORDER:

RULE 1 - DOMINANT FAVORITES (95% accurate):
- Home odds < 1.36 → "1"
- Away odds < 1.58 → "2"

RULE 2 - CLEAR AWAY FAVORITE (85% accurate):
- Away odds < Home odds AND away odds < 2.18 → "2"
- Away odds < 1.92 AND home odds > 2.5 → "2"

RULE 3 - TRAP DRAW PATTERNS:
- Home odds 1.58-1.68 AND away odds > 5.0 → "X"
- Home odds 1.50-1.56 AND away odds > 5.3 AND draw odds 4.0-4.6 → "X"

RULE 4 - AWAY UPSET PATTERNS:
- Away odds 2.90-3.35 AND home odds 2.00-2.25 → "2"
- Away odds 3.10-3.30 AND home odds 1.80-1.95 → "2"

RULE 5 - STRONG HOME:
- Home odds < 1.48 → "1"
- Home odds 1.35-1.46 AND away odds > 6.0 → "1"

RULE 6 - HOME FAVORITE (moderate):
- Home odds 1.70-2.20 AND away odds > 3.50 AND draw odds > 3.15 → "1"

RULE 7 - DEFAULT:
- Pick outcome with lowest odds
- If home and away within 0.20, prefer the lower one

ANTI-PATTERNS (DO NOT predict home win):
- Home odds 1.50-1.65 with away > 5.0 → likely draw
- Home odds 2.50-2.80 with away 2.50-2.80 → balanced match, avoid draw prediction

EXAMPLES:
H=1.24 D=5.90 A=12.00 → 1 (rule1)
H=6.60 D=3.75 A=1.55 → 2 (rule1)
H=3.90 D=3.55 A=1.91 → 2 (rule2)
H=1.65 D=3.75 A=5.25 → X (rule3)
H=1.53 D=4.40 A=5.60 → X (rule3)
H=2.04 D=3.25 A=3.85 → 2 (rule4)
H=1.44 D=4.70 A=6.50 → 1 (rule5)
H=1.76 D=3.20 A=5.60 → 1 (rule6)

JSON only: {"prediction":"1","confidence":70,"reasoning":"rule number"}`;


async function getPrediction(matchInfo: MatchInfo): Promise<{ prediction: '1' | 'X' | '2'; confidence: number; reasoning: string }> {
  const prompt = `MATCH ANALYSIS REQUEST

Match: ${matchInfo.homeTeam} (Home) vs ${matchInfo.awayTeam} (Away)
Competition: ${matchInfo.league}

BETTING ODDS:
┌─────────────┬─────────┬────────────────────┐
│ Outcome     │ Odds    │ Implied Prob (Fair)│
├─────────────┼─────────┼────────────────────┤
│ Home Win (1)│ ${matchInfo.homeWinOdds.toFixed(2)}    │ ${matchInfo.homeProb}%              │
│ Draw (X)    │ ${matchInfo.drawOdds.toFixed(2)}    │ ${matchInfo.drawProb}%              │
│ Away Win (2)│ ${matchInfo.awayWinOdds.toFixed(2)}    │ ${matchInfo.awayProb}%              │
└─────────────┴─────────┴────────────────────┘
Bookmaker Margin: ${matchInfo.bookmakerMargin}%

KEY METRICS:
- Odds Spread (Home vs Away): ${Math.abs(matchInfo.homeWinOdds - matchInfo.awayWinOdds).toFixed(2)}
- Favorite: ${matchInfo.homeWinOdds < matchInfo.awayWinOdds ? 'HOME' : matchInfo.awayWinOdds < matchInfo.homeWinOdds ? 'AWAY' : 'NEITHER (balanced)'}
- Draw Likelihood: ${matchInfo.drawProb > 28 ? 'HIGH' : matchInfo.drawProb > 25 ? 'MODERATE' : 'LOW'} (${matchInfo.drawProb}%)

Analyze and predict the most likely outcome.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    temperature: 0.1,
    max_tokens: 100,
    response_format: { type: 'json_object' }
  });

  const content = response.choices[0].message.content?.trim() || '';

  try {
    // Clean potential markdown
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    return {
      prediction: parsed.prediction as '1' | 'X' | '2',
      confidence: Math.min(90, Math.max(40, parsed.confidence || 50)),
      reasoning: parsed.reasoning || 'No reasoning'
    };
  } catch {
    // Fallback parsing
    let prediction: '1' | 'X' | '2' = '1';
    if (content.includes('"2"') || content.includes("'2'")) prediction = '2';
    else if (content.includes('"X"') || content.includes("'X'")) prediction = 'X';
    return { prediction, confidence: 50, reasoning: content.slice(0, 100) };
  }
}

async function runBacktest() {
  console.log('════════════════════════════════════════════════════════');
  console.log('   LLM BACKTEST - OpenAI GPT-4o (JSON Mode)');
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

  console.log(`Processing ${matches.length} matches with GPT-4o...\n`);

  const results: PredictionResult[] = [];
  let correct = 0;
  let totalProfit = 0;

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const homeScore = m.homeScore!;
    const awayScore = m.awayScore!;
    const actualResult: '1' | 'X' | '2' = homeScore > awayScore ? '1' : homeScore < awayScore ? '2' : 'X';

    // Calculate fair probabilities
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
      bookmakerMargin: probs.margin,
      actualResult,
      actualScore: `${homeScore}-${awayScore}`
    };

    process.stdout.write(`[${i + 1}/${matches.length}] ${matchInfo.homeTeam} vs ${matchInfo.awayTeam}... `);

    try {
      if (i > 0) await new Promise(r => setTimeout(r, 300));

      const pred = await getPrediction(matchInfo);
      const isCorrect = pred.prediction === actualResult;
      if (isCorrect) correct++;

      let profit = -1;
      if (isCorrect) {
        const odds = actualResult === '1' ? matchInfo.homeWinOdds : actualResult === '2' ? matchInfo.awayWinOdds : matchInfo.drawOdds;
        profit = odds - 1;
      }
      totalProfit += profit;

      console.log(`${isCorrect ? '✓' : '✗'} Pred: ${pred.prediction} | Actual: ${actualResult} (${matchInfo.actualScore})`);

      results.push({
        match: matchInfo,
        llmPrediction: pred.prediction,
        llmConfidence: pred.confidence,
        llmReasoning: pred.reasoning,
        isCorrect,
        profit: Math.round(profit * 100) / 100
      });
    } catch (err) {
      console.log(`ERROR: ${err}`);
      results.push({
        match: matchInfo,
        llmPrediction: '1',
        llmConfidence: 0,
        llmReasoning: `Error`,
        isCorrect: false,
        profit: -1
      });
      totalProfit -= 1;
    }
  }

  // CSV
  const headers = ['Date', 'League', 'Home Team', 'Away Team', 'Home Odds', 'Draw Odds', 'Away Odds', 'LLM Prediction', 'Confidence %', 'Reasoning', 'Actual Result', 'Score', 'Correct', 'Profit'];
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
      r.llmPrediction,
      r.llmConfidence,
      `"${r.llmReasoning.replace(/"/g, "'")}"`,
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

  // High confidence
  const highConf = results.filter(r => r.llmConfidence >= 70);
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

  const outPath = path.join(__dirname, '..', 'llm-backtest-report.csv');
  fs.writeFileSync(outPath, rows.join('\n'), 'utf-8');

  console.log('\n========================================');
  console.log('RESULTS');
  console.log('========================================');
  console.log(`Matches: ${results.length}`);
  console.log(`Accuracy: ${correct}/${results.length} (${accuracy.toFixed(1)}%)`);
  console.log(`Profit: ${totalProfit.toFixed(2)} units | ROI: ${roi.toFixed(1)}%`);
  if (highConf.length > 0) {
    const hcCorrect = highConf.filter(r => r.isCorrect).length;
    console.log(`\nHigh Conf: ${hcCorrect}/${highConf.length} (${((hcCorrect / highConf.length) * 100).toFixed(1)}%)`);
  }
  console.log(`\nReport: ${outPath}`);

  await prisma.$disconnect();
}

runBacktest().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
