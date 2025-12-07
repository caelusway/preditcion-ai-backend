// Mock data aligned with frontend mockData.json structure

export interface Team {
  id: string;
  name: string;
  apiId: string;
  logoUrl: string;
  country: string;
  league: string;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  apiId: string;
  homeTeam: Team;
  awayTeam: Team;
  kickoffTime: string;
  status: 'upcoming' | 'live' | 'finished';
  homeScore: number;
  awayScore: number;
  venue: string;
  referee: string;
  league: string;
  season: string;
  round: string;
}

export interface QuickStats {
  recentForm: {
    home: string[];
    away: string[];
  };
  goalsLast10: {
    home: number;
    away: number;
  };
  expectedGoals: {
    home: number;
    away: number;
  };
  injuries: {
    home: number;
    away: number;
  };
  headToHead: {
    homeWins: number;
    draws: number;
    awayWins: number;
  };
}

export interface Prediction {
  id: string;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  aiConfidence: 'High' | 'Medium' | 'Low';
  aiAnalysis: string;
  quickStats: QuickStats;
}

export interface MatchDetail extends Match {
  homeTeamId: string;
  awayTeamId: string;
  externalData: {
    goals: { home: number; away: number };
    score: {
      halftime: { home: number | null; away: number | null };
      fulltime: { home: number | null; away: number | null };
      extratime: { home: number | null; away: number | null };
      penalty: { home: number | null; away: number | null };
    };
    teams: {
      home: { id: number; name: string; logo: string; winner: boolean | null };
      away: { id: number; name: string; logo: string; winner: boolean | null };
    };
    league: {
      id: number;
      name: string;
      country: string;
      logo: string;
      flag: string;
      season: number;
      round: string;
      standings: boolean;
    };
    fixture: {
      id: number;
      date: string;
      timestamp: number;
      timezone: string;
      status: { long: string; short: string; elapsed: number | null; extra: null };
      venue: { id: number; name: string; city: string };
      referee: string;
      periods: { first: number | null; second: number | null };
    };
  };
  prediction: Prediction;
}

// Home Stats
export const homeStats = {
  predicted: 571,
  upcoming: 536,
  won: 23,
};

