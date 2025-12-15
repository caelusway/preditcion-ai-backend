import { prisma } from '../../lib/prisma';
import { footballAPIService } from '../football-api.service';
import { logger } from '../../lib/logger';
import {
  AggregatedMatchData,
  TeamInfo,
  TeamSeasonStats,
  RecentMatchData,
  H2HData,
  StandingsData,
  OddsData,
  DataQualityMetrics,
  MatchInfo,
} from '../../types/prediction.types';

export class DataAggregatorService {
  /**
   * Aggregate all data needed for prediction from various sources
   */
  async aggregateMatchData(matchId: string): Promise<AggregatedMatchData> {
    // Get match from database with teams
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    if (!match) {
      throw new Error(`Match not found: ${matchId}`);
    }

    const homeTeamApiId = match.homeTeam.apiId ? parseInt(match.homeTeam.apiId) : null;
    const awayTeamApiId = match.awayTeam.apiId ? parseInt(match.awayTeam.apiId) : null;
    const fixtureId = match.apiId ? parseInt(match.apiId) : null;

    // Extract league info from external data if available
    const externalData = match.externalData as any;
    const leagueId = externalData?.league?.id || null;
    const season = match.season ? parseInt(match.season) : 2024;

    // Parallel data fetching for performance
    const [homeStats, awayStats, h2hData, homeRecent, awayRecent, standings, odds] =
      await Promise.all([
        this.fetchTeamStats(homeTeamApiId, leagueId, season),
        this.fetchTeamStats(awayTeamApiId, leagueId, season),
        this.fetchH2H(homeTeamApiId, awayTeamApiId),
        this.fetchRecentMatches(homeTeamApiId, season),
        this.fetchRecentMatches(awayTeamApiId, season),
        this.fetchStandings(leagueId, season, homeTeamApiId, awayTeamApiId),
        this.fetchOdds(fixtureId),
      ]);

    // Calculate data quality
    const dataQuality = this.assessDataQuality({
      homeStats,
      awayStats,
      h2hData,
      homeRecent,
      awayRecent,
      standings,
      odds,
    });

    return {
      match: this.extractMatchInfo(match),
      homeTeam: this.extractTeamInfo(match.homeTeam),
      awayTeam: this.extractTeamInfo(match.awayTeam),
      homeStats,
      awayStats,
      headToHead: h2hData,
      homeRecentForm: homeRecent,
      awayRecentForm: awayRecent,
      standings,
      odds,
      dataQuality,
    };
  }

  /**
   * Fetch team season statistics from API
   */
  private async fetchTeamStats(
    teamApiId: number | null,
    leagueId: number | null,
    season: number
  ): Promise<TeamSeasonStats | null> {
    if (!teamApiId || !leagueId) return null;

    try {
      const stats = await footballAPIService.getTeamSeasonStatistics(teamApiId, leagueId, season);
      if (!stats) return null;

      return {
        form: stats.form || '',
        fixtures: {
          played: stats.fixtures.played,
          wins: stats.fixtures.wins,
          draws: stats.fixtures.draws,
          losses: stats.fixtures.loses,
        },
        goals: {
          for: {
            total: stats.goals.for.total,
            average: {
              home: parseFloat(stats.goals.for.average.home) || 0,
              away: parseFloat(stats.goals.for.average.away) || 0,
              total: parseFloat(stats.goals.for.average.total) || 0,
            },
          },
          against: {
            total: stats.goals.against.total,
            average: {
              home: parseFloat(stats.goals.against.average.home) || 0,
              away: parseFloat(stats.goals.against.average.away) || 0,
              total: parseFloat(stats.goals.against.average.total) || 0,
            },
          },
        },
        cleanSheet: stats.clean_sheet,
        failedToScore: stats.failed_to_score,
      };
    } catch (error) {
      logger.warn({ teamApiId, error }, 'Failed to fetch team stats');
      return null;
    }
  }

