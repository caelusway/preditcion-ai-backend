import { footballAPIService, TOP_5_LEAGUES, LEAGUE_IDS } from './football-api.service';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { env } from '../config/env';

/**
 * Service to sync football data from API-Football to database
 * Syncs Top 5 European leagues: Premier League, La Liga, Serie A, Bundesliga, Ligue 1
 */
export class MatchSyncService {
  private readonly PREMIER_LEAGUE_SEASON = 2024;
  private readonly CURRENT_SEASON = 2024; // For Dec 2024 - May 2025, season is 2024

  /**
   * Get current season based on today's date
   * Football seasons run from August to May
   * Aug-Dec: use current year, Jan-May: use previous year
   */
  private getCurrentSeason(): number {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const year = now.getFullYear();
    // If Jan-July (0-6), use previous year. If Aug-Dec (7-11), use current year
    return month < 7 ? year - 1 : year;
  }

  /**
   * Sync all Premier League teams for 2024-2025 season
   */
  async syncTeams(): Promise<void> {
    if (env.FOOTBALL_DATA_SOURCE !== 'api') {
      logger.info('Skipping team sync - using dummy data');
      return;
    }

    try {
      logger.info('Starting team sync for Premier League 2024-2025...');

      const apiTeams = await footballAPIService.getPremierLeagueTeams(this.PREMIER_LEAGUE_SEASON);

      logger.info({ count: apiTeams.length }, 'Fetched teams from API');

      for (const apiTeam of apiTeams) {
        const teamData = (apiTeam as any).team || apiTeam;

        await prisma.team.upsert({
          where: { apiId: teamData.id.toString() },
          create: {
            apiId: teamData.id.toString(),
            name: teamData.name,
            logoUrl: teamData.logo,
            country: teamData.country || 'England',
            league: 'Premier League',
          },
          update: {
            name: teamData.name,
            logoUrl: teamData.logo,
            country: teamData.country || 'England',
          },
        });
      }

      logger.info({ count: apiTeams.length }, 'Team sync completed');
    } catch (error) {
      logger.error({ error }, 'Failed to sync teams');
      throw error;
    }
  }

  /**
   * Sync Premier League fixtures for 2024-2025 season
   * @param status - Optional status filter: 'FT' (finished), 'NS' (not started), etc.
   * @param limit - Maximum number of fixtures to sync
   */
  async syncFixtures(status?: string, limit?: number): Promise<void> {
    if (env.FOOTBALL_DATA_SOURCE !== 'api') {
      logger.info('Skipping fixture sync - using dummy data');
      return;
    }

    try {
      logger.info({ status, limit }, 'Starting fixture sync for Premier League 2024-2025...');

      let apiFixtures = await footballAPIService.getPremierLeagueFixtures(
        this.PREMIER_LEAGUE_SEASON,
        status
      );

      if (limit) {
        apiFixtures = apiFixtures.slice(0, limit);
      }

      logger.info({ count: apiFixtures.length }, 'Fetched fixtures from API');

      for (const fixture of apiFixtures) {
        // Get or find teams
        const homeTeam = await prisma.team.findUnique({
          where: { apiId: fixture.teams.home.id.toString() },
        });

        const awayTeam = await prisma.team.findUnique({
          where: { apiId: fixture.teams.away.id.toString() },
        });

        if (!homeTeam || !awayTeam) {
          logger.warn(
            {
              fixtureId: fixture.fixture.id,
              homeTeam: fixture.teams.home.name,
              awayTeam: fixture.teams.away.name,
            },
            'Skipping fixture - teams not found in database'
          );
          continue;
        }

        // Determine match status
        const matchStatus = this.mapFixtureStatus(fixture.fixture.status.short);

        // Upsert match
        await prisma.match.upsert({
          where: { apiId: fixture.fixture.id.toString() },
          create: {
            apiId: fixture.fixture.id.toString(),
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            kickoffTime: new Date(fixture.fixture.date),
            status: matchStatus,
            homeScore: fixture.goals.home,
            awayScore: fixture.goals.away,
            venue: fixture.fixture.venue.name,
            referee: fixture.fixture.referee,
            league: fixture.league.name,
            season: fixture.league.season.toString(),
            round: fixture.league.round,
            externalData: fixture as any,
          },
          update: {
            kickoffTime: new Date(fixture.fixture.date),
            status: matchStatus,
            homeScore: fixture.goals.home,
            awayScore: fixture.goals.away,
            venue: fixture.fixture.venue.name,
            referee: fixture.fixture.referee,
            round: fixture.league.round,
            externalData: fixture as any,
          },
        });
      }

      logger.info({ count: apiFixtures.length }, 'Fixture sync completed');
    } catch (error) {
      logger.error({ error }, 'Failed to sync fixtures');
      throw error;
    }
  }

