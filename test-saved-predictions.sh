#!/bin/bash

BASE_URL="http://localhost:3002"

echo "1. Creating test user..."
EMAIL="test$(date +%s)@test.com"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Test123456\",\"name\":\"Test User\"}")

USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.userId')
echo "User ID: $USER_ID"

echo -e "\n2. Verifying email..."
curl -s -X POST "$BASE_URL/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"code\":\"123456\"}" > /dev/null

echo -e "\n3. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Test123456\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')
echo "Token: ${TOKEN:0:20}..."

echo -e "\n4. Saving a live match..."
SAVE_RESPONSE=$(curl -s -X POST "$BASE_URL/saved-matches" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"matchId":"match-live-1"}')

echo -e "\n=== Save Match Response ==="
echo $SAVE_RESPONSE | jq '.'

echo -e "\n=== Prediction Data ==="
echo $SAVE_RESPONSE | jq '.match.prediction'

echo -e "\n5. Getting all saved matches..."
GET_SAVED=$(curl -s -X GET "$BASE_URL/saved-matches" \
  -H "Authorization: Bearer $TOKEN")

echo -e "\n=== Saved Matches ==="
echo $GET_SAVED | jq '.'

echo -e "\n=== First Match Prediction ==="
echo $GET_SAVED | jq '.[0].match.prediction'
