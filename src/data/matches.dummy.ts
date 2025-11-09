export const dummyMatches = [
  {
    id: 'match-1',
    homeTeam: {
      id: 'team-mu',
      name: 'Manchester United',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
    },
    awayTeam: {
      id: 'team-liv',
      name: 'Liverpool',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    },
    kickoffTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    status: 'upcoming' as const,
    aiConfidence: 'Medium' as const,
    predictionId: 'pred-1',
  },
  {
    id: 'match-2',
    homeTeam: {
      id: 'team-mci',
      name: 'Manchester City',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    },
    awayTeam: {
      id: 'team-ars',
      name: 'Arsenal',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    },
    kickoffTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'upcoming' as const,
    aiConfidence: 'High' as const,
    predictionId: 'pred-2',
  },
  {
    id: 'match-3',
    homeTeam: {
      id: 'team-new',
      name: 'Newcastle',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg',
    },
    awayTeam: {
      id: 'team-bri',
      name: 'Brighton',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg',
    },
    kickoffTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'upcoming' as const,
    aiConfidence: 'Medium' as const,
    predictionId: 'pred-3',
  },
  {
    id: 'match-4',
    homeTeam: {
      id: 'team-avl',
      name: 'Aston Villa',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f9/Aston_Villa_FC_crest_%282016%29.svg',
    },
    awayTeam: {
      id: 'team-whu',
      name: 'West Ham',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg',
    },
    kickoffTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'upcoming' as const,
    aiConfidence: 'Medium' as const,
    predictionId: 'pred-4',
  },
  {
    id: 'match-5',
    homeTeam: {
      id: 'team-che',
      name: 'Chelsea',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
    },
    awayTeam: {
      id: 'team-tot',
      name: 'Tottenham',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
    },
    kickoffTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'upcoming' as const,
    aiConfidence: 'Low' as const,
    predictionId: 'pred-5',
  },
];

export const dummyPredictions: Record<string, any> = {
  'match-1': {
    id: 'pred-1',
    homeWinProbability: 45,
    drawProbability: 30,
    awayWinProbability: 25,
    aiConfidence: 'Medium' as const,
    aiAnalysis:
      "Manchester United's home advantage and recent form give them a slight edge. Liverpool's attacking prowess could create problems, but United's defensive improvements should help them secure a result.",
    quickStats: {
      recentForm: {
        home: ['W', 'D', 'W', 'L', 'W'],
        away: ['W', 'W', 'D', 'L', 'W'],
      },
      goalsLast10: {
        home: 14,
        away: 18,
      },
      expectedGoals: {
        home: 1.8,
        away: 1.6,
      },
      injuries: {
        home: 2,
        away: 1,
      },
      headToHead: {
        homeWins: 7,
        draws: 5,
        awayWins: 8,
      },
    },
  },
  'match-2': {
    id: 'pred-2',
    homeWinProbability: 60,
    drawProbability: 25,
    awayWinProbability: 15,
    aiConfidence: 'High' as const,
    aiAnalysis:
      "Manchester City's dominant home record and tactical superiority give them a strong advantage. Arsenal's defensive organization will be tested, but City's attacking depth should prove decisive.",
    quickStats: {
      recentForm: {
        home: ['W', 'W', 'W', 'D', 'W'],
        away: ['W', 'D', 'D', 'W', 'L'],
      },
      goalsLast10: {
        home: 22,
        away: 15,
      },
      expectedGoals: {
        home: 2.5,
        away: 1.4,
      },
      injuries: {
        home: 1,
        away: 3,
      },
      headToHead: {
        homeWins: 10,
        draws: 3,
        awayWins: 5,
      },
    },
  },
  'match-3': {
    id: 'pred-3',
    homeWinProbability: 55,
    drawProbability: 25,
    awayWinProbability: 20,
    aiConfidence: 'Medium' as const,
    aiAnalysis:
      "Newcastle's home advantage and recent winning streak give them the edge. Brighton's tactical flexibility could cause problems, but Newcastle's momentum should prevail.",
    quickStats: {
      recentForm: {
        home: ['W', 'W', 'D', 'W', 'L'],
        away: ['D', 'L', 'W', 'D', 'W'],
      },
      goalsLast10: {
        home: 16,
        away: 10,
      },
      expectedGoals: {
        home: 2.2,
        away: 1.7,
      },
      injuries: {
        home: 1,
        away: 2,
      },
      headToHead: {
        homeWins: 8,
        draws: 4,
        awayWins: 6,
      },
    },
  },
  'match-4': {
    id: 'pred-4',
    homeWinProbability: 50,
    drawProbability: 30,
    awayWinProbability: 20,
    aiConfidence: 'Medium' as const,
    aiAnalysis:
      "Aston Villa's strong home form meets West Ham's inconsistent away record. Villa's attacking players are in good form, which should give them a narrow advantage.",
    quickStats: {
      recentForm: {
        home: ['W', 'W', 'L', 'D', 'W'],
        away: ['L', 'D', 'W', 'L', 'D'],
      },
      goalsLast10: {
        home: 13,
        away: 11,
      },
      expectedGoals: {
        home: 1.9,
        away: 1.5,
      },
      injuries: {
        home: 2,
        away: 2,
      },
      headToHead: {
        homeWins: 6,
        draws: 7,
        awayWins: 7,
      },
    },
  },
  'match-5': {
    id: 'pred-5',
    homeWinProbability: 40,
    drawProbability: 30,
    awayWinProbability: 30,
    aiConfidence: 'Low' as const,
    aiAnalysis:
      "This London derby is highly unpredictable. Both teams have shown inconsistency recently, and form goes out the window in local rivalries. Expect a tight, competitive match.",
    quickStats: {
      recentForm: {
        home: ['D', 'L', 'W', 'D', 'L'],
        away: ['L', 'W', 'D', 'L', 'W'],
      },
      goalsLast10: {
        home: 12,
        away: 13,
      },
      expectedGoals: {
        home: 1.6,
        away: 1.7,
      },
      injuries: {
        home: 3,
        away: 2,
      },
      headToHead: {
        homeWins: 9,
        draws: 8,
        awayWins: 10,
      },
    },
  },
};
