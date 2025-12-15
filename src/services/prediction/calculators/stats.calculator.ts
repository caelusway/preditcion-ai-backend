import { BaseCalculator } from './base-calculator';
import {
  StatsPrediction,
  PredictionType,
  PredictionFactor,
} from '../../../types/prediction.types';

export class StatsCalculator extends BaseCalculator {
  getType(): PredictionType {
    return 'stats';
  }

  calculate(): StatsPrediction {
    const factors: PredictionFactor[] = [];

    // Calculate expected goals
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

    // Calculate possession
    const possession = this.predictPossession(factors);

    // Calculate shots
    const shots = this.predictShots(factors);

    // Calculate shots on target (typically 30-35% of total shots)
    const shotsOnTarget = {
      home: Math.round(shots.home * 0.33),
      away: Math.round(shots.away * 0.33),
    };

    // Calculate corners
    const corners = this.predictCorners(factors);

    // Overall stats confidence
    const hasGoodData = this.data.dataQuality.score >= 60;
    const confidence = hasGoodData ? 65 : 45;

    factors.push(
      this.createFactor(
        'data_quality',
        `Data quality: ${this.data.dataQuality.score}% (${this.data.dataQuality.reliability})`,
        hasGoodData ? 'positive' : 'negative'
      )
    );

    return {
      type: 'stats',
      expectedGoals: {
        home: this.round(homeXG, 2),
        away: this.round(awayXG, 2),
      },
      possession,
      totalShots: shots,
      shotsOnTarget,
      corners,
      confidence,
      factors,
    };
  }

  /**
   * Predict possession percentages
   */
  private predictPossession(factors: PredictionFactor[]): { home: number; away: number } {
    // Default possession
    let homePossession = 52; // Slight home advantage
    let awayPossession = 48;

    // Adjust based on team strength
    if (this.data.standings) {
      const homeStrength = this.calculatePositionStrength(
        this.data.standings.homePosition,
        this.data.standings.totalTeams
      );
      const awayStrength = this.calculatePositionStrength(
        this.data.standings.awayPosition,
        this.data.standings.totalTeams
      );

      // Better teams tend to have more possession
      const strengthDiff = (homeStrength - awayStrength) / 100;
      homePossession += strengthDiff * 10;
      awayPossession -= strengthDiff * 10;
    }

    // Adjust based on recent form (winning teams often have more possession)
    const homeFormStrength = this.calculateFormStrength(this.data.homeRecentForm);
    const awayFormStrength = this.calculateFormStrength(this.data.awayRecentForm);
    const formDiff = (homeFormStrength - awayFormStrength) / 100;
    homePossession += formDiff * 5;
    awayPossession -= formDiff * 5;

    // Ensure bounds and normalize to 100
    homePossession = Math.max(35, Math.min(65, homePossession));
    awayPossession = 100 - homePossession;

    factors.push(
      this.createFactor(
        'possession',
        `Expected Possession: ${Math.round(homePossession)}% - ${Math.round(awayPossession)}%`,
        homePossession > 55 ? 'positive' : homePossession < 45 ? 'negative' : 'neutral',
        homePossession > 55 ? 'home' : homePossession < 45 ? 'away' : undefined
      )
    );

    return {
      home: Math.round(homePossession),
      away: Math.round(awayPossession),
    };
  }

  /**
   * Predict total shots for each team
   */
  private predictShots(factors: PredictionFactor[]): { home: number; away: number } {
    // League average shots per game per team
    const LEAGUE_AVG_SHOTS = 12;

    let homeShots = LEAGUE_AVG_SHOTS;
    let awayShots = LEAGUE_AVG_SHOTS - 1; // Away teams typically have fewer shots

    // Adjust based on team attacking strength
    if (this.data.homeStats) {
      const homeGoalRate = this.data.homeStats.goals.for.average.home;
      const attackMultiplier = homeGoalRate / 1.4; // 1.4 is approx league average
      homeShots *= attackMultiplier;
    }

    if (this.data.awayStats) {
      const awayGoalRate = this.data.awayStats.goals.for.average.away;
      const attackMultiplier = awayGoalRate / 1.2; // Away teams score slightly less
      awayShots *= attackMultiplier;
    }

    // Adjust based on defensive strength (weak defense = more shots against)
    if (this.data.awayStats) {
      const awayConcededRate = this.data.awayStats.goals.against.average.away;
      homeShots *= 1 + (awayConcededRate - 1.4) * 0.2;
    }

    if (this.data.homeStats) {
      const homeConcededRate = this.data.homeStats.goals.against.average.home;
      awayShots *= 1 + (homeConcededRate - 1.2) * 0.2;
    }

    // Bounds
    homeShots = Math.max(6, Math.min(20, homeShots));
    awayShots = Math.max(4, Math.min(18, awayShots));

    factors.push(
      this.createFactor(
        'shots',
        `Expected Shots: ${Math.round(homeShots)} - ${Math.round(awayShots)}`,
        homeShots > awayShots + 3 ? 'positive' : homeShots < awayShots - 2 ? 'negative' : 'neutral',
        homeShots > awayShots + 3 ? 'home' : homeShots < awayShots - 2 ? 'away' : undefined
      )
    );

    return {
      home: Math.round(homeShots),
      away: Math.round(awayShots),
    };
  }

  /**
   * Predict corners for each team
   */
  private predictCorners(factors: PredictionFactor[]): { home: number; away: number } {
    // League average corners per team per game
    const LEAGUE_AVG_CORNERS = 5;

    let homeCorners = LEAGUE_AVG_CORNERS + 0.5; // Home advantage
    let awayCorners = LEAGUE_AVG_CORNERS - 0.5;

    // Teams with more possession tend to win more corners
    if (this.data.standings) {
      const homeStrength = this.calculatePositionStrength(
        this.data.standings.homePosition,
        this.data.standings.totalTeams
      );
      const awayStrength = this.calculatePositionStrength(
        this.data.standings.awayPosition,
        this.data.standings.totalTeams
      );

      homeCorners += (homeStrength - 50) / 50 * 2;
      awayCorners += (awayStrength - 50) / 50 * 1.5;
    }

    // Attacking teams win more corners
    if (this.data.homeStats) {
      const homeGoalRate = this.data.homeStats.goals.for.average.home;
      homeCorners *= 1 + (homeGoalRate - 1.4) * 0.15;
    }

    if (this.data.awayStats) {
      const awayGoalRate = this.data.awayStats.goals.for.average.away;
      awayCorners *= 1 + (awayGoalRate - 1.2) * 0.15;
    }

    // Bounds
    homeCorners = Math.max(3, Math.min(10, homeCorners));
    awayCorners = Math.max(2, Math.min(9, awayCorners));

    factors.push(
      this.createFactor(
        'corners',
        `Expected Corners: ${Math.round(homeCorners)} - ${Math.round(awayCorners)}`,
        'neutral'
      )
    );

    return {
      home: Math.round(homeCorners),
      away: Math.round(awayCorners),
    };
  }
}
