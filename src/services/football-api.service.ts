import { env } from '../config/env';
import { logger } from '../lib/logger';

/**
 * API-Football v3 Response Structure
 * Docs: https://www.api-football.com/documentation-v3
 */
interface APIFootballResponse<T = any> {
  get: string;
  parameters: Record<string, any>;
  errors: any[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T[];
}

interface Team {
  id: number;
  name: string;
  code: string;
  country: string;
  founded: number;
  national: boolean;
  logo: string;
}

interface Fixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
    venue: {
      id: number | null;
      name: string | null;
      city: string | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    round: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

interface Statistics {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  statistics: Array<{
    type: string;
    value: any;
  }>;
}

// League IDs for Top 5 European Leagues
export const LEAGUE_IDS = {
  // Top 5 Leagues
  PREMIER_LEAGUE: 39,
  LA_LIGA: 140,
  SERIE_A: 135,
  BUNDESLIGA: 78,
  LIGUE_1: 61,
  // European Cups & International
  CHAMPIONS_LEAGUE: 2,
  EUROPA_LEAGUE: 3,
  CONFERENCE_LEAGUE: 848,
  WORLD_CUP: 1,
} as const;

export const TOP_5_LEAGUES = [
  LEAGUE_IDS.PREMIER_LEAGUE,
  LEAGUE_IDS.LA_LIGA,
  LEAGUE_IDS.SERIE_A,
  LEAGUE_IDS.BUNDESLIGA,
  LEAGUE_IDS.LIGUE_1,
];

export const EUROPEAN_CUPS = [
  LEAGUE_IDS.CHAMPIONS_LEAGUE,
  LEAGUE_IDS.EUROPA_LEAGUE,
  LEAGUE_IDS.CONFERENCE_LEAGUE,
  LEAGUE_IDS.WORLD_CUP,
];

// All supported leagues and tournaments
export const ALL_LEAGUES = [...TOP_5_LEAGUES, ...EUROPEAN_CUPS];

interface LeagueInfo {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
  season: number;
  round: string;
}

interface Odds {
  fixture: { id: number };
  league: LeagueInfo;
  bookmakers: Array<{
    id: number;
    name: string;
    bets: Array<{
      id: number;
      name: string;
      values: Array<{
        value: string;
        odd: string;
      }>;
    }>;
  }>;
}

interface TeamStats {
  team: { id: number; name: string; logo: string };
  league: LeagueInfo;
  form: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: { total: { home: number; away: number; total: number }; average: { home: string; away: string; total: string } };
    against: { total: { home: number; away: number; total: number }; average: { home: string; away: string; total: string } };
  };
  clean_sheet: { home: number; away: number; total: number };
  failed_to_score: { home: number; away: number; total: number };
}

export class FootballAPIService {
  // API-Football v3 official endpoint
  private baseURL = 'https://v3.football.api-sports.io';
  private headers = {
    'x-apisports-key': env.RAPIDAPI_KEY || '',
  };

  // Premier League ID (for backwards compatibility)
  private readonly PREMIER_LEAGUE_ID = LEAGUE_IDS.PREMIER_LEAGUE;

