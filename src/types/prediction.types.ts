// Prediction System Type Definitions

// ===== Data Aggregation Types =====

export interface TeamInfo {
  id: string;
  apiId: string;
  name: string;
  logoUrl: string | null;
  country: string | null;
  league: string | null;
}

export interface TeamSeasonStats {
  form: string; // e.g., "WWDLW"
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    losses: { home: number; away: number; total: number };
  };
  goals: {
    for: {
      total: { home: number; away: number; total: number };
      average: { home: number; away: number; total: number };
    };
    against: {
      total: { home: number; away: number; total: number };
      average: { home: number; away: number; total: number };
    };
  };
  cleanSheet: { home: number; away: number; total: number };
  failedToScore: { home: number; away: number; total: number };
}

export interface RecentMatchData {
  fixtureId: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  result: 'W' | 'D' | 'L';
  isHome: boolean;
  goalsScored: number;
  goalsConceded: number;
}

export interface H2HData {
  total: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  homeGoals: number;
  awayGoals: number;
  bttsCount: number;
  over25Count: number;
  matches: Array<{
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
  }>;
}

export interface StandingsData {
  homePosition: number;
  awayPosition: number;
  homePoints: number;
  awayPoints: number;
  homeGoalDiff: number;
  awayGoalDiff: number;
  totalTeams: number;
}

export interface OddsData {
  bookmaker: string;
  matchWinner: {
    home: number;
    draw: number;
    away: number;
  };
  overUnder?: {
    over25: number;
    under25: number;
  };
  btts?: {
    yes: number;
    no: number;
  };
}

export interface DataQualityMetrics {
  score: number; // 0-100
  reliability: 'high' | 'medium' | 'low';
  missingData: string[];
}

export interface MatchInfo {
  id: string;
  apiId: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoffTime: Date;
  venue: string | null;
  league: string | null;
  leagueId: number | null;
  season: string | null;
  round: string | null;
}

export interface AggregatedMatchData {
  match: MatchInfo;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homeStats: TeamSeasonStats | null;
  awayStats: TeamSeasonStats | null;
  headToHead: H2HData | null;
  homeRecentForm: RecentMatchData[];
  awayRecentForm: RecentMatchData[];
  standings: StandingsData | null;
  odds: OddsData | null;
  dataQuality: DataQualityMetrics;
}

// ===== Calculator Result Types =====

export type PredictionType =
  | 'match_outcome'
  | 'btts'
  | 'over_under'
  | 'correct_score'
  | 'htft'
  | 'stats';

export interface CalculatorResult {
  type: PredictionType;
  confidence: number; // 0-100
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  type: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  team?: 'home' | 'away';
  weight?: number;
}

// ===== Individual Prediction Types =====

export interface MatchOutcomePrediction extends CalculatorResult {
  type: 'match_outcome';
  homeWin: number; // percentage
  draw: number; // percentage
  awayWin: number; // percentage
  predicted: '1' | 'X' | '2';
}

export interface BTTSPrediction extends CalculatorResult {
  type: 'btts';
  yes: number; // percentage
  no: number; // percentage
  predicted: 'Yes' | 'No';
}

export interface OverUnderLine {
  over: number;
  under: number;
}

export interface OverUnderPrediction extends CalculatorResult {
  type: 'over_under';
  lines: {
    '0.5': OverUnderLine;
    '1.5': OverUnderLine;
    '2.5': OverUnderLine;
    '3.5': OverUnderLine;
  };
  expectedGoals: number;
  recommended: string; // e.g., "Over 2.5"
}

export interface ScoreProbability {
  score: string; // e.g., "2-1"
  probability: number;
}

export interface CorrectScorePrediction extends CalculatorResult {
  type: 'correct_score';
  topPredictions: ScoreProbability[];
  mostLikely: string;
}

export interface HTFTResult {
  result: string; // e.g., "1/1", "X/2"
  probability: number;
}

export interface HTFTPrediction extends CalculatorResult {
  type: 'htft';
  predictions: HTFTResult[];
  mostLikely: string;
}

export interface StatsPrediction extends CalculatorResult {
  type: 'stats';
  expectedGoals: { home: number; away: number };
  possession: { home: number; away: number };
  totalShots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
}

// ===== Complete Prediction Output =====

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface CompletePrediction {
  id: string;
  matchId: string;
  generatedAt: Date;
  expiresAt: Date;

  // Core predictions
  matchOutcome: MatchOutcomePrediction;
  btts: BTTSPrediction;
  overUnder: OverUnderPrediction;
  correctScore: CorrectScorePrediction;
  htft: HTFTPrediction;
  stats: StatsPrediction;

  // Meta
  confidence: ConfidenceLevel;
  confidenceScore: number;
  aiAnalysis: string;
  factors: PredictionFactor[];
  dataQuality: DataQualityMetrics;
}

// ===== API Response Types =====

export interface PredictionResponse {
  matchId: string;
  generatedAt: string;
  expiresAt: string;
  confidence: ConfidenceLevel;
  confidenceScore: number;

  matchOutcome: {
    homeWin: number;
    draw: number;
    awayWin: number;
    predicted: '1' | 'X' | '2';
  };

  btts: {
    yes: number;
    no: number;
    predicted: 'Yes' | 'No';
  };

  overUnder: {
    lines: {
      '0.5': OverUnderLine;
      '1.5': OverUnderLine;
      '2.5': OverUnderLine;
      '3.5': OverUnderLine;
    };
    expectedGoals: number;
    recommended: string;
  };

  correctScore: {
    topPredictions: ScoreProbability[];
    mostLikely: string;
  };

  htft: {
    predictions: HTFTResult[];
    mostLikely: string;
  };

  stats: {
    expectedGoals: { home: number; away: number };
    possession: { home: number; away: number };
    totalShots: { home: number; away: number };
    shotsOnTarget: { home: number; away: number };
    corners: { home: number; away: number };
  };

  aiAnalysis: string;
  factors: PredictionFactor[];
  dataQuality: DataQualityMetrics;
}

// ===== Cache Types =====

export interface CachedPrediction {
  prediction: CompletePrediction;
  createdAt: number;
  expiresAt: number;
}

// ===== Accuracy Tracking Types =====

export interface PredictionAccuracyData {
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  periodStart: Date;
  periodEnd: Date;

  outcome: {
    total: number;
    correct: number;
    accuracy: number;
  };

  btts: {
    total: number;
    correct: number;
    accuracy: number;
  };

  overUnder: {
    total: number;
    correct: number;
    accuracy: number;
  };

  byConfidence: {
    high: { total: number; correct: number };
    medium: { total: number; correct: number };
    low: { total: number; correct: number };
  };
}
