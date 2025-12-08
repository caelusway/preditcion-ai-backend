// Match detail screen data aligned with frontend mockData.json structure

// Match Statistics (average per match)
export interface MatchStatistics {
  totalGoals: { home: number; away: number };
  goalsScored: { home: number; away: number };
  goalsAgainst: { home: number; away: number };
  possession: { home: number; away: number };
  totalShots: { home: number; away: number };
  shotsOnGoal: { home: number; away: number };
  shotsOffGoal: { home: number; away: number };
  fouls: { home: number; away: number };
  corners: { home: number; away: number };
  offsides: { home: number; away: number };
  yellowCards: { home: number; away: number };
}

// Form Statistics (Last 10 Matches)
export interface FormStatistics {
  wins: { home: number; away: number };
  over15Goals: { home: number; away: number };
  over25Goals: { home: number; away: number };
  over35Goals: { home: number; away: number };
  bothTeamsScored: { home: number; away: number };
  unexpectedWins: { home: number; away: number };
  unexpectedLoses: { home: number; away: number };
}

// Recent Match
export interface RecentMatch {
  date: string;
  result: 'W' | 'L' | 'D';
  homeTeam: { name: string };
  awayTeam: { name: string };
  homeScore: number;
  awayScore: number;
}

// Standing Entry
export interface StandingEntry {
  position: number;
  team: { name: string };
  matches: number;
  goals: string;
  points: number;
  isHighlighted?: boolean;
}

// AI Prediction
export interface AIPrediction {
  label: string;
  prediction: string;
  odds: number;
  confidence: number;
  oddsDirection: 'up' | 'down' | 'none';
}

// Match Header Odds
export interface MatchHeaderOdds {
  homeWin: { value: number; direction: 'up' | 'down' | 'none' };
  draw: { value: number; direction: 'up' | 'down' | 'none' };
  awayWin: { value: number; direction: 'up' | 'down' | 'none' };
}

// Market Values
export interface MarketValues {
  home: string;
  away: string;
}

// Score Predictions
export interface ScorePredictions {
  halfTime: { home: number; away: number };
  correctScore: { home: number; away: number };
}

// Stats Predictions
export interface StatsPredictions {
  xG: { home: number; away: number };
  possession: { home: number; away: number };
  totalShots: { home: number; away: number };
  shotsOnGoal: { home: number; away: number };
  shotsOffGoal: { home: number; away: number };
  corners: { home: number; away: number };
}

// Default match statistics
export const matchStatistics: MatchStatistics = {
  totalGoals: { home: 3.1, away: 2.7 },
  goalsScored: { home: 1.2, away: 1.4 },
  goalsAgainst: { home: 1.9, away: 1.3 },
  possession: { home: 53, away: 46 },
  totalShots: { home: 16.2, away: 14 },
  shotsOnGoal: { home: 4.5, away: 4.2 },
  shotsOffGoal: { home: 6.8, away: 6.5 },
  fouls: { home: 11.4, away: 11.8 },
  corners: { home: 5.4, away: 3.8 },
  offsides: { home: 1.6, away: 0.8 },
  yellowCards: { home: 1.22, away: 1.33 },
};

// Default form statistics
export const formStatistics: FormStatistics = {
  wins: { home: 3, away: 5 },
  over15Goals: { home: 8, away: 6 },
  over25Goals: { home: 5, away: 5 },
  over35Goals: { home: 5, away: 4 },
  bothTeamsScored: { home: 5, away: 4 },
  unexpectedWins: { home: 0, away: 0 },
  unexpectedLoses: { home: 1, away: 0 },
};

// Home team recent matches
export const homeTeamRecentMatches: RecentMatch[] = [
  { date: '23 Nov', result: 'W', homeTeam: { name: 'FC Copenhage.' }, awayTeam: { name: 'Brondby.' }, homeScore: 1, awayScore: 0 },
  { date: '09 Nov', result: 'L', homeTeam: { name: 'Vejle.' }, awayTeam: { name: 'FC Copenhage.' }, homeScore: 2, awayScore: 0 },
  { date: '04 Nov', result: 'L', homeTeam: { name: 'Tottenham.' }, awayTeam: { name: 'FC Copenhage.' }, homeScore: 4, awayScore: 0 },
  { date: '01 Nov', result: 'W', homeTeam: { name: 'FC Copenhage.' }, awayTeam: { name: 'Fredericia.' }, homeScore: 3, awayScore: 2 },
  { date: '29 Oct', result: 'W', homeTeam: { name: 'Hobro.' }, awayTeam: { name: 'FC Copenhage.' }, homeScore: 1, awayScore: 4 },
  { date: '26 Oct', result: 'D', homeTeam: { name: 'FC Copenhage.' }, awayTeam: { name: 'Viborg.' }, homeScore: 0, awayScore: 0 },
  { date: '21 Oct', result: 'L', homeTeam: { name: 'FC Copenhage.' }, awayTeam: { name: 'Dortmund.' }, homeScore: 2, awayScore: 4 },
  { date: '17 Oct', result: 'L', homeTeam: { name: 'Silkeborg.' }, awayTeam: { name: 'Copenhagen.' }, homeScore: 3, awayScore: 1 },
  { date: '05 Oct', result: 'D', homeTeam: { name: 'Copenhagen.' }, awayTeam: { name: 'Midtjylland.' }, homeScore: 1, awayScore: 1 },
  { date: '01 Oct', result: 'L', homeTeam: { name: 'Qarabag.' }, awayTeam: { name: 'Copenhagen.' }, homeScore: 2, awayScore: 0 },
];