  /**
   * Sync match statistics for a specific fixture
   */
  async syncFixtureStatistics(fixtureId: number): Promise<void> {
    if (env.FOOTBALL_DATA_SOURCE !== 'api') {
      return;
    }

    try {
      const match = await prisma.match.findUnique({
        where: { apiId: fixtureId.toString() },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      });

      if (!match) {
        logger.warn({ fixtureId }, 'Match not found in database');
        return;
      }

      const statistics = await footballAPIService.getFixtureStatistics(fixtureId);

      if (!statistics || statistics.length === 0) {
        logger.warn({ fixtureId }, 'No statistics available for fixture');
        return;
      }

      // Extract statistics for both teams
      const homeStats = statistics.find(
        (s) => s.team.id.toString() === match.homeTeam.apiId
      )?.statistics;
      const awayStats = statistics.find(
        (s) => s.team.id.toString() === match.awayTeam.apiId
      )?.statistics;

      if (!homeStats || !awayStats) {
        return;
      }

      // Parse statistics
      const getValue = (stats: any[], type: string): any => {
        const stat = stats.find((s) => s.type === type);
        return stat?.value ?? null;
      };

      // Get team form from recent fixtures
      const [homeForm, awayForm] = await Promise.all([
        this.getTeamForm(parseInt(match.homeTeam.apiId!)),
        this.getTeamForm(parseInt(match.awayTeam.apiId!)),
      ]);

      // Upsert match statistics
      await prisma.matchStatistics.upsert({
        where: { matchId: match.id },
        create: {
          matchId: match.id,
          homeFormW: homeForm.wins,
          homeFormD: homeForm.draws,
          homeFormL: homeForm.losses,
          homeFormString: homeForm.formString,
          awayFormW: awayForm.wins,
          awayFormD: awayForm.draws,
          awayFormL: awayForm.losses,
          awayFormString: awayForm.formString,
          homeGoalsScored: homeForm.goalsScored,
          homeGoalsConceded: homeForm.goalsConceded,
          awayGoalsScored: awayForm.goalsScored,
          awayGoalsConceded: awayForm.goalsConceded,
          rawData: { home: homeStats, away: awayStats } as any,
        },
        update: {
          homeFormW: homeForm.wins,
          homeFormD: homeForm.draws,
          homeFormL: homeForm.losses,
          homeFormString: homeForm.formString,
          awayFormW: awayForm.wins,
          awayFormD: awayForm.draws,
          awayFormL: awayForm.losses,
          awayFormString: awayForm.formString,
          homeGoalsScored: homeForm.goalsScored,
          homeGoalsConceded: homeForm.goalsConceded,
          awayGoalsScored: awayForm.goalsScored,
          awayGoalsConceded: awayForm.goalsConceded,
          rawData: { home: homeStats, away: awayStats } as any,
        },
      });

      logger.info({ fixtureId, matchId: match.id }, 'Match statistics synced');
    } catch (error) {
      logger.error({ error, fixtureId }, 'Failed to sync fixture statistics');
    }
  }

