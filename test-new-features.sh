#!/bin/bash

# Test New Features - Comprehensive Test Suite
# Tests: Pagination, Real Data, Swagger Docs, Database Integration

echo "🧪 Testing New Backend Features"
echo "================================"
echo ""

BASE_URL="http://localhost:3000"
API_BASE="$BASE_URL"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test result
test_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC} $2"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to check JSON response
check_json() {
    echo "$1" | jq . > /dev/null 2>&1
    return $?
}

echo -e "${BLUE}📡 1. Testing Health & Connectivity${NC}"
echo "--------------------------------------"

# Test 1: Health Check
HEALTH=$(curl -s "$BASE_URL/health")
check_json "$HEALTH" && test_result 0 "Health endpoint returns valid JSON" || test_result 1 "Health endpoint failed"

# Test 2: Swagger Docs Available
SWAGGER=$(curl -sL -o /dev/null -w "%{http_code}" "$BASE_URL/docs")
[ "$SWAGGER" = "200" ] && test_result 0 "Swagger docs accessible at /docs" || test_result 1 "Swagger docs not accessible"

echo ""
echo -e "${BLUE}🔐 2. Testing Authentication (Required for API tests)${NC}"
echo "--------------------------------------"

# Register a test user
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="Test123456"

REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test\",\"surname\":\"User\"}")

check_json "$REGISTER_RESPONSE" && test_result 0 "User registration returns valid JSON" || test_result 1 "User registration failed"

# Login to get token
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken' 2>/dev/null)

if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
    test_result 0 "Login successful, got access token"
else
    test_result 1 "Login failed or no access token"
    echo -e "${RED}Cannot proceed with API tests without authentication${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}⚽ 3. Testing Matches API with Pagination${NC}"
echo "--------------------------------------"