// Away team recent matches
export const awayTeamRecentMatches: RecentMatch[] = [
  { date: '05 Nov', result: 'L', homeTeam: { name: 'Inter.' }, awayTeam: { name: 'Kairat Almat.' }, homeScore: 2, awayScore: 1 },
  { date: '26 Oct', result: 'D', homeTeam: { name: 'Kairat Almat.' }, awayTeam: { name: 'FC Astana.' }, homeScore: 1, awayScore: 1 },
  { date: '21 Oct', result: 'D', homeTeam: { name: 'Kairat Almat.' }, awayTeam: { name: 'Pafos.' }, homeScore: 0, awayScore: 0 },
  { date: '17 Oct', result: 'W', homeTeam: { name: 'Kyzyl-Zhar.' }, awayTeam: { name: 'Kairat.' }, homeScore: 0, awayScore: 1 },
  { date: '05 Oct', result: 'W', homeTeam: { name: 'Kairat.' }, awayTeam: { name: 'Zhetysu.' }, homeScore: 5, awayScore: 0 },
  { date: '30 Sep', result: 'L', homeTeam: { name: 'Kairat.' }, awayTeam: { name: 'Real Madrid.' }, homeScore: 0, awayScore: 5 },
  { date: '22 Sep', result: 'W', homeTeam: { name: 'Kairat.' }, awayTeam: { name: 'Zhenys.' }, homeScore: 3, awayScore: 1 },
  { date: '18 Sep', result: 'L', homeTeam: { name: 'Sporting CP.' }, awayTeam: { name: 'Kairat.' }, homeScore: 4, awayScore: 1 },
  { date: '14 Sep', result: 'W', homeTeam: { name: 'Kairat.' }, awayTeam: { name: 'Aktobe.' }, homeScore: 1, awayScore: 0 },
  { date: '31 Aug', result: 'W', homeTeam: { name: 'Okzhetpes.' }, awayTeam: { name: 'Kairat.' }, homeScore: 0, awayScore: 1 },
];