  /**
   * Get team form from last N matches
   */
  private async getTeamForm(teamId: number, last: number = 10) {
    try {
      const fixtures = await footballAPIService.getTeamFixtures(
        teamId,
        this.PREMIER_LEAGUE_SEASON,
        last
      );

      let wins = 0;
      let draws = 0;
      let losses = 0;
      let goalsScored = 0;
      let goalsConceded = 0;
      const formString: string[] = [];

      for (const fixture of fixtures) {
        if (fixture.fixture.status.short !== 'FT') continue;

        const isHome = fixture.teams.home.id === teamId;
        const teamGoals = isHome ? fixture.goals.home : fixture.goals.away;
        const opponentGoals = isHome ? fixture.goals.away : fixture.goals.home;

        if (teamGoals === null || opponentGoals === null) continue;

        goalsScored += teamGoals;
        goalsConceded += opponentGoals;

        if (teamGoals > opponentGoals) {
          wins++;
          formString.push('W');
        } else if (teamGoals < opponentGoals) {
          losses++;
          formString.push('L');
        } else {
          draws++;
          formString.push('D');
        }
      }

      return {
        wins,
        draws,
        losses,
        goalsScored,
        goalsConceded,
        formString: formString.join(''),
      };
    } catch (error) {
      logger.error({ error, teamId }, 'Failed to get team form');
      return {
        wins: 0,
        draws: 0,
        losses: 0,
        goalsScored: 0,
        goalsConceded: 0,
        formString: '',
      };
    }
  }

  /**
   * Map API-Football status codes to our status
   */
  private mapFixtureStatus(apiStatus: string): string {
    const statusMap: Record<string, string> = {
      NS: 'upcoming', // Not Started
      TBD: 'upcoming', // Time To Be Defined
      LIVE: 'live',
      '1H': 'live', // First Half
      HT: 'live', // Halftime
      '2H': 'live', // Second Half
      ET: 'live', // Extra Time
      P: 'live', // Penalties
      FT: 'finished', // Finished
      AET: 'finished', // Finished After Extra Time
      PEN: 'finished', // Finished After Penalties
      PST: 'postponed', // Postponed
      CANC: 'cancelled', // Cancelled
      ABD: 'abandoned', // Abandoned
      AWD: 'awarded', // Technical Loss
      WO: 'walkover', // WalkOver
    };

    return statusMap[apiStatus] || 'upcoming';
  }

  /**
   * Sync Premier League standings
   */
  async syncStandings(): Promise<void> {
    if (env.FOOTBALL_DATA_SOURCE !== 'api') {
      logger.info('Skipping standings sync - using dummy data');
      return;
    }

    try {
      logger.info({ season: this.PREMIER_LEAGUE_SEASON }, 'Starting standings sync...');

      const standingsData = await footballAPIService.getPremierLeagueStandings(
        this.PREMIER_LEAGUE_SEASON
      );

      if (!standingsData || !standingsData.league || !standingsData.league.standings) {
        logger.warn('No standings data available');
        return;
      }

      const standings = standingsData.league.standings[0]; // Premier League has single group

      for (const standing of standings) {
        const team = await prisma.team.findUnique({
          where: { apiId: standing.team.id.toString() },
        });

        if (!team) {
          logger.warn({ teamName: standing.team.name }, 'Team not found for standings');
          continue;
        }

        await prisma.standing.upsert({
          where: {
            teamId_season: {
              teamId: team.id,
              season: this.PREMIER_LEAGUE_SEASON.toString(),
            },
          },
          create: {
            teamId: team.id,
            season: this.PREMIER_LEAGUE_SEASON.toString(),
            league: 'Premier League',
            rank: standing.rank,
            points: standing.points,
            goalsDiff: standing.goalsDiff,
            played: standing.all.played,
            wins: standing.all.win,
            draws: standing.all.draw,
            losses: standing.all.lose,
            goalsFor: standing.all.goals.for,
            goalsAgainst: standing.all.goals.against,
            homePlayed: standing.home.played,
            homeWins: standing.home.win,
            homeDraws: standing.home.draw,
            homeLosses: standing.home.lose,
            homeGoalsFor: standing.home.goals.for,
            homeGoalsAgainst: standing.home.goals.against,
            awayPlayed: standing.away.played,
            awayWins: standing.away.win,
            awayDraws: standing.away.draw,
            awayLosses: standing.away.lose,
            awayGoalsFor: standing.away.goals.for,
            awayGoalsAgainst: standing.away.goals.against,
            form: standing.form,
            description: standing.description,
          },
          update: {
            rank: standing.rank,
            points: standing.points,
            goalsDiff: standing.goalsDiff,
            played: standing.all.played,
            wins: standing.all.win,
            draws: standing.all.draw,
            losses: standing.all.lose,
            goalsFor: standing.all.goals.for,
            goalsAgainst: standing.all.goals.against,
            homePlayed: standing.home.played,
            homeWins: standing.home.win,
            homeDraws: standing.home.draw,
            homeLosses: standing.home.lose,
            homeGoalsFor: standing.home.goals.for,
            homeGoalsAgainst: standing.home.goals.against,
            awayPlayed: standing.away.played,
            awayWins: standing.away.win,
            awayDraws: standing.away.draw,
            awayLosses: standing.away.lose,
            awayGoalsFor: standing.away.goals.for,
            awayGoalsAgainst: standing.away.goals.against,
            form: standing.form,
            description: standing.description,
          },
        });
      }

      logger.info({ count: standings.length }, 'Standings sync completed');
    } catch (error) {
      logger.error({ error }, 'Failed to sync standings');
      throw error;
    }
  }

