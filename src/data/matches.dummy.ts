export const dummyMatches = [
  // LIVE MATCHES
  {
    id: 'match-live-1',
    homeTeam: {
      id: 'team-lei',
      name: 'Leicester City',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2d/Leicester_City_crest.svg',
    },
    awayTeam: {
      id: 'team-eve',
      name: 'Everton',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg',
    },
    kickoffTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // Started 45 min ago
    status: 'live' as const,
    homeScore: 1,
    awayScore: 1,
    aiConfidence: 'Medium' as const,
    predictionId: 'pred-live-1',
  },
  {
    id: 'match-live-2',
    homeTeam: {
      id: 'team-wol',
      name: 'Wolverhampton',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/fc/Wolverhampton_Wanderers.svg',
    },
    awayTeam: {
      id: 'team-cry',
      name: 'Crystal Palace',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Crystal_Palace_FC_logo_%282022%29.svg',
    },
    kickoffTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // Started 25 min ago
    status: 'live' as const,
    homeScore: 0,
    awayScore: 2,
    aiConfidence: 'Low' as const,
    predictionId: 'pred-live-2',
  },

  // UPCOMING MATCHES
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

  // FINISHED MATCHES
  {
    id: 'match-finished-1',
    homeTeam: {
      id: 'team-ars',
      name: 'Arsenal',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    },
    awayTeam: {
      id: 'team-sou',
      name: 'Southampton',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c9/FC_Southampton.svg',
    },
    kickoffTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    status: 'finished' as const,
    homeScore: 3,
    awayScore: 1,
    aiConfidence: 'High' as const,
    predictionId: 'pred-finished-1',
  },
  {
    id: 'match-finished-2',
    homeTeam: {
      id: 'team-liv',
      name: 'Liverpool',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    },
    awayTeam: {
      id: 'team-bou',
      name: 'Bournemouth',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e5/AFC_Bournemouth_%282013%29.svg',
    },
    kickoffTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    status: 'finished' as const,
    homeScore: 4,
    awayScore: 0,
    aiConfidence: 'High' as const,
    predictionId: 'pred-finished-2',
  },
  {
    id: 'match-finished-3',
    homeTeam: {
      id: 'team-mci',
      name: 'Manchester City',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    },
    awayTeam: {
      id: 'team-not',
      name: 'Nottingham Forest',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg',
    },
    kickoffTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    status: 'finished' as const,
    homeScore: 2,
    awayScore: 2,
    aiConfidence: 'Medium' as const,
    predictionId: 'pred-finished-3',
  },
  {
    id: 'match-finished-4',
    homeTeam: {
      id: 'team-tot',
      name: 'Tottenham',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
    },
    awayTeam: {
      id: 'team-che',
      name: 'Chelsea',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
    },
    kickoffTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    status: 'finished' as const,
    homeScore: 1,
    awayScore: 3,
    aiConfidence: 'Low' as const,
    predictionId: 'pred-finished-4',
  },
];

