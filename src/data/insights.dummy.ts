// Mock data aligned with frontend mockData.json structure

export interface AccuracyByDay {
  day: string;
  accuracy: number;
}

export interface AccuracyData {
  period: 'week' | 'month';
  accuracy: number;
  totalPredictions: number;
  correctPredictions: number;
  accuracyByDay: AccuracyByDay[];
}

export interface TopTeam {
  rank: number;
  teamName: string;
  totalPredictions: number;
  accuracy: number;
}

export interface ConfidenceLevel {
  level: 'High' | 'Medium' | 'Low';
  percentage: number;
  count: number;
}

export interface Surprise {
  match: string;
  predicted: number;
  outcome: string;
  date: string;
}

// Accuracy data for week
export const dummyAccuracyWeek: AccuracyData = {
  period: 'week',
  accuracy: 68.5,
  totalPredictions: 127,
  correctPredictions: 87,
  accuracyByDay: [
    { day: 'Mon', accuracy: 65 },
    { day: 'Tue', accuracy: 70 },
    { day: 'Wed', accuracy: 68 },
    { day: 'Thu', accuracy: 72 },
    { day: 'Fri', accuracy: 75 },
    { day: 'Sat', accuracy: 71 },
    { day: 'Sun', accuracy: 69 },
  ],
};

// Accuracy data for month
export const dummyAccuracyMonth: AccuracyData = {
  period: 'month',
  accuracy: 71.2,
  totalPredictions: 520,
  correctPredictions: 370,
  accuracyByDay: [
    { day: 'Week 1', accuracy: 78 },
    { day: 'Week 2', accuracy: 85 },
    { day: 'Week 3', accuracy: 72 },
    { day: 'Week 4', accuracy: 89 },
  ],
};

// Top performing teams
export const dummyTopTeams: TopTeam[] = [
  { rank: 1, teamName: 'Manchester City', totalPredictions: 45, accuracy: 75.5 },
  { rank: 2, teamName: 'Liverpool', totalPredictions: 42, accuracy: 72.3 },
  { rank: 3, teamName: 'Arsenal', totalPredictions: 38, accuracy: 71.0 },
  { rank: 4, teamName: 'Chelsea', totalPredictions: 35, accuracy: 68.5 },
  { rank: 5, teamName: 'Manchester United', totalPredictions: 33, accuracy: 65.2 },
];

// Legacy top teams format (for backwards compatibility)
export const dummyTopTeamsLegacy = [
  { name: 'Manchester City', accuracy: 85, predictions: 12 },
  { name: 'Arsenal', accuracy: 78, predictions: 10 },
  { name: 'Liverpool', accuracy: 75, predictions: 11 },
  { name: 'Newcastle', accuracy: 72, predictions: 9 },
  { name: 'Chelsea', accuracy: 70, predictions: 10 },
];

// Confidence distribution
export const dummyConfidenceDistribution: ConfidenceLevel[] = [
  { level: 'High', percentage: 45, count: 57 },
  { level: 'Medium', percentage: 35, count: 44 },
  { level: 'Low', percentage: 20, count: 26 },
];

// Surprise results
export const dummySurprises: Surprise[] = [
  { match: 'Brighton vs Man United', predicted: 15, outcome: 'Brighton Won', date: 'Oct 20' },
  { match: 'Aston Villa vs Man City', predicted: 20, outcome: 'Aston Villa Won', date: 'Oct 18' },
  { match: 'Wolves vs Liverpool', predicted: 12, outcome: 'Draw', date: 'Oct 15' },
];

// Complete insights object (matching mockData.json structure)
export const insights = {
  accuracy: dummyAccuracyWeek,
  topTeams: dummyTopTeams,
  confidenceDistribution: dummyConfidenceDistribution,
  topTeamsLegacy: dummyTopTeamsLegacy,
  surprises: dummySurprises,
  confidenceDistributionLegacy: {
    high: 45,
    medium: 35,
    low: 20,
  },
};