// League standings
export const standings: StandingEntry[] = [
  { position: 1, team: { name: 'Bayern Münche' }, matches: 4, goals: '14-3', points: 12 },
  { position: 2, team: { name: 'Arsenal' }, matches: 4, goals: '11-0', points: 12 },
  { position: 3, team: { name: 'Inter' }, matches: 4, goals: '11-1', points: 12 },
  { position: 4, team: { name: 'Manchester Cit' }, matches: 4, goals: '10-3', points: 10 },
  { position: 5, team: { name: 'Paris Saint Ge' }, matches: 4, goals: '14-5', points: 9 },
  { position: 6, team: { name: 'Leverkusen' }, matches: 4, goals: '9-2', points: 9 },
  { position: 7, team: { name: 'Real Madrid' }, matches: 4, goals: '8-2', points: 9 },
  { position: 8, team: { name: 'Liverpool' }, matches: 4, goals: '9-4', points: 9 },
  { position: 9, team: { name: 'Galatasaray' }, matches: 4, goals: '8-6', points: 9 },
  { position: 10, team: { name: 'Tottenham' }, matches: 4, goals: '7-2', points: 8 },
  { position: 11, team: { name: 'Barcelona' }, matches: 4, goals: '12-7', points: 7 },
  { position: 12, team: { name: 'Chelsea' }, matches: 4, goals: '9-6', points: 7 },
  { position: 13, team: { name: 'Sporting CP' }, matches: 4, goals: '8-5', points: 7 },
  { position: 14, team: { name: 'Borussia Dortm' }, matches: 4, goals: '13-11', points: 7 },
  { position: 15, team: { name: 'Qarabag' }, matches: 4, goals: '8-7', points: 7 },
  { position: 16, team: { name: 'Atalanta' }, matches: 4, goals: '3-5', points: 7 },
  { position: 17, team: { name: 'Atletico Madri' }, matches: 4, goals: '10-9', points: 6 },
  { position: 18, team: { name: 'PSV Eindhoven' }, matches: 4, goals: '9-7', points: 5 },
  { position: 19, team: { name: 'Monaco' }, matches: 4, goals: '4-6', points: 5 },
  { position: 20, team: { name: 'Pafos' }, matches: 4, goals: '2-5', points: 5 },
  { position: 21, team: { name: 'Bayer Leverkus' }, matches: 4, goals: '6-10', points: 5 },
  { position: 22, team: { name: 'Club Brugge KV' }, matches: 4, goals: '8-10', points: 4 },
  { position: 23, team: { name: 'Eintracht Fran' }, matches: 4, goals: '7-11', points: 4 },
  { position: 24, team: { name: 'Napoli' }, matches: 4, goals: '4-9', points: 4 },
  { position: 25, team: { name: 'Marseille' }, matches: 4, goals: '6-5', points: 3 },
  { position: 26, team: { name: 'Juventus' }, matches: 4, goals: '7-8', points: 3 },
  { position: 27, team: { name: 'Athletic Club' }, matches: 4, goals: '4-9', points: 3 },
  { position: 28, team: { name: 'Union St. Gill' }, matches: 4, goals: '4-12', points: 3 },
  { position: 29, team: { name: 'Bodo/Glimt' }, matches: 4, goals: '5-8', points: 2 },
  { position: 30, team: { name: 'Slavia Praha' }, matches: 4, goals: '2-8', points: 2 },
  { position: 31, team: { name: 'Olympiakos Pir' }, matches: 4, goals: '2-9', points: 2 },
  { position: 32, team: { name: 'Villarreal' }, matches: 4, goals: '2-6', points: 1 },
  { position: 33, team: { name: 'FC Copenhagen' }, matches: 4, goals: '4-12', points: 1, isHighlighted: true },
  { position: 34, team: { name: 'Kairat Almaty' }, matches: 4, goals: '2-11', points: 1, isHighlighted: true },
  { position: 35, team: { name: 'Benfica' }, matches: 4, goals: '2-8', points: 0 },
  { position: 36, team: { name: 'Ajax' }, matches: 4, goals: '1-14', points: 0 },
];

// AI Predictions for match detail
export const aiPredictions: AIPrediction[] = [
  { label: 'Best Tip', prediction: 'U3.5', odds: 1.63, confidence: 3, oddsDirection: 'none' },
  { label: '1x2 Tip', prediction: '2', odds: 9.5, confidence: 1, oddsDirection: 'down' },
  { label: 'Total Goals', prediction: 'Under 3.5', odds: 1.63, confidence: 3, oddsDirection: 'none' },
  { label: 'Both Teams To Score', prediction: 'Yes', odds: 1.86, confidence: 1, oddsDirection: 'up' },
  { label: 'Bet Builder Tip', prediction: 'X2&U5.5', odds: 3.70, confidence: 1, oddsDirection: 'none' },
];

// Match header odds
export const matchHeaderOdds: MatchHeaderOdds = {
  homeWin: { value: 1.40, direction: 'up' },
  draw: { value: 5.40, direction: 'down' },
  awayWin: { value: 9.50, direction: 'down' },
};

// Market values
export const marketValues: MarketValues = {
  home: '€75.35m',
  away: '€16.05m',
};

// Score predictions
export const scorePredictions: ScorePredictions = {
  halfTime: { home: 0, away: 1 },
  correctScore: { home: 1, away: 2 },
};

// Stats predictions
export const statsPredictions: StatsPredictions = {
  xG: { home: 1.35, away: 0.54 },
  possession: { home: 63, away: 37 },
  totalShots: { home: 19, away: 10 },
  shotsOnGoal: { home: 4, away: 3 },
  shotsOffGoal: { home: 7, away: 4 },
  corners: { home: 5, away: 3 },
};

// Complete match detail screen data
export const matchDetailScreenData = {
  matchStatistics,
  formStatistics,
  homeTeamRecentMatches,
  awayTeamRecentMatches,
  standings,
  aiPredictions,
  matchHeaderOdds,
  marketValues,
  scorePredictions,
  statsPredictions,
};

// Helper function to get match detail data by match ID
export function getMatchDetailData(matchId: string) {
  // In a real scenario, this would fetch data specific to the match
  // For now, return default data
  return matchDetailScreenData;
}



