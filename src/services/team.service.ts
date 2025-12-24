import { prisma } from '../lib/prisma';
import { footballAPIService, ALL_LEAGUES, LEAGUE_IDS } from './football-api.service';
import { logger } from '../lib/logger';

interface SelectableLeague {
  id: number;
  name: string;
  country: string;
  logo: string;
  teams: Array<{
    id: string;
    apiId: string;
    name: string;
    logoUrl: string;
  }>;
}

export class TeamService {
  /**
   * Get selectable teams grouped by league
   * First tries to get from database cache, then falls back to API
   */
  async getSelectableTeams(): Promise<{ leagues: SelectableLeague[] }> {
    try {
      // Try to get teams from database first
      const dbTeams = await prisma.team.findMany({
        where: {
          league: {
            in: ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'],
          },
        },
        orderBy: [{ league: 'asc' }, { name: 'asc' }],
      });

      if (dbTeams.length > 0) {
        // Group teams by league
        const leagueMap = new Map<string, SelectableLeague>();

        const leagueInfo: Record<string, { id: number; country: string; logo: string }> = {
          // Top 5 Leagues
          'Premier League': { id: LEAGUE_IDS.PREMIER_LEAGUE, country: 'England', logo: `https://media.api-sports.io/football/leagues/${LEAGUE_IDS.PREMIER_LEAGUE}.png` },
          'La Liga': { id: LEAGUE_IDS.LA_LIGA, country: 'Spain', logo: `https://media.api-sports.io/football/leagues/${LEAGUE_IDS.LA_LIGA}.png` },
          'Serie A': { id: LEAGUE_IDS.SERIE_A, country: 'Italy', logo: `https://media.api-sports.io/football/leagues/${LEAGUE_IDS.SERIE_A}.png` },
          'Bundesliga': { id: LEAGUE_IDS.BUNDESLIGA, country: 'Germany', logo: `https://media.api-sports.io/football/leagues/${LEAGUE_IDS.BUNDESLIGA}.png` },
          'Ligue 1': { id: LEAGUE_IDS.LIGUE_1, country: 'France', logo: `https://media.api-sports.io/football/leagues/${LEAGUE_IDS.LIGUE_1}.png` },
          // European Cups & International
          'UEFA Champions League': { id: LEAGUE_IDS.CHAMPIONS_LEAGUE, country: 'Europe', logo: `https://media.api-sports.io/football/leagues/${LEAGUE_IDS.CHAMPIONS_LEAGUE}.png` },
          'UEFA Europa League': { id: LEAGUE_IDS.EUROPA_LEAGUE, country: 'Europe', logo: `https://media.api-sports.io/football/leagues/${LEAGUE_IDS.EUROPA_LEAGUE}.png` },
          'UEFA Europa Conference League': { id: LEAGUE_IDS.CONFERENCE_LEAGUE, country: 'Europe', logo: `https://media.api-sports.io/football/leagues/${LEAGUE_IDS.CONFERENCE_LEAGUE}.png` },
          'World Cup': { id: LEAGUE_IDS.WORLD_CUP, country: 'International', logo: `https://media.api-sports.io/football/leagues/${LEAGUE_IDS.WORLD_CUP}.png` },
        };

        // Track teams by name within each league to avoid duplicates
        // Prefer teams with apiId over teams without
        const teamByNameAndLeague = new Map<string, typeof dbTeams[0]>();

        for (const team of dbTeams) {
          const key = `${team.league}:${team.name}`;
          const existing = teamByNameAndLeague.get(key);

          // If no existing team, or current team has apiId and existing doesn't, use current
          if (!existing || (team.apiId && !existing.apiId)) {
            teamByNameAndLeague.set(key, team);
          }
        }

        // Now build the league map from deduplicated teams
        for (const team of teamByNameAndLeague.values()) {
          const leagueName = team.league || 'Unknown';
          const info = leagueInfo[leagueName];

          if (!leagueMap.has(leagueName)) {
            leagueMap.set(leagueName, {
              id: info?.id || 0,
              name: leagueName,
              country: info?.country || 'Unknown',
              logo: info?.logo || '',
              teams: [],
            });
          }

          leagueMap.get(leagueName)!.teams.push({
            id: team.id,
            apiId: team.apiId || '',
            name: team.name,
            logoUrl: team.logoUrl || '',
          });
        }

        // Sort teams by name within each league
        for (const league of leagueMap.values()) {
          league.teams.sort((a, b) => a.name.localeCompare(b.name));
        }

        return { leagues: Array.from(leagueMap.values()) };
      }

      // Fallback to API and cache results
      return await this.fetchAndCacheTeams();
    } catch (error) {
      logger.error({ error }, 'Failed to get selectable teams');
      throw error;
    }
  }

  /**
   * Fetch teams from API and cache in database
   */
  async fetchAndCacheTeams(): Promise<{ leagues: SelectableLeague[] }> {
    const apiData = await footballAPIService.getTeamsForLeagues(ALL_LEAGUES, 2024);
    const leagues: SelectableLeague[] = [];

    for (const leagueData of apiData) {
      const leagueTeams: SelectableLeague['teams'] = [];

      for (const apiTeam of leagueData.teams) {
        // Upsert team to database
        const team = await prisma.team.upsert({
          where: { apiId: apiTeam.id.toString() },
          update: {
            name: apiTeam.name,
            logoUrl: apiTeam.logo,
            country: leagueData.country,
            league: leagueData.leagueName,
          },
          create: {
            apiId: apiTeam.id.toString(),
            name: apiTeam.name,
            logoUrl: apiTeam.logo,
            country: leagueData.country,
            league: leagueData.leagueName,
          },
        });

        leagueTeams.push({
          id: team.id,
          apiId: team.apiId || '',
          name: team.name,
          logoUrl: team.logoUrl || '',
        });
      }

      leagues.push({
        id: leagueData.leagueId,
        name: leagueData.leagueName,
        country: leagueData.country,
        logo: leagueData.logo,
        teams: leagueTeams.sort((a, b) => a.name.localeCompare(b.name)),
      });
    }

    logger.info({ leagueCount: leagues.length }, 'Teams fetched and cached');
    return { leagues };
  }

  /**
   * Get a team by ID
   */
  async getTeamById(teamId: string) {
    return await prisma.team.findUnique({
      where: { id: teamId },
    });
  }
}

export const teamService = new TeamService();
