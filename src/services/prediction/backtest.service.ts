import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { predictionEngineService } from './prediction-engine.service';
import { footballAPIService } from '../football-api.service';

interface MatchResult {
  matchId: string;
  apiId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  totalGoals: number;
  actualOutcome: '1' | 'X' | '2';
  actualBTTS: boolean;
  actualOver25: boolean;
  actualOver15: boolean;
  actualOver35: boolean;
}

interface PredictionResult {
  matchId: string;
  predictedOutcome: '1' | 'X' | '2';
  outcomeConfidence: number;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  predictedBTTS: 'Yes' | 'No';
  bttsYesProb: number;
  predictedOver25: boolean;
  over25Prob: number;
  predictedScore: string;
  expectedGoals: number;
}

interface BacktestMatch {
  match: MatchResult;
  prediction: PredictionResult;
  results: {
    outcomeCorrect: boolean;
    bttsCorrect: boolean;
    over25Correct: boolean;
    over15Correct: boolean;
    over35Correct: boolean;
    scoreCorrect: boolean;
    goalDiffError: number;
  };
}

interface BacktestReport {
  summary: {
    totalMatches: number;
    dateRange: { from: string; to: string };
    leagues: string[];
  };
  accuracy: {
    matchOutcome: {
      correct: number;
      total: number;
      percentage: number;
      byConfidence: {
        high: { correct: number; total: number; percentage: number };
        medium: { correct: number; total: number; percentage: number };
        low: { correct: number; total: number; percentage: number };
      };
    };
    btts: {
      correct: number;
      total: number;
      percentage: number;
    };
    overUnder: {
      over15: { correct: number; total: number; percentage: number };
      over25: { correct: number; total: number; percentage: number };
      over35: { correct: number; total: number; percentage: number };
    };
    correctScore: {
      exact: number;
      total: number;
      percentage: number;
    };
    expectedGoals: {
      avgError: number;
      correlation: number;
    };
  };
  profitability: {
    matchOutcome: {
      bets: number;
      wins: number;
      avgOdds: number;
      roi: number;
    };
    btts: {
      bets: number;
      wins: number;
      avgOdds: number;
      roi: number;
    };
    over25: {
      bets: number;
      wins: number;
      avgOdds: number;
      roi: number;
    };
  };
  matches: BacktestMatch[];
  insights: string[];
}

export class BacktestService {
  /**
   * Run backtest on finished matches
   */
  async runBacktest(options: {
    startDate: string;
    endDate: string;
    leagueIds?: number[];
    limit?: number;
  }): Promise<BacktestReport> {
    const { startDate, endDate, leagueIds, limit = 50 } = options;

    logger.info({ startDate, endDate, leagueIds, limit }, 'Starting backtest');

    // Get finished matches from database
    const matches = await this.getFinishedMatches(startDate, endDate, leagueIds, limit);

    if (matches.length === 0) {
      throw new Error('No finished matches found for backtest');
    }

    logger.info({ matchCount: matches.length }, 'Found matches for backtest');

    // Generate predictions and compare with actual results
    const backtestMatches: BacktestMatch[] = [];

    for (const match of matches) {
      try {
        const backtestMatch = await this.evaluateMatch(match);
        if (backtestMatch) {
          backtestMatches.push(backtestMatch);
        }
      } catch (error) {
        logger.warn({ matchId: match.id, error }, 'Failed to evaluate match');
      }
    }

    // Generate report
    const report = this.generateReport(backtestMatches, startDate, endDate);

    return report;
  }

