// Test script for API-Football
// Run with: node test-api.js

const API_KEY = 'f899128910a69f25acae19eb9a9d6928';

// Official API-Football endpoint
const API_URL = 'https://v3.football.api-sports.io';

async function testAPI() {
  console.log('Testing API-Football (Official)...\n');

  try {
    // Test 1: Get Premier League teams for 2023-2024 season
    console.log('1. Testing Teams endpoint (Premier League 2023)...');
    const teamsResponse = await fetch(`${API_URL}/teams?league=39&season=2023`, {
      method: 'GET',
      headers: {
        'x-apisports-key': API_KEY,
      },
    });

    console.log(`Status: ${teamsResponse.status} ${teamsResponse.statusText}`);
    const teamsData = await teamsResponse.json();

    if (teamsData.errors && Object.keys(teamsData.errors).length > 0) {
      console.log('❌ Error:', teamsData.errors);
      console.log('\nYou need to subscribe to API-Football on RapidAPI:');
      console.log('👉 https://rapidapi.com/api-sports/api/api-football\n');
      return;
    }

    console.log(`✅ Success! Found ${teamsData.results} teams`);
    if (teamsData.response && teamsData.response.length > 0) {
      console.log('\nFirst 3 teams:');
      teamsData.response.slice(0, 3).forEach((item) => {
        console.log(`  - ${item.team.name} (ID: ${item.team.id})`);
      });
    }

    // Test 2: Get recent fixtures
    console.log('\n2. Testing Fixtures endpoint (Premier League 2023)...');
    const fixturesResponse = await fetch(
      `${API_URL}/fixtures?league=39&season=2023&last=5`,
      {
        method: 'GET',
        headers: {
          'x-apisports-key': API_KEY,
        },
      }
    );

    const fixturesData = await fixturesResponse.json();
    console.log(`Status: ${fixturesResponse.status}`);
    console.log(`✅ Found ${fixturesData.results} fixtures`);

    if (fixturesData.response && fixturesData.response.length > 0) {
      console.log('\nLast 3 fixtures:');
      fixturesData.response.slice(0, 3).forEach((fixture) => {
        const homeTeam = fixture.teams.home.name;
        const awayTeam = fixture.teams.away.name;
        const score = `${fixture.goals.home ?? '-'} - ${fixture.goals.away ?? '-'}`;
        const date = new Date(fixture.fixture.date).toLocaleDateString();
        console.log(`  ${date}: ${homeTeam} ${score} ${awayTeam}`);
      });
    }

    console.log('\n✅ API-Football is working! You can now integrate it into the backend.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