export const dummyPredictions: Record<string, any> = {
  'pred-live-1': {
    id: 'pred-live-1',
    homeWinProbability: 48,
    drawProbability: 28,
    awayWinProbability: 24,
    aiConfidence: 'Medium' as const,
    aiAnalysis:
      "Leicester's home advantage is being neutralized by Everton's defensive organization. The match is currently balanced at 1-1, with both teams creating chances. The next goal will be crucial.",
    quickStats: {
      recentForm: {
        home: ['W', 'L', 'D', 'W', 'L'],
        away: ['D', 'L', 'W', 'D', 'D'],
      },
      goalsLast10: {
        home: 11,
        away: 9,
      },
      expectedGoals: {
        home: 1.5,
        away: 1.3,
      },
      injuries: {
        home: 2,
        away: 3,
      },
      headToHead: {
        homeWins: 6,
        draws: 8,
        awayWins: 5,
      },
    },
  },
  'pred-live-2': {
    id: 'pred-live-2',
    homeWinProbability: 25,
    drawProbability: 20,
    awayWinProbability: 55,
    aiConfidence: 'Low' as const,
    aiAnalysis:
      "Crystal Palace has taken control with a 2-0 lead. Wolverhampton needs to push forward but risks conceding more. Palace's counter-attacking threat is significant.",
    quickStats: {
      recentForm: {
        home: ['L', 'L', 'D', 'L', 'W'],
        away: ['W', 'D', 'W', 'L', 'W'],
      },
      goalsLast10: {
        home: 8,
        away: 14,
      },
      expectedGoals: {
        home: 1.2,
        away: 2.1,
      },
      injuries: {
        home: 4,
        away: 1,
      },
      headToHead: {
        homeWins: 7,
        draws: 6,
        awayWins: 8,
      },
    },
  },
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
  'pred-finished-1': {
    id: 'pred-finished-1',
    homeWinProbability: 75,
    drawProbability: 15,
    awayWinProbability: 10,
    aiConfidence: 'High' as const,
    aiAnalysis:
      "Arsenal dominated as expected with a convincing 3-1 victory. Their attacking prowess was on full display, and Southampton struggled to contain them throughout the match.",
    quickStats: {
      recentForm: {
        home: ['W', 'W', 'W', 'D', 'W'],
        away: ['L', 'L', 'L', 'D', 'L'],
      },
      goalsLast10: {
        home: 24,
        away: 6,
      },
      expectedGoals: {
        home: 3.2,
        away: 0.8,
      },
      injuries: {
        home: 1,
        away: 5,
      },
      headToHead: {
        homeWins: 12,
        draws: 3,
        awayWins: 2,
      },
    },
  },
  'pred-finished-2': {
    id: 'pred-finished-2',
    homeWinProbability: 80,
    drawProbability: 12,
    awayWinProbability: 8,
    aiConfidence: 'High' as const,
    aiAnalysis:
      "Liverpool's 4-0 thrashing of Bournemouth was a dominant display. Their attacking trio was unstoppable, and Bournemouth had no answer to Liverpool's high press and quick transitions.",
    quickStats: {
      recentForm: {
        home: ['W', 'W', 'W', 'W', 'D'],
        away: ['L', 'L', 'D', 'L', 'L'],
      },
      goalsLast10: {
        home: 28,
        away: 7,
      },
      expectedGoals: {
        home: 3.8,
        away: 0.6,
      },
      injuries: {
        home: 0,
        away: 4,
      },
      headToHead: {
        homeWins: 15,
        draws: 2,
        awayWins: 1,
      },
    },
  },
  'pred-finished-3': {
    id: 'pred-finished-3',
    homeWinProbability: 65,
    drawProbability: 22,
    awayWinProbability: 13,
    aiConfidence: 'Medium' as const,
    aiAnalysis:
      "Surprising 2-2 draw as Nottingham Forest held Manchester City. City dominated possession but couldn't convert their chances, while Forest defended resiliently and capitalized on set pieces.",
    quickStats: {
      recentForm: {
        home: ['W', 'W', 'D', 'W', 'W'],
        away: ['D', 'L', 'W', 'D', 'L'],
      },
      goalsLast10: {
        home: 26,
        away: 12,
      },
      expectedGoals: {
        home: 2.9,
        away: 1.1,
      },
      injuries: {
        home: 2,
        away: 2,
      },
      headToHead: {
        homeWins: 8,
        draws: 3,
        awayWins: 2,
      },
    },
  },
  'pred-finished-4': {
    id: 'pred-finished-4',
    homeWinProbability: 42,
    drawProbability: 28,
    awayWinProbability: 30,
    aiConfidence: 'Low' as const,
    aiAnalysis:
      "Chelsea won 3-1 in a London derby thriller. Tottenham started well but Chelsea's second-half surge proved decisive. A tactical masterclass from Chelsea's manager changed the game.",
    quickStats: {
      recentForm: {
        home: ['L', 'W', 'D', 'L', 'W'],
        away: ['W', 'D', 'W', 'L', 'D'],
      },
      goalsLast10: {
        home: 14,
        away: 15,
      },
      expectedGoals: {
        home: 1.6,
        away: 1.8,
      },
      injuries: {
        home: 3,
        away: 2,
      },
      headToHead: {
        homeWins: 10,
        draws: 9,
        awayWins: 11,
      },
    },
  },
};