// Matches list (for /matches endpoint)
export const dummyMatches: Match[] = [
  {
    id: '1',
    apiId: 'api-1',
    homeTeam: {
      id: 't1',
      name: 'Manchester United',
      apiId: 'api-t1',
      logoUrl: 'https://resources.premierleague.com/premierleague/badges/50/t1.png',
      country: 'England',
      league: 'Premier League',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    awayTeam: {
      id: 't14',
      name: 'Liverpool',
      apiId: 'api-t14',
      logoUrl: 'https://resources.premierleague.com/premierleague/badges/50/t14.png',
      country: 'England',
      league: 'Premier League',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    kickoffTime: '2025-10-25T20:00:00Z',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    venue: 'Old Trafford',
    referee: 'Michael Oliver',
    league: 'England',
    season: '2025',
    round: 'Round 10',
  },
  {
    id: '2',
    apiId: 'api-2',
    homeTeam: {
      id: 't43',
      name: 'Manchester City',
      apiId: 'api-t43',
      logoUrl: 'https://resources.premierleague.com/premierleague/badges/50/t43.png',
      country: 'England',
      league: 'Premier League',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    awayTeam: {
      id: 't3',
      name: 'Arsenal',
      apiId: 'api-t3',
      logoUrl: 'https://resources.premierleague.com/premierleague/badges/50/t3.png',
      country: 'England',
      league: 'Premier League',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    kickoffTime: '2025-10-26T15:00:00Z',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    venue: 'Etihad Stadium',
    referee: 'Anthony Taylor',
    league: 'England',
    season: '2025',
    round: 'Round 10',
  },
  {
    id: '3',
    apiId: 'api-3',
    homeTeam: {
      id: 't8',
      name: 'Chelsea',
      apiId: 'api-t8',
      logoUrl: 'https://resources.premierleague.com/premierleague/badges/50/t8.png',
      country: 'England',
      league: 'Premier League',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    awayTeam: {
      id: 't6',
      name: 'Tottenham',
      apiId: 'api-t6',
      logoUrl: 'https://resources.premierleague.com/premierleague/badges/50/t6.png',
      country: 'England',
      league: 'Premier League',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    kickoffTime: '2025-10-26T17:30:00Z',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    venue: 'Stamford Bridge',
    referee: 'Craig Pawson',
    league: 'England',
    season: '2025',
    round: 'Round 10',
  },
  {
    id: '4',
    apiId: 'api-4',
    homeTeam: {
      id: 't4',
      name: 'Newcastle',
      apiId: 'api-t4',
      logoUrl: 'https://resources.premierleague.com/premierleague/badges/50/t4.png',
      country: 'England',
      league: 'Premier League',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    awayTeam: {
      id: 't36',
      name: 'Brighton',
      apiId: 'api-t36',
      logoUrl: 'https://resources.premierleague.com/premierleague/badges/50/t36.png',
      country: 'England',
      league: 'Premier League',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    kickoffTime: '2025-10-27T14:00:00Z',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    venue: "St. James' Park",
    referee: 'Simon Hooper',
    league: 'England',
    season: '2025',
    round: 'Round 10',
  },
  {
    id: '5',
    apiId: 'api-5',
    homeTeam: {
      id: 't7',
      name: 'Aston Villa',
      apiId: 'api-t7',
      logoUrl: 'https://resources.premierleague.com/premierleague/badges/50/t7.png',
      country: 'England',
      league: 'Premier League',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    awayTeam: {
      id: 't21',
      name: 'West Ham',
      apiId: 'api-t21',
      logoUrl: 'https://resources.premierleague.com/premierleague/badges/50/t21.png',
      country: 'England',
      league: 'Premier League',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    kickoffTime: '2025-10-27T16:30:00Z',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    venue: 'Villa Park',
    referee: 'Robert Jones',
    league: 'England',
    season: '2025',
    round: 'Round 10',
  },
];

// Match details (for /matches/:id endpoint)
export const dummyMatchDetails: Record<string, MatchDetail> = {
  '1': {
    id: '1',
    apiId: 'api-1',
    homeTeam: {
      id: 't1',
      name: 'FC Copenhagen',
      apiId: 'api-t1',
      logoUrl: 'https://media.api-sports.io/football/teams/400.png',
      country: 'Denmark',
      league: 'Superliga',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    awayTeam: {
      id: 't2',
      name: 'Kairat Almaty',
      apiId: 'api-t2',
      logoUrl: 'https://media.api-sports.io/football/teams/686.png',
      country: 'Kazakhstan',
      league: 'Premier League',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    homeTeamId: 't1',
    awayTeamId: 't2',
    kickoffTime: '2025-11-27T20:00:00Z',
    status: 'finished',
    homeScore: 3,
    awayScore: 2,
    venue: 'Parken Stadium',
    referee: 'Michael Oliver',
    league: 'Denmark',
    season: '2025',
    round: 'Round 15',
    externalData: {
      goals: { home: 3, away: 2 },
      score: {
        halftime: { home: 1, away: 1 },
        fulltime: { home: 3, away: 2 },
        extratime: { home: null, away: null },
        penalty: { home: null, away: null },
      },
      teams: {
        home: { id: 400, name: 'FC Copenhagen', logo: '', winner: true },
        away: { id: 686, name: 'Kairat Almaty', logo: '', winner: false },
      },
      league: {
        id: 119,
        name: 'Superliga',
        country: 'Denmark',
        logo: '',
        flag: '',
        season: 2025,
        round: 'Round 15',
        standings: true,
      },
      fixture: {
        id: 12345,
        date: '2025-11-27T20:00:00Z',
        timestamp: 1732737600,
        timezone: 'UTC',
        status: { long: 'Match Finished', short: 'FT', elapsed: 90, extra: null },
        venue: { id: 1, name: 'Parken Stadium', city: 'Copenhagen' },
        referee: 'Michael Oliver',
        periods: { first: 1732737600, second: 1732741200 },
      },
    },
    prediction: {
      id: 'pred-1',
      homeWinProbability: 55,
      drawProbability: 25,
      awayWinProbability: 20,
      aiConfidence: 'High',
      aiAnalysis: 'FC Copenhagen has strong home form and historical advantage. Expected to dominate possession.',
      quickStats: {
        recentForm: {
          home: ['W', 'W', 'D', 'L', 'W'],
          away: ['L', 'L', 'W', 'D', 'L'],
        },
        goalsLast10: { home: 18, away: 12 },
        expectedGoals: { home: 1.8, away: 1.2 },
        injuries: { home: 2, away: 3 },
        headToHead: { homeWins: 5, draws: 2, awayWins: 1 },
      },
    },
  },
  '2': {
    id: '2',
    apiId: 'api-2',
    homeTeam: {
      id: 't43',
      name: 'Manchester City',
      apiId: 'api-t43',
      logoUrl: 'https://resources.premierleague.com/premierleague/badges/50/t43.png',
      country: 'England',
      league: 'Premier League',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    awayTeam: {
      id: 't3',
      name: 'Arsenal',
      apiId: 'api-t3',
      logoUrl: 'https://resources.premierleague.com/premierleague/badges/50/t3.png',
      country: 'England',
      league: 'Premier League',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    homeTeamId: 't43',
    awayTeamId: 't3',
    kickoffTime: '2025-10-26T15:00:00Z',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    venue: 'Etihad Stadium',
    referee: 'Anthony Taylor',
    league: 'England',
    season: '2025',
    round: 'Round 10',
    externalData: {
      goals: { home: 0, away: 0 },
      score: {
        halftime: { home: null, away: null },
        fulltime: { home: null, away: null },
        extratime: { home: null, away: null },
        penalty: { home: null, away: null },
      },
      teams: {
        home: { id: 43, name: 'Manchester City', logo: '', winner: null },
        away: { id: 3, name: 'Arsenal', logo: '', winner: null },
      },
      league: {
        id: 39,
        name: 'Premier League',
        country: 'England',
        logo: '',
        flag: '',
        season: 2025,
        round: 'Round 10',
        standings: true,
      },
      fixture: {
        id: 12346,
        date: '2025-10-26T15:00:00Z',
        timestamp: 1729951200,
        timezone: 'UTC',
        status: { long: 'Not Started', short: 'NS', elapsed: null, extra: null },
        venue: { id: 2, name: 'Etihad Stadium', city: 'Manchester' },
        referee: 'Anthony Taylor',
        periods: { first: null, second: null },
      },
    },
    prediction: {
      id: 'pred-2',
      homeWinProbability: 45,
      drawProbability: 30,
      awayWinProbability: 25,
      aiConfidence: 'Medium',
      aiAnalysis: "Tight match expected. City has home advantage but Arsenal in good form.",
      quickStats: {
        recentForm: {
          home: ['W', 'W', 'W', 'D', 'W'],
          away: ['W', 'D', 'W', 'W', 'L'],
        },
        goalsLast10: { home: 25, away: 22 },
        expectedGoals: { home: 2.1, away: 1.9 },
        injuries: { home: 1, away: 2 },
        headToHead: { homeWins: 8, draws: 4, awayWins: 6 },
      },
    },
  },
};

// Predictions map (for backwards compatibility)
export const dummyPredictions: Record<string, Prediction> = {
  '1': dummyMatchDetails['1'].prediction,
  '2': dummyMatchDetails['2'].prediction,
};