  /**
   * Sync top players (scorers and assists)
   */
  async syncTopPlayers(limit: number = 20): Promise<void> {
    if (env.FOOTBALL_DATA_SOURCE !== 'api') {
      logger.info('Skipping player stats sync - using dummy data');
      return;
    }

    try {
      logger.info({ season: this.PREMIER_LEAGUE_SEASON, limit }, 'Starting player stats sync...');

      // Get both top scorers and top assists
      const [topScorers, topAssists] = await Promise.all([
        footballAPIService.getTopScorers(this.PREMIER_LEAGUE_SEASON, limit),
        footballAPIService.getTopAssists(this.PREMIER_LEAGUE_SEASON, limit),
      ]);

      // Combine and deduplicate players
      const playersMap = new Map();

      for (const playerData of [...topScorers, ...topAssists]) {
        const player = playerData.player;
        const stats = playerData.statistics[0]; // Get first team stats (players can play for multiple teams)

        if (!stats) continue;

        const team = await prisma.team.findUnique({
          where: { apiId: stats.team.id.toString() },
        });

        if (!team) {
          logger.warn({ playerName: player.name, teamName: stats.team.name }, 'Team not found');
          continue;
        }

        const playerId = player.id.toString();

        if (!playersMap.has(playerId)) {
          playersMap.set(playerId, {
            apiId: playerId,
            teamId: team.id,
            season: this.PREMIER_LEAGUE_SEASON.toString(),
            name: player.name,
            firstname: player.firstname,
            lastname: player.lastname,
            age: player.age,
            nationality: player.nationality,
            photo: player.photo,
            position: stats.games.position,
            appearences: stats.games.appearences || 0,
            lineups: stats.games.lineups || 0,
            minutes: stats.games.minutes || 0,
            rating: stats.games.rating ? parseFloat(stats.games.rating) : null,
            goals: stats.goals.total || 0,
            assists: stats.goals.assists || 0,
            shots: stats.shots?.total || 0,
            shotsOn: stats.shots?.on || 0,
            penaltyScored: stats.penalty?.scored || 0,
            penaltyMissed: stats.penalty?.missed || 0,
            passes: stats.passes?.total || 0,
            keyPasses: stats.passes?.key || 0,
            tackles: stats.tackles?.total || 0,
            duelsWon: stats.duels?.won || 0,
            dribblesSuccess: stats.dribbles?.success || 0,
            foulsDrawn: stats.fouls?.drawn || 0,
            foulsCommitted: stats.fouls?.committed || 0,
            yellowCards: stats.cards?.yellow || 0,
            redCards: stats.cards?.red || 0,
            rawData: playerData,
          });
        }
      }

      // Insert/update players
      for (const [playerId, playerStats] of playersMap.entries()) {
        await prisma.playerStats.upsert({
          where: {
            apiId_season: {
              apiId: playerId,
              season: this.PREMIER_LEAGUE_SEASON.toString(),
            },
          },
          create: playerStats,
          update: playerStats,
        });
      }

      logger.info({ count: playersMap.size }, 'Player stats sync completed');
    } catch (error) {
      logger.error({ error }, 'Failed to sync player stats');
      throw error;
    }
  }

