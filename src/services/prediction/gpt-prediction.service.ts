import { logger } from '../../lib/logger';
import { env } from '../../config/env';
import {
  AggregatedMatchData,
  MatchOutcomePrediction,
  BTTSPrediction,
  OverUnderPrediction,
  PredictionFactor,
} from '../../types/prediction.types';

interface AIPredictionResult {
  matchOutcome: {
    homeWin: number;
    draw: number;
    awayWin: number;
    predicted: '1' | 'X' | '2';
    confidence: number;
    reasoning: string;
  };
  btts: {
    yes: number;
    no: number;
    predicted: 'Yes' | 'No';
    confidence: number;
    reasoning: string;
  };
  overUnder: {
    over25: number;
    under25: number;
    predicted: 'Over' | 'Under';
    confidence: number;
    reasoning: string;
  };
  analysis: string;
}

export class GPTPredictionService {
  private geminiApiKey: string | null = null;
  private openaiApiKey: string | null = null;
  private provider: 'openai' | 'gemini';
  private model: string;

  constructor() {
    this.geminiApiKey = env.GEMINI_API_KEY || null;
    this.openaiApiKey = env.OPENAI_API_KEY || null;
    this.provider = env.AI_PROVIDER || 'gemini';
    this.model = env.AI_MODEL || 'gemini-3-pro-preview';
  }

  isAvailable(): boolean {
    if (this.provider === 'gemini') {
      return !!this.geminiApiKey;
    }
    return !!this.openaiApiKey;
  }

  /**
   * Get predictions from AI model (Gemini or OpenAI)
   */
  async getPredictions(data: AggregatedMatchData): Promise<AIPredictionResult | null> {
    if (!this.isAvailable()) {
      logger.warn(`AI prediction not available - no ${this.provider} API key`);
      return null;
    }

    try {
      const prompt = this.buildPredictionPrompt(data);
      const response = this.provider === 'gemini'
        ? await this.callGemini(prompt)
        : await this.callOpenAI(prompt);

      if (!response) {
        return null;
      }

      return this.parseAIResponse(response);
    } catch (error) {
      logger.error({ error }, `${this.provider} prediction failed`);
      return null;
    }
  }

