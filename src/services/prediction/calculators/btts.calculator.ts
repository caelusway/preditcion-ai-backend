import { BaseCalculator } from './base-calculator';
import {
  BTTSPrediction,
  PredictionType,
  PredictionFactor,
} from '../../../types/prediction.types';

export class BTTSCalculator extends BaseCalculator {
  getType(): PredictionType {
    return 'btts';
  }

  calculate(): BTTSPrediction {
    const factors: PredictionFactor[] = [];

    // Calculate probability of each team scoring
    const homeScoringProb = this.calculateScoringProbability('home', factors);
    const awayScoringProb = this.calculateScoringProbability('away', factors);

    // BTTS Yes = P(home scores) * P(away scores)
    let bttsYes = (homeScoringProb / 100) * (awayScoringProb / 100) * 100;

    // Adjust with H2H data if available
    if (this.data.headToHead && this.data.headToHead.total > 0) {
      const h2hBTTSRate = (this.data.headToHead.bttsCount / this.data.headToHead.total) * 100;

      factors.push(
        this.createFactor(
          'h2h_btts',
          `H2H BTTS: ${this.data.headToHead.bttsCount}/${this.data.headToHead.total} matches (${Math.round(h2hBTTSRate)}%)`,
          h2hBTTSRate > 50 ? 'positive' : h2hBTTSRate < 40 ? 'negative' : 'neutral'
        )
      );

      // Blend: 70% calculated, 30% H2H
      bttsYes = bttsYes * 0.7 + h2hBTTSRate * 0.3;
    }

    // Adjust with odds if available
    if (this.data.odds?.btts) {
      const oddsYes = this.oddsToImpliedProbability(this.data.odds.btts.yes);
      const oddsNo = this.oddsToImpliedProbability(this.data.odds.btts.no);
      const oddsTotal = oddsYes + oddsNo;
      const normalizedOddsYes = (oddsYes / oddsTotal) * 100;

      // Blend: 80% calculated, 20% odds
      bttsYes = bttsYes * 0.8 + normalizedOddsYes * 0.2;

      factors.push(
        this.createFactor(
          'odds',
          `BTTS Odds: Yes ${this.data.odds.btts.yes.toFixed(2)} / No ${this.data.odds.btts.no.toFixed(2)}`,
          'neutral'
        )
      );
    }

    // Ensure bounds
    bttsYes = Math.max(15, Math.min(85, bttsYes));
    const bttsNo = 100 - bttsYes;

    const predicted = bttsYes > 50 ? 'Yes' : 'No';

    // Confidence based on how far from 50% (more certain = more confident)
    const certainty = Math.abs(bttsYes - 50) / 50;
    const confidence = this.calculateConfidence(certainty);

    return {
      type: 'btts',
      yes: this.round(bttsYes),
      no: this.round(bttsNo),
      predicted,
      confidence,
      factors,
    };
  }

  /**
   * Calculate probability of a team scoring
   */
  private calculateScoringProbability(
    team: 'home' | 'away',
    factors: PredictionFactor[]
  ): number {
    const stats = team === 'home' ? this.data.homeStats : this.data.awayStats;
    const opponentStats = team === 'home' ? this.data.awayStats : this.data.homeStats;
    const teamInfo = team === 'home' ? this.data.homeTeam : this.data.awayTeam;
    const recentMatches = team === 'home' ? this.data.homeRecentForm : this.data.awayRecentForm;

    // Default scoring probability - reduced from 70% to 65% for more balanced predictions
    let scoringProb = 65;

    if (stats) {
      // Calculate from stats
      const played = team === 'home'
        ? stats.fixtures.played.home
        : stats.fixtures.played.away;
      const failedToScore = team === 'home'
        ? stats.failedToScore.home
        : stats.failedToScore.away;

      if (played > 0) {
        scoringProb = ((played - failedToScore) / played) * 100;
      }

      // Add factor
      factors.push(
        this.createFactor(
          'scoring_rate',
          `${teamInfo.name} scoring: ${Math.round(scoringProb)}% (${played - failedToScore}/${played} matches)`,
          scoringProb > 70 ? 'positive' : scoringProb < 50 ? 'negative' : 'neutral',
          team
        )
      );
    }

    // Consider opponent's clean sheet rate
    if (opponentStats) {
      const opponentPlayed = team === 'home'
        ? opponentStats.fixtures.played.away
        : opponentStats.fixtures.played.home;
      const opponentCleanSheets = team === 'home'
        ? opponentStats.cleanSheet.away
        : opponentStats.cleanSheet.home;

      if (opponentPlayed > 0) {
        const cleanSheetRate = (opponentCleanSheets / opponentPlayed) * 100;
        // Reduce scoring probability based on opponent's clean sheet ability
        scoringProb = scoringProb * (1 - cleanSheetRate / 200); // Max 50% reduction
      }
    }

    // Adjust with recent form
    if (recentMatches.length > 0) {
      const recentScored = recentMatches.slice(0, 5).filter(m => m.goalsScored > 0).length;
      const recentScoringRate = (recentScored / Math.min(5, recentMatches.length)) * 100;

      // Blend: 70% season stats, 30% recent form
      scoringProb = scoringProb * 0.7 + recentScoringRate * 0.3;
    }

    return Math.max(25, Math.min(90, scoringProb));
  }
}