  /**
   * Full sync: teams + fixtures + statistics + standings + players
   */
  async fullSync(fixtureLimit: number = 50): Promise<void> {
    logger.info('Starting full sync for Premier League 2023-2024...');

    try {
      // Step 1: Sync teams
      await this.syncTeams();

      // Step 2: Sync finished fixtures
      await this.syncFixtures('FT', fixtureLimit);

      // Step 3: Sync upcoming fixtures
      await this.syncFixtures('NS', 20);

      // Step 4: Sync standings
      await this.syncStandings();

      // Step 5: Sync top players (scorers and assists)
      await this.syncTopPlayers(20);

      logger.info('✅ Full sync completed successfully');
    } catch (error) {
      logger.error({ error }, 'Full sync failed');
      throw error;
    }
  }

  /**
   * Sync teams for all Top 5 leagues
   */
  async syncTeamsForAllLeagues(): Promise<void> {
    logger.info('Starting team sync for Top 5 leagues...');

    const syncLog = await prisma.syncLog.create({
      data: {
        syncType: 'teams',
        status: 'started',
        leagueIds: TOP_5_LEAGUES.join(','),
      },
    });

    let itemsProcessed = 0;
    let itemsFailed = 0;

    try {
      const season = this.getCurrentSeason();
      const leagueTeams = await footballAPIService.getTeamsForLeagues(TOP_5_LEAGUES, season);

      for (const league of leagueTeams) {
        for (const team of league.teams) {
          try {
            await prisma.team.upsert({
              where: { apiId: team.id.toString() },
              create: {
                apiId: team.id.toString(),
                name: team.name,
                logoUrl: team.logo,
                country: league.country,
                league: league.leagueName,
              },
              update: {
                name: team.name,
                logoUrl: team.logo,
                country: league.country,
                league: league.leagueName,
              },
            });
            itemsProcessed++;
          } catch (error) {
            logger.error({ error, teamName: team.name }, 'Failed to sync team');
            itemsFailed++;
          }
        }
      }

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          itemsProcessed,
          itemsFailed,
          completedAt: new Date(),
        },
      });

      logger.info({ itemsProcessed, itemsFailed }, 'Team sync for all leagues completed');
    } catch (error) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'failed',
          itemsProcessed,
          itemsFailed,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  /**
   * Sync upcoming fixtures for next N days for all Top 5 leagues
   */
  async syncUpcomingFixtures(days: number = 7): Promise<{ processed: number; failed: number }> {
    logger.info({ days }, 'Starting upcoming fixtures sync for Top 5 leagues...');

    const syncLog = await prisma.syncLog.create({
      data: {
        syncType: 'fixtures',
        status: 'started',
        leagueIds: TOP_5_LEAGUES.join(','),
      },
    });

    let itemsProcessed = 0;
    let itemsFailed = 0;

    try {
      // Generate dates for next N days
      const dates: string[] = [];
      for (let i = 0; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }

      for (const date of dates) {
        try {
          const fixtures = await footballAPIService.getFixturesByDate(date, TOP_5_LEAGUES);

          for (const fixture of fixtures) {
            try {
              // Get or create teams
              let homeTeam = await prisma.team.findUnique({
                where: { apiId: fixture.teams.home.id.toString() },
              });

              let awayTeam = await prisma.team.findUnique({
                where: { apiId: fixture.teams.away.id.toString() },
              });

              // Create teams if not exist
              if (!homeTeam) {
                homeTeam = await prisma.team.create({
                  data: {
                    apiId: fixture.teams.home.id.toString(),
                    name: fixture.teams.home.name,
                    logoUrl: fixture.teams.home.logo,
                    country: fixture.league.country,
                    league: fixture.league.name,
                  },
                });
              }

              if (!awayTeam) {
                awayTeam = await prisma.team.create({
                  data: {
                    apiId: fixture.teams.away.id.toString(),
                    name: fixture.teams.away.name,
                    logoUrl: fixture.teams.away.logo,
                    country: fixture.league.country,
                    league: fixture.league.name,
                  },
                });
              }

              const matchStatus = this.mapFixtureStatus(fixture.fixture.status.short);

              // Upsert match
              await prisma.match.upsert({
                where: { apiId: fixture.fixture.id.toString() },
                create: {
                  apiId: fixture.fixture.id.toString(),
                  homeTeamId: homeTeam.id,
                  awayTeamId: awayTeam.id,
                  kickoffTime: new Date(fixture.fixture.date),
                  status: matchStatus,
                  homeScore: fixture.goals.home,
                  awayScore: fixture.goals.away,
                  venue: fixture.fixture.venue?.name,
                  referee: fixture.fixture.referee,
                  league: fixture.league.name,
                  leagueId: fixture.league.id,
                  season: fixture.league.season.toString(),
                  round: fixture.league.round,
                  externalData: fixture as any,
                },
                update: {
                  kickoffTime: new Date(fixture.fixture.date),
                  status: matchStatus,
                  homeScore: fixture.goals.home,
                  awayScore: fixture.goals.away,
                  venue: fixture.fixture.venue?.name,
                  referee: fixture.fixture.referee,
                  league: fixture.league.name,
                  leagueId: fixture.league.id,
                  round: fixture.league.round,
                  externalData: fixture as any,
                },
              });

              itemsProcessed++;
            } catch (error) {
              logger.error({ error, fixtureId: fixture.fixture.id }, 'Failed to sync fixture');
              itemsFailed++;
            }
          }
        } catch (error) {
          logger.error({ error, date }, 'Failed to fetch fixtures for date');
        }
      }

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          itemsProcessed,
          itemsFailed,
          completedAt: new Date(),
        },
      });

      logger.info({ itemsProcessed, itemsFailed }, 'Upcoming fixtures sync completed');
      return { processed: itemsProcessed, failed: itemsFailed };
    } catch (error) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'failed',
          itemsProcessed,
          itemsFailed,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  /**
   * Sync odds for upcoming matches in database
   */
  async syncOddsForUpcomingMatches(): Promise<{ processed: number; failed: number }> {
    logger.info('Starting odds sync for upcoming matches...');

    const syncLog = await prisma.syncLog.create({
      data: {
        syncType: 'odds',
        status: 'started',
      },
    });

    let itemsProcessed = 0;
    let itemsFailed = 0;

    try {
      // Get upcoming matches from database
      const upcomingMatches = await prisma.match.findMany({
        where: {
          status: 'upcoming',
          apiId: { not: null },
          kickoffTime: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
          },
        },
        orderBy: { kickoffTime: 'asc' },
        take: 100, // Limit to avoid too many API calls
      });

      logger.info({ matchCount: upcomingMatches.length }, 'Found upcoming matches to sync odds');

      for (const match of upcomingMatches) {
        try {
          const fixtureId = parseInt(match.apiId!);
          const oddsData = await footballAPIService.getFixtureOdds(fixtureId);

          if (!oddsData || !oddsData.bookmakers || oddsData.bookmakers.length === 0) {
            continue; // No odds available
          }

          // Get first bookmaker (usually the most popular)
          const bookmaker = oddsData.bookmakers[0];
          const bets = bookmaker.bets;

          // Extract odds
          const matchWinner = bets.find(b => b.name === 'Match Winner' || b.id === 1);
          const overUnder25 = bets.find(b => b.name === 'Goals Over/Under' && b.values.some(v => v.value === 'Over 2.5'));
          const overUnder15 = bets.find(b => b.name === 'Goals Over/Under' && b.values.some(v => v.value === 'Over 1.5'));
          const overUnder35 = bets.find(b => b.name === 'Goals Over/Under' && b.values.some(v => v.value === 'Over 3.5'));
          const btts = bets.find(b => b.name === 'Both Teams Score' || b.id === 8);
          const doubleChance = bets.find(b => b.name === 'Double Chance' || b.id === 12);

          const getOddValue = (bet: any, value: string): number | null => {
            if (!bet) return null;
            const found = bet.values.find((v: any) => v.value === value);
            return found ? parseFloat(found.odd) : null;
          };

          await prisma.matchOdds.upsert({
            where: { matchId: match.id },
            create: {
              matchId: match.id,
              matchApiId: match.apiId!,
              homeWinOdds: getOddValue(matchWinner, 'Home'),
              drawOdds: getOddValue(matchWinner, 'Draw'),
              awayWinOdds: getOddValue(matchWinner, 'Away'),
              homeOrDrawOdds: getOddValue(doubleChance, 'Home/Draw'),
              awayOrDrawOdds: getOddValue(doubleChance, 'Draw/Away'),
              homeOrAwayOdds: getOddValue(doubleChance, 'Home/Away'),
              over25Odds: getOddValue(overUnder25, 'Over 2.5'),
              under25Odds: getOddValue(overUnder25, 'Under 2.5'),
              over15Odds: getOddValue(overUnder15, 'Over 1.5'),
              under15Odds: getOddValue(overUnder15, 'Under 1.5'),
              over35Odds: getOddValue(overUnder35, 'Over 3.5'),
              under35Odds: getOddValue(overUnder35, 'Under 3.5'),
              bttsYesOdds: getOddValue(btts, 'Yes'),
              bttsNoOdds: getOddValue(btts, 'No'),
              bookmaker: bookmaker.name,
              bookmakerId: bookmaker.id,
              rawData: oddsData as any,
            },
            update: {
              homeWinOdds: getOddValue(matchWinner, 'Home'),
              drawOdds: getOddValue(matchWinner, 'Draw'),
              awayWinOdds: getOddValue(matchWinner, 'Away'),
              homeOrDrawOdds: getOddValue(doubleChance, 'Home/Draw'),
              awayOrDrawOdds: getOddValue(doubleChance, 'Draw/Away'),
              homeOrAwayOdds: getOddValue(doubleChance, 'Home/Away'),
              over25Odds: getOddValue(overUnder25, 'Over 2.5'),
              under25Odds: getOddValue(overUnder25, 'Under 2.5'),
              over15Odds: getOddValue(overUnder15, 'Over 1.5'),
              under15Odds: getOddValue(overUnder15, 'Under 1.5'),
              over35Odds: getOddValue(overUnder35, 'Over 3.5'),
              under35Odds: getOddValue(overUnder35, 'Under 3.5'),
              bttsYesOdds: getOddValue(btts, 'Yes'),
              bttsNoOdds: getOddValue(btts, 'No'),
              bookmaker: bookmaker.name,
              bookmakerId: bookmaker.id,
              rawData: oddsData as any,
            },
          });

          itemsProcessed++;
        } catch (error) {
          logger.error({ error, matchId: match.id, apiId: match.apiId }, 'Failed to sync odds for match');
          itemsFailed++;
        }
      }

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          itemsProcessed,
          itemsFailed,
          completedAt: new Date(),
        },
      });

      logger.info({ itemsProcessed, itemsFailed }, 'Odds sync completed');
      return { processed: itemsProcessed, failed: itemsFailed };
    } catch (error) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'failed',
          itemsProcessed,
          itemsFailed,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  /**
   * Sync finished matches from the past N days
   */
  async syncFinishedMatches(days: number = 7): Promise<{ processed: number; failed: number }> {
    logger.info({ days }, 'Starting finished matches sync...');

    const syncLog = await prisma.syncLog.create({
      data: {
        syncType: 'fixtures',
        status: 'started',
        leagueIds: TOP_5_LEAGUES.join(','),
      },
    });

    let itemsProcessed = 0;
    let itemsFailed = 0;

    try {
      // Generate dates for past N days
      const dates: string[] = [];
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      for (const date of dates) {
        try {
          const fixtures = await footballAPIService.getFixturesByDate(date, TOP_5_LEAGUES);

          // Only process finished matches
          const finishedFixtures = fixtures.filter(f =>
            ['FT', 'AET', 'PEN'].includes(f.fixture.status.short)
          );

          for (const fixture of finishedFixtures) {
            try {
              // Get or create teams
              let homeTeam = await prisma.team.findUnique({
                where: { apiId: fixture.teams.home.id.toString() },
              });

              let awayTeam = await prisma.team.findUnique({
                where: { apiId: fixture.teams.away.id.toString() },
              });

              if (!homeTeam) {
                homeTeam = await prisma.team.create({
                  data: {
                    apiId: fixture.teams.home.id.toString(),
                    name: fixture.teams.home.name,
                    logoUrl: fixture.teams.home.logo,
                    country: fixture.league.country,
                    league: fixture.league.name,
                  },
                });
              }

              if (!awayTeam) {
                awayTeam = await prisma.team.create({
                  data: {
                    apiId: fixture.teams.away.id.toString(),
                    name: fixture.teams.away.name,
                    logoUrl: fixture.teams.away.logo,
                    country: fixture.league.country,
                    league: fixture.league.name,
                  },
                });
              }

              await prisma.match.upsert({
                where: { apiId: fixture.fixture.id.toString() },
                create: {
                  apiId: fixture.fixture.id.toString(),
                  homeTeamId: homeTeam.id,
                  awayTeamId: awayTeam.id,
                  kickoffTime: new Date(fixture.fixture.date),
                  status: 'finished',
                  homeScore: fixture.goals.home,
                  awayScore: fixture.goals.away,
                  venue: fixture.fixture.venue?.name,
                  referee: fixture.fixture.referee,
                  league: fixture.league.name,
                  leagueId: fixture.league.id,
                  season: fixture.league.season.toString(),
                  round: fixture.league.round,
                  externalData: fixture as any,
                },
                update: {
                  status: 'finished',
                  homeScore: fixture.goals.home,
                  awayScore: fixture.goals.away,
                  venue: fixture.fixture.venue?.name,
                  referee: fixture.fixture.referee,
                  league: fixture.league.name,
                  leagueId: fixture.league.id,
                  round: fixture.league.round,
                  externalData: fixture as any,
                },
              });

              itemsProcessed++;
            } catch (error) {
              logger.error({ error, fixtureId: fixture.fixture.id }, 'Failed to sync finished fixture');
              itemsFailed++;
            }
          }
        } catch (error) {
          logger.error({ error, date }, 'Failed to fetch finished fixtures for date');
        }
      }

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          itemsProcessed,
          itemsFailed,
          completedAt: new Date(),
        },
      });

      logger.info({ itemsProcessed, itemsFailed }, 'Finished matches sync completed');
      return { processed: itemsProcessed, failed: itemsFailed };
    } catch (error) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'failed',
          itemsProcessed,
          itemsFailed,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  /**
   * Full sync for Top 5 leagues: upcoming fixtures + odds + finished matches
   * This is the main method to be called by scheduler
   */
  async syncAllMatches(): Promise<{
    fixtures: { processed: number; failed: number };
    finished: { processed: number; failed: number };
    odds: { processed: number; failed: number };
  }> {
    logger.info('Starting full match sync for Top 5 leagues...');

    try {
      // 1. Sync teams first (if needed)
      await this.syncTeamsForAllLeagues();

      // 2. Sync upcoming fixtures for next 7 days
      const fixturesResult = await this.syncUpcomingFixtures(7);

      // 3. Sync finished matches from past 3 days
      const finishedResult = await this.syncFinishedMatches(3);

      // 4. Sync odds for upcoming matches
      const oddsResult = await this.syncOddsForUpcomingMatches();

      logger.info({
        fixtures: fixturesResult,
        finished: finishedResult,
        odds: oddsResult,
      }, '✅ Full match sync completed');

      return {
        fixtures: fixturesResult,
        finished: finishedResult,
        odds: oddsResult,
      };
    } catch (error) {
      logger.error({ error }, 'Full match sync failed');
      throw error;
    }
  }

  /**
   * Get last sync status
   */
  async getLastSyncStatus(): Promise<{
    fixtures: any;
    odds: any;
    teams: any;
  }> {
    const [fixtures, odds, teams] = await Promise.all([
      prisma.syncLog.findFirst({
        where: { syncType: 'fixtures' },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.syncLog.findFirst({
        where: { syncType: 'odds' },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.syncLog.findFirst({
        where: { syncType: 'teams' },
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    return { fixtures, odds, teams };
  }
}

export const matchSyncService = new MatchSyncService();
