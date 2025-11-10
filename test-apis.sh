#!/bin/bash

# Quick API Test Script
BASE_URL="http://localhost:3001"

echo "🧪 Testing Football Prediction API"
echo "===================================="
echo ""

# Test 1: Health Check
echo "1️⃣ Testing Health Endpoint..."
curl -s "$BASE_URL/health" | jq '.'
echo ""

# Test 2: Live Matches
echo "2️⃣ Testing Live Matches..."
curl -s "$BASE_URL/matches?status=live" | jq '{count: .data | length, matches: [.data[] | {id, home: .homeTeam.name, away: .awayTeam.name, status, score: "\(.homeScore)-\(.awayScore)"}]}'
echo ""

# Test 3: Upcoming Matches
echo "3️⃣ Testing Upcoming Matches..."
curl -s "$BASE_URL/matches?status=upcoming" | jq '{count: .data | length}'
echo ""

# Test 4: Finished Matches
echo "4️⃣ Testing Finished Matches..."
curl -s "$BASE_URL/matches?status=finished" | jq '{count: .data | length}'
echo ""

# Test 5: Register & Login
echo "5️⃣ Testing Auth Flow..."
RANDOM_EMAIL="test$(date +%s)@test.com"
echo "Registering user: $RANDOM_EMAIL"
REG_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$RANDOM_EMAIL\",\"password\":\"Test1234\",\"name\":\"Test\",\"surname\":\"User\"}")
echo "$REG_RESPONSE" | jq '{userId: .user.id, email: .user.email}'

# Verify email in DB
npx prisma db execute --stdin <<< "UPDATE users SET \"emailVerified\" = true WHERE email = '$RANDOM_EMAIL';" > /dev/null 2>&1
echo "Email verified"

# Login
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$RANDOM_EMAIL\",\"password\":\"Test1234\"}")
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
echo "Token received: ${TOKEN:0:20}..."
echo ""

# Test 6: Stats API
echo "6️⃣ Testing Stats API..."
curl -s -X GET "$BASE_URL/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 7: Save Match
echo "7️⃣ Testing Save Match..."
curl -s -X POST "$BASE_URL/saved-matches" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"matchId":"match-live-1"}' | jq '.'
echo ""

# Test 8: Get Saved Matches
echo "8️⃣ Testing Get Saved Matches..."
curl -s -X GET "$BASE_URL/saved-matches" \
  -H "Authorization: Bearer $TOKEN" | jq 'length'
echo ""

# Test 9: Unsave Match
echo "9️⃣ Testing Unsave Match..."
curl -s -X DELETE "$BASE_URL/saved-matches/match-live-1" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo "✅ All tests completed!"
