export const dummyAccuracyWeek = {
  period: 'week' as const,
  accuracyByDay: [
    { day: 'Mon', accuracy: 75, category: 'Good' as const },
    { day: 'Tue', accuracy: 82, category: 'Excellent' as const },
    { day: 'Wed', accuracy: 58, category: 'Fair' as const },
    { day: 'Thu', accuracy: 88, category: 'Excellent' as const },
    { day: 'Fri', accuracy: 79, category: 'Good' as const },
    { day: 'Sat', accuracy: 91, category: 'Excellent' as const },
    { day: 'Sun', accuracy: 95, category: 'Excellent' as const },
  ],
};

export const dummyAccuracyMonth = {
  period: 'month' as const,
  accuracyByDay: [
    { day: 'Week 1', accuracy: 78, category: 'Good' as const },
    { day: 'Week 2', accuracy: 85, category: 'Excellent' as const },
    { day: 'Week 3', accuracy: 72, category: 'Good' as const },
    { day: 'Week 4', accuracy: 89, category: 'Excellent' as const },
  ],
};

export const dummyTopTeams = {
  teams: [
    {
      rank: 1,
      teamName: 'Manchester City',
      accuracy: 85,
      totalPredictions: 12,
    },
    {
      rank: 2,
      teamName: 'Arsenal',
      accuracy: 78,
      totalPredictions: 10,
    },
    {
      rank: 3,
      teamName: 'Liverpool',
      accuracy: 75,
      totalPredictions: 11,
    },
    {
      rank: 4,
      teamName: 'Newcastle',
      accuracy: 72,
      totalPredictions: 9,
    },
    {
      rank: 5,
      teamName: 'Chelsea',
      accuracy: 70,
      totalPredictions: 10,
    },
    {
      rank: 6,
      teamName: 'Manchester United',
      accuracy: 68,
      totalPredictions: 11,
    },
    {
      rank: 7,
      teamName: 'Tottenham',
      accuracy: 65,
      totalPredictions: 9,
    },
    {
      rank: 8,
      teamName: 'Aston Villa',
      accuracy: 63,
      totalPredictions: 8,
    },
  ],
};

export const dummyConfidenceDistribution = {
  distribution: [
    { level: 'High' as const, percentage: 45 },
    { level: 'Medium' as const, percentage: 38 },
    { level: 'Low' as const, percentage: 17 },
  ],
};