  /**
   * Make a GET request to API-Football v3
   */
  private async get<T>(endpoint: string, params: Record<string, any> = {}): Promise<T[]> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${this.baseURL}${endpoint}${queryString ? `?${queryString}` : ''}`;

      logger.info({ url, params }, 'Fetching from API-Football');

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API request failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json() as APIFootballResponse<T>;

      if (data.errors && data.errors.length > 0) {
        throw new Error(`API errors: ${JSON.stringify(data.errors)}`);
      }

      logger.info(
        { endpoint, results: data.results, paging: data.paging },
        'API-Football response received'
      );

      return data.response;
    } catch (error) {
      logger.error({ error, endpoint, params }, 'Failed to fetch from API-Football');
      throw error;
    }
  }

  /**
   * Get Premier League fixtures for a specific season
   * @param season - Year (e.g., 2024 for 2024-2025 season)
   * @param status - Filter by status: 'NS' (not started), 'LIVE', 'FT' (finished), etc.
   */
  async getPremierLeagueFixtures(season: number = 2024, status?: string): Promise<Fixture[]> {
    const params: Record<string, any> = {
      league: this.PREMIER_LEAGUE_ID,
      season: season.toString(),
    };

    if (status) {
      params.status = status;
    }

    return await this.get<Fixture>('/fixtures', params);
  }

  /**
   * Get a specific fixture by ID
   */
  async getFixture(fixtureId: number): Promise<Fixture | null> {
    const fixtures = await this.get<Fixture>('/fixtures', { id: fixtureId.toString() });
    return fixtures[0] || null;
  }

  /**
   * Get all Premier League teams for a specific season
   */
  async getPremierLeagueTeams(season: number = 2024): Promise<Team[]> {
    return await this.get<Team>('/teams', {
      league: this.PREMIER_LEAGUE_ID.toString(),
      season: season.toString(),
    });
  }

  /**
   * Get team information by ID
   */
  async getTeam(teamId: number): Promise<Team | null> {
    const teams = await this.get<Team>('/teams', { id: teamId.toString() });
    return teams[0] || null;
  }

  /**
   * Get fixture statistics (possession, shots, etc.)
   */
  async getFixtureStatistics(fixtureId: number): Promise<Statistics[]> {
    return await this.get<Statistics>('/fixtures/statistics', { fixture: fixtureId.toString() });
  }

  /**
   * Get team statistics for a season
   */
  async getTeamStatistics(
    teamId: number,
    season: number = 2024
  ): Promise<any> {
    const stats = await this.get<any>('/teams/statistics', {
      team: teamId.toString(),
      league: this.PREMIER_LEAGUE_ID.toString(),
      season: season.toString(),
    });
    return stats[0] || null;
  }

  /**
   * Get head-to-head between two teams
   */
  async getHeadToHead(team1Id: number, team2Id: number, last: number = 10): Promise<Fixture[]> {
    return await this.get<Fixture>('/fixtures/headtohead', {
      h2h: `${team1Id}-${team2Id}`,
      last: last.toString(),
    });
  }

  /**
   * Get team's last N fixtures
   */
  async getTeamFixtures(
    teamId: number,
    season: number = 2024,
    last: number = 10
  ): Promise<Fixture[]> {
    return await this.get<Fixture>('/fixtures', {
      team: teamId.toString(),
      league: this.PREMIER_LEAGUE_ID.toString(),
      season: season.toString(),
      last: last.toString(),
    });
  }

  /**
   * Get upcoming Premier League fixtures
   */
  async getUpcomingFixtures(count: number = 10): Promise<Fixture[]> {
    return await this.get<Fixture>('/fixtures', {
      league: this.PREMIER_LEAGUE_ID.toString(),
      season: '2024',
      status: 'NS',
      next: count.toString(),
    });
  }

  /**
   * Get Premier League standings for a season
   */
  async getPremierLeagueStandings(season: number = 2023): Promise<any> {
    const standings = await this.get<any>('/standings', {
      league: this.PREMIER_LEAGUE_ID.toString(),
      season: season.toString(),
    });
    return standings[0] || null;
  }

  /**
   * Get top scorers for Premier League season
   */
  async getTopScorers(season: number = 2023, limit: number = 20): Promise<any[]> {
    const players = await this.get<any>('/players/topscorers', {
      league: this.PREMIER_LEAGUE_ID.toString(),
      season: season.toString(),
    });
    return players.slice(0, limit);
  }

  /**
   * Get top assists for Premier League season
   */
  async getTopAssists(season: number = 2023, limit: number = 20): Promise<any[]> {
    const players = await this.get<any>('/players/topassists', {
      league: this.PREMIER_LEAGUE_ID.toString(),
      season: season.toString(),
    });
    return players.slice(0, limit);
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const teams = await this.getPremierLeagueTeams(2024);
      logger.info({ teamsCount: teams.length }, 'API-Football connection test successful');
      return true;
    } catch (error) {
      logger.error({ error }, 'API-Football connection test failed');
      return false;
    }
  }

  /**
   * Get fixtures by date for specified leagues
   * @param date - Date in YYYY-MM-DD format
   * @param leagueIds - Array of league IDs (defaults to Top 5)
   */
  async getFixturesByDate(date: string, leagueIds: number[] = TOP_5_LEAGUES): Promise<Fixture[]> {
    const allFixtures: Fixture[] = [];

    // Football seasons typically run from August to May
    // A date in January-July belongs to the previous year's season
    // A date in August-December belongs to the current year's season
    const targetDate = new Date(date);
    const month = targetDate.getMonth(); // 0-11
    const year = targetDate.getFullYear();
    // If Jan-Jul (month 0-6), use previous year as season. If Aug-Dec (month 7-11), use current year
    const season = month < 7 ? year - 1 : year;

    for (const leagueId of leagueIds) {
      try {
        const fixtures = await this.get<Fixture>('/fixtures', {
          date,
          league: leagueId.toString(),
          season: season.toString(),
        });
        allFixtures.push(...fixtures);
      } catch (error) {
        logger.warn({ leagueId, date, error }, 'Failed to fetch fixtures for league');
      }
    }

    return allFixtures;
  }

  /**
   * Get all teams for multiple leagues
   */
  async getTeamsForLeagues(leagueIds: number[] = TOP_5_LEAGUES, season: number = 2024): Promise<Array<{
    leagueId: number;
    leagueName: string;
    country: string;
    logo: string;
    teams: Team[];
  }>> {
    const results: Array<{
      leagueId: number;
      leagueName: string;
      country: string;
      logo: string;
      teams: Team[];
    }> = [];

    const leagueNames: Record<number, { name: string; country: string }> = {
      // Top 5 Leagues
      [LEAGUE_IDS.PREMIER_LEAGUE]: { name: 'Premier League', country: 'England' },
      [LEAGUE_IDS.LA_LIGA]: { name: 'La Liga', country: 'Spain' },
      [LEAGUE_IDS.SERIE_A]: { name: 'Serie A', country: 'Italy' },
      [LEAGUE_IDS.BUNDESLIGA]: { name: 'Bundesliga', country: 'Germany' },
      [LEAGUE_IDS.LIGUE_1]: { name: 'Ligue 1', country: 'France' },
      // European Cups & International
      [LEAGUE_IDS.CHAMPIONS_LEAGUE]: { name: 'Champions League', country: 'Europe' },
      [LEAGUE_IDS.EUROPA_LEAGUE]: { name: 'Europa League', country: 'Europe' },
      [LEAGUE_IDS.CONFERENCE_LEAGUE]: { name: 'Conference League', country: 'Europe' },
      [LEAGUE_IDS.WORLD_CUP]: { name: 'World Cup', country: 'International' },
    };

    for (const leagueId of leagueIds) {
      try {
        const response = await this.get<any>('/teams', {
          league: leagueId.toString(),
          season: season.toString(),
        });

        // Extract teams from the response structure
        const teams: Team[] = response.map((item: any) => ({
          id: item.team.id,
          name: item.team.name,
          code: item.team.code,
          country: item.team.country,
          founded: item.team.founded,
          national: item.team.national,
          logo: item.team.logo,
        }));

        const leagueInfo = leagueNames[leagueId] || { name: 'Unknown League', country: 'Unknown' };

        results.push({
          leagueId,
          leagueName: leagueInfo.name,
          country: leagueInfo.country,
          logo: `https://media.api-sports.io/football/leagues/${leagueId}.png`,
          teams,
        });
      } catch (error) {
        logger.warn({ leagueId, error }, 'Failed to fetch teams for league');
      }
    }

    return results;
  }

  /**
   * Get fixture odds
   */
  async getFixtureOdds(fixtureId: number): Promise<Odds | null> {
    try {
      const odds = await this.get<Odds>('/odds', {
        fixture: fixtureId.toString(),
      });
      return odds[0] || null;
    } catch (error) {
      logger.warn({ fixtureId, error }, 'Failed to fetch fixture odds');
      return null;
    }
  }

  /**
   * Get team season statistics (form, goals, etc.)
   */
  async getTeamSeasonStatistics(teamId: number, leagueId: number, season: number = 2024): Promise<TeamStats | null> {
    try {
      const stats = await this.get<TeamStats>('/teams/statistics', {
        team: teamId.toString(),
        league: leagueId.toString(),
        season: season.toString(),
      });
      return stats[0] || null;
    } catch (error) {
      logger.warn({ teamId, leagueId, error }, 'Failed to fetch team statistics');
      return null;
    }
  }

  /**
   * Get standings for a specific league
   */
  async getLeagueStandings(leagueId: number, season: number = 2024): Promise<any> {
    try {
      const standings = await this.get<any>('/standings', {
        league: leagueId.toString(),
        season: season.toString(),
      });
      return standings[0] || null;
    } catch (error) {
      logger.warn({ leagueId, error }, 'Failed to fetch league standings');
      return null;
    }
  }

  /**
   * Get detailed fixture with lineups, events, statistics
   */
  async getFixtureDetails(fixtureId: number): Promise<{
    fixture: Fixture | null;
    statistics: Statistics[];
    events: any[];
    lineups: any[];
  }> {
    try {
      const [fixture, statistics] = await Promise.all([
        this.getFixture(fixtureId),
        this.getFixtureStatistics(fixtureId),
      ]);

      // Get events and lineups
      const events = await this.get<any>('/fixtures/events', { fixture: fixtureId.toString() });
      const lineups = await this.get<any>('/fixtures/lineups', { fixture: fixtureId.toString() });

      return {
        fixture,
        statistics,
        events,
        lineups,
      };
    } catch (error) {
      logger.error({ fixtureId, error }, 'Failed to fetch fixture details');
      return {
        fixture: null,
        statistics: [],
        events: [],
        lineups: [],
      };
    }
  }
}

export const footballAPIService = new FootballAPIService();