  /**
   * Build comprehensive prompt for GPT prediction with all available data
   */
  private buildPredictionPrompt(data: AggregatedMatchData): string {
    const homeTeam = data.homeTeam.name;
    const awayTeam = data.awayTeam.name;
    const league = data.match.league || 'Unknown League';

    // Format home team season statistics
    let homeStatsStr = 'No season statistics available';
    if (data.homeStats) {
      const hs = data.homeStats;
      homeStatsStr = `Form: ${hs.form || 'N/A'}
Played: ${hs.fixtures.played.total} (Home: ${hs.fixtures.played.home}, Away: ${hs.fixtures.played.away})
Wins: ${hs.fixtures.wins.total} (Home: ${hs.fixtures.wins.home}, Away: ${hs.fixtures.wins.away})
Draws: ${hs.fixtures.draws.total} (Home: ${hs.fixtures.draws.home}, Away: ${hs.fixtures.draws.away})
Losses: ${hs.fixtures.losses.total} (Home: ${hs.fixtures.losses.home}, Away: ${hs.fixtures.losses.away})
Goals Scored: ${hs.goals.for.total.total} (Home: ${hs.goals.for.total.home}, Away: ${hs.goals.for.total.away})
Goals Conceded: ${hs.goals.against.total.total} (Home: ${hs.goals.against.total.home}, Away: ${hs.goals.against.total.away})
Avg Goals Scored: ${hs.goals.for.average.total.toFixed(2)} per game
Avg Goals Conceded: ${hs.goals.against.average.total.toFixed(2)} per game
Clean Sheets: ${hs.cleanSheet.total} (Home: ${hs.cleanSheet.home}, Away: ${hs.cleanSheet.away})
Failed to Score: ${hs.failedToScore.total} (Home: ${hs.failedToScore.home}, Away: ${hs.failedToScore.away})`;
    }

    // Format away team season statistics
    let awayStatsStr = 'No season statistics available';
    if (data.awayStats) {
      const as = data.awayStats;
      awayStatsStr = `Form: ${as.form || 'N/A'}
Played: ${as.fixtures.played.total} (Home: ${as.fixtures.played.home}, Away: ${as.fixtures.played.away})
Wins: ${as.fixtures.wins.total} (Home: ${as.fixtures.wins.home}, Away: ${as.fixtures.wins.away})
Draws: ${as.fixtures.draws.total} (Home: ${as.fixtures.draws.home}, Away: ${as.fixtures.draws.away})
Losses: ${as.fixtures.losses.total} (Home: ${as.fixtures.losses.home}, Away: ${as.fixtures.losses.away})
Goals Scored: ${as.goals.for.total.total} (Home: ${as.goals.for.total.home}, Away: ${as.goals.for.total.away})
Goals Conceded: ${as.goals.against.total.total} (Home: ${as.goals.against.total.home}, Away: ${as.goals.against.total.away})
Avg Goals Scored: ${as.goals.for.average.total.toFixed(2)} per game
Avg Goals Conceded: ${as.goals.against.average.total.toFixed(2)} per game
Clean Sheets: ${as.cleanSheet.total} (Home: ${as.cleanSheet.home}, Away: ${as.cleanSheet.away})
Failed to Score: ${as.failedToScore.total} (Home: ${as.failedToScore.home}, Away: ${as.failedToScore.away})`;
    }

    // Format recent form (last 5 matches)
    let homeForm = 'No recent matches';
    if (data.homeRecentForm && data.homeRecentForm.length > 0) {
      homeForm = data.homeRecentForm.slice(0, 5).map(m =>
        `${m.result}(${m.goalsScored}-${m.goalsConceded}) vs ${m.isHome ? m.awayTeam : m.homeTeam}${m.isHome ? '(H)' : '(A)'}`
      ).join(', ');
    }

    let awayForm = 'No recent matches';
    if (data.awayRecentForm && data.awayRecentForm.length > 0) {
      awayForm = data.awayRecentForm.slice(0, 5).map(m =>
        `${m.result}(${m.goalsScored}-${m.goalsConceded}) vs ${m.isHome ? m.awayTeam : m.homeTeam}${m.isHome ? '(H)' : '(A)'}`
      ).join(', ');
    }

    // Format head-to-head data
    let h2hStr = 'No head-to-head data available';
    if (data.headToHead && data.headToHead.total > 0) {
      const h2h = data.headToHead;
      const avgGoals = h2h.total > 0 ? ((h2h.homeGoals + h2h.awayGoals) / h2h.total).toFixed(2) : '0';
      h2hStr = `Total Meetings: ${h2h.total}
${homeTeam} Wins: ${h2h.homeWins} | Draws: ${h2h.draws} | ${awayTeam} Wins: ${h2h.awayWins}
Total Goals: ${h2h.homeGoals + h2h.awayGoals} (Avg: ${avgGoals} per match)
BTTS: ${h2h.bttsCount}/${h2h.total} (${h2h.total > 0 ? ((h2h.bttsCount / h2h.total) * 100).toFixed(0) : 0}%)
Over 2.5 Goals: ${h2h.over25Count}/${h2h.total} (${h2h.total > 0 ? ((h2h.over25Count / h2h.total) * 100).toFixed(0) : 0}%)`;

      if (h2h.matches && h2h.matches.length > 0) {
        h2hStr += '\nRecent H2H: ' + h2h.matches.slice(0, 3).map(m =>
          `${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam} (${m.date})`
        ).join(' | ');
      }
    }

    // Format standings data
    let standingsStr = 'No standings data available';
    if (data.standings) {
      const s = data.standings;
      standingsStr = `${homeTeam}: Position #${s.homePosition} (${s.homePoints} pts, GD: ${s.homeGoalDiff >= 0 ? '+' : ''}${s.homeGoalDiff})
${awayTeam}: Position #${s.awayPosition} (${s.awayPoints} pts, GD: ${s.awayGoalDiff >= 0 ? '+' : ''}${s.awayGoalDiff})
Position Gap: ${Math.abs(s.homePosition - s.awayPosition)} places (out of ${s.totalTeams} teams)`;
    }

    // Format betting odds
    let oddsStr = 'No betting odds available';
    if (data.odds && data.odds.matchWinner.home > 0) {
      oddsStr = `Match Winner: Home ${data.odds.matchWinner.home.toFixed(2)} | Draw ${data.odds.matchWinner.draw.toFixed(2)} | Away ${data.odds.matchWinner.away.toFixed(2)}`;
      if (data.odds.btts && data.odds.btts.yes > 0) {
        oddsStr += `\nBTTS: Yes ${data.odds.btts.yes.toFixed(2)} | No ${data.odds.btts.no.toFixed(2)}`;
      }
      if (data.odds.overUnder && data.odds.overUnder.over25 > 0) {
        oddsStr += `\nOver/Under 2.5: Over ${data.odds.overUnder.over25.toFixed(2)} | Under ${data.odds.overUnder.under25.toFixed(2)}`;
      }
      oddsStr += `\nBookmaker: ${data.odds.bookmaker || 'Various'}`;
    }

    return `You are a world-class football analyst with deep knowledge of European football leagues. Analyze this match comprehensively.

=== MATCH INFORMATION ===
Home Team: ${homeTeam}
Away Team: ${awayTeam}
League: ${league}
Date: ${data.match.kickoffTime.toISOString().split('T')[0]}
Venue: ${data.match.venue || 'Home Stadium'}

=== ${homeTeam.toUpperCase()} SEASON STATISTICS ===
${homeStatsStr}

=== ${awayTeam.toUpperCase()} SEASON STATISTICS ===
${awayStatsStr}

=== RECENT FORM (Last 5 matches) ===
${homeTeam}: ${homeForm}
${awayTeam}: ${awayForm}

=== HEAD TO HEAD HISTORY ===
${h2hStr}

=== LEAGUE STANDINGS ===
${standingsStr}

=== BETTING ODDS (Market Indicator) ===
${oddsStr}

=== ANALYSIS INSTRUCTIONS ===
Based on ALL the data above, provide your expert predictions. Consider:
1. Home advantage - ${homeTeam} playing at home typically gives them an edge
2. Current form - Weight recent results heavily
3. Head-to-head record - Historical patterns between these teams
4. League position - Quality difference reflected in standings
5. Goals patterns - Scoring and conceding trends (clean sheets, failed to score)
6. Market odds - Bookmaker analysis as reference (not gospel)

Use your football knowledge to interpret patterns. For example:
- High clean sheet % suggests defensive solidity
- High failed to score % suggests attacking weakness
- Recent form shows current momentum
- H2H shows psychological factors

IMPORTANT: Provide realistic percentages that reflect true probabilities.

Respond ONLY with valid JSON in this exact format:
{
  "matchOutcome": {
    "homeWin": <number 0-100>,
    "draw": <number 0-100>,
    "awayWin": <number 0-100>,
    "predicted": "<1 or X or 2>",
    "confidence": <number 0-100>,
    "reasoning": "<2-3 sentence explanation>"
  },
  "btts": {
    "yes": <number 0-100>,
    "no": <number 0-100>,
    "predicted": "<Yes or No>",
    "confidence": <number 0-100>,
    "reasoning": "<1-2 sentence explanation>"
  },
  "overUnder": {
    "over25": <number 0-100>,
    "under25": <number 0-100>,
    "predicted": "<Over or Under>",
    "confidence": <number 0-100>,
    "reasoning": "<1-2 sentence explanation>"
  },
  "analysis": "<3-4 sentence overall match analysis covering key factors>"
}`;
  }