  /**
   * Fetch head-to-head data
   */
  private async fetchH2H(
    homeTeamApiId: number | null,
    awayTeamApiId: number | null
  ): Promise<H2HData | null> {
    if (!homeTeamApiId || !awayTeamApiId) return null;

    try {
      const h2hMatches = await footballAPIService.getHeadToHead(homeTeamApiId, awayTeamApiId, 10);
      if (!h2hMatches || h2hMatches.length === 0) return null;

      let homeWins = 0;
      let draws = 0;
      let awayWins = 0;
      let homeGoals = 0;
      let awayGoals = 0;
      let bttsCount = 0;
      let over25Count = 0;

      const matches = h2hMatches.map((m: any) => {
        const hGoals = m.goals.home || 0;
        const aGoals = m.goals.away || 0;
        const isHomeTeamHome = m.teams.home.id === homeTeamApiId;

        // Count results from perspective of our home team
        if (isHomeTeamHome) {
          if (hGoals > aGoals) homeWins++;
          else if (hGoals < aGoals) awayWins++;
          else draws++;
          homeGoals += hGoals;
          awayGoals += aGoals;
        } else {
          if (aGoals > hGoals) homeWins++;
          else if (aGoals < hGoals) awayWins++;
          else draws++;
          homeGoals += aGoals;
          awayGoals += hGoals;
        }

        // BTTS and Over 2.5
        if (hGoals > 0 && aGoals > 0) bttsCount++;
        if (hGoals + aGoals > 2.5) over25Count++;

        return {
          date: m.fixture.date,
          homeTeam: m.teams.home.name,
          awayTeam: m.teams.away.name,
          homeScore: hGoals,
          awayScore: aGoals,
        };
      });

      return {
        total: h2hMatches.length,
        homeWins,
        draws,
        awayWins,
        homeGoals,
        awayGoals,
        bttsCount,
        over25Count,
        matches,
      };
    } catch (error) {
      logger.warn({ homeTeamApiId, awayTeamApiId, error }, 'Failed to fetch H2H');
      return null;
    }
  }

  /**
   * Fetch recent matches for a team
   */
  private async fetchRecentMatches(
    teamApiId: number | null,
    season: number
  ): Promise<RecentMatchData[]> {
    if (!teamApiId) return [];

    try {
      const fixtures = await footballAPIService.getTeamFixtures(teamApiId, season, 10);
      if (!fixtures || fixtures.length === 0) return [];

      return fixtures.map((f: any) => {
        const isHome = f.teams.home.id === teamApiId;
        const goalsScored = isHome ? f.goals.home : f.goals.away;
        const goalsConceded = isHome ? f.goals.away : f.goals.home;
        const won = isHome ? f.teams.home.winner : f.teams.away.winner;
        const lost = isHome ? f.teams.away.winner : f.teams.home.winner;

        let result: 'W' | 'D' | 'L' = 'D';
        if (won) result = 'W';
        else if (lost) result = 'L';

        return {
          fixtureId: f.fixture.id,
          date: f.fixture.date,
          homeTeam: f.teams.home.name,
          awayTeam: f.teams.away.name,
          homeScore: f.goals.home || 0,
          awayScore: f.goals.away || 0,
          result,
          isHome,
          goalsScored: goalsScored || 0,
          goalsConceded: goalsConceded || 0,
        };
      });
    } catch (error) {
      logger.warn({ teamApiId, error }, 'Failed to fetch recent matches');
      return [];
    }
  }

  /**
   * Fetch standings and extract positions
   */
  private async fetchStandings(
    leagueId: number | null,
    season: number,
    homeTeamApiId: number | null,
    awayTeamApiId: number | null
  ): Promise<StandingsData | null> {
    if (!leagueId || !homeTeamApiId || !awayTeamApiId) return null;

    try {
      const standingsData = await footballAPIService.getLeagueStandings(leagueId, season);
      if (!standingsData?.league?.standings?.[0]) return null;

      const standings = standingsData.league.standings[0];
      const homeTeamStanding = standings.find((s: any) => s.team.id === homeTeamApiId);
      const awayTeamStanding = standings.find((s: any) => s.team.id === awayTeamApiId);

      if (!homeTeamStanding || !awayTeamStanding) return null;

      return {
        homePosition: homeTeamStanding.rank,
        awayPosition: awayTeamStanding.rank,
        homePoints: homeTeamStanding.points,
        awayPoints: awayTeamStanding.points,
        homeGoalDiff: homeTeamStanding.goalsDiff,
        awayGoalDiff: awayTeamStanding.goalsDiff,
        totalTeams: standings.length,
      };
    } catch (error) {
      logger.warn({ leagueId, error }, 'Failed to fetch standings');
      return null;
    }
  }

