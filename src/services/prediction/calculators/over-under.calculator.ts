import { BaseCalculator } from './base-calculator';
import {
  OverUnderPrediction,
  PredictionType,
  PredictionFactor,
  OverUnderLine,
} from '../../../types/prediction.types';

export class OverUnderCalculator extends BaseCalculator {
  getType(): PredictionType {
    return 'over_under';
  }

  calculate(): OverUnderPrediction {
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
    const totalXG = homeXG + awayXG;

    factors.push(
      this.createFactor(
        'xG',
        `Total Expected Goals: ${this.round(totalXG)} (${this.round(homeXG)} + ${this.round(awayXG)})`,
        totalXG > 2.5 ? 'positive' : totalXG < 2.0 ? 'negative' : 'neutral'
      )
    );

    // Calculate probabilities for each line using Poisson
    const lines: { '0.5': OverUnderLine; '1.5': OverUnderLine; '2.5': OverUnderLine; '3.5': OverUnderLine } = {
      '0.5': this.calculateLine(totalXG, 0.5),
      '1.5': this.calculateLine(totalXG, 1.5),
      '2.5': this.calculateLine(totalXG, 2.5),
      '3.5': this.calculateLine(totalXG, 3.5),
    };

    // Check if we have valid odds
    const hasValidOdds = this.data.odds?.overUnder && this.data.odds.overUnder.over25 > 0;

    // Adjust with H2H data if available
    if (this.data.headToHead && this.data.headToHead.total > 0) {
      const h2hOver25Rate = (this.data.headToHead.over25Count / this.data.headToHead.total) * 100;

      factors.push(
        this.createFactor(
          'h2h_goals',
          `H2H O2.5: ${this.data.headToHead.over25Count}/${this.data.headToHead.total} matches (${Math.round(h2hOver25Rate)}%)`,
          h2hOver25Rate > 55 ? 'positive' : h2hOver25Rate < 45 ? 'negative' : 'neutral'
        )
      );

      // Blend weights depend on whether we have odds
      const h2hWeight = hasValidOdds ? 0.20 : 0.30;
      lines['2.5'].over = lines['2.5'].over * (1 - h2hWeight) + h2hOver25Rate * h2hWeight;
      lines['2.5'].under = 100 - lines['2.5'].over;
    }

    // Adjust with odds if available
    if (hasValidOdds) {
      const oddsOver = this.oddsToImpliedProbability(this.data.odds!.overUnder!.over25);
      const oddsUnder = this.oddsToImpliedProbability(this.data.odds!.overUnder!.under25);
      const oddsTotal = oddsOver + oddsUnder;
      const normalizedOver = (oddsOver / oddsTotal) * 100;

      // Blend with odds - bookmaker odds are highly accurate for goal markets
      lines['2.5'].over = lines['2.5'].over * 0.65 + normalizedOver * 0.35;
      lines['2.5'].under = 100 - lines['2.5'].over;

      factors.push(
        this.createFactor(
          'odds',
          `O2.5 Odds: Over ${this.data.odds!.overUnder!.over25.toFixed(2)} / Under ${this.data.odds!.overUnder!.under25.toFixed(2)}`,
          'neutral'
        )
      );
    }

    // Add recent scoring patterns
    this.addRecentGoalFactors(factors);

    // Round all values
    Object.keys(lines).forEach((key) => {
      const line = lines[key as keyof typeof lines];
      line.over = this.round(line.over);
      line.under = this.round(line.under);
    });

    // Determine recommended line (most confident prediction with value)
    const recommended = this.findRecommendedLine(lines, totalXG);

    // Confidence based on how decisive the 2.5 line is
    const certainty = Math.abs(lines['2.5'].over - 50) / 50;
    const confidence = this.calculateConfidence(certainty);

    return {
      type: 'over_under',
      lines,
      expectedGoals: this.round(totalXG),
      recommended,
      confidence,
      factors,
    };
  }

  /**
   * Calculate over/under probabilities for a specific line
   */
  private calculateLine(totalXG: number, line: number): OverUnderLine {
    // P(Under X) = P(0) + P(1) + ... + P(floor(X))
    const underProb = this.poissonCumulativeProbability(totalXG, Math.floor(line));
    const overProb = 1 - underProb;

    return {
      over: overProb * 100,
      under: underProb * 100,
    };
  }

  /**
   * Find the recommended line based on expected goals and confidence
   */
  private findRecommendedLine(
    lines: { '0.5': OverUnderLine; '1.5': OverUnderLine; '2.5': OverUnderLine; '3.5': OverUnderLine },
    totalXG: number
  ): string {
    // Find the line closest to totalXG for best value
    const lineValues = [0.5, 1.5, 2.5, 3.5];
    let bestLine = '2.5';
    let bestConfidence = 0;

    for (const lineVal of lineValues) {
      const key = lineVal.toString() as keyof typeof lines;
      const line = lines[key];
      const confidence = Math.abs(line.over - 50);

      // Prefer lines where we have strong conviction
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestLine = line.over > 50 ? `Over ${key}` : `Under ${key}`;
      }
    }

    // Default to most common market based on xG
    if (bestConfidence < 10) {
      if (totalXG > 2.8) return 'Over 2.5';
      if (totalXG < 2.2) return 'Under 2.5';
      return totalXG > 2.5 ? 'Over 2.5' : 'Under 2.5';
    }

    return bestLine;
  }

  /**
   * Add factors based on recent goal patterns
   */
  private addRecentGoalFactors(factors: PredictionFactor[]): void {
    // Home team recent goals
    if (this.data.homeRecentForm.length >= 5) {
      const homeGoals = this.data.homeRecentForm.slice(0, 5).reduce((sum, m) => sum + m.goalsScored, 0);
      const homeAvg = homeGoals / 5;
      factors.push(
        this.createFactor(
          'recent_goals',
          `${this.data.homeTeam.name} last 5: ${homeGoals} goals (avg. ${this.round(homeAvg)})`,
          homeAvg > 1.5 ? 'positive' : homeAvg < 1.0 ? 'negative' : 'neutral',
          'home'
        )
      );
    }

    // Away team recent goals
    if (this.data.awayRecentForm.length >= 5) {
      const awayGoals = this.data.awayRecentForm.slice(0, 5).reduce((sum, m) => sum + m.goalsScored, 0);
      const awayAvg = awayGoals / 5;
      factors.push(
        this.createFactor(
          'recent_goals',
          `${this.data.awayTeam.name} last 5: ${awayGoals} goals (avg. ${this.round(awayAvg)})`,
          awayAvg > 1.5 ? 'positive' : awayAvg < 1.0 ? 'negative' : 'neutral',
          'away'
        )
      );
    }
  }
}