# Test 3: Get matches with pagination (page 1)
MATCHES_PAGE1=$(curl -s "$API_BASE/matches?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

check_json "$MATCHES_PAGE1"
if [ $? -eq 0 ]; then
    test_result 0 "Matches endpoint returns valid JSON"

    # Check if using real data (pagination) or dummy data
    HAS_PAGINATION=$(echo "$MATCHES_PAGE1" | jq 'has("pagination")' 2>/dev/null)
    if [ "$HAS_PAGINATION" = "true" ]; then
        test_result 0 "Response has pagination metadata (using real data)"

        # Verify pagination structure
        CURRENT_PAGE=$(echo "$MATCHES_PAGE1" | jq -r '.pagination.currentPage' 2>/dev/null)
        TOTAL_ITEMS=$(echo "$MATCHES_PAGE1" | jq -r '.pagination.totalItems' 2>/dev/null)
        HAS_NEXT=$(echo "$MATCHES_PAGE1" | jq -r '.pagination.hasNextPage' 2>/dev/null)
        HAS_PREV=$(echo "$MATCHES_PAGE1" | jq -r '.pagination.hasPreviousPage' 2>/dev/null)

        [ "$CURRENT_PAGE" = "1" ] && test_result 0 "Current page is 1" || test_result 1 "Current page should be 1"
        [ "$HAS_PREV" = "false" ] && test_result 0 "First page has no previous" || test_result 1 "First page should have no previous"
        [ -n "$TOTAL_ITEMS" ] && test_result 0 "Total items count present: $TOTAL_ITEMS" || test_result 1 "Total items missing"

        # Check data array
        DATA_LENGTH=$(echo "$MATCHES_PAGE1" | jq '.data | length' 2>/dev/null)
        [ "$DATA_LENGTH" -gt "0" ] && test_result 0 "Data array has $DATA_LENGTH items" || test_result 1 "Data array is empty"

    else
        test_result 1 "No pagination metadata (using dummy data mode)"
        echo -e "${YELLOW}   Note: Set FOOTBALL_DATA_SOURCE=api in .env to test real data${NC}"
    fi
else
    test_result 1 "Matches endpoint failed"
fi

# Test 4: Get matches with filters
MATCHES_UPCOMING=$(curl -s "$API_BASE/matches?status=upcoming&page=1&limit=5" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

check_json "$MATCHES_UPCOMING" && test_result 0 "Matches with status filter returns valid JSON" || test_result 1 "Matches with filter failed"

# Test 5: Get matches page 2
MATCHES_PAGE2=$(curl -s "$API_BASE/matches?page=2&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

check_json "$MATCHES_PAGE2"
if [ $? -eq 0 ]; then
    test_result 0 "Second page returns valid JSON"

    HAS_PAGINATION=$(echo "$MATCHES_PAGE2" | jq 'has("pagination")' 2>/dev/null)
    if [ "$HAS_PAGINATION" = "true" ]; then
        CURRENT_PAGE=$(echo "$MATCHES_PAGE2" | jq -r '.pagination.currentPage' 2>/dev/null)
        HAS_PREV=$(echo "$MATCHES_PAGE2" | jq -r '.pagination.hasPreviousPage' 2>/dev/null)

        [ "$CURRENT_PAGE" = "2" ] && test_result 0 "Current page is 2" || test_result 1 "Current page should be 2"
        [ "$HAS_PREV" = "true" ] && test_result 0 "Second page has previous" || test_result 1 "Second page should have previous"
    fi
else
    test_result 1 "Second page request failed"
fi

# Test 6: Edge cases
# Test with limit exceeding max (should cap at 100)
MATCHES_LARGE=$(curl -s "$API_BASE/matches?page=1&limit=200" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

check_json "$MATCHES_LARGE" && test_result 0 "Large limit request handled gracefully" || test_result 1 "Large limit request failed"

# Test with page 0 (should default to 1)
MATCHES_PAGE0=$(curl -s "$API_BASE/matches?page=0&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

check_json "$MATCHES_PAGE0"
if [ $? -eq 0 ]; then
    test_result 0 "Page 0 request handled"

    HAS_PAGINATION=$(echo "$MATCHES_PAGE0" | jq 'has("pagination")' 2>/dev/null)
    if [ "$HAS_PAGINATION" = "true" ]; then
        CURRENT_PAGE=$(echo "$MATCHES_PAGE0" | jq -r '.pagination.currentPage' 2>/dev/null)
        [ "$CURRENT_PAGE" = "1" ] && test_result 0 "Page 0 defaults to page 1" || test_result 1 "Page 0 should default to 1"
    fi
else
    test_result 1 "Page 0 request failed"
fi

echo ""
echo -e "${BLUE}📊 4. Testing Database Integration${NC}"
echo "--------------------------------------"

# Check if database has real data
if [ "$HAS_PAGINATION" = "true" ]; then
    echo -e "${GREEN}✓${NC} Database integration active (API mode)"

    # Check if we have teams
    FIRST_MATCH=$(echo "$MATCHES_PAGE1" | jq -r '.data[0]' 2>/dev/null)
    if [ "$FIRST_MATCH" != "null" ]; then
        HOME_TEAM=$(echo "$FIRST_MATCH" | jq -r '.homeTeam.name' 2>/dev/null)
        AWAY_TEAM=$(echo "$FIRST_MATCH" | jq -r '.awayTeam.name' 2>/dev/null)

        if [ -n "$HOME_TEAM" ] && [ "$HOME_TEAM" != "null" ]; then
            test_result 0 "Match includes team data: $HOME_TEAM vs $AWAY_TEAM"

            # Check for team logos
            HOME_LOGO=$(echo "$FIRST_MATCH" | jq -r '.homeTeam.logoUrl' 2>/dev/null)
            [ -n "$HOME_LOGO" ] && [ "$HOME_LOGO" != "null" ] && test_result 0 "Team has logo URL" || test_result 1 "Team logo missing"
        else
            test_result 1 "Match data incomplete"
        fi
    fi
else
    echo -e "${YELLOW}⚠${NC}  Using dummy data mode"
    echo -e "   To test real data: Set FOOTBALL_DATA_SOURCE=api in .env"
fi

echo ""
echo -e "${BLUE}📚 5. Testing Swagger Documentation${NC}"
echo "--------------------------------------"

# Get Swagger spec
SWAGGER_SPEC=$(curl -s "$BASE_URL/docs.json")

check_json "$SWAGGER_SPEC"
if [ $? -eq 0 ]; then
    test_result 0 "Swagger spec is valid JSON"

    # Check for new schemas
    HAS_TEAM=$(echo "$SWAGGER_SPEC" | jq '.components.schemas | has("Team")' 2>/dev/null)
    HAS_MATCH=$(echo "$SWAGGER_SPEC" | jq '.components.schemas | has("Match")' 2>/dev/null)
    HAS_STANDING=$(echo "$SWAGGER_SPEC" | jq '.components.schemas | has("Standing")' 2>/dev/null)
    HAS_PLAYER=$(echo "$SWAGGER_SPEC" | jq '.components.schemas | has("PlayerStats")' 2>/dev/null)
    HAS_PREDICTION=$(echo "$SWAGGER_SPEC" | jq '.components.schemas | has("Prediction")' 2>/dev/null)

    [ "$HAS_TEAM" = "true" ] && test_result 0 "Team schema documented" || test_result 1 "Team schema missing"
    [ "$HAS_MATCH" = "true" ] && test_result 0 "Match schema documented" || test_result 1 "Match schema missing"
    [ "$HAS_STANDING" = "true" ] && test_result 0 "Standing schema documented" || test_result 1 "Standing schema missing"
    [ "$HAS_PLAYER" = "true" ] && test_result 0 "PlayerStats schema documented" || test_result 1 "PlayerStats schema missing"
    [ "$HAS_PREDICTION" = "true" ] && test_result 0 "Prediction schema documented" || test_result 1 "Prediction schema missing"

    # Check for new tags
    HAS_STANDINGS_TAG=$(echo "$SWAGGER_SPEC" | jq '.tags | map(.name) | contains(["Standings"])' 2>/dev/null)
    HAS_PLAYERS_TAG=$(echo "$SWAGGER_SPEC" | jq '.tags | map(.name) | contains(["Players"])' 2>/dev/null)
    HAS_TEAMS_TAG=$(echo "$SWAGGER_SPEC" | jq '.tags | map(.name) | contains(["Teams"])' 2>/dev/null)

    [ "$HAS_STANDINGS_TAG" = "true" ] && test_result 0 "Standings tag present" || test_result 1 "Standings tag missing"
    [ "$HAS_PLAYERS_TAG" = "true" ] && test_result 0 "Players tag present" || test_result 1 "Players tag missing"
    [ "$HAS_TEAMS_TAG" = "true" ] && test_result 0 "Teams tag present" || test_result 1 "Teams tag missing"
else
    test_result 1 "Swagger spec is invalid"
fi

echo ""
echo -e "${BLUE}👤 6. Testing User Profile Updates${NC}"
echo "--------------------------------------"

# Update profile with name/surname
PROFILE_UPDATE=$(curl -s -X PUT "$API_BASE/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John","surname":"Doe"}')

check_json "$PROFILE_UPDATE"
if [ $? -eq 0 ]; then
    test_result 0 "Profile update returns valid JSON"

    NAME=$(echo "$PROFILE_UPDATE" | jq -r '.name' 2>/dev/null)
    SURNAME=$(echo "$PROFILE_UPDATE" | jq -r '.surname' 2>/dev/null)

    [ "$NAME" = "John" ] && test_result 0 "Name updated successfully" || test_result 1 "Name update failed"
    [ "$SURNAME" = "Doe" ] && test_result 0 "Surname updated successfully" || test_result 1 "Surname update failed"
else
    test_result 1 "Profile update failed"
fi

# Get profile
PROFILE=$(curl -s "$API_BASE/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

check_json "$PROFILE"
if [ $? -eq 0 ]; then
    test_result 0 "Get profile returns valid JSON"

    NAME=$(echo "$PROFILE" | jq -r '.name' 2>/dev/null)
    SURNAME=$(echo "$PROFILE" | jq -r '.surname' 2>/dev/null)

    [ "$NAME" = "John" ] && test_result 0 "Name persisted in database" || test_result 1 "Name not persisted"
    [ "$SURNAME" = "Doe" ] && test_result 0 "Surname persisted in database" || test_result 1 "Surname not persisted"
else
    test_result 1 "Get profile failed"
fi

echo ""
echo "================================"
echo -e "${BLUE}📊 Test Summary${NC}"
echo "================================"
echo ""
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC} 🎉"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
