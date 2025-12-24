/**
 * Evaluates if a prediction was correct based on match result
 */

interface PredictionInput {
  label: string;
  prediction: string;
}

/**
 * Evaluates if a prediction occurred (was correct) based on match score
 * @returns boolean if match is finished, undefined if match not finished
 */
export function evaluatePrediction(
  prediction: PredictionInput,
  homeScore: number | null,
  awayScore: number | null,
  matchStatus: string
): boolean | undefined {
  // Only evaluate finished matches
  if (matchStatus !== 'finished' || homeScore === null || awayScore === null) {
    return undefined;
  }

  const totalGoals = homeScore + awayScore;
  const predValue = prediction.prediction.toUpperCase();
  const label = prediction.label.toLowerCase();

  // 1x2 Tip evaluation
  if (label.includes('1x2')) {
    if (predValue === '1') return homeScore > awayScore;
    if (predValue === '2') return awayScore > homeScore;
    if (predValue === 'X') return homeScore === awayScore;
  }

  // Total Goals / Over-Under evaluation
  if (label.includes('total goals') || label.includes('best tip')) {
    return evaluateOverUnder(predValue, totalGoals);
  }

  // Both Teams To Score
  if (label.includes('both teams') || label.includes('btts')) {
    const bothScored = homeScore > 0 && awayScore > 0;
    if (predValue === 'YES') return bothScored;
    if (predValue === 'NO') return !bothScored;
  }

  // Bet Builder (combined predictions like "X2&U5.5")
  if (label.includes('bet builder')) {
    return evaluateBetBuilder(predValue, homeScore, awayScore, totalGoals);
  }

  return undefined;
}

/**
 * Evaluates Over/Under predictions
 */
function evaluateOverUnder(prediction: string, totalGoals: number): boolean | undefined {
  // Match patterns like "O2.5", "U3.5", "OVER 2.5", "UNDER 3.5"
  const overMatch = prediction.match(/(?:OVER\s*|O)(\d+\.?\d*)/i);
  const underMatch = prediction.match(/(?:UNDER\s*|U)(\d+\.?\d*)/i);

  if (overMatch) {
    const threshold = parseFloat(overMatch[1]);
    return totalGoals > threshold;
  }

  if (underMatch) {
    const threshold = parseFloat(underMatch[1]);
    return totalGoals < threshold;
  }

  return undefined;
}

/**
 * Evaluates Bet Builder (combined) predictions
 * Examples: "X2&U5.5", "1X&O1.5"
 */
function evaluateBetBuilder(
  prediction: string,
  homeScore: number,
  awayScore: number,
  totalGoals: number
): boolean | undefined {
  // Split by & to get individual conditions
  const conditions = prediction.split('&');

  for (const condition of conditions) {
    const cond = condition.trim().toUpperCase();

    // Double chance: 1X, X2, 12
    if (cond === '1X') {
      if (!(homeScore >= awayScore)) return false; // Home win or draw
    } else if (cond === 'X2') {
      if (!(awayScore >= homeScore)) return false; // Away win or draw
    } else if (cond === '12') {
      if (homeScore === awayScore) return false; // Not a draw
    }
    // 1x2
    else if (cond === '1') {
      if (!(homeScore > awayScore)) return false;
    } else if (cond === '2') {
      if (!(awayScore > homeScore)) return false;
    } else if (cond === 'X') {
      if (!(homeScore === awayScore)) return false;
    }
    // Over/Under
    else {
      const overUnderResult = evaluateOverUnder(cond, totalGoals);
      if (overUnderResult === false) return false;
      if (overUnderResult === undefined) {
        // Unknown condition, skip
      }
    }
  }

  return true;
}

/**
 * Adds isOccured to each prediction in the array
 */
export function addIsOccuredToPredictions(
  predictions: PredictionInput[],
  homeScore: number | null,
  awayScore: number | null,
  matchStatus: string
): (PredictionInput & { isOccured?: boolean })[] {
  return predictions.map(pred => ({
    ...pred,
    isOccured: evaluatePrediction(pred, homeScore, awayScore, matchStatus),
  }));
}