  /**
   * Fetch betting odds
   */
  private async fetchOdds(fixtureId: number | null): Promise<OddsData | null> {
    if (!fixtureId) return null;

    try {
      const oddsData = await footballAPIService.getFixtureOdds(fixtureId);
      if (!oddsData?.bookmakers?.[0]) return null;

      const bookmaker = oddsData.bookmakers[0];
      const result: OddsData = {
        bookmaker: bookmaker.name,
        matchWinner: { home: 0, draw: 0, away: 0 },
      };

      for (const bet of bookmaker.bets) {
        const betName = bet.name.toLowerCase();

        if (betName.includes('match winner') || betName === 'home/away') {
          for (const v of bet.values) {
            if (v.value === 'Home') result.matchWinner.home = parseFloat(v.odd);
            else if (v.value === 'Draw') result.matchWinner.draw = parseFloat(v.odd);
            else if (v.value === 'Away') result.matchWinner.away = parseFloat(v.odd);
          }
        } else if (betName.includes('over/under') && betName.includes('2.5')) {
          result.overUnder = { over25: 0, under25: 0 };
          for (const v of bet.values) {
            if (v.value.includes('Over')) result.overUnder.over25 = parseFloat(v.odd);
            else if (v.value.includes('Under')) result.overUnder.under25 = parseFloat(v.odd);
          }
        } else if (betName.includes('both teams score')) {
          result.btts = { yes: 0, no: 0 };
          for (const v of bet.values) {
            if (v.value === 'Yes') result.btts.yes = parseFloat(v.odd);
            else if (v.value === 'No') result.btts.no = parseFloat(v.odd);
          }
        }
      }

      return result;
    } catch (error) {
      logger.warn({ fixtureId, error }, 'Failed to fetch odds');
      return null;
    }
  }

  /**
   * Assess data quality for confidence adjustments
   */
  private assessDataQuality(data: {
    homeStats: TeamSeasonStats | null;
    awayStats: TeamSeasonStats | null;
    h2hData: H2HData | null;
    homeRecent: RecentMatchData[];
    awayRecent: RecentMatchData[];
    standings: StandingsData | null;
    odds: OddsData | null;
  }): DataQualityMetrics {
    let score = 100;
    const missingData: string[] = [];

    if (!data.homeStats) {
      score -= 20;
      missingData.push('homeStats');
    }
    if (!data.awayStats) {
      score -= 20;
      missingData.push('awayStats');
    }
    if (!data.h2hData || data.h2hData.total === 0) {
      score -= 10;
      missingData.push('h2h');
    }
    if (data.homeRecent.length < 5) {
      score -= 10;
      missingData.push('homeRecentForm');
    }
    if (data.awayRecent.length < 5) {
      score -= 10;
      missingData.push('awayRecentForm');
    }
    if (!data.standings) {
      score -= 10;
      missingData.push('standings');
    }
    if (!data.odds) {
      score -= 10;
      missingData.push('odds');
    }

    // Bonus for good data
    if (data.homeRecent.length >= 10) score += 5;
    if (data.awayRecent.length >= 10) score += 5;
    if (data.h2hData && data.h2hData.total >= 5) score += 5;

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      reliability: score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low',
      missingData,
    };
  }

  /**
   * Extract match info from database record
   */
  private extractMatchInfo(match: any): MatchInfo {
    const externalData = match.externalData as any;

    return {
      id: match.id,
      apiId: match.apiId,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      kickoffTime: match.kickoffTime,
      venue: match.venue,
      league: match.league,
      leagueId: externalData?.league?.id || null,
      season: match.season,
      round: match.round,
    };
  }

  /**
   * Extract team info from database record
   */
  private extractTeamInfo(team: any): TeamInfo {
    return {
      id: team.id,
      apiId: team.apiId,
      name: team.name,
      logoUrl: team.logoUrl,
      country: team.country,
      league: team.league,
    };
  }
}

export const dataAggregatorService = new DataAggregatorService();
