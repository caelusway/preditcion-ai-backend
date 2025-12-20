import {
  AggregatedMatchData,
  CalculatorResult,
  PredictionFactor,
  PredictionType,
  TeamSeasonStats,
  RecentMatchData,
} from '../../../types/prediction.types';

export abstract class BaseCalculator {
  protected data: AggregatedMatchData;

  constructor(data: AggregatedMatchData) {
    this.data = data;
  }

  /**
   * Main calculation method - must be implemented by subclasses
   */
  abstract calculate(): CalculatorResult;

  /**
   * Get the type of prediction this calculator produces
   */
  abstract getType(): PredictionType;

  // ===== UTILITY METHODS =====

  /**
   * Calculate factorial for Poisson distribution
   */
  protected factorial(n: number): number {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  /**
   * Calculate Poisson probability P(X = k) for given lambda
   */
  protected poissonProbability(lambda: number, k: number): number {
    if (lambda <= 0) return k === 0 ? 1 : 0;
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / this.factorial(k);
  }

  /**
   * Calculate cumulative Poisson probability P(X <= k)
   */
  protected poissonCumulativeProbability(lambda: number, k: number): number {
    let sum = 0;
    for (let i = 0; i <= k; i++) {
      sum += this.poissonProbability(lambda, i);
    }
    return sum;
  }

  /**
   * Normalize probabilities to sum to 100%
   */
  protected normalizeProbabilities(probs: number[]): number[] {
    const sum = probs.reduce((a, b) => a + b, 0);
    if (sum === 0) return probs.map(() => 100 / probs.length);
    return probs.map((p) => (p / sum) * 100);
  }

  /**
   * Convert odds to implied probability (removing vig)
   */
  protected oddsToImpliedProbability(odds: number): number {
    if (odds <= 1) return 0;
    return (1 / odds) * 100;
  }

  /**
   * Calculate expected goals for a team
   * Uses combination of team stats and opponent stats
   */
  protected calculateExpectedGoals(teamStats: TeamSeasonStats | null, opponentStats: TeamSeasonStats | null, isHome: boolean): number {
    // Default expected goals if no stats - based on Top 5 leagues 2023-24 average
    const DEFAULT_XG = 1.40;

    if (!teamStats) return isHome ? DEFAULT_XG * 1.08 : DEFAULT_XG;

    // Team's scoring rate
    const teamScoringAvg = isHome
      ? teamStats.goals.for.average.home
      : teamStats.goals.for.average.away;

    // Opponent's conceding rate
    const opponentConcedingAvg = opponentStats
      ? isHome
        ? opponentStats.goals.against.average.away
        : opponentStats.goals.against.average.home
      : DEFAULT_XG;

    // Top 5 European leagues average goals per team per game: ~1.40-1.50
    // Using 1.42 as calibrated baseline
    const LEAGUE_AVG = 1.42;

    // Calculate xG using Dixon-Coles style adjustment
    // (Team attack strength * Opponent defense weakness) * League average
    const attackStrength = teamScoringAvg > 0 ? teamScoringAvg / LEAGUE_AVG : 1.0;
    const defenseWeakness = opponentConcedingAvg > 0 ? opponentConcedingAvg / LEAGUE_AVG : 1.0;

    let xG = attackStrength * defenseWeakness * LEAGUE_AVG;

    // Home advantage: European data shows ~8% goal increase at home
    // Post-COVID data shows this has decreased slightly to 6-7%
    if (isHome) {
      xG *= 1.08;
    }

    // Cap between 0.4 and 3.5 (more realistic range)
    return Math.max(0.4, Math.min(3.5, xG));
  }

  /**
   * Calculate form strength from recent matches (0-100)
   * Weights recent matches more heavily
   * IMPROVED: Better draw valuation (50 points = neutral, not 40)
   */
  protected calculateFormStrength(recentMatches: RecentMatchData[]): number {
    if (recentMatches.length === 0) return 50; // Neutral

    // Weights for recency (most recent = highest weight)
    // Steeper decay to emphasize recent form more
    const weights = [1.0, 0.85, 0.72, 0.61, 0.52, 0.44, 0.37, 0.32, 0.27, 0.23];

    let totalWeight = 0;
    let weightedScore = 0;

    recentMatches.slice(0, 10).forEach((match, index) => {
      const weight = weights[index] || 0.2;
      totalWeight += weight;

      let score = 0;
      // Win = 100, Draw = 50 (neutral), Loss = 0
      // This better reflects actual point system (3-1-0)
      if (match.result === 'W') score = 100;
      else if (match.result === 'D') score = 50;  // Changed from 40 to 50
      else score = 0;

      // Goal difference adjustment (smaller effect)
      const goalDiff = match.goalsScored - match.goalsConceded;
      score += goalDiff * 3; // Reduced from 5 to 3
      score = Math.max(0, Math.min(100, score));

      weightedScore += score * weight;
    });

    return totalWeight > 0 ? weightedScore / totalWeight : 50;
  }

  /**
   * Calculate team strength from standings position (0-100)
   */
  protected calculatePositionStrength(position: number, totalTeams: number): number {
    if (!position || !totalTeams) return 50;
    // Top team = 100, bottom team = 0
    return ((totalTeams - position) / (totalTeams - 1)) * 100;
  }

  /**
   * Get home advantage multiplier based on stats
   */
  protected getHomeAdvantageMultiplier(): number {
    const homeStats = this.data.homeStats;
    if (!homeStats) return 1.05; // Default 5% advantage

    const homeWinRate = homeStats.fixtures.played.home > 0
      ? homeStats.fixtures.wins.home / homeStats.fixtures.played.home
      : 0.5;

    // Scale from 1.0 to 1.15 based on home win rate
    return 1.0 + homeWinRate * 0.15;
  }

  /**
   * Calculate H2H advantage factor (-1 to 1)
   * Positive = home team advantage, Negative = away team advantage
   */
  protected calculateH2HAdvantage(): number {
    const h2h = this.data.headToHead;
    if (!h2h || h2h.total === 0) return 0;

    const homeWinRate = h2h.homeWins / h2h.total;
    const awayWinRate = h2h.awayWins / h2h.total;

    return homeWinRate - awayWinRate;
  }

  /**
   * Calculate confidence based on data quality and prediction certainty
   */
  protected calculateConfidence(predictionCertainty: number): number {
    const dataQuality = this.data.dataQuality.score / 100;
    const certaintyFactor = predictionCertainty; // Already 0-1

    // Weighted average: 60% certainty, 40% data quality
    const baseConfidence = certaintyFactor * 0.6 + dataQuality * 0.4;

    // Scale to 0-100 with max of 95 (nothing is certain)
    return Math.min(95, Math.round(baseConfidence * 100));
  }

  /**
   * Create a prediction factor
   */
  protected createFactor(
    type: string,
    description: string,
    impact: 'positive' | 'negative' | 'neutral',
    team?: 'home' | 'away',
    weight?: number
  ): PredictionFactor {
    return { type, description, impact, team, weight };
  }

  /**
   * Round to specified decimal places
   */
  protected round(value: number, decimals: number = 1): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
}