  /**
   * Get finished matches from database
   */
  private async getFinishedMatches(
    startDate: string,
    endDate: string,
    leagueIds?: number[],
    limit: number = 50
  ) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const where: any = {
      status: 'finished',
      kickoffTime: {
        gte: start,
        lte: end,
      },
      homeScore: { not: null },
      awayScore: { not: null },
    };

    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: { kickoffTime: 'desc' },
      take: limit,
    });

    return matches;
  }

  /**
   * Evaluate a single match
   */
  private async evaluateMatch(match: any): Promise<BacktestMatch | null> {
    const homeScore = match.homeScore as number;
    const awayScore = match.awayScore as number;
    const totalGoals = homeScore + awayScore;

    // Determine actual results
    const actualOutcome: '1' | 'X' | '2' =
      homeScore > awayScore ? '1' : homeScore < awayScore ? '2' : 'X';
    const actualBTTS = homeScore > 0 && awayScore > 0;
    const actualOver25 = totalGoals > 2.5;
    const actualOver15 = totalGoals > 1.5;
    const actualOver35 = totalGoals > 3.5;

    const matchResult: MatchResult = {
      matchId: match.id,
      apiId: match.apiId || '',
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeScore,
      awayScore,
      totalGoals,
      actualOutcome,
      actualBTTS,
      actualOver25,
      actualOver15,
      actualOver35,
    };

    // Generate prediction for this match
    try {
      const prediction = await predictionEngineService.getPrediction(match.id, true);

      const predictedOutcome = prediction.matchOutcome.predicted as '1' | 'X' | '2';
      const predictedBTTS = prediction.btts.predicted as 'Yes' | 'No';
      const over25Prob = prediction.overUnder.lines['2.5'].over;
      const predictedOver25 = over25Prob > 50;
      const predictedScore = prediction.correctScore.mostLikely;
      const expectedGoals = prediction.overUnder.expectedGoals;

      const predictionResult: PredictionResult = {
        matchId: match.id,
        predictedOutcome,
        outcomeConfidence: prediction.matchOutcome.confidence,
        homeWinProb: prediction.matchOutcome.homeWin,
        drawProb: prediction.matchOutcome.draw,
        awayWinProb: prediction.matchOutcome.awayWin,
        predictedBTTS,
        bttsYesProb: prediction.btts.yes,
        predictedOver25,
        over25Prob,
        predictedScore,
        expectedGoals,
      };

      // Calculate results
      const outcomeCorrect = predictedOutcome === actualOutcome;
      const bttsCorrect = (predictedBTTS === 'Yes') === actualBTTS;
      const over25Correct = predictedOver25 === actualOver25;
      const over15Correct = (prediction.overUnder.lines['1.5'].over > 50) === actualOver15;
      const over35Correct = (prediction.overUnder.lines['3.5'].over > 50) === actualOver35;
      const scoreCorrect = predictedScore === `${homeScore}-${awayScore}`;
      const goalDiffError = Math.abs(expectedGoals - totalGoals);

      return {
        match: matchResult,
        prediction: predictionResult,
        results: {
          outcomeCorrect,
          bttsCorrect,
          over25Correct,
          over15Correct,
          over35Correct,
          scoreCorrect,
          goalDiffError,
        },
      };
    } catch (error) {
      logger.warn({ matchId: match.id, error }, 'Failed to generate prediction for backtest');
      return null;
    }
  }

  /**
   * Generate comprehensive report
   */
  private generateReport(
    matches: BacktestMatch[],
    startDate: string,
    endDate: string
  ): BacktestReport {
    const total = matches.length;
    if (total === 0) {
      throw new Error('No matches to generate report');
    }

    // Match outcome accuracy
    const outcomeCorrect = matches.filter(m => m.results.outcomeCorrect).length;

    // By confidence level
    const highConfMatches = matches.filter(m => m.prediction.outcomeConfidence >= 70);
    const medConfMatches = matches.filter(m => m.prediction.outcomeConfidence >= 50 && m.prediction.outcomeConfidence < 70);
    const lowConfMatches = matches.filter(m => m.prediction.outcomeConfidence < 50);

    const highConfCorrect = highConfMatches.filter(m => m.results.outcomeCorrect).length;
    const medConfCorrect = medConfMatches.filter(m => m.results.outcomeCorrect).length;
    const lowConfCorrect = lowConfMatches.filter(m => m.results.outcomeCorrect).length;

    // BTTS accuracy
    const bttsCorrect = matches.filter(m => m.results.bttsCorrect).length;

    // Over/Under accuracy
    const over15Correct = matches.filter(m => m.results.over15Correct).length;
    const over25Correct = matches.filter(m => m.results.over25Correct).length;
    const over35Correct = matches.filter(m => m.results.over35Correct).length;

    // Correct score
    const scoreCorrect = matches.filter(m => m.results.scoreCorrect).length;

    // Expected goals analysis
    const totalGoalError = matches.reduce((sum, m) => sum + m.results.goalDiffError, 0);
    const avgGoalError = totalGoalError / total;

    // Calculate correlation between expected and actual goals
    const expectedGoals = matches.map(m => m.prediction.expectedGoals);
    const actualGoals = matches.map(m => m.match.totalGoals);
    const correlation = this.calculateCorrelation(expectedGoals, actualGoals);

    // Profitability simulation (assuming flat 1 unit bets)
    // For outcome, only bet when confidence > 60%
    const outcomeBets = matches.filter(m => {
      const maxProb = Math.max(m.prediction.homeWinProb, m.prediction.drawProb, m.prediction.awayWinProb);
      return maxProb > 50;
    });
    const outcomeWins = outcomeBets.filter(m => m.results.outcomeCorrect).length;
    const outcomeAvgOdds = 2.0; // Assumed average odds
    const outcomeROI = ((outcomeWins * outcomeAvgOdds) - outcomeBets.length) / outcomeBets.length * 100;

    // BTTS profitability
    const bttsBets = matches.filter(m => Math.abs(m.prediction.bttsYesProb - 50) > 10);
    const bttsWinsCount = bttsBets.filter(m => m.results.bttsCorrect).length;
    const bttsROI = ((bttsWinsCount * 1.9) - bttsBets.length) / bttsBets.length * 100;

    // Over 2.5 profitability
    const over25Bets = matches.filter(m => Math.abs(m.prediction.over25Prob - 50) > 10);
    const over25WinsCount = over25Bets.filter(m => m.results.over25Correct).length;
    const over25ROI = ((over25WinsCount * 1.9) - over25Bets.length) / over25Bets.length * 100;

    // Get unique leagues
    const leagues = [...new Set(matches.map(m => m.match.homeTeam))].slice(0, 5);

    // Generate insights
    const insights = this.generateInsights(matches, {
      outcomeAccuracy: (outcomeCorrect / total) * 100,
      bttsAccuracy: (bttsCorrect / total) * 100,
      over25Accuracy: (over25Correct / total) * 100,
      avgGoalError,
      highConfAccuracy: highConfMatches.length > 0 ? (highConfCorrect / highConfMatches.length) * 100 : 0,
    });

    return {
      summary: {
        totalMatches: total,
        dateRange: { from: startDate, to: endDate },
        leagues,
      },
      accuracy: {
        matchOutcome: {
          correct: outcomeCorrect,
          total,
          percentage: Math.round((outcomeCorrect / total) * 100 * 10) / 10,
          byConfidence: {
            high: {
              correct: highConfCorrect,
              total: highConfMatches.length,
              percentage: highConfMatches.length > 0 ? Math.round((highConfCorrect / highConfMatches.length) * 100 * 10) / 10 : 0,
            },
            medium: {
              correct: medConfCorrect,
              total: medConfMatches.length,
              percentage: medConfMatches.length > 0 ? Math.round((medConfCorrect / medConfMatches.length) * 100 * 10) / 10 : 0,
            },
            low: {
              correct: lowConfCorrect,
              total: lowConfMatches.length,
              percentage: lowConfMatches.length > 0 ? Math.round((lowConfCorrect / lowConfMatches.length) * 100 * 10) / 10 : 0,
            },
          },
        },
        btts: {
          correct: bttsCorrect,
          total,
          percentage: Math.round((bttsCorrect / total) * 100 * 10) / 10,
        },
        overUnder: {
          over15: {
            correct: over15Correct,
            total,
            percentage: Math.round((over15Correct / total) * 100 * 10) / 10,
          },
          over25: {
            correct: over25Correct,
            total,
            percentage: Math.round((over25Correct / total) * 100 * 10) / 10,
          },
          over35: {
            correct: over35Correct,
            total,
            percentage: Math.round((over35Correct / total) * 100 * 10) / 10,
          },
        },
        correctScore: {
          exact: scoreCorrect,
          total,
          percentage: Math.round((scoreCorrect / total) * 100 * 10) / 10,
        },
        expectedGoals: {
          avgError: Math.round(avgGoalError * 100) / 100,
          correlation: Math.round(correlation * 100) / 100,
        },
      },
      profitability: {
        matchOutcome: {
          bets: outcomeBets.length,
          wins: outcomeWins,
          avgOdds: outcomeAvgOdds,
          roi: Math.round(outcomeROI * 10) / 10,
        },
        btts: {
          bets: bttsBets.length,
          wins: bttsWinsCount,
          avgOdds: 1.9,
          roi: Math.round(bttsROI * 10) / 10,
        },
        over25: {
          bets: over25Bets.length,
          wins: over25WinsCount,
          avgOdds: 1.9,
          roi: Math.round(over25ROI * 10) / 10,
        },
      },
      matches,
      insights,
    };
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
    const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;
    return numerator / denominator;
  }

  /**
   * Generate insights based on backtest results
   */
  private generateInsights(
    matches: BacktestMatch[],
    stats: {
      outcomeAccuracy: number;
      bttsAccuracy: number;
      over25Accuracy: number;
      avgGoalError: number;
      highConfAccuracy: number;
    }
  ): string[] {
    const insights: string[] = [];

    // Match outcome insights
    if (stats.outcomeAccuracy > 50) {
      insights.push(`Match outcome prediction is performing well at ${stats.outcomeAccuracy.toFixed(1)}% (above 33% random baseline)`);
    } else if (stats.outcomeAccuracy > 40) {
      insights.push(`Match outcome prediction at ${stats.outcomeAccuracy.toFixed(1)}% - room for improvement`);
    } else {
      insights.push(`Match outcome prediction needs attention at ${stats.outcomeAccuracy.toFixed(1)}%`);
    }

    // High confidence analysis
    if (stats.highConfAccuracy > 60) {
      insights.push(`High confidence predictions are reliable at ${stats.highConfAccuracy.toFixed(1)}%`);
    } else if (stats.highConfAccuracy > 0) {
      insights.push(`High confidence predictions underperforming at ${stats.highConfAccuracy.toFixed(1)}% - calibration needed`);
    }

    // BTTS insights
    if (stats.bttsAccuracy > 55) {
      insights.push(`BTTS prediction strong at ${stats.bttsAccuracy.toFixed(1)}%`);
    } else if (stats.bttsAccuracy < 45) {
      insights.push(`BTTS model needs recalibration (${stats.bttsAccuracy.toFixed(1)}%)`);
    }

    // Over 2.5 insights
    if (stats.over25Accuracy > 55) {
      insights.push(`Over/Under 2.5 prediction performing well at ${stats.over25Accuracy.toFixed(1)}%`);
    }

    // Expected goals error
    if (stats.avgGoalError < 1.5) {
      insights.push(`Expected goals model is accurate (avg error: ${stats.avgGoalError.toFixed(2)} goals)`);
    } else {
      insights.push(`Expected goals model has high variance (avg error: ${stats.avgGoalError.toFixed(2)} goals)`);
    }

    // Pattern analysis
    const homeWins = matches.filter(m => m.match.actualOutcome === '1').length;
    const awayWins = matches.filter(m => m.match.actualOutcome === '2').length;
    const draws = matches.filter(m => m.match.actualOutcome === 'X').length;

    const homeWinPredictions = matches.filter(m => m.prediction.predictedOutcome === '1').length;

    if (homeWinPredictions / matches.length > 0.6) {
      insights.push(`Model may be over-predicting home wins (${((homeWinPredictions / matches.length) * 100).toFixed(0)}% predicted vs ${((homeWins / matches.length) * 100).toFixed(0)}% actual)`);
    }

    // Over/Under bias
    const actualOver25Count = matches.filter(m => m.match.actualOver25).length;
    const predictedOver25Count = matches.filter(m => m.prediction.predictedOver25).length;

    if (Math.abs(actualOver25Count - predictedOver25Count) > matches.length * 0.15) {
      if (predictedOver25Count > actualOver25Count) {
        insights.push('Model tends to over-estimate total goals - consider adjusting Poisson parameters');
      } else {
        insights.push('Model tends to under-estimate total goals - consider increasing expected goals calculation');
      }
    }

    return insights;
  }

  /**
   * Generate detailed report for a specific number of matches
   */
  async runDetailedBacktest(options: {
    startDate: string;
    endDate: string;
    matchCount?: number;
  }): Promise<DetailedBacktestReport> {
    const { startDate, endDate, matchCount = 10 } = options;

    logger.info({ startDate, endDate, matchCount }, 'Starting detailed backtest');

    // Get finished matches
    const matches = await this.getFinishedMatches(startDate, endDate, undefined, matchCount);

    if (matches.length === 0) {
      throw new Error('No finished matches found for detailed backtest');
    }

    // Generate predictions and detailed analysis
    const detailedMatches: DetailedMatchAnalysis[] = [];

    for (const match of matches) {
      try {
        const analysis = await this.analyzeMatchDetailed(match);
        if (analysis) {
          detailedMatches.push(analysis);
        }
      } catch (error) {
        logger.warn({ matchId: match.id, error }, 'Failed to analyze match');
      }
    }

    // Generate summary statistics
    const summary = this.generateDetailedSummary(detailedMatches);

    return {
      reportDate: new Date().toISOString(),
      dateRange: { from: startDate, to: endDate },
      matchesAnalyzed: detailedMatches.length,
      summary,
      matches: detailedMatches,
      recommendations: this.generateRecommendations(summary, detailedMatches),
    };
  }

  /**
   * Analyze a single match with detailed breakdown
   */
  private async analyzeMatchDetailed(match: any): Promise<DetailedMatchAnalysis | null> {
    const homeScore = match.homeScore as number;
    const awayScore = match.awayScore as number;
    const totalGoals = homeScore + awayScore;

    // Determine actual results
    const actualOutcome: '1' | 'X' | '2' =
      homeScore > awayScore ? '1' : homeScore < awayScore ? '2' : 'X';
    const actualBTTS = homeScore > 0 && awayScore > 0;

    try {
      const prediction = await predictionEngineService.getPrediction(match.id, true);

      const predictedOutcome = prediction.matchOutcome.predicted as '1' | 'X' | '2';
      const predictedBTTS = prediction.btts.predicted as 'Yes' | 'No';

      // Calculate accuracy for each prediction type
      const outcomeCorrect = predictedOutcome === actualOutcome;
      const bttsCorrect = (predictedBTTS === 'Yes') === actualBTTS;
      const over25Correct = (prediction.overUnder.lines['2.5'].over > 50) === (totalGoals > 2.5);
      const scoreCorrect = prediction.correctScore.mostLikely === `${homeScore}-${awayScore}`;

      // Determine what went wrong or right
      const analysisNotes: string[] = [];

      if (outcomeCorrect) {
        analysisNotes.push(`✓ Outcome correct: Predicted ${predictedOutcome}, Actual ${actualOutcome}`);
      } else {
        const correctProb = actualOutcome === '1' ? prediction.matchOutcome.homeWin :
                           actualOutcome === '2' ? prediction.matchOutcome.awayWin :
                           prediction.matchOutcome.draw;
        analysisNotes.push(`✗ Outcome wrong: Predicted ${predictedOutcome} (${prediction.matchOutcome[predictedOutcome === '1' ? 'homeWin' : predictedOutcome === '2' ? 'awayWin' : 'draw'].toFixed(1)}%), Actual ${actualOutcome} (${correctProb.toFixed(1)}%)`);
      }

      if (bttsCorrect) {
        analysisNotes.push(`✓ BTTS correct: Predicted ${predictedBTTS}, Actual ${actualBTTS ? 'Yes' : 'No'}`);
      } else {
        analysisNotes.push(`✗ BTTS wrong: Predicted ${predictedBTTS} (${prediction.btts.yes.toFixed(1)}% yes), Actual ${actualBTTS ? 'Yes' : 'No'}`);
      }

      if (over25Correct) {
        analysisNotes.push(`✓ Over 2.5 correct: ${prediction.overUnder.lines['2.5'].over.toFixed(1)}% predicted, ${totalGoals} goals scored`);
      } else {
        analysisNotes.push(`✗ Over 2.5 wrong: ${prediction.overUnder.lines['2.5'].over.toFixed(1)}% predicted Over, Actual ${totalGoals} goals`);
      }

      // Score prediction analysis
      const topScores = prediction.correctScore.topPredictions.slice(0, 3);
      const actualScoreInTop3 = topScores.some(s => s.score === `${homeScore}-${awayScore}`);
      const actualScoreInTop10 = prediction.correctScore.topPredictions.some(s => s.score === `${homeScore}-${awayScore}`);

      if (scoreCorrect) {
        analysisNotes.push(`✓ Exact score correct: ${homeScore}-${awayScore}`);
      } else if (actualScoreInTop3) {
        analysisNotes.push(`○ Score in top 3: Predicted ${prediction.correctScore.mostLikely}, Actual ${homeScore}-${awayScore} was #${topScores.findIndex(s => s.score === `${homeScore}-${awayScore}`) + 1}`);
      } else if (actualScoreInTop10) {
        analysisNotes.push(`○ Score in top 10: Actual ${homeScore}-${awayScore} was in predictions`);
      } else {
        analysisNotes.push(`✗ Score missed: Predicted ${prediction.correctScore.mostLikely}, Actual ${homeScore}-${awayScore}`);
      }

      // Key factors that influenced prediction
      const keyFactors = prediction.factors?.slice(0, 5) || [];

      return {
        matchInfo: {
          id: match.id,
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          kickoffTime: match.kickoffTime,
          finalScore: `${homeScore}-${awayScore}`,
          totalGoals,
        },
        actualResults: {
          outcome: actualOutcome,
          btts: actualBTTS,
          over15: totalGoals > 1.5,
          over25: totalGoals > 2.5,
          over35: totalGoals > 3.5,
        },
        predictions: {
          outcome: {
            predicted: predictedOutcome,
            probabilities: {
              home: prediction.matchOutcome.homeWin,
              draw: prediction.matchOutcome.draw,
              away: prediction.matchOutcome.awayWin,
            },
            confidence: prediction.matchOutcome.confidence,
            correct: outcomeCorrect,
          },
          btts: {
            predicted: predictedBTTS,
            yesProb: prediction.btts.yes,
            correct: bttsCorrect,
          },
          overUnder: {
            expectedGoals: prediction.overUnder.expectedGoals,
            lines: {
              '1.5': { prob: prediction.overUnder.lines['1.5'].over, correct: (prediction.overUnder.lines['1.5'].over > 50) === (totalGoals > 1.5) },
              '2.5': { prob: prediction.overUnder.lines['2.5'].over, correct: over25Correct },
              '3.5': { prob: prediction.overUnder.lines['3.5'].over, correct: (prediction.overUnder.lines['3.5'].over > 50) === (totalGoals > 3.5) },
            },
          },
          correctScore: {
            predicted: prediction.correctScore.mostLikely,
            topPredictions: topScores,
            correct: scoreCorrect,
            actualInTop10: actualScoreInTop10,
          },
        },
        accuracy: {
          outcomeCorrect,
          bttsCorrect,
          over25Correct,
          scoreCorrect,
          totalCorrect: [outcomeCorrect, bttsCorrect, over25Correct].filter(Boolean).length,
          totalPredictions: 3,
        },
        analysis: analysisNotes,
        keyFactors: keyFactors.map(f => ({
          type: f.type,
          description: f.description,
          impact: f.impact,
        })),
      };
    } catch (error) {
      logger.warn({ matchId: match.id, error }, 'Failed to generate detailed analysis');
      return null;
    }
  }

  /**
   * Generate summary statistics for detailed report
   */
  private generateDetailedSummary(matches: DetailedMatchAnalysis[]): DetailedSummary {
    const total = matches.length;

    const outcomeCorrect = matches.filter(m => m.accuracy.outcomeCorrect).length;
    const bttsCorrect = matches.filter(m => m.accuracy.bttsCorrect).length;
    const over25Correct = matches.filter(m => m.accuracy.over25Correct).length;
    const scoreCorrect = matches.filter(m => m.accuracy.scoreCorrect).length;

    // Breakdown by outcome type
    const homeWinMatches = matches.filter(m => m.actualResults.outcome === '1');
    const awayWinMatches = matches.filter(m => m.actualResults.outcome === '2');
    const drawMatches = matches.filter(m => m.actualResults.outcome === 'X');

    const homeWinAccuracy = homeWinMatches.length > 0
      ? homeWinMatches.filter(m => m.predictions.outcome.predicted === '1').length / homeWinMatches.length * 100
      : 0;
    const awayWinAccuracy = awayWinMatches.length > 0
      ? awayWinMatches.filter(m => m.predictions.outcome.predicted === '2').length / awayWinMatches.length * 100
      : 0;
    const drawAccuracy = drawMatches.length > 0
      ? drawMatches.filter(m => m.predictions.outcome.predicted === 'X').length / drawMatches.length * 100
      : 0;

    // Average expected goals vs actual
    const avgExpectedGoals = matches.reduce((sum, m) => sum + m.predictions.overUnder.expectedGoals, 0) / total;
    const avgActualGoals = matches.reduce((sum, m) => sum + m.matchInfo.totalGoals, 0) / total;
    const xgError = Math.abs(avgExpectedGoals - avgActualGoals);

    return {
      overallAccuracy: {
        outcome: { correct: outcomeCorrect, total, percentage: Math.round(outcomeCorrect / total * 100 * 10) / 10 },
        btts: { correct: bttsCorrect, total, percentage: Math.round(bttsCorrect / total * 100 * 10) / 10 },
        over25: { correct: over25Correct, total, percentage: Math.round(over25Correct / total * 100 * 10) / 10 },
        correctScore: { correct: scoreCorrect, total, percentage: Math.round(scoreCorrect / total * 100 * 10) / 10 },
      },
      outcomeBreakdown: {
        homeWins: { actual: homeWinMatches.length, accuracy: Math.round(homeWinAccuracy * 10) / 10 },
        awayWins: { actual: awayWinMatches.length, accuracy: Math.round(awayWinAccuracy * 10) / 10 },
        draws: { actual: drawMatches.length, accuracy: Math.round(drawAccuracy * 10) / 10 },
      },
      goalsAnalysis: {
        avgExpectedGoals: Math.round(avgExpectedGoals * 100) / 100,
        avgActualGoals: Math.round(avgActualGoals * 100) / 100,
        xgError: Math.round(xgError * 100) / 100,
      },
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(summary: DetailedSummary, matches: DetailedMatchAnalysis[]): string[] {
    const recommendations: string[] = [];

    // Outcome accuracy recommendations
    if (summary.overallAccuracy.outcome.percentage < 50) {
      recommendations.push('📊 Match outcome accuracy below 50% - consider increasing weight of bookmaker odds in calculations');
    }

    // Draw prediction recommendations
    if (summary.outcomeBreakdown.draws.accuracy < 20 && summary.outcomeBreakdown.draws.actual > 0) {
      recommendations.push('🤝 Draw predictions need improvement - model rarely predicts draws correctly');
    }

    // BTTS recommendations
    if (summary.overallAccuracy.btts.percentage < 50) {
      recommendations.push('⚽ BTTS accuracy below 50% - adjust scoring probability calculations');
    }

    // xG recommendations
    if (summary.goalsAnalysis.xgError > 1.0) {
      recommendations.push('📈 Expected goals error high (>' + summary.goalsAnalysis.xgError.toFixed(1) + ') - recalibrate Poisson parameters');
    }

    // Check for systematic bias
    const homePredictions = matches.filter(m => m.predictions.outcome.predicted === '1').length;
    const awayPredictions = matches.filter(m => m.predictions.outcome.predicted === '2').length;
    const drawPredictions = matches.filter(m => m.predictions.outcome.predicted === 'X').length;

    if (homePredictions / matches.length > 0.6) {
      recommendations.push('🏠 Over-predicting home wins (' + Math.round(homePredictions / matches.length * 100) + '%) - reduce home advantage factor');
    }
    if (awayPredictions / matches.length > 0.6) {
      recommendations.push('✈️ Over-predicting away wins (' + Math.round(awayPredictions / matches.length * 100) + '%) - check away strength calculation');
    }
    if (drawPredictions === 0 && summary.outcomeBreakdown.draws.actual > 0) {
      recommendations.push('🤝 Model never predicts draws but ' + summary.outcomeBreakdown.draws.actual + ' occurred - adjust draw threshold');
    }

    // Positive feedback
    if (summary.overallAccuracy.outcome.percentage >= 60) {
      recommendations.push('✅ Strong outcome prediction performance - model is well calibrated');
    }
    if (summary.overallAccuracy.over25.percentage >= 65) {
      recommendations.push('✅ Excellent Over/Under 2.5 predictions - goal expectation model is accurate');
    }

    return recommendations;
  }
}

// Additional interfaces for detailed report
interface DetailedMatchAnalysis {
  matchInfo: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    kickoffTime: Date;
    finalScore: string;
    totalGoals: number;
  };
  actualResults: {
    outcome: '1' | 'X' | '2';
    btts: boolean;
    over15: boolean;
    over25: boolean;
    over35: boolean;
  };
  predictions: {
    outcome: {
      predicted: '1' | 'X' | '2';
      probabilities: { home: number; draw: number; away: number };
      confidence: number;
      correct: boolean;
    };
    btts: {
      predicted: 'Yes' | 'No';
      yesProb: number;
      correct: boolean;
    };
    overUnder: {
      expectedGoals: number;
      lines: {
        '1.5': { prob: number; correct: boolean };
        '2.5': { prob: number; correct: boolean };
        '3.5': { prob: number; correct: boolean };
      };
    };
    correctScore: {
      predicted: string;
      topPredictions: { score: string; probability: number }[];
      correct: boolean;
      actualInTop10: boolean;
    };
  };
  accuracy: {
    outcomeCorrect: boolean;
    bttsCorrect: boolean;
    over25Correct: boolean;
    scoreCorrect: boolean;
    totalCorrect: number;
    totalPredictions: number;
  };
  analysis: string[];
  keyFactors: { type: string; description: string; impact: string }[];
}

interface DetailedSummary {
  overallAccuracy: {
    outcome: { correct: number; total: number; percentage: number };
    btts: { correct: number; total: number; percentage: number };
    over25: { correct: number; total: number; percentage: number };
    correctScore: { correct: number; total: number; percentage: number };
  };
  outcomeBreakdown: {
    homeWins: { actual: number; accuracy: number };
    awayWins: { actual: number; accuracy: number };
    draws: { actual: number; accuracy: number };
  };
  goalsAnalysis: {
    avgExpectedGoals: number;
    avgActualGoals: number;
    xgError: number;
  };
}

interface DetailedBacktestReport {
  reportDate: string;
  dateRange: { from: string; to: string };
  matchesAnalyzed: number;
  summary: DetailedSummary;
  matches: DetailedMatchAnalysis[];
  recommendations: string[];
}

export const backtestService = new BacktestService();
