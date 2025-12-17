#!/bin/bash

echo "=========================================="
echo "TEST 1: Duplicate Teams in Premier League"
echo "=========================================="

RESPONSE=$(curl -s http://localhost:3001/teams/selectable)
EVERTON_COUNT=$(echo "$RESPONSE" | grep -o '"name":"Everton"' | wc -l | tr -d ' ')

echo "Everton entries found: $EVERTON_COUNT"
if [ "$EVERTON_COUNT" -eq 1 ]; then
  echo "PASS: No duplicate Everton (only 1 entry)"
else
  echo "FAIL: Found $EVERTON_COUNT Everton entries"
fi

echo ""
echo "=========================================="
echo "TEST 2: AI Prediction Confidence (100 scale)"
echo "=========================================="

MATCH_RESPONSE=$(curl -s "http://localhost:3001/matches/1")
CONFIDENCE_VALUES=$(echo "$MATCH_RESPONSE" | grep -o '"confidence":[0-9]*' | head -5)

echo "Confidence values found:"
echo "$CONFIDENCE_VALUES"

HAS_HIGH_CONFIDENCE=$(echo "$MATCH_RESPONSE" | grep -o '"confidence":[0-9]*' | grep -E '"confidence":[1-9][0-9]' | head -1)
if [ -n "$HAS_HIGH_CONFIDENCE" ]; then
  echo "PASS: Confidence is on 100 scale"
else
  echo "FAIL: Confidence appears to be on 10 scale"
fi

echo ""
echo "=========================================="
echo "TEST 3: Standings Team Logos"
echo "=========================================="

if echo "$MATCH_RESPONSE" | grep -q '"standings".*"logoUrl"'; then
  echo "PASS: Standings include team logos"
  echo "Sample:"
  echo "$MATCH_RESPONSE" | grep -o '"team":{"name":"[^"]*","logoUrl":"[^"]*"}' | head -3
else
  echo "FAIL: No logoUrl in standings"
fi

echo ""
echo "=========================================="
echo "TEST 4: Swagger Docs Available"
echo "=========================================="

SWAGGER_CHECK=$(curl -s http://localhost:3001/docs/ | head -c 100)
if echo "$SWAGGER_CHECK" | grep -qi 'html\|swagger'; then
  echo "PASS: Swagger docs accessible"
else
  echo "CHECK: $SWAGGER_CHECK"
fi

echo ""
echo "=========================================="
echo "TEST 5: Change Password API"
echo "=========================================="

# Register test user
REG=$(curl -s -X POST http://localhost:3001/auth/register -H "Content-Type: application/json" -d '{"email":"testpwd2@test.com","username":"testpwd2","password":"OldPass123","name":"Test","surname":"User"}')
echo "Registered: $(echo $REG | grep -o '"id":"[^"]*"' | head -1)"

# Verify email
npx prisma db execute --stdin <<< "UPDATE users SET \"emailVerified\" = true WHERE email = 'testpwd2@test.com';" 2>/dev/null

# Login
LOGIN=$(curl -s -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"identifier":"testpwd2@test.com","password":"OldPass123"}')
TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//;s/"//')

if [ -n "$TOKEN" ]; then
  echo "Login successful"
  
  # Test wrong password
  WRONG=$(curl -s -X POST http://localhost:3001/auth/change-password -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"currentPassword":"WrongPass","newPassword":"NewPass456"}')
  if echo "$WRONG" | grep -q "incorrect"; then
    echo "PASS: Wrong password rejected"
  fi
  
  # Test correct password
  CORRECT=$(curl -s -X POST http://localhost:3001/auth/change-password -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"currentPassword":"OldPass123","newPassword":"NewPass456"}')
  if echo "$CORRECT" | grep -q "success"; then
    echo "PASS: Password changed"
  fi
  
  # Verify new password works
  NEWLOGIN=$(curl -s -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"identifier":"testpwd2@test.com","password":"NewPass456"}')
  if echo "$NEWLOGIN" | grep -q "accessToken"; then
    echo "PASS: New password works"
  fi
fi

# Cleanup
npx prisma db execute --stdin <<< "DELETE FROM users WHERE email = 'testpwd2@test.com';" 2>/dev/null
echo "Cleanup done"

echo ""
echo "=========================================="
echo "ALL TESTS COMPLETED"
echo "=========================================="
