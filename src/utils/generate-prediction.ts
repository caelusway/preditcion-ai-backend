/**
 * Generate realistic AI predictions for matches (demo purposes)
 * This is a simple rule-based system for demo - replace with actual ML model in production
 */

interface Team {
  id: string;
  name: string;
}

interface PredictionResult {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  aiConfidence: 'Low' | 'Medium' | 'High';
  aiAnalysis: string;
  quickStats: {
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
  };
}

// Team strength ratings (Premier League 2023/24 - can be updated)
const teamStrengths: Record<string, number> = {
  // Top tier (85-95)
  'Manchester City': 95,
  'Arsenal': 90,
  'Liverpool': 90,
  'Newcastle': 82,

  // Upper mid-table (75-84)
  'Manchester United': 80,
  'Tottenham': 80,
  'Chelsea': 78,
  'Brighton': 76,
  'Aston Villa': 75,
  'West Ham': 74,

  // Mid-table (65-74)
  'Brentford': 70,
  'Fulham': 68,
  'Crystal Palace': 67,
  'Wolves': 66,
  'Nottingham Forest': 65,
  'Everton': 64,

  // Lower table (55-64)
  'Bournemouth': 63,
  'Luton': 60,
  'Burnley': 58,
  'Sheffield United': 55,
};

// Get team strength with fallback
function getTeamStrength(teamName: string): number {
  return teamStrengths[teamName] || 70; // Default mid-table strength
}

// Generate random form
function generateForm(): string[] {
  const outcomes = ['W', 'D', 'L'];
  const form: string[] = [];
  for (let i = 0; i < 5; i++) {
    const rand = Math.random();
    if (rand < 0.4) form.push('W');
    else if (rand < 0.7) form.push('D');
    else form.push('L');
  }
  return form;
}

// Calculate form strength from form array
function calculateFormStrength(form: string[]): number {
  let strength = 0;
  form.forEach((result, index) => {
    const weight = 5 - index; // More recent games have higher weight
    if (result === 'W') strength += weight * 3;
    else if (result === 'D') strength += weight;
  });
  return strength;
}

/**
 * Generate a realistic AI prediction for a match
 */
