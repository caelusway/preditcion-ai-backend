import { Request, Response, NextFunction } from 'express';
import { dummyMatches, dummyMatchDetails, homeStats } from '../data/matches.dummy';
import {
  matchStatistics,
  formStatistics,
  homeTeamRecentMatches,
  awayTeamRecentMatches,
  standings,
  aiPredictions,
  matchHeaderOdds,
  marketValues,
  scorePredictions,
  statsPredictions,
  getMatchDetailData,
} from '../data/match-detail.dummy';
import { AppError } from '../types/common.types';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import {
  parsePaginationParams,
  getPrismaPagination,
  createPaginatedResponse,
} from '../utils/pagination';
import { generatePrediction } from '../utils/generate-prediction';
import { footballAPIService, ALL_LEAGUES, LEAGUE_IDS } from '../services/football-api.service';
import { predictionEngineService } from '../services/prediction/prediction-engine.service';
import { backtestService } from '../services/prediction/backtest.service';
import { logger } from '../lib/logger';
import { addIsOccuredToPredictions } from '../utils/prediction-evaluator';
import { formatAIPredictions } from '../utils/prediction-formatter';

export class MatchesController {
  // GET /matches - Get all matches grouped by league
  async getMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const dateParam = req.query.date as string; // YYYY-MM-DD format
      const status = req.query.status as string;

      // Parse date or use today
      const targetDate = dateParam || new Date().toISOString().split('T')[0];

