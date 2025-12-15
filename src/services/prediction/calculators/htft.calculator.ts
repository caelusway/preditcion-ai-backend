import { BaseCalculator } from './base-calculator';
import {
  HTFTPrediction,
  PredictionType,
  PredictionFactor,
  HTFTResult,
  MatchOutcomePrediction,
} from '../../../types/prediction.types';

export class HTFTCalculator extends BaseCalculator {
  private matchOutcome: MatchOutcomePrediction | null = null;

  getType(): PredictionType {
    return 'htft';
  }

  /**
   * Set match outcome prediction for consistency
   */
  setMatchOutcome(outcome: MatchOutcomePrediction): void {
    this.matchOutcome = outcome;
  }

  calculate(): HTFTPrediction {
    const factors: PredictionFactor[] = [];

    // Use full-time probabilities from match outcome or calculate
    let ftProbs = {
      home: 0.4,
      draw: 0.25,
      away: 0.35,
    };

    if (this.matchOutcome) {
      ftProbs = {
        home: this.matchOutcome.homeWin / 100,
        draw: this.matchOutcome.draw / 100,
        away: this.matchOutcome.awayWin / 100,
      };
    }

    // Calculate half-time probabilities
    // HT tends to have more draws than FT
    const htProbs = this.calculateHalfTimeProbs(factors);

    // Calculate all 9 HT/FT combinations
    const combinations: HTFTResult[] = [];
    const htResults = ['1', 'X', '2'];
    const ftResults = ['1', 'X', '2'];

    for (const ht of htResults) {
      for (const ft of ftResults) {
        const htProb = htProbs[ht as keyof typeof htProbs];
        const ftProb = ftProbs[ft === '1' ? 'home' : ft === 'X' ? 'draw' : 'away'];

        // Calculate conditional probability
        // P(HT/FT) = P(HT) * P(FT|HT)
        const conditionalProb = this.calculateConditionalProb(ht, ft, htProb, ftProb);

        combinations.push({
          result: `${ht}/${ft}`,
          probability: this.round(conditionalProb * 100),
        });
      }
    }

    // Sort by probability
    combinations.sort((a, b) => b.probability - a.probability);

    // Normalize to 100%
    const total = combinations.reduce((sum, c) => sum + c.probability, 0);
    if (total > 0 && Math.abs(total - 100) > 1) {
      combinations.forEach(c => {
        c.probability = this.round((c.probability / total) * 100);
      });
    }

    const mostLikely = combinations[0].result;

    // Add common patterns factor
    factors.push(
      this.createFactor(
        'htft_pattern',
        `Most likely: ${mostLikely} (${combinations[0].probability}%)`,
        'neutral'
      )
    );

    // Confidence is moderate (HTFT is harder to predict)
    const certainty = combinations[0].probability / 50; // Max around 30-40%
    const confidence = Math.min(55, this.calculateConfidence(certainty));

    return {
      type: 'htft',
      predictions: combinations.slice(0, 9), // All 9 combinations
      mostLikely,
      confidence,
      factors,
    };
  }

  /**
   * Calculate half-time probabilities
   */
  private calculateHalfTimeProbs(factors: PredictionFactor[]): {
    '1': number;
    X: number;
    '2': number;
  } {
    // Default HT probabilities (more draws at HT)
    let htProbs = {
      '1': 0.30,
      X: 0.45,
      '2': 0.25,
    };

    // Adjust based on team stats if available
    if (this.data.homeStats && this.data.awayStats) {
      // Calculate first-half scoring tendencies from recent matches
      const homeFirstHalfStrength = this.calculateFirstHalfStrength('home');
      const awayFirstHalfStrength = this.calculateFirstHalfStrength('away');

      const strengthDiff = homeFirstHalfStrength - awayFirstHalfStrength;

      // Adjust probabilities
      htProbs = {
        '1': 0.30 + strengthDiff * 0.1,
        X: 0.45 - Math.abs(strengthDiff) * 0.05,
        '2': 0.25 - strengthDiff * 0.1,
      };

      // Ensure bounds
      htProbs['1'] = Math.max(0.15, Math.min(0.50, htProbs['1']));
      htProbs.X = Math.max(0.25, Math.min(0.55, htProbs.X));
      htProbs['2'] = Math.max(0.15, Math.min(0.45, htProbs['2']));

      // Normalize
      const total = htProbs['1'] + htProbs.X + htProbs['2'];
      htProbs['1'] /= total;
      htProbs.X /= total;
      htProbs['2'] /= total;
    }

    factors.push(
      this.createFactor(
        'ht_probs',
        `HT Probabilities: 1 ${Math.round(htProbs['1'] * 100)}%, X ${Math.round(htProbs.X * 100)}%, 2 ${Math.round(htProbs['2'] * 100)}%`,
        'neutral'
      )
    );

    return htProbs;
  }

  /**
   * Calculate first-half strength based on recent matches
   */
  private calculateFirstHalfStrength(team: 'home' | 'away'): number {
    const recentMatches = team === 'home' ? this.data.homeRecentForm : this.data.awayRecentForm;

    if (recentMatches.length === 0) return 0;

    // Simple approximation: teams scoring more goals tend to score earlier
    const avgGoals = recentMatches.slice(0, 5).reduce((sum, m) => sum + m.goalsScored, 0) / Math.min(5, recentMatches.length);

    // Higher scoring teams have better first half
    return (avgGoals - 1.3) / 1.3; // Normalize around league average
  }

  /**
   * Calculate conditional probability P(FT|HT)
   */
  private calculateConditionalProb(
    ht: string,
    ft: string,
    htProb: number,
    ftProb: number
  ): number {
    // Base conditional probabilities based on football patterns
    // P(FT|HT) depends heavily on HT result

    if (ht === '1') {
      // Leading at HT
      if (ft === '1') return htProb * 0.70; // Usually maintain lead
      if (ft === 'X') return htProb * 0.20; // Sometimes blow lead
      if (ft === '2') return htProb * 0.10; // Rarely lose from winning
    }

    if (ht === 'X') {
      // Draw at HT - most common scenario
      if (ft === '1') return htProb * ftProb * 1.1; // Slight boost for home
      if (ft === 'X') return htProb * 0.35; // Many stay draws
      if (ft === '2') return htProb * ftProb * 0.9;
    }

    if (ht === '2') {
      // Away leading at HT
      if (ft === '1') return htProb * 0.10; // Rarely comeback
      if (ft === 'X') return htProb * 0.20;
      if (ft === '2') return htProb * 0.70; // Usually maintain lead
    }

    return htProb * ftProb;
  }
}
