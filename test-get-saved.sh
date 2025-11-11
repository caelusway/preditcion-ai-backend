#!/bin/bash

BASE_URL="http://localhost:3002"

# Register
EMAIL="gettest$(date +%s)@test.com"
echo "Registering: $EMAIL"
REG=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Test1234\",\"name\":\"Test\",\"surname\":\"User\"}")

USER_ID=$(echo "$REG" | jq -r '.user.id')
echo "User ID: $USER_ID"

# Verify email
npx prisma db execute --stdin <<< "UPDATE users SET \"emailVerified\" = true WHERE email = '$EMAIL';" > /dev/null 2>&1

# Login
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Test1234\"}" | jq -r '.accessToken')

echo "Token: ${TOKEN:0:20}..."

# Save two matches
echo "Saving match-live-1..."
curl -s -X POST "$BASE_URL/saved-matches" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"matchId":"match-live-1"}' > /dev/null

echo "Saving match-1 (upcoming)..."
curl -s -X POST "$BASE_URL/saved-matches" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"matchId":"match-1"}' > /dev/null

# Get saved matches
echo ""
echo "=== Getting Saved Matches ==="
SAVED=$(curl -s "$BASE_URL/saved-matches" \
  -H "Authorization: Bearer $TOKEN")

echo "$SAVED" | jq '.'

echo ""
echo "=== First Match Prediction ==="
echo "$SAVED" | jq '.[0].match.prediction'

echo ""
echo "=== Second Match Prediction ==="
echo "$SAVED" | jq '.[1].match.prediction'
