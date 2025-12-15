import { BaseCalculator } from './base-calculator';
import {
  MatchOutcomePrediction,
  PredictionType,
  PredictionFactor,
} from '../../../types/prediction.types';

export class MatchOutcomeCalculator extends BaseCalculator {
  getType(): PredictionType {
    return 'match_outcome';
  }

  calculate(): MatchOutcomePrediction {
    const factors: PredictionFactor[] = [];

    // Calculate expected goals using Poisson model
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

    // 1. Poisson-based probabilities (40% weight)
    const poissonProbs = this.calculatePoissonProbabilities(homeXG, awayXG);

    // 2. Form-based probabilities (25% weight)
    const formProbs = this.calculateFormProbabilities(factors);

    // 3. Standings-based probabilities (15% weight)
    const standingsProbs = this.calculateStandingsProbabilities(factors);

    // 4. H2H-based probabilities (10% weight)
    const h2hProbs = this.calculateH2HProbabilities(factors);

    // 5. Odds-implied probabilities (10% weight)
    const oddsProbs = this.calculateOddsProbabilities(factors);

    // Combine all probabilities with weights
    // Increased odds weight as bookmaker odds already account for real home advantage
    const weights = {
      poisson: 0.35,
      form: 0.20,
      standings: 0.15,
      h2h: 0.10,
      odds: 0.20, // Increased from 0.10 - odds are historically most accurate
    };

    let homeWin =
      poissonProbs.homeWin * weights.poisson +
      formProbs.homeWin * weights.form +
      standingsProbs.homeWin * weights.standings +
      h2hProbs.homeWin * weights.h2h +
      oddsProbs.homeWin * weights.odds;

    let draw =
      poissonProbs.draw * weights.poisson +
      formProbs.draw * weights.form +
      standingsProbs.draw * weights.standings +
      h2hProbs.draw * weights.h2h +
      oddsProbs.draw * weights.odds;

    let awayWin =
      poissonProbs.awayWin * weights.poisson +
      formProbs.awayWin * weights.form +
      standingsProbs.awayWin * weights.standings +
      h2hProbs.awayWin * weights.h2h +
      oddsProbs.awayWin * weights.odds;

    // Normalize to 100%
    const normalized = this.normalizeProbabilities([homeWin, draw, awayWin]);
    homeWin = this.round(normalized[0]);
    draw = this.round(normalized[1]);
    awayWin = this.round(normalized[2]);

    // Determine prediction
    // Predict draw when probabilities are close (within 5%) and draw is substantial
    let predicted: '1' | 'X' | '2' = '1';
    const margin = Math.abs(homeWin - awayWin);

    if (draw >= homeWin && draw >= awayWin) {
      predicted = 'X';
    } else if (draw >= 28 && margin < 5) {
      // When home/away are very close and draw is reasonable, predict draw
      predicted = 'X';
    } else if (awayWin > homeWin) {
      predicted = '2';
    }

    // Calculate confidence based on margin between top prediction and others
    const maxProb = Math.max(homeWin, draw, awayWin);
    const certainty = (maxProb - 33.33) / 66.67; // How far from equal split
    const confidence = this.calculateConfidence(certainty);

    // Add summary factor
    factors.unshift(
      this.createFactor(
        'xG',
        `Expected Goals: ${this.round(homeXG)} vs ${this.round(awayXG)}`,
        homeXG > awayXG ? 'positive' : homeXG < awayXG ? 'negative' : 'neutral',
        homeXG > awayXG ? 'home' : 'away'
      )
    );

    return {
      type: 'match_outcome',
      homeWin,
      draw,
      awayWin,
      predicted,
      confidence,
      factors,
    };
  }

  /**
   * Calculate probabilities using Poisson distribution
   */
  private calculatePoissonProbabilities(homeXG: number, awayXG: number): {
    homeWin: number;
    draw: number;
    awayWin: number;
  } {
    let homeWin = 0;
    let draw = 0;
    let awayWin = 0;

    // Calculate for goals 0-6
    const maxGoals = 6;
    for (let h = 0; h <= maxGoals; h++) {
      for (let a = 0; a <= maxGoals; a++) {
        const prob = this.poissonProbability(homeXG, h) * this.poissonProbability(awayXG, a);
        if (h > a) homeWin += prob;
        else if (h < a) awayWin += prob;
        else draw += prob;
      }
    }

    // Convert to percentages
    const total = homeWin + draw + awayWin;
    return {
      homeWin: (homeWin / total) * 100,
      draw: (draw / total) * 100,
      awayWin: (awayWin / total) * 100,
    };
  }