export function generatePrediction(homeTeam: Team, awayTeam: Team): PredictionResult {
  // Get base strengths
  const homeStrength = getTeamStrength(homeTeam.name);
  const awayStrength = getTeamStrength(awayTeam.name);

  // Generate form
  const homeForm = generateForm();
  const awayForm = generateForm();

  // Calculate form strengths
  const homeFormStrength = calculateFormStrength(homeForm);
  const awayFormStrength = calculateFormStrength(awayForm);

  // Home advantage (+5%)
  const homeAdvantage = 5;

  // Calculate adjusted strengths
  const homeTotal = homeStrength + homeFormStrength + homeAdvantage;
  const awayTotal = awayStrength + awayFormStrength;

  // Calculate win probabilities
  const totalStrength = homeTotal + awayTotal;
  let homeWin = (homeTotal / totalStrength) * 100;
  let awayWin = (awayTotal / totalStrength) * 100;

  // Draw probability increases when teams are evenly matched
  const strengthDiff = Math.abs(homeTotal - awayTotal);
  let draw = 30 - (strengthDiff / 10); // Base 30%, decreases with strength difference
  draw = Math.max(15, Math.min(35, draw)); // Clamp between 15-35%

  // Adjust win probabilities to account for draw
  const winProbTotal = 100 - draw;
  homeWin = (homeWin / 100) * winProbTotal;
  awayWin = (awayWin / 100) * winProbTotal;

  // Round to integers
  homeWin = Math.round(homeWin);
  awayWin = Math.round(awayWin);
  draw = 100 - homeWin - awayWin; // Ensure they sum to 100

  // Determine confidence based on probability spread
  const maxProb = Math.max(homeWin, draw, awayWin);
  let confidence: 'Low' | 'Medium' | 'High';
  if (maxProb >= 55) confidence = 'High';
  else if (maxProb >= 45) confidence = 'Medium';
  else confidence = 'Low';

  // Generate stats
  const homeGoals = Math.floor(15 + (homeStrength / 10) + Math.random() * 5);
  const awayGoals = Math.floor(12 + (awayStrength / 10) + Math.random() * 5);

  const homeXG = 1.2 + (homeStrength / 50) + Math.random() * 0.5;
  const awayXG = 1.0 + (awayStrength / 50) + Math.random() * 0.5;

  const homeInjuries = Math.floor(Math.random() * 4);
  const awayInjuries = Math.floor(Math.random() * 4);

  // Generate head-to-head based on relative strength
  const h2hTotal = 20;
  const homeH2HWins = Math.floor((homeStrength / (homeStrength + awayStrength)) * h2hTotal);
  const awayH2HWins = Math.floor((awayStrength / (homeStrength + awayStrength)) * h2hTotal);
  const h2hDraws = h2hTotal - homeH2HWins - awayH2HWins;

  // Generate AI analysis
  const analysis = generateAnalysis(
    homeTeam.name,
    awayTeam.name,
    homeWin,
    awayWin,
    homeStrength,
    awayStrength,
    confidence
  );

  return {
    homeWinProbability: homeWin,
    drawProbability: draw,
    awayWinProbability: awayWin,
    aiConfidence: confidence,
    aiAnalysis: analysis,
    quickStats: {
      recentForm: {
        home: homeForm,
        away: awayForm,
      },
      goalsLast10: {
        home: homeGoals,
        away: awayGoals,
      },
      expectedGoals: {
        home: Number(homeXG.toFixed(1)),
        away: Number(awayXG.toFixed(1)),
      },
      injuries: {
        home: homeInjuries,
        away: awayInjuries,
      },
      headToHead: {
        homeWins: homeH2HWins,
        draws: h2hDraws,
        awayWins: awayH2HWins,
      },
    },
  };
}

/**
 * Generate realistic AI analysis text
 */
function generateAnalysis(
  homeName: string,
  awayName: string,
  homeWinProb: number,
  awayWinProb: number,
  homeStrength: number,
  awayStrength: number,
  confidence: string
): string {
  const templates = [];

  // Determine favorite
  if (homeWinProb > awayWinProb + 10) {
    templates.push(
      `${homeName}'s home advantage and superior form give them a clear edge in this fixture. ${awayName} will need to be at their best to get a result.`,
      `${homeName} are the favorites here, with their strong home record and current momentum. ${awayName}'s defensive organization will be tested.`,
      `${homeName} should have the upper hand playing at home. Their attacking prowess could prove too much for ${awayName}'s defense.`
    );
  } else if (awayWinProb > homeWinProb + 10) {
    templates.push(
      `${awayName} come into this match as favorites despite being away from home. Their quality should shine through against ${homeName}.`,
      `${awayName}'s recent form and tactical superiority make them favorites, even on the road. ${homeName} will need a perfect performance.`,
      `${awayName} have the edge here with their superior squad depth and current form. ${homeName}'s home advantage may not be enough.`
    );
  } else {
    // Evenly matched
    templates.push(
      `This is a tightly contested fixture with both teams evenly matched. Home advantage could be the deciding factor for ${homeName}.`,
      `A closely fought match is expected between ${homeName} and ${awayName}. Recent form and tactical adjustments will be crucial.`,
      `Both teams have similar strengths, making this a difficult match to predict. Expect a competitive encounter with fine margins deciding the outcome.`,
      `${homeName} and ${awayName} are well-matched opponents. Small details and individual brilliance could swing this match either way.`
    );
  }

  // Add confidence qualifier if low
  if (confidence === 'Low') {
    templates.push(`This match is highly unpredictable with both teams showing inconsistent form. Form could go out the window in this fixture.`);
  }

  return templates[Math.floor(Math.random() * templates.length)];
}
