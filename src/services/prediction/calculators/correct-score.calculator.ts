import { BaseCalculator } from './base-calculator';
import {
  CorrectScorePrediction,
  PredictionType,
  PredictionFactor,
  ScoreProbability,
} from '../../../types/prediction.types';

export class CorrectScoreCalculator extends BaseCalculator {
  getType(): PredictionType {
    return 'correct_score';
  }

  calculate(): CorrectScorePrediction {
    const factors: PredictionFactor[] = [];

    // Calculate expected goals for each team
    const homeXG = this.calculateExpectedGoals(
      this.data.homeStats,
      this.data.awayStats,
      true
    );
    const awayXG = this.calculateExpectedGoals(
      this.data.awayStats,
      this.data.homeStats,
      false
    );

    factors.push(
      this.createFactor(
        'xG',
        `Expected Score: ${this.round(homeXG)} - ${this.round(awayXG)}`,
        'neutral'
      )
    );

    // Build probability matrix for scores 0-5
    const maxGoals = 5;
    const scoreProbabilities: ScoreProbability[] = [];

    for (let homeGoals = 0; homeGoals <= maxGoals; homeGoals++) {
      for (let awayGoals = 0; awayGoals <= maxGoals; awayGoals++) {
        const homeProb = this.poissonProbability(homeXG, homeGoals);
        const awayProb = this.poissonProbability(awayXG, awayGoals);
        const probability = homeProb * awayProb * 100;

        scoreProbabilities.push({
          score: `${homeGoals}-${awayGoals}`,
          probability: this.round(probability, 2),
        });
      }
    }

    // Sort by probability (highest first)
    scoreProbabilities.sort((a, b) => b.probability - a.probability);

    // Get top 10 predictions
    const topPredictions = scoreProbabilities.slice(0, 10);
    const mostLikely = topPredictions[0].score;

    // Add H2H common scores
    if (this.data.headToHead && this.data.headToHead.matches.length > 0) {
      const commonScores = this.findCommonH2HScores();
      if (commonScores.length > 0) {
        factors.push(
          this.createFactor(
            'h2h_scores',
            `H2H Common Scores: ${commonScores.slice(0, 3).join(', ')}`,
            'neutral'
          )
        );
      }
    }

    // Add typical result type
    const mostLikelyParts = mostLikely.split('-').map(Number);
    const resultType = this.describeResult(mostLikelyParts[0], mostLikelyParts[1]);
    factors.push(
      this.createFactor(
        'result_type',
        `Expected Result: ${resultType}`,
        mostLikelyParts[0] > mostLikelyParts[1] ? 'positive' : mostLikelyParts[0] < mostLikelyParts[1] ? 'negative' : 'neutral',
        mostLikelyParts[0] > mostLikelyParts[1] ? 'home' : 'away'
      )
    );

    // Confidence is lower for correct score (harder to predict)
    // Base confidence on top prediction probability
    const certainty = topPredictions[0].probability / 20; // Max ~15% for single score
    const confidence = Math.min(60, this.calculateConfidence(certainty));

    return {
      type: 'correct_score',
      topPredictions,
      mostLikely,
      confidence,
      factors,
    };
  }

  /**
   * Find common scores from H2H matches
   */
  private findCommonH2HScores(): string[] {
    if (!this.data.headToHead?.matches) return [];

    const scoreCounts: Record<string, number> = {};

    for (const match of this.data.headToHead.matches) {
      const score = `${match.homeScore}-${match.awayScore}`;
      scoreCounts[score] = (scoreCounts[score] || 0) + 1;
    }

    // Sort by frequency
    return Object.entries(scoreCounts)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, count]) => count > 1)
      .map(([score, count]) => `${score} (${count}x)`);
  }

  /**
   * Describe the result type in English
   */
  private describeResult(homeGoals: number, awayGoals: number): string {
    const totalGoals = homeGoals + awayGoals;

    if (homeGoals === awayGoals) {
      if (totalGoals === 0) return 'Goalless draw';
      return `${homeGoals}-${awayGoals} draw`;
    }

    const winner = homeGoals > awayGoals ? 'Home' : 'Away';
    const margin = Math.abs(homeGoals - awayGoals);

    if (totalGoals <= 1) return `Low-scoring ${winner.toLowerCase()} win`;
    if (totalGoals >= 5) return `High-scoring ${winner.toLowerCase()} win`;
    if (margin >= 3) return `Comfortable ${winner.toLowerCase()} win`;

    return `${winner} win`;
  }
}
