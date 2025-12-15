import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { dataAggregatorService } from './data-aggregator.service';
import { predictionCacheService } from './prediction-cache.service';
import { aiAnalysisService } from './ai-analysis.service';

// Calculators
import { MatchOutcomeCalculator } from './calculators/match-outcome.calculator';
import { BTTSCalculator } from './calculators/btts.calculator';
import { OverUnderCalculator } from './calculators/over-under.calculator';
import { CorrectScoreCalculator } from './calculators/correct-score.calculator';
import { HTFTCalculator } from './calculators/htft.calculator';
import { StatsCalculator } from './calculators/stats.calculator';

import {
  CompletePrediction,
  PredictionResponse,
  ConfidenceLevel,
  PredictionFactor,
  AggregatedMatchData,
} from '../../types/prediction.types';

export class PredictionEngineService {
  /**
   * Generate or retrieve prediction for a match
   */
  async getPrediction(matchId: string, forceRefresh: boolean = false): Promise<CompletePrediction> {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = predictionCacheService.get(matchId);
      if (cached) {
        logger.debug({ matchId }, 'Returning cached prediction');
        return cached;
      }
    }

    // Generate new prediction
    return this.generatePrediction(matchId);
  }

  /**
   * Generate a new prediction for a match
   */
  async generatePrediction(matchId: string): Promise<CompletePrediction> {
    logger.info({ matchId }, 'Generating prediction');

    // Aggregate all data
    const data = await dataAggregatorService.aggregateMatchData(matchId);

    // Run all calculators
    const matchOutcomeCalc = new MatchOutcomeCalculator(data);
    const bttsCalc = new BTTSCalculator(data);
    const overUnderCalc = new OverUnderCalculator(data);
    const correctScoreCalc = new CorrectScoreCalculator(data);
    const htftCalc = new HTFTCalculator(data);
    const statsCalc = new StatsCalculator(data);

    // Calculate predictions
    const matchOutcome = matchOutcomeCalc.calculate();
    const btts = bttsCalc.calculate();
    const overUnder = overUnderCalc.calculate();
    const correctScore = correctScoreCalc.calculate();
    const stats = statsCalc.calculate();

    // Set match outcome for HTFT calculator (for consistency)
    htftCalc.setMatchOutcome(matchOutcome);
    const htft = htftCalc.calculate();

    // Generate AI analysis
    const aiAnalysis = await aiAnalysisService.generateAnalysis(data, {
      matchOutcome,
      btts,
      overUnder,
      correctScore,
      stats,
    });

    // Calculate overall confidence
    const { confidence, confidenceScore } = this.calculateOverallConfidence(
      matchOutcome,
      btts,
      overUnder,
      correctScore,
      htft,
      stats,
      data
    );

    // Collect all factors
    const factors = this.collectFactors(matchOutcome, btts, overUnder, correctScore, htft, stats);

    // Build complete prediction
    const now = new Date();
    const ttl = predictionCacheService.calculateTTL(data.match.kickoffTime);
    const expiresAt = new Date(now.getTime() + ttl);

    const prediction: CompletePrediction = {
      id: uuidv4(),
      matchId,
      generatedAt: now,
      expiresAt,
      matchOutcome,
      btts,
      overUnder,
      correctScore,
      htft,
      stats,
      confidence,
      confidenceScore,
      aiAnalysis,
      factors,
      dataQuality: data.dataQuality,
    };

    // Cache the prediction
    predictionCacheService.set(matchId, prediction, ttl);

    // Store in database (async, don't wait)
    this.storePrediction(prediction, data).catch((err) => {
      logger.error({ err, matchId }, 'Failed to store prediction');
    });

    logger.info({ matchId, confidence, confidenceScore }, 'Prediction generated');

    return prediction;
  }

  /**
   * Calculate overall confidence from all predictions
   */
  private calculateOverallConfidence(
    matchOutcome: any,
    btts: any,
    overUnder: any,
    correctScore: any,
    htft: any,
    stats: any,
    data: AggregatedMatchData
  ): { confidence: ConfidenceLevel; confidenceScore: number } {
    // Weighted average of calculator confidences
    const weights = {
      matchOutcome: 0.30,
      btts: 0.15,
      overUnder: 0.20,
      correctScore: 0.10,
      htft: 0.10,
      stats: 0.15,
    };

    const weightedSum =
      matchOutcome.confidence * weights.matchOutcome +
      btts.confidence * weights.btts +
      overUnder.confidence * weights.overUnder +
      correctScore.confidence * weights.correctScore +
      htft.confidence * weights.htft +
      stats.confidence * weights.stats;

    // Apply data quality multiplier
    const qualityMultiplier = data.dataQuality.score / 100;
    let adjustedScore = weightedSum * qualityMultiplier;

    // Algorithm agreement bonus (if all point same direction)
    const agreementBonus = this.calculateAgreementBonus(matchOutcome, btts, overUnder);
    adjustedScore += agreementBonus;

    // Cap at 95% (nothing is certain in football)
    adjustedScore = Math.min(95, Math.max(20, adjustedScore));

    const confidenceScore = Math.round(adjustedScore);
    const confidence: ConfidenceLevel =
      confidenceScore >= 70 ? 'High' : confidenceScore >= 50 ? 'Medium' : 'Low';

    return { confidence, confidenceScore };
  }

  /**
   * Calculate bonus for algorithm agreement
   */
  private calculateAgreementBonus(matchOutcome: any, btts: any, overUnder: any): number {
    let bonus = 0;

    // If strong home favorite and high expected goals
    if (matchOutcome.homeWin > 50 && overUnder.expectedGoals > 2.5) {
      bonus += 3;
    }

    // If strong away favorite and high expected goals
    if (matchOutcome.awayWin > 50 && overUnder.expectedGoals > 2.5) {
      bonus += 3;
    }

    // If very high BTTS and high O2.5
    if (btts.yes > 60 && overUnder.lines['2.5'].over > 55) {
      bonus += 2;
    }

    // If very low BTTS and low expected goals
    if (btts.no > 60 && overUnder.expectedGoals < 2.0) {
      bonus += 2;
    }

    return bonus;
  }

  /**
   * Collect important factors from all calculators
   */
  private collectFactors(...predictions: any[]): PredictionFactor[] {
    const allFactors: PredictionFactor[] = [];

    for (const pred of predictions) {
      if (pred.factors) {
        // Take top 2 factors from each prediction type
        allFactors.push(...pred.factors.slice(0, 2));
      }
    }

    // Limit to 10 most important factors
    return allFactors.slice(0, 10);
  }

  /**
   * Store prediction in database
   */
  private async storePrediction(
    prediction: CompletePrediction,
    data: AggregatedMatchData
  ): Promise<void> {
    try {
      await prisma.prediction.create({
        data: {
          matchId: prediction.matchId,
          userId: null, // AI prediction
          homeWinProbability: prediction.matchOutcome.homeWin,
          drawProbability: prediction.matchOutcome.draw,
          awayWinProbability: prediction.matchOutcome.awayWin,
          predictedHomeScore: prediction.stats.expectedGoals.home,
          predictedAwayScore: prediction.stats.expectedGoals.away,
          confidence: prediction.confidence,
          aiModel: 'hybrid-v1',
          reasoning: prediction.aiAnalysis,
          factors: prediction.factors as any,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to store prediction in database');
    }
  }

  /**
   * Convert CompletePrediction to API response format
   */
  toResponse(prediction: CompletePrediction): PredictionResponse {
    return {
      matchId: prediction.matchId,
      generatedAt: prediction.generatedAt.toISOString(),
      expiresAt: prediction.expiresAt.toISOString(),
      confidence: prediction.confidence,
      confidenceScore: prediction.confidenceScore,
      matchOutcome: {
        homeWin: prediction.matchOutcome.homeWin,
        draw: prediction.matchOutcome.draw,
        awayWin: prediction.matchOutcome.awayWin,
        predicted: prediction.matchOutcome.predicted,
      },
      btts: {
        yes: prediction.btts.yes,
        no: prediction.btts.no,
        predicted: prediction.btts.predicted,
      },
      overUnder: {
        lines: prediction.overUnder.lines,
        expectedGoals: prediction.overUnder.expectedGoals,
        recommended: prediction.overUnder.recommended,
      },
      correctScore: {
        topPredictions: prediction.correctScore.topPredictions,
        mostLikely: prediction.correctScore.mostLikely,
      },
      htft: {
        predictions: prediction.htft.predictions,
        mostLikely: prediction.htft.mostLikely,
      },
      stats: {
        expectedGoals: prediction.stats.expectedGoals,
        possession: prediction.stats.possession,
        totalShots: prediction.stats.totalShots,
        shotsOnTarget: prediction.stats.shotsOnTarget,
        corners: prediction.stats.corners,
      },
      aiAnalysis: prediction.aiAnalysis,
      factors: prediction.factors,
      dataQuality: prediction.dataQuality,
    };
  }
}

export const predictionEngineService = new PredictionEngineService();