  /**
   * Call Gemini API
   */
  private async callGemini(prompt: string): Promise<string | null> {
    try {
      logger.info({ model: this.model }, 'Calling Gemini for prediction');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an expert football analyst. Always respond with valid JSON only, no additional text or markdown formatting.\n\n${prompt}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2000,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ status: response.status, error: errorText }, 'Gemini API error');
        return null;
      }

      const result = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };

      const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
      logger.info({ responseLength: content?.length }, 'Gemini response received');

      return content || null;
    } catch (error) {
      logger.error({ error }, 'Gemini API call failed');
      return null;
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string | null> {
    try {
      logger.info({ model: this.model }, 'Calling OpenAI for prediction');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert football analyst. Always respond with valid JSON only, no additional text.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ status: response.status, error: errorText }, 'OpenAI API error');
        return null;
      }

      const result = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = result.choices?.[0]?.message?.content;
      logger.info({ responseLength: content?.length }, 'OpenAI response received');

      return content || null;
    } catch (error) {
      logger.error({ error }, 'OpenAI API call failed');
      return null;
    }
  }

  /**
   * Parse AI response into structured prediction
   */
  private parseAIResponse(response: string): AIPredictionResult | null {
    try {
      // Clean response - remove markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.slice(7);
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.slice(3);
      }
      if (cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.slice(0, -3);
      }
      cleanResponse = cleanResponse.trim();

      const parsed = JSON.parse(cleanResponse);

      // Validate and normalize
      const result: AIPredictionResult = {
        matchOutcome: {
          homeWin: this.clamp(parsed.matchOutcome?.homeWin || 33, 0, 100),
          draw: this.clamp(parsed.matchOutcome?.draw || 33, 0, 100),
          awayWin: this.clamp(parsed.matchOutcome?.awayWin || 33, 0, 100),
          predicted: this.validateOutcome(parsed.matchOutcome?.predicted),
          confidence: this.clamp(parsed.matchOutcome?.confidence || 50, 0, 100),
          reasoning: parsed.matchOutcome?.reasoning || '',
        },
        btts: {
          yes: this.clamp(parsed.btts?.yes || 50, 0, 100),
          no: this.clamp(parsed.btts?.no || 50, 0, 100),
          predicted: parsed.btts?.predicted === 'Yes' ? 'Yes' : 'No',
          confidence: this.clamp(parsed.btts?.confidence || 50, 0, 100),
          reasoning: parsed.btts?.reasoning || '',
        },
        overUnder: {
          over25: this.clamp(parsed.overUnder?.over25 || 50, 0, 100),
          under25: this.clamp(parsed.overUnder?.under25 || 50, 0, 100),
          predicted: parsed.overUnder?.predicted === 'Over' ? 'Over' : 'Under',
          confidence: this.clamp(parsed.overUnder?.confidence || 50, 0, 100),
          reasoning: parsed.overUnder?.reasoning || '',
        },
        analysis: parsed.analysis || '',
      };

      // Normalize probabilities to 100%
      const outcomeTotal = result.matchOutcome.homeWin + result.matchOutcome.draw + result.matchOutcome.awayWin;
      if (outcomeTotal > 0) {
        result.matchOutcome.homeWin = Math.round(result.matchOutcome.homeWin / outcomeTotal * 100);
        result.matchOutcome.draw = Math.round(result.matchOutcome.draw / outcomeTotal * 100);
        result.matchOutcome.awayWin = 100 - result.matchOutcome.homeWin - result.matchOutcome.draw;
      }

      result.btts.no = 100 - result.btts.yes;
      result.overUnder.under25 = 100 - result.overUnder.over25;

      return result;
    } catch (error) {
      logger.error({ error, response }, 'Failed to parse GPT response');
      return null;
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private validateOutcome(value: string): '1' | 'X' | '2' {
    if (value === '1' || value === 'X' || value === '2') return value;
    return '1';
  }

  /**
   * Convert AI prediction to MatchOutcomePrediction format
   */
  convertToMatchOutcome(aiResult: AIPredictionResult, _data: AggregatedMatchData): MatchOutcomePrediction {
    const factors: PredictionFactor[] = [
      {
        type: 'ai_analysis',
        description: `AI: ${aiResult.matchOutcome.reasoning}`,
        impact: 'neutral',
      },
    ];

    return {
      type: 'match_outcome',
      homeWin: aiResult.matchOutcome.homeWin,
      draw: aiResult.matchOutcome.draw,
      awayWin: aiResult.matchOutcome.awayWin,
      predicted: aiResult.matchOutcome.predicted,
      confidence: aiResult.matchOutcome.confidence,
      factors,
    };
  }

  /**
   * Convert AI prediction to BTTSPrediction format
   */
  convertToBTTS(aiResult: AIPredictionResult): BTTSPrediction {
    const factors: PredictionFactor[] = [
      {
        type: 'ai_analysis',
        description: `AI: ${aiResult.btts.reasoning}`,
        impact: 'neutral',
      },
    ];

    return {
      type: 'btts',
      yes: aiResult.btts.yes,
      no: aiResult.btts.no,
      predicted: aiResult.btts.predicted,
      confidence: aiResult.btts.confidence,
      factors,
    };
  }

  /**
   * Convert AI prediction to OverUnderPrediction format
   */
  convertToOverUnder(aiResult: AIPredictionResult): OverUnderPrediction {
    const factors: PredictionFactor[] = [
      {
        type: 'ai_analysis',
        description: `AI: ${aiResult.overUnder.reasoning}`,
        impact: 'neutral',
      },
    ];

    return {
      type: 'over_under',
      lines: {
        '0.5': { over: 95, under: 5 },
        '1.5': { over: 80, under: 20 },
        '2.5': { over: aiResult.overUnder.over25, under: aiResult.overUnder.under25 },
        '3.5': { over: Math.max(10, aiResult.overUnder.over25 - 25), under: Math.min(90, aiResult.overUnder.under25 + 25) },
      },
      expectedGoals: 2.5,
      recommended: aiResult.overUnder.predicted === 'Over' ? 'Over 2.5' : 'Under 2.5',
      confidence: aiResult.overUnder.confidence,
      factors,
    };
  }
}

export const gptPredictionService = new GPTPredictionService();