      // If using real API data
      if (env.FOOTBALL_DATA_SOURCE === 'api') {
        try {
          // Fetch fixtures from API
          const fixtures = await footballAPIService.getFixturesByDate(targetDate, ALL_LEAGUES);

          // Group by league
          const leagueMap = new Map<string, {
            league: string;
            country: string;
            leagueImg: string;
            leagueId: number;
            matches: any[];
          }>();

          for (const fixture of fixtures) {
            const leagueKey = `${fixture.league.id}-${fixture.league.name}`;

            if (!leagueMap.has(leagueKey)) {
              leagueMap.set(leagueKey, {
                league: fixture.league.name,
                country: fixture.league.country,
                leagueImg: fixture.league.logo,
                leagueId: fixture.league.id,
                matches: [],
              });
            }

            // Upsert teams to database
            const [homeTeam, awayTeam] = await Promise.all([
              prisma.team.upsert({
                where: { apiId: fixture.teams.home.id.toString() },
                update: { name: fixture.teams.home.name, logoUrl: fixture.teams.home.logo },
                create: {
                  apiId: fixture.teams.home.id.toString(),
                  name: fixture.teams.home.name,
                  logoUrl: fixture.teams.home.logo,
                  country: fixture.league.country,
                  league: fixture.league.name,
                },
              }),
              prisma.team.upsert({
                where: { apiId: fixture.teams.away.id.toString() },
                update: { name: fixture.teams.away.name, logoUrl: fixture.teams.away.logo },
                create: {
                  apiId: fixture.teams.away.id.toString(),
                  name: fixture.teams.away.name,
                  logoUrl: fixture.teams.away.logo,
                  country: fixture.league.country,
                  league: fixture.league.name,
                },
              }),
            ]);

            // Determine match status
            let matchStatus: 'upcoming' | 'live' | 'finished' = 'upcoming';
            if (fixture.fixture.status.short === 'FT' || fixture.fixture.status.short === 'AET' || fixture.fixture.status.short === 'PEN') {
              matchStatus = 'finished';
            } else if (['1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(fixture.fixture.status.short)) {
              matchStatus = 'live';
            }

            // Apply status filter if provided
            if (status && matchStatus !== status) {
              continue;
            }

            // Upsert match to database
            const match = await prisma.match.upsert({
              where: { apiId: fixture.fixture.id.toString() },
              update: {
                homeScore: fixture.goals.home,
                awayScore: fixture.goals.away,
                status: matchStatus,
                externalData: fixture as any,
              },
              create: {
                apiId: fixture.fixture.id.toString(),
                homeTeamId: homeTeam.id,
                awayTeamId: awayTeam.id,
                kickoffTime: new Date(fixture.fixture.date),
                status: matchStatus,
                homeScore: fixture.goals.home,
                awayScore: fixture.goals.away,
                venue: fixture.fixture.venue?.name || null,
                referee: fixture.fixture.referee,
                league: fixture.league.name,
                season: fixture.league.season.toString(),
                round: fixture.league.round,
                externalData: fixture as any,
              },
            });

            leagueMap.get(leagueKey)!.matches.push({
              id: match.id,
              apiId: fixture.fixture.id.toString(),
              homeTeam: {
                id: homeTeam.id,
                name: homeTeam.name,
                apiId: homeTeam.apiId,
                logoUrl: homeTeam.logoUrl,
                country: homeTeam.country,
                league: homeTeam.league,
              },
              awayTeam: {
                id: awayTeam.id,
                name: awayTeam.name,
                apiId: awayTeam.apiId,
                logoUrl: awayTeam.logoUrl,
                country: awayTeam.country,
                league: awayTeam.league,
              },
              kickoffTime: fixture.fixture.date,
              status: matchStatus,
              homeScore: fixture.goals.home,
              awayScore: fixture.goals.away,
              venue: fixture.fixture.venue?.name,
              referee: fixture.fixture.referee,
              round: fixture.league.round,
            });
          }

          return res.status(200).json({
            date: targetDate,
            matches: Array.from(leagueMap.values()).filter(l => l.matches.length > 0),
          });
        } catch (apiError) {
          logger.error({ error: apiError }, 'Failed to fetch from API, falling back to database');
        }
      }

      // Fallback to database or dummy data
      if (env.FOOTBALL_DATA_SOURCE === 'dummy') {
        // Group dummy matches by league
        let filteredMatches = [...dummyMatches];
        if (status) {
          filteredMatches = filteredMatches.filter(m => m.status === status);
        }

        const leagueMap = new Map<string, any>();
        for (const match of filteredMatches) {
          const leagueKey = match.league;
          if (!leagueMap.has(leagueKey)) {
            leagueMap.set(leagueKey, {
              league: 'Premier League',
              country: match.homeTeam.country,
              leagueImg: 'https://media.api-sports.io/football/leagues/39.png',
              leagueId: LEAGUE_IDS.PREMIER_LEAGUE,
              matches: [],
            });
          }
          leagueMap.get(leagueKey)!.matches.push(match);
        }

        return res.status(200).json({
          date: targetDate,
          matches: Array.from(leagueMap.values()),
        });
      }

      // Database query with grouping
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const where: any = {
        kickoffTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      };
      if (status) {
        where.status = status;
      }

      const matches = await prisma.match.findMany({
        where,
        include: {
          homeTeam: true,
          awayTeam: true,
        },
        orderBy: {
          kickoffTime: 'asc',
        },
      });

      // Group by league
      const leagueMap = new Map<string, any>();
      for (const match of matches) {
        const leagueKey = match.league || 'Unknown';
        if (!leagueMap.has(leagueKey)) {
          leagueMap.set(leagueKey, {
            league: match.league,
            country: match.homeTeam.country,
            leagueImg: `https://media.api-sports.io/football/leagues/39.png`,
            leagueId: LEAGUE_IDS.PREMIER_LEAGUE,
            matches: [],
          });
        }
        leagueMap.get(leagueKey)!.matches.push({
          id: match.id,
          apiId: match.apiId,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          kickoffTime: match.kickoffTime,
          status: match.status,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          venue: match.venue,
          referee: match.referee,
          round: match.round,
        });
      }

      return res.status(200).json({
        date: targetDate,
        matches: Array.from(leagueMap.values()),
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /matches/upcoming - Get upcoming matches
  async getUpcomingMatches(req: Request, res: Response, next: NextFunction) {
    try {
      if (env.FOOTBALL_DATA_SOURCE === 'dummy') {
        const matches = dummyMatches.filter((m) => m.status === 'upcoming');
        return res.status(200).json({
          data: matches,
          count: matches.length,
        });
      }

      const matches = await prisma.match.findMany({
        where: { status: 'upcoming' },
        include: {
          homeTeam: true,
          awayTeam: true,
          odds: true,
        },
        orderBy: {
          kickoffTime: 'asc',
        },
        take: 20,
      });

      // Format matches with odds
      const formattedMatches = matches.map(match => ({
        id: match.id,
        apiId: match.apiId,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        kickoffTime: match.kickoffTime,
        status: match.status,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        venue: match.venue,
        referee: match.referee,
        league: match.league,
        round: match.round,
        odds: match.odds ? {
          homeWin: match.odds.homeWinOdds,
          draw: match.odds.drawOdds,
          awayWin: match.odds.awayWinOdds,
          over25: match.odds.over25Odds,
          under25: match.odds.under25Odds,
          bttsYes: match.odds.bttsYesOdds,
          bttsNo: match.odds.bttsNoOdds,
          bookmaker: match.odds.bookmaker,
          updatedAt: match.odds.updatedAt,
        } : null,
      }));

      return res.status(200).json({
        data: formattedMatches,
        count: formattedMatches.length,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /matches/:id - Get match details with full statistics
  async getMatchById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // If using dummy data
      if (env.FOOTBALL_DATA_SOURCE === 'dummy') {
        const matchDetail = dummyMatchDetails[id];
        if (matchDetail) {
          // Return full match detail screen data
          return res.status(200).json({
            match: matchDetail,
            matchStatistics,
            formStatistics,
            homeTeamRecentMatches,
            awayTeamRecentMatches,
            standings,
            aiPredictions,
            matchHeaderOdds,
            marketValues,
            scorePredictions,
            statsPredictions,
          });
        }

        // Fallback to basic match
        const match = dummyMatches.find((m) => m.id === id);
        if (!match) {
          throw new AppError(404, 'Match not found');
        }

        return res.status(200).json({
          match,
          matchStatistics,
          formStatistics,
          homeTeamRecentMatches,
          awayTeamRecentMatches,
          standings,
          aiPredictions,
          matchHeaderOdds,
          marketValues,
          scorePredictions,
          statsPredictions,
        });
      }

      // Using real database - fetch match with teams and predictions
      const match = await prisma.match.findUnique({
        where: { id },
        include: {
          homeTeam: true,
          awayTeam: true,
          predictions: {
            where: { userId: null }, // AI predictions only
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          statistics: true,
        },
      });

      if (!match) {
        throw new AppError(404, 'Match not found');
      }

      // Try to fetch additional data from API if available
      let apiStatistics = null;
      let homeRecentMatches: any[] = [];
      let awayRecentMatches: any[] = [];
      let leagueStandings = null;

      if (env.FOOTBALL_DATA_SOURCE === 'api' && match.apiId) {
        try {
          const fixtureId = parseInt(match.apiId);
          const homeTeamApiId = match.homeTeam.apiId ? parseInt(match.homeTeam.apiId) : null;
          const awayTeamApiId = match.awayTeam.apiId ? parseInt(match.awayTeam.apiId) : null;

          // Fetch fixture statistics
          const fixtureStats = await footballAPIService.getFixtureStatistics(fixtureId);
          if (fixtureStats.length > 0) {
            apiStatistics = fixtureStats;
          }

          // Fetch recent matches for both teams
          if (homeTeamApiId) {
            const homeMatches = await footballAPIService.getTeamFixtures(homeTeamApiId, 2024, 10);
            homeRecentMatches = homeMatches.map(m => ({
              date: new Date(m.fixture.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
              result: m.teams.home.id === homeTeamApiId
                ? (m.teams.home.winner ? 'W' : m.teams.away.winner ? 'L' : 'D')
                : (m.teams.away.winner ? 'W' : m.teams.home.winner ? 'L' : 'D'),
              homeTeam: { name: m.teams.home.name, logoUrl: m.teams.home.logo },
              awayTeam: { name: m.teams.away.name, logoUrl: m.teams.away.logo },
              homeScore: m.goals.home,
              awayScore: m.goals.away,
            }));
          }

          if (awayTeamApiId) {
            const awayMatches = await footballAPIService.getTeamFixtures(awayTeamApiId, 2024, 10);
            awayRecentMatches = awayMatches.map(m => ({
              date: new Date(m.fixture.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
              result: m.teams.away.id === awayTeamApiId
                ? (m.teams.away.winner ? 'W' : m.teams.home.winner ? 'L' : 'D')
                : (m.teams.home.winner ? 'W' : m.teams.away.winner ? 'L' : 'D'),
              homeTeam: { name: m.teams.home.name, logoUrl: m.teams.home.logo },
              awayTeam: { name: m.teams.away.name, logoUrl: m.teams.away.logo },
              homeScore: m.goals.home,
              awayScore: m.goals.away,
            }));
          }

          // Get league standings
          const externalData = match.externalData as any;
          if (externalData?.league?.id) {
            const rawStandings = await footballAPIService.getLeagueStandings(externalData.league.id, 2024);
            // Transform API standings to include team logos
            if (rawStandings?.league?.standings?.[0]) {
              leagueStandings = rawStandings.league.standings[0].map((s: any) => ({
                position: s.rank,
                team: {
                  name: s.team.name,
                  logoUrl: s.team.logo,
                },
                matches: s.all?.played || 0,
                goals: `${s.all?.goals?.for || 0}-${s.all?.goals?.against || 0}`,
                points: s.points,
                isHighlighted: s.team.id === parseInt(match.homeTeam.apiId || '0') ||
                               s.team.id === parseInt(match.awayTeam.apiId || '0'),
              }));
            }
          }
        } catch (apiError) {
          logger.warn({ error: apiError, matchId: id }, 'Failed to fetch additional match data from API');
        }
      }

      // Use stored prediction if available, otherwise generate dynamically
      let prediction;
      let enginePrediction = null;

      // Try to get prediction from engine (for real AI predictions)
      try {
        enginePrediction = await predictionEngineService.getPrediction(id);
        prediction = {
          id: enginePrediction.id,
          homeWinProbability: enginePrediction.matchOutcome.homeWin,
          drawProbability: enginePrediction.matchOutcome.draw,
          awayWinProbability: enginePrediction.matchOutcome.awayWin,
          aiConfidence: enginePrediction.confidence,
          aiAnalysis: enginePrediction.aiAnalysis,
          quickStats: enginePrediction.factors,
        };
      } catch (predErr) {
        logger.warn({ error: predErr, matchId: id }, 'Prediction engine failed, using fallback');

        if (match.predictions && match.predictions.length > 0) {
          const dbPrediction = match.predictions[0];
          prediction = {
            id: dbPrediction.id,
            homeWinProbability: dbPrediction.homeWinProbability,
            drawProbability: dbPrediction.drawProbability,
            awayWinProbability: dbPrediction.awayWinProbability,
            aiConfidence: dbPrediction.confidence,
            aiAnalysis: dbPrediction.reasoning,
            quickStats: dbPrediction.factors,
          };
        } else {
          // Fallback: generate prediction dynamically
          const fallbackPred = generatePrediction(
            { id: match.homeTeam.id, name: match.homeTeam.name },
            { id: match.awayTeam.id, name: match.awayTeam.name }
          );
          prediction = {
            id: `pred-${match.id}`,
            ...fallbackPred,
          };
        }
      }

      // Generate aiPredictions from engine or use dummy fallback
      let formattedPredictions;
      if (enginePrediction) {
        // Get odds data for formatting
        const oddsData = enginePrediction.dataQuality?.missingData?.includes('odds')
          ? null
          : {
              matchWinner: {
                home: matchHeaderOdds.homeWin.value,
                draw: matchHeaderOdds.draw.value,
                away: matchHeaderOdds.awayWin.value,
              },
            };

        formattedPredictions = formatAIPredictions(enginePrediction, oddsData);
      } else {
        formattedPredictions = aiPredictions;
      }

      // Add isOccured to aiPredictions for finished matches
      const predictionsWithOccured = addIsOccuredToPredictions(
        formattedPredictions,
        match.homeScore,
        match.awayScore,
        match.status
      );

      return res.status(200).json({
        match: {
          ...match,
          prediction,
        },
        matchStatistics: apiStatistics || matchStatistics,
        formStatistics,
        homeTeamRecentMatches: homeRecentMatches,
        awayTeamRecentMatches: awayRecentMatches,
        standings: leagueStandings || standings,
        aiPredictions: predictionsWithOccured,
        matchHeaderOdds,
        marketValues,
        scorePredictions,
        statsPredictions,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /matches/:id/predictions - Get AI predictions for match
  async getMatchPredictions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const forceRefresh = req.query.refresh === 'true';

      // Check if match exists
      const match = await prisma.match.findUnique({
        where: { id },
        include: { homeTeam: true, awayTeam: true },
      });

      if (!match) {
        throw new AppError(404, 'Match not found');
      }

      // If dummy mode, return dummy data
      if (env.FOOTBALL_DATA_SOURCE === 'dummy') {
        const matchDetail = dummyMatchDetails[id];
        if (matchDetail) {
          return res.status(200).json({
            prediction: matchDetail.prediction,
            aiPredictions,
            matchHeaderOdds,
            scorePredictions,
            statsPredictions,
          });
        }
        // Return basic dummy predictions
        return res.status(200).json({
          aiPredictions,
          matchHeaderOdds,
          scorePredictions,
          statsPredictions,
        });
      }

      try {
        // Use new prediction engine
        const prediction = await predictionEngineService.getPrediction(id, forceRefresh);
        const response = predictionEngineService.toResponse(prediction);

        return res.status(200).json(response);
      } catch (predError) {
        logger.error({ error: predError, matchId: id }, 'Prediction engine failed');

        // Fallback to stored prediction or dummy
        const storedPrediction = await prisma.prediction.findFirst({
          where: { matchId: id, userId: null },
          orderBy: { createdAt: 'desc' },
        });

        if (storedPrediction) {
          return res.status(200).json({
            matchId: id,
            matchOutcome: {
              homeWin: storedPrediction.homeWinProbability,
              draw: storedPrediction.drawProbability,
              awayWin: storedPrediction.awayWinProbability,
              predicted: storedPrediction.homeWinProbability > storedPrediction.awayWinProbability ? '1' : '2',
            },
            confidence: storedPrediction.confidence,
            aiAnalysis: storedPrediction.reasoning,
            aiPredictions,
            matchHeaderOdds,
            scorePredictions,
            statsPredictions,
          });
        }

        // Return dummy as last resort
        return res.status(200).json({
          aiPredictions,
          matchHeaderOdds,
          scorePredictions,
          statsPredictions,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // GET /matches/:id/statistics - Get match statistics
  async getMatchStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (env.FOOTBALL_DATA_SOURCE === 'dummy') {
        return res.status(200).json({
          matchId: id,
          statistics: matchStatistics,
        });
      }

      const stats = await prisma.matchStatistics.findUnique({
        where: { matchId: id },
      });

      if (!stats) {
        // Return default statistics if none found
        return res.status(200).json({
          matchId: id,
          statistics: matchStatistics,
        });
      }

      return res.status(200).json({
        matchId: id,
        statistics: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /matches/:id/form - Get team form data
  async getMatchForm(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (env.FOOTBALL_DATA_SOURCE === 'dummy') {
        return res.status(200).json({
          matchId: id,
          formStatistics,
          marketValues,
        });
      }

      // In production, fetch from database
      return res.status(200).json({
        matchId: id,
        formStatistics,
        marketValues,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /matches/:id/recent - Get recent matches for teams
  async getRecentMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (env.FOOTBALL_DATA_SOURCE === 'dummy') {
        return res.status(200).json({
          matchId: id,
          homeTeamRecentMatches,
          awayTeamRecentMatches,
        });
      }

      // In production, fetch from database
      return res.status(200).json({
        matchId: id,
        homeTeamRecentMatches,
        awayTeamRecentMatches,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /matches/:id/odds - Get betting odds for a match
  async getMatchOdds(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Find match to get apiId
      const match = await prisma.match.findUnique({
        where: { id },
        include: { homeTeam: true, awayTeam: true },
      });

      if (!match) {
        throw new AppError(404, 'Match not found');
      }

      // Dummy odds for fallback
      const dummyOdds = {
        matchId: id,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        bookmaker: 'Sample Odds',
        updatedAt: new Date().toISOString(),
        markets: {
          matchWinner: {
            name: 'Match Winner (1X2)',
            values: [
              { label: '1', name: match.homeTeam.name, odd: '2.10' },
              { label: 'X', name: 'Draw', odd: '3.40' },
              { label: '2', name: match.awayTeam.name, odd: '3.20' },
            ],
          },
          overUnder: {
            name: 'Goals Over/Under',
            values: [
              { label: 'Over 1.5', odd: '1.35' },
              { label: 'Under 1.5', odd: '3.10' },
              { label: 'Over 2.5', odd: '1.85' },
              { label: 'Under 2.5', odd: '1.95' },
              { label: 'Over 3.5', odd: '2.75' },
              { label: 'Under 3.5', odd: '1.45' },
            ],
          },
          btts: {
            name: 'Both Teams to Score',
            values: [
              { label: 'Yes', odd: '1.75' },
              { label: 'No', odd: '2.05' },
            ],
          },
          doubleChance: {
            name: 'Double Chance',
            values: [
              { label: '1X', name: `${match.homeTeam.name} or Draw`, odd: '1.30' },
              { label: '12', name: `${match.homeTeam.name} or ${match.awayTeam.name}`, odd: '1.25' },
              { label: 'X2', name: `Draw or ${match.awayTeam.name}`, odd: '1.55' },
            ],
          },
        },
      };

      if (env.FOOTBALL_DATA_SOURCE === 'dummy' || !match.apiId) {
        return res.status(200).json(dummyOdds);
      }

      // Fetch real odds from API-Football
      try {
        const fixtureId = parseInt(match.apiId);
        const apiOdds = await footballAPIService.getFixtureOdds(fixtureId);

        if (!apiOdds || !apiOdds.bookmakers || apiOdds.bookmakers.length === 0) {
          return res.status(200).json(dummyOdds);
        }

        // Use first bookmaker (usually the most reliable)
        const bookmaker = apiOdds.bookmakers[0];

        // Parse odds into structured format
        const parsedOdds: any = {
          matchId: id,
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          bookmaker: bookmaker.name,
          updatedAt: new Date().toISOString(),
          markets: {},
        };

        for (const bet of bookmaker.bets) {
          const betName = bet.name.toLowerCase();

          if (betName.includes('match winner') || betName === 'home/away') {
            parsedOdds.markets.matchWinner = {
              name: 'Match Winner (1X2)',
              values: bet.values.map((v) => ({
                label: v.value === 'Home' ? '1' : v.value === 'Away' ? '2' : 'X',
                name: v.value === 'Home' ? match.homeTeam.name : v.value === 'Away' ? match.awayTeam.name : 'Draw',
                odd: v.odd,
              })),
            };
          } else if (betName.includes('goals over/under') || betName.includes('over/under')) {
            parsedOdds.markets.overUnder = {
              name: 'Goals Over/Under',
              values: bet.values.map((v) => ({
                label: v.value,
                odd: v.odd,
              })),
            };
          } else if (betName.includes('both teams score') || betName === 'btts') {
            parsedOdds.markets.btts = {
              name: 'Both Teams to Score',
              values: bet.values.map((v) => ({
                label: v.value,
                odd: v.odd,
              })),
            };
          } else if (betName.includes('double chance')) {
            parsedOdds.markets.doubleChance = {
              name: 'Double Chance',
              values: bet.values.map((v) => ({
                label: v.value === 'Home/Draw' ? '1X' : v.value === 'Home/Away' ? '12' : 'X2',
                name: v.value === 'Home/Draw' ? `${match.homeTeam.name} or Draw` :
                      v.value === 'Home/Away' ? `${match.homeTeam.name} or ${match.awayTeam.name}` :
                      `Draw or ${match.awayTeam.name}`,
                odd: v.odd,
              })),
            };
          }
        }

        // Fill missing markets with dummy data
        if (!parsedOdds.markets.matchWinner) parsedOdds.markets.matchWinner = dummyOdds.markets.matchWinner;
        if (!parsedOdds.markets.overUnder) parsedOdds.markets.overUnder = dummyOdds.markets.overUnder;
        if (!parsedOdds.markets.btts) parsedOdds.markets.btts = dummyOdds.markets.btts;
        if (!parsedOdds.markets.doubleChance) parsedOdds.markets.doubleChance = dummyOdds.markets.doubleChance;

        return res.status(200).json(parsedOdds);
      } catch (apiError) {
        logger.warn({ error: apiError, matchId: id }, 'Failed to fetch odds from API');
        return res.status(200).json(dummyOdds);
      }
    } catch (error) {
      next(error);
    }
  }

  // GET /matches/home-stats - Get home stats
  async getHomeStats(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(homeStats);
    } catch (error) {
      next(error);
    }
  }

  // POST /matches/backtest - Run backtest on historical matches
  async runBacktest(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, limit = 50 } = req.body;

      if (!startDate || !endDate) {
        throw new AppError(400, 'startDate and endDate are required');
      }

      const report = await backtestService.runBacktest({
        startDate,
        endDate,
        limit: Math.min(limit, 100),
      });

      return res.status(200).json(report);
    } catch (error) {
      next(error);
    }
  }

  // GET /matches/finished - Get finished matches with date range
  async getFinishedMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const startDateParam = req.query.startDate as string;
      const endDateParam = req.query.endDate as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      // Default: last 7 days
      const endDate = endDateParam ? new Date(endDateParam) : new Date();
      endDate.setHours(23, 59, 59, 999);

      const startDate = startDateParam
        ? new Date(startDateParam)
        : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);

      // If using real API data
      if (env.FOOTBALL_DATA_SOURCE === 'api') {
        try {
          // Fetch all dates in range
          const allFixtures: any[] = [];
          const currentDate = new Date(startDate);

          while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const fixtures = await footballAPIService.getFixturesByDate(dateStr, ALL_LEAGUES);

            // Filter only finished matches
            const finishedFixtures = fixtures.filter(f =>
              ['FT', 'AET', 'PEN'].includes(f.fixture.status.short)
            );

            allFixtures.push(...finishedFixtures);
            currentDate.setDate(currentDate.getDate() + 1);
          }

          // Group by league
          const leagueMap = new Map<string, {
            league: string;
            country: string;
            leagueImg: string;
            leagueId: number;
            matches: any[];
          }>();

          for (const fixture of allFixtures) {
            const leagueKey = `${fixture.league.id}-${fixture.league.name}`;

            if (!leagueMap.has(leagueKey)) {
              leagueMap.set(leagueKey, {
                league: fixture.league.name,
                country: fixture.league.country,
                leagueImg: fixture.league.logo,
                leagueId: fixture.league.id,
                matches: [],
              });
            }

            leagueMap.get(leagueKey)!.matches.push({
              id: fixture.fixture.id.toString(),
              apiId: fixture.fixture.id.toString(),
              homeTeam: {
                name: fixture.teams.home.name,
                logoUrl: fixture.teams.home.logo,
              },
              awayTeam: {
                name: fixture.teams.away.name,
                logoUrl: fixture.teams.away.logo,
              },
              kickoffTime: fixture.fixture.date,
              status: 'finished',
              homeScore: fixture.goals.home,
              awayScore: fixture.goals.away,
              venue: fixture.fixture.venue?.name,
              round: fixture.league.round,
            });
          }

          // Paginate
          const allLeagues = Array.from(leagueMap.values()).filter(l => l.matches.length > 0);
          const totalMatches = allLeagues.reduce((acc, l) => acc + l.matches.length, 0);

          return res.status(200).json({
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            totalMatches,
            matches: allLeagues,
          });
        } catch (apiError) {
          logger.error({ error: apiError }, 'Failed to fetch finished matches from API');
        }
      }

      // Fallback to database
      const matches = await prisma.match.findMany({
        where: {
          status: 'finished',
          kickoffTime: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
        orderBy: {
          kickoffTime: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      const totalCount = await prisma.match.count({
        where: {
          status: 'finished',
          kickoffTime: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Group by league
      const leagueMap = new Map<string, any>();
      for (const match of matches) {
        const leagueKey = match.league || 'Unknown';
        if (!leagueMap.has(leagueKey)) {
          leagueMap.set(leagueKey, {
            league: match.league,
            country: match.homeTeam.country,
            leagueImg: `https://media.api-sports.io/football/leagues/39.png`,
            leagueId: LEAGUE_IDS.PREMIER_LEAGUE,
            matches: [],
          });
        }
        leagueMap.get(leagueKey)!.matches.push({
          id: match.id,
          apiId: match.apiId,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          kickoffTime: match.kickoffTime,
          status: match.status,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          venue: match.venue,
          round: match.round,
        });
      }

      return res.status(200).json({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalMatches: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        matches: Array.from(leagueMap.values()),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const matchesController = new MatchesController();
