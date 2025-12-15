import { logger } from '../../lib/logger';
import { env } from '../../config/env';
import {
  AggregatedMatchData,
  MatchOutcomePrediction,
  BTTSPrediction,
  OverUnderPrediction,
  CorrectScorePrediction,
  StatsPrediction,
} from '../../types/prediction.types';

interface AllPredictions {
  matchOutcome: MatchOutcomePrediction;
  btts: BTTSPrediction;
  overUnder: OverUnderPrediction;
  correctScore: CorrectScorePrediction;
  stats: StatsPrediction;
}

export class AIAnalysisService {
  private apiKey: string | null = null;

  constructor() {
    // Check for OpenAI API key
    this.apiKey = (env as any).OPENAI_API_KEY || process.env.OPENAI_API_KEY || null;
  }

  /**
   * Generate AI analysis for match predictions
   */
  async generateAnalysis(
    data: AggregatedMatchData,
    predictions: AllPredictions
  ): Promise<string> {
    // If no API key, use template-based analysis
    if (!this.apiKey) {
      return this.generateTemplateAnalysis(data, predictions);
    }

    try {
      const prompt = this.buildPrompt(data, predictions);
      const analysis = await this.callOpenAI(prompt);
      return analysis || this.generateTemplateAnalysis(data, predictions);
    } catch (error) {
      logger.warn({ error }, 'AI analysis failed, using template');
      return this.generateTemplateAnalysis(data, predictions);
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string | null> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert football analyst. Generate a match analysis based on the provided statistics and predictions.
The analysis should be 2-3 paragraphs long, professional yet easy to understand.
Focus on:
1. Key factors influencing the prediction
2. Recent form analysis
3. Head-to-head significance
4. Notable statistical patterns
Don't state predictions as certainties, discuss probabilities instead.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        logger.error({ status: response.status }, 'OpenAI API error');
        return null;
      }

      const result = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return result.choices?.[0]?.message?.content || null;
    } catch (error) {
      logger.error({ error }, 'OpenAI API call failed');
      return null;
    }
  }

  /**
   * Build prompt for AI analysis
   */
  private buildPrompt(data: AggregatedMatchData, predictions: AllPredictions): string {
    const homeForm = data.homeRecentForm.slice(0, 5).map((m) => m.result).join('') || 'N/A';
    const awayForm = data.awayRecentForm.slice(0, 5).map((m) => m.result).join('') || 'N/A';

    let standingsInfo = 'Unknown';
    if (data.standings) {
      standingsInfo = `${data.homeTeam.name}: ${data.standings.homePosition}th, ${data.awayTeam.name}: ${data.standings.awayPosition}th`;
    }

    let h2hInfo = 'Unknown';
    if (data.headToHead && data.headToHead.total > 0) {
      h2hInfo = `Last ${data.headToHead.total} matches: ${data.headToHead.homeWins}W-${data.headToHead.draws}D-${data.headToHead.awayWins}L`;
    }

    return `
MATCH: ${data.homeTeam.name} vs ${data.awayTeam.name}
LEAGUE: ${data.match.league || 'Unknown'}
DATE: ${data.match.kickoffTime.toLocaleDateString('en-US')}
VENUE: ${data.match.venue || 'Unknown'}

STANDINGS: ${standingsInfo}

RECENT FORM (Last 5):
- ${data.homeTeam.name}: ${homeForm}
- ${data.awayTeam.name}: ${awayForm}

HEAD TO HEAD: ${h2hInfo}

PREDICTIONS:
- Match Result: Home ${predictions.matchOutcome.homeWin}%, Draw ${predictions.matchOutcome.draw}%, Away ${predictions.matchOutcome.awayWin}%
- Predicted: ${predictions.matchOutcome.predicted === '1' ? data.homeTeam.name + ' wins' : predictions.matchOutcome.predicted === 'X' ? 'Draw' : data.awayTeam.name + ' wins'}
- Expected Goals: ${predictions.stats.expectedGoals.home} - ${predictions.stats.expectedGoals.away}
- BTTS: ${predictions.btts.predicted} (${Math.max(predictions.btts.yes, predictions.btts.no)}%)
- Over 2.5 Goals: ${predictions.overUnder.lines['2.5'].over}%
- Most Likely Score: ${predictions.correctScore.mostLikely}

Please write a detailed analysis for this match:
`;
  }

  /**
   * Generate template-based analysis (fallback)
   */
  private generateTemplateAnalysis(data: AggregatedMatchData, predictions: AllPredictions): string {
    const homeTeam = data.homeTeam.name;
    const awayTeam = data.awayTeam.name;

    // Determine favorite
    const isFavorite =
      predictions.matchOutcome.homeWin > predictions.matchOutcome.awayWin
        ? 'home'
        : predictions.matchOutcome.awayWin > predictions.matchOutcome.homeWin
        ? 'away'
        : 'none';

    const favoriteTeam = isFavorite === 'home' ? homeTeam : isFavorite === 'away' ? awayTeam : null;
    const favoriteProb = Math.max(predictions.matchOutcome.homeWin, predictions.matchOutcome.awayWin);

    // Describe form
    const homeForm = this.describeForm(data.homeRecentForm);
    const awayForm = this.describeForm(data.awayRecentForm);

    // Build analysis
    let analysis = '';

    // Opening paragraph - teams and form
    analysis += `${homeTeam} enter this fixture in ${homeForm} form. `;
    analysis += `Their opponents ${awayTeam} have been showing ${awayForm} performances recently. `;

    // Standings context
    if (data.standings) {
      const posDiff = Math.abs(data.standings.homePosition - data.standings.awayPosition);
      if (posDiff <= 3) {
        analysis += `Both teams are closely positioned in the league standings. `;
      } else if (data.standings.homePosition < data.standings.awayPosition) {
        analysis += `${homeTeam} currently sit higher in the league table. `;
      } else {
        analysis += `${awayTeam} hold a better league position. `;
      }
    }

    // Prediction paragraph
    analysis += '\n\n';
    if (favoriteTeam && favoriteProb > 40) {
      analysis += `Based on statistical analysis, ${favoriteTeam} appear to be favorites with a ${favoriteProb.toFixed(0)}% win probability. `;
    } else {
      analysis += `This looks like an evenly matched contest, with the draw probability at ${predictions.matchOutcome.draw.toFixed(0)}%. `;
    }

    // Goals analysis
    const totalXG = predictions.stats.expectedGoals.home + predictions.stats.expectedGoals.away;
    if (totalXG > 2.8) {
      analysis += `With expected goals at ${totalXG.toFixed(1)}, this could be a high-scoring affair. `;
    } else if (totalXG < 2.2) {
      analysis += `A low-scoring match is anticipated with total expected goals at ${totalXG.toFixed(1)}. `;
    }

    // BTTS analysis
    if (predictions.btts.yes > 55) {
      analysis += `Both teams finding the net seems likely (${predictions.btts.yes.toFixed(0)}% probability). `;
    } else if (predictions.btts.no > 55) {
      analysis += `At least one team may fail to score in this encounter. `;
    }

    // H2H context
    if (data.headToHead && data.headToHead.total >= 3) {
      analysis += '\n\n';
      analysis += `In the last ${data.headToHead.total} meetings, ${homeTeam} have recorded ${data.headToHead.homeWins} wins, `;
      analysis += `${data.headToHead.draws} draws, and ${data.headToHead.awayWins} defeats. `;

      if (data.headToHead.homeWins > data.headToHead.awayWins) {
        analysis += `The head-to-head record favors ${homeTeam}. `;
      } else if (data.headToHead.awayWins > data.headToHead.homeWins) {
        analysis += `Historical meetings give ${awayTeam} the edge. `;
      }
    }

    return analysis.trim();
  }

  /**
   * Describe team form in English
   */
  private describeForm(recentMatches: { result: 'W' | 'D' | 'L' }[]): string {
    if (recentMatches.length === 0) return 'unknown';

    const last5 = recentMatches.slice(0, 5);
    const wins = last5.filter((m) => m.result === 'W').length;
    const draws = last5.filter((m) => m.result === 'D').length;
    const losses = last5.filter((m) => m.result === 'L').length;

    if (wins >= 4) return 'excellent';
    if (wins >= 3) return 'good';
    if (wins >= 2 && losses <= 1) return 'consistent';
    if (losses >= 4) return 'poor';
    if (losses >= 3) return 'struggling';
    if (draws >= 3) return 'draw-prone';

    return 'mixed';
  }
}

export const aiAnalysisService = new AIAnalysisService();
