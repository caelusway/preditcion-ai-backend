/**
 * Converts prediction engine output to aiPredictions format for the API
 */

import { CompletePrediction } from '../types/prediction.types';

export interface FormattedAIPrediction {
  label: string;
  prediction: string;
  odds: number;
  confidence: number;
  oddsDirection: 'up' | 'down' | 'none';
  isOccured?: boolean;
}

interface OddsData {
  matchWinner?: { home: number; draw: number; away: number };
  overUnder?: { over25: number; under25: number };
  btts?: { yes: number; no: number };
}

/**
 * Format prediction engine output to aiPredictions array
 */
export function formatAIPredictions(
  prediction: CompletePrediction,
  odds?: OddsData | null
): FormattedAIPrediction[] {
  const predictions: FormattedAIPrediction[] = [];

  // 1. Best Tip - En yüksek güvenli tahmin
  const bestTip = getBestTip(prediction, odds);
  predictions.push(bestTip);

  // 2. 1x2 Tip - Maç sonucu tahmini
  const matchOutcomeTip = getMatchOutcomeTip(prediction, odds);
  predictions.push(matchOutcomeTip);

  // 3. Total Goals - Over/Under tahmini
  const totalGoalsTip = getTotalGoalsTip(prediction, odds);
  predictions.push(totalGoalsTip);

  // 4. Both Teams To Score
  const bttsTip = getBTTSTip(prediction, odds);
  predictions.push(bttsTip);

  // 5. Bet Builder - Kombineli tahmin
  const betBuilderTip = getBetBuilderTip(prediction, odds);
  predictions.push(betBuilderTip);

  return predictions;
}

/**
 * Get the best tip based on highest confidence
 */
function getBestTip(prediction: CompletePrediction, odds?: OddsData | null): FormattedAIPrediction {
  const candidates: { label: string; prediction: string; confidence: number; odds: number }[] = [];

  // 1x2 options
  const { homeWin, draw, awayWin, predicted } = prediction.matchOutcome;
  const maxOutcome = Math.max(homeWin, draw, awayWin);

  if (maxOutcome > 45) {
    candidates.push({
      label: '1x2',
      prediction: predicted,
      confidence: maxOutcome,
      odds: getOddsFor1x2(predicted, odds),
    });
  }

  // Over/Under options
  const lines = prediction.overUnder.lines;
  for (const [line, values] of Object.entries(lines)) {
    if (values.over > 60) {
      candidates.push({
        label: 'O/U',
        prediction: `O${line}`,
        confidence: values.over,
        odds: line === '2.5' ? (odds?.overUnder?.over25 || 1.85) : estimateOdds(values.over),
      });
    }
    if (values.under > 60) {
      candidates.push({
        label: 'O/U',
        prediction: `U${line}`,
        confidence: values.under,
        odds: line === '2.5' ? (odds?.overUnder?.under25 || 1.95) : estimateOdds(values.under),
      });
    }
  }

  // BTTS options
  if (prediction.btts.yes > 58) {
    candidates.push({
      label: 'BTTS',
      prediction: 'BTTS Yes',
      confidence: prediction.btts.yes,
      odds: odds?.btts?.yes || 1.80,
    });
  }
  if (prediction.btts.no > 58) {
    candidates.push({
      label: 'BTTS',
      prediction: 'BTTS No',
      confidence: prediction.btts.no,
      odds: odds?.btts?.no || 2.00,
    });
  }

  // Sort by confidence and pick best
  candidates.sort((a, b) => b.confidence - a.confidence);

  const best = candidates[0] || {
    prediction: prediction.overUnder.recommended,
    confidence: 55,
    odds: 1.75,
  };

  return {
    label: 'Best Tip',
    prediction: best.prediction,
    odds: roundOdds(best.odds),
    confidence: Math.round(best.confidence),
    oddsDirection: 'none',
  };
}

/**
 * Get 1x2 match outcome tip
 */
function getMatchOutcomeTip(prediction: CompletePrediction, odds?: OddsData | null): FormattedAIPrediction {
  const { homeWin, draw, awayWin, predicted } = prediction.matchOutcome;
  const confidence = Math.max(homeWin, draw, awayWin);

  return {
    label: '1x2 Tip',
    prediction: predicted,
    odds: roundOdds(getOddsFor1x2(predicted, odds)),
    confidence: Math.round(confidence),
    oddsDirection: 'none',
  };
}

/**
 * Get total goals tip
 */
