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
    // Default expected goals if no stats
    const DEFAULT_XG = 1.3;

    if (!teamStats) return DEFAULT_XG;

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

    // League average (approximate)
    const LEAGUE_AVG = 1.4;

    // Calculate xG as adjustment from average
    // (Team attack strength * Opponent defense weakness) * League average
    const attackStrength = teamScoringAvg / LEAGUE_AVG;
    const defenseWeakness = opponentConcedingAvg / LEAGUE_AVG;

    let xG = attackStrength * defenseWeakness * LEAGUE_AVG;

    // Apply home advantage (+5% for home team - reduced from 10% based on modern data)
    if (isHome) {
      xG *= 1.05;
    }

    // Cap between 0.3 and 4.0
    return Math.max(0.3, Math.min(4.0, xG));
  }

  /**
   * Calculate form strength from recent matches (0-100)
   * Weights recent matches more heavily
   */
  protected calculateFormStrength(recentMatches: RecentMatchData[]): number {
    if (recentMatches.length === 0) return 50; // Neutral

    // Weights for recency (most recent = highest weight)
    const weights = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3];

    let totalWeight = 0;
    let weightedScore = 0;

    recentMatches.slice(0, 10).forEach((match, index) => {
      const weight = weights[index] || 0.3;
      totalWeight += weight;

      let score = 0;
      if (match.result === 'W') score = 100;
      else if (match.result === 'D') score = 40;
      else score = 0;

      // Bonus for high-scoring wins, penalty for heavy defeats
      const goalDiff = match.goalsScored - match.goalsConceded;
      score += goalDiff * 5;
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
