import { footballAPIService } from './football-api.service';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { env } from '../config/env';

/**
 * Service to sync football data from API-Football to database
 * Focuses on Premier League 2023-2024 season for demo purposes
 */
export class MatchSyncService {
  private readonly PREMIER_LEAGUE_SEASON = 2023;

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
}

export const matchSyncService = new MatchSyncService();