  /**
   * Calculate probabilities based on recent form
   */
  private calculateFormProbabilities(factors: PredictionFactor[]): {
    homeWin: number;
    draw: number;
    awayWin: number;
  } {
    const homeForm = this.calculateFormStrength(this.data.homeRecentForm);
    const awayForm = this.calculateFormStrength(this.data.awayRecentForm);

    // Add form factors
    if (this.data.homeRecentForm.length > 0) {
      const homeFormStr = this.data.homeRecentForm.slice(0, 5).map(m => m.result).join('');
      const homeWins = this.data.homeRecentForm.slice(0, 5).filter(m => m.result === 'W').length;
      factors.push(
        this.createFactor(
          'form',
          `${this.data.homeTeam.name} last 5: ${homeFormStr} (${homeWins}W)`,
          homeForm > 60 ? 'positive' : homeForm < 40 ? 'negative' : 'neutral',
          'home'
        )
      );
    }

    if (this.data.awayRecentForm.length > 0) {
      const awayFormStr = this.data.awayRecentForm.slice(0, 5).map(m => m.result).join('');
      const awayWins = this.data.awayRecentForm.slice(0, 5).filter(m => m.result === 'W').length;
      factors.push(
        this.createFactor(
          'form',
          `${this.data.awayTeam.name} last 5: ${awayFormStr} (${awayWins}W)`,
          awayForm > 60 ? 'positive' : awayForm < 40 ? 'negative' : 'neutral',
          'away'
        )
      );
    }

    // Convert form to probabilities
    const formDiff = homeForm - awayForm;
    const homeAdvantage = 2; // Reduced from 5% to 2% based on modern football data

    // Logistic function to convert form difference to probability
    const homeWinBase = 33.33 + formDiff * 0.25 + homeAdvantage;
    const awayWinBase = 33.33 - formDiff * 0.25;
    const drawBase = 100 - homeWinBase - awayWinBase;

    return {
      homeWin: Math.max(10, Math.min(70, homeWinBase)),
      draw: Math.max(15, Math.min(40, drawBase)),
      awayWin: Math.max(10, Math.min(70, awayWinBase)),
    };
  }

  /**
   * Calculate probabilities based on standings
   */
  private calculateStandingsProbabilities(factors: PredictionFactor[]): {
    homeWin: number;
    draw: number;
    awayWin: number;
  } {
    if (!this.data.standings) {
      return { homeWin: 35, draw: 30, awayWin: 35 }; // Balanced default
    }

    const homeStrength = this.calculatePositionStrength(
      this.data.standings.homePosition,
      this.data.standings.totalTeams
    );
    const awayStrength = this.calculatePositionStrength(
      this.data.standings.awayPosition,
      this.data.standings.totalTeams
    );

    // Add standings factor
    factors.push(
      this.createFactor(
        'standings',
        `Position: ${this.data.standings.homePosition}th vs ${this.data.standings.awayPosition}th (${this.data.standings.totalTeams} teams)`,
        homeStrength > awayStrength ? 'positive' : homeStrength < awayStrength ? 'negative' : 'neutral',
        homeStrength > awayStrength ? 'home' : 'away'
      )
    );

    const strengthDiff = homeStrength - awayStrength;

    return {
      homeWin: 33.33 + strengthDiff * 0.2 + 2, // Reduced home advantage from +5 to +2
      draw: 28,
      awayWin: 33.33 - strengthDiff * 0.2,
    };
  }

  /**
   * Calculate probabilities based on head-to-head
   */
  private calculateH2HProbabilities(factors: PredictionFactor[]): {
    homeWin: number;
    draw: number;
    awayWin: number;
  } {
    if (!this.data.headToHead || this.data.headToHead.total === 0) {
      return { homeWin: 35, draw: 30, awayWin: 35 }; // Balanced default when no H2H data
    }

    const h2h = this.data.headToHead;
    const homeWinRate = (h2h.homeWins / h2h.total) * 100;
    const drawRate = (h2h.draws / h2h.total) * 100;
    const awayWinRate = (h2h.awayWins / h2h.total) * 100;

    // Add H2H factor
    factors.push(
      this.createFactor(
        'h2h',
        `Last ${h2h.total} H2H: ${h2h.homeWins}W-${h2h.draws}D-${h2h.awayWins}L`,
        homeWinRate > awayWinRate ? 'positive' : homeWinRate < awayWinRate ? 'negative' : 'neutral',
        homeWinRate > awayWinRate ? 'home' : 'away'
      )
    );

    return {
      homeWin: homeWinRate || 35,
      draw: drawRate || 30,
      awayWin: awayWinRate || 35,
    };
  }

  /**
   * Calculate probabilities from bookmaker odds
   */
  private calculateOddsProbabilities(factors: PredictionFactor[]): {
    homeWin: number;
    draw: number;
    awayWin: number;
  } {
    if (!this.data.odds || !this.data.odds.matchWinner.home) {
      return { homeWin: 35, draw: 30, awayWin: 35 }; // Balanced default when no odds data
    }

    const odds = this.data.odds.matchWinner;

    // Convert odds to probabilities
    const homeProb = this.oddsToImpliedProbability(odds.home);
    const drawProb = this.oddsToImpliedProbability(odds.draw);
    const awayProb = this.oddsToImpliedProbability(odds.away);

    // Remove overround (normalize to 100%)
    const total = homeProb + drawProb + awayProb;
    const normalized = {
      homeWin: (homeProb / total) * 100,
      draw: (drawProb / total) * 100,
      awayWin: (awayProb / total) * 100,
    };

    // Add odds factor
    factors.push(
      this.createFactor(
        'odds',
        `Oranlar: ${odds.home.toFixed(2)} - ${odds.draw.toFixed(2)} - ${odds.away.toFixed(2)}`,
        'neutral'
      )
    );

    return normalized;
  }
}