function getTotalGoalsTip(prediction: CompletePrediction, odds?: OddsData | null): FormattedAIPrediction {
  const recommended = prediction.overUnder.recommended;
  const expectedGoals = prediction.overUnder.expectedGoals;

  // Determine confidence based on expected goals distance from line
  let confidence: number;
  let predictionStr: string;
  let tipOdds: number;

  if (expectedGoals > 2.8) {
    predictionStr = 'Over 2.5';
    confidence = prediction.overUnder.lines['2.5']?.over || 55;
    tipOdds = odds?.overUnder?.over25 || 1.85;
  } else if (expectedGoals < 2.2) {
    predictionStr = 'Under 2.5';
    confidence = prediction.overUnder.lines['2.5']?.under || 55;
    tipOdds = odds?.overUnder?.under25 || 1.95;
  } else {
    // Close to 2.5, use 3.5 line
    if (expectedGoals > 2.5) {
      predictionStr = 'Over 2.5';
      confidence = prediction.overUnder.lines['2.5']?.over || 50;
      tipOdds = odds?.overUnder?.over25 || 1.85;
    } else {
      predictionStr = 'Under 3.5';
      confidence = prediction.overUnder.lines['3.5']?.under || 55;
      tipOdds = 1.45; // U3.5 typical odds
    }
  }

  return {
    label: 'Total Goals',
    prediction: predictionStr,
    odds: roundOdds(tipOdds),
    confidence: Math.round(confidence),
    oddsDirection: 'none',
  };
}

/**
 * Get BTTS tip
 */
function getBTTSTip(prediction: CompletePrediction, odds?: OddsData | null): FormattedAIPrediction {
  const { yes, no, predicted } = prediction.btts;
  const confidence = Math.max(yes, no);

  return {
    label: 'Both Teams To Score',
    prediction: predicted,
    odds: roundOdds(predicted === 'Yes' ? (odds?.btts?.yes || 1.80) : (odds?.btts?.no || 2.00)),
    confidence: Math.round(confidence),
    oddsDirection: 'none',
  };
}

/**
 * Get Bet Builder combined tip
 */
function getBetBuilderTip(prediction: CompletePrediction, odds?: OddsData | null): FormattedAIPrediction {
  const { homeWin, draw, awayWin, predicted } = prediction.matchOutcome;
  const expectedGoals = prediction.overUnder.expectedGoals;

  let betParts: string[] = [];
  let combinedOdds = 1;
  let avgConfidence = 0;
  let partCount = 0;

  // Double chance based on match outcome
  if (homeWin > 40 && homeWin < 55) {
    betParts.push('1X');
    combinedOdds *= 1.35;
    avgConfidence += homeWin + prediction.matchOutcome.draw;
    partCount++;
  } else if (awayWin > 40 && awayWin < 55) {
    betParts.push('X2');
    combinedOdds *= 1.45;
    avgConfidence += awayWin + prediction.matchOutcome.draw;
    partCount++;
  } else if (homeWin >= 55) {
    betParts.push('1');
    combinedOdds *= getOddsFor1x2('1', odds);
    avgConfidence += homeWin;
    partCount++;
  } else if (awayWin >= 55) {
    betParts.push('2');
    combinedOdds *= getOddsFor1x2('2', odds);
    avgConfidence += awayWin;
    partCount++;
  } else {
    betParts.push('X2');
    combinedOdds *= 1.45;
    avgConfidence += awayWin + draw;
    partCount++;
  }

  // Add goals line
  if (expectedGoals < 3) {
    betParts.push('U4.5');
    combinedOdds *= 1.20;
    avgConfidence += prediction.overUnder.lines['3.5']?.under || 70;
    partCount++;
  } else {
    betParts.push('O1.5');
    combinedOdds *= 1.25;
    avgConfidence += prediction.overUnder.lines['1.5']?.over || 75;
    partCount++;
  }

  const finalConfidence = partCount > 0 ? avgConfidence / partCount : 50;

  return {
    label: 'Bet Builder Tip',
    prediction: betParts.join('&'),
    odds: roundOdds(combinedOdds),
    confidence: Math.round(Math.min(finalConfidence * 0.85, 70)), // Combined bets are harder
    oddsDirection: 'none',
  };
}

/**
 * Helper: Get odds for 1x2 prediction
 */
function getOddsFor1x2(predicted: string, odds?: OddsData | null): number {
  if (!odds?.matchWinner) {
    // Estimate based on typical odds
    if (predicted === '1') return 2.10;
    if (predicted === 'X') return 3.40;
    return 3.20;
  }

  if (predicted === '1') return odds.matchWinner.home;
  if (predicted === 'X') return odds.matchWinner.draw;
  return odds.matchWinner.away;
}

/**
 * Helper: Estimate odds from probability
 */
function estimateOdds(probability: number): number {
  if (probability <= 0) return 10;
  const decimal = 100 / probability;
  return roundOdds(decimal);
}

/**
 * Helper: Round odds to 2 decimal places
 */
function roundOdds(odds: number): number {
  return Math.round(odds * 100) / 100;
}
