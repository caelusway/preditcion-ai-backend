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

export class FootballAPIService {
  // API-Football v3 official endpoint
  private baseURL = 'https://v3.football.api-sports.io';
  private headers = {
    'x-apisports-key': env.RAPIDAPI_KEY || '',
  };

  // Premier League ID
  private readonly PREMIER_LEAGUE_ID = 39;

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

      const data: APIFootballResponse<T> = await response.json();

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
}

export const footballAPIService = new FootballAPIService();
