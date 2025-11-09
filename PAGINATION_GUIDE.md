# API Pagination Guide

## Overview

The API now supports **proper pagination** for list endpoints with complete metadata for implementing pagination UI in mobile apps.

## Pagination Types

### 1. Offset-Based Pagination (Page Numbers)

**Best for**: Traditional page-based navigation with page numbers.

**Query Parameters:**
- `page` (integer, default: 1) - Page number (starts from 1)
- `limit` (integer, default: 20, max: 100) - Items per page

**Example Request:**
```http
GET /api/matches?page=2&limit=20&status=upcoming
```

**Response Format:**
```json
{
  "data": [
    {
      "id": "uuid",
      "homeTeam": { "name": "Arsenal", "logoUrl": "..." },
      "awayTeam": { "name": "Chelsea", "logoUrl": "..." },
      "kickoffTime": "2024-12-15T15:00:00Z",
      "status": "upcoming",
      ...
    }
  ],
  "pagination": {
    "currentPage": 2,
    "itemsPerPage": 20,
    "totalItems": 70,
    "totalPages": 4,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

### 2. Cursor-Based Pagination (Infinite Scroll)

**Best for**: Mobile infinite scroll, continuous data loading.

**Query Parameters:**
- `cursor` (string, optional) - ID of last item from previous page
- `limit` (integer, default: 20, max: 100) - Items per request

**Example Request:**
```http
GET /api/matches?cursor=abc123&limit=20
```

**Response Format:**
```json
{
  "data": [
    { "id": "def456", ... },
    { "id": "ghi789", ... }
  ],
  "nextCursor": "ghi789",
  "hasMore": true
}
```

## Endpoints with Pagination

### Matches

```http
GET /api/matches?page=1&limit=20&status=upcoming
```

**Filters:**
- `status` - Filter by match status (upcoming, live, finished)

**Sorting:**
- Default: ordered by `kickoffTime` ascending (soonest first)

### Future Endpoints (To Be Implemented)

```http
GET /api/standings?page=1&limit=20&season=2023
GET /api/players/top-scorers?page=1&limit=10
GET /api/players/top-assists?page=1&limit=10
GET /api/teams/:teamId/matches?page=1&limit=10
```

## Implementation Details

### Backend Utilities

Located in [src/utils/pagination.ts](src/utils/pagination.ts:1)

**Key Functions:**
```typescript
// Parse pagination params from request
parsePaginationParams(req, defaultLimit?, maxLimit?)

// Get Prisma pagination options
getPrismaPagination({ page, limit, skip })

// Create paginated response
createPaginatedResponse(data, page, limit, totalCount)

// For cursor pagination
parseCursorPaginationParams(req, defaultLimit?, maxLimit?)
createCursorPaginatedResponse(data, limit)
```

### Controller Pattern

```typescript
import {
  parsePaginationParams,
  getPrismaPagination,
  createPaginatedResponse,
} from '../utils/pagination';

async getMatches(req: Request, res: Response) {
  // Parse pagination params
  const { page, limit, skip } = parsePaginationParams(req);

  // Build filters
  const where = { status: req.query.status };

  // Query with count
  const [totalCount, matches] = await Promise.all([
    prisma.match.count({ where }),
    prisma.match.findMany({
      where,
      ...getPrismaPagination({ page, limit, skip }),
    }),
  ]);

  // Return paginated response
  const response = createPaginatedResponse(matches, page, limit, totalCount);
  res.json(response);
}
```

## Mobile App Integration

### React Native Example (Offset Pagination)

```typescript
import { useState, useEffect } from 'react';

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

function useMatches(status?: string) {
  const [matches, setMatches] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, [page, status]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/matches?page=${page}&limit=20&status=${status}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data: PaginatedResponse = await response.json();
      setMatches(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  };

  return {
    matches,
    pagination,
    loading,
    nextPage: () => setPage(p => p + 1),
    prevPage: () => setPage(p => Math.max(1, p - 1)),
  };
}

// Usage
function MatchesScreen() {
  const { matches, pagination, loading, nextPage, prevPage } = useMatches('upcoming');

  return (
    <View>
      <FlatList data={matches} renderItem={...} />

      {/* Pagination Controls */}
      <View style={styles.pagination}>
        <Button
          title="Previous"
          disabled={!pagination?.hasPreviousPage}
          onPress={prevPage}
        />
        <Text>
          Page {pagination?.currentPage} of {pagination?.totalPages}
        </Text>
        <Button
          title="Next"
          disabled={!pagination?.hasNextPage}
          onPress={nextPage}
        />
      </View>
    </View>
  );
}
```

### React Native Example (Infinite Scroll)

```typescript
function useInfiniteMatches() {
  const [matches, setMatches] = useState([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const url = cursor
        ? `/api/matches?cursor=${cursor}&limit=20`
        : `/api/matches?limit=20`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      setMatches(prev => [...prev, ...data.data]);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  };

  return { matches, loadMore, hasMore, loading };
}

// Usage
function MatchesScreen() {
  const { matches, loadMore, hasMore, loading } = useInfiniteMatches();

  return (
    <FlatList
      data={matches}
      renderItem={({ item }) => <MatchCard match={item} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loading ? <ActivityIndicator /> : null}
    />
  );
}
```

## Best Practices

### 1. Choose the Right Pagination Type

**Use Offset Pagination (pages) when:**
- Users need to jump to specific pages
- Showing page numbers in UI
- Data is relatively stable
- Need total count information

**Use Cursor Pagination when:**
- Implementing infinite scroll
- Real-time data that changes frequently
- Better performance for large datasets
- Mobile-first approach

### 2. Set Reasonable Limits

```typescript
// Backend defaults
const DEFAULT_LIMIT = 20;  // Good balance for mobile
const MAX_LIMIT = 100;     // Prevent large requests

// Mobile app limits
const MATCHES_PER_PAGE = 20;      // List views
const INFINITE_SCROLL_BATCH = 15; // Infinite scroll
```

### 3. Handle Edge Cases

```typescript
// No results
if (pagination.totalItems === 0) {
  return <EmptyState message="No matches found" />;
}

// Last page
if (!pagination.hasNextPage) {
  // Disable next button or show "End of results"
}

// Loading states
if (loading && page === 1) {
  return <LoadingSpinner />;
}
```

### 4. Cache & Optimize

```typescript
// React Query example
import { useInfiniteQuery } from '@tanstack/react-query';

function useMatches() {
  return useInfiniteQuery({
    queryKey: ['matches'],
    queryFn: ({ pageParam = 1 }) =>
      fetch(`/api/matches?page=${pageParam}`).then(r => r.json()),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.currentPage + 1
        : undefined,
    staleTime: 60000, // Cache for 1 minute
  });
}
```

## Testing Pagination

### Test Different Scenarios

```bash
# First page
curl "http://localhost:3000/api/matches?page=1&limit=10"

# Middle page
curl "http://localhost:3000/api/matches?page=3&limit=10"

# Last page
curl "http://localhost:3000/api/matches?page=10&limit=10"

# With filters
curl "http://localhost:3000/api/matches?page=1&limit=20&status=upcoming"

# Edge cases
curl "http://localhost:3000/api/matches?page=0&limit=10"    # Should return page 1
curl "http://localhost:3000/api/matches?page=999&limit=10"  # Should return empty with valid pagination
curl "http://localhost:3000/api/matches?limit=200"          # Should cap at max limit (100)
```

### Verify Response

Check that response includes:
- ✅ `data` array with correct number of items
- ✅ `pagination.currentPage` matches request
- ✅ `pagination.totalItems` is accurate
- ✅ `pagination.totalPages` is calculated correctly
- ✅ `pagination.hasNextPage` is accurate
- ✅ `pagination.hasPreviousPage` is accurate

## Performance Considerations

### 1. Count Optimization

For large datasets, counting can be expensive. Consider:

```typescript
// Option 1: Parallel count + query (current)
const [count, data] = await Promise.all([
  prisma.match.count({ where }),
  prisma.match.findMany({ where, skip, take }),
]);

// Option 2: Only count on first page
const count = page === 1
  ? await prisma.match.count({ where })
  : null; // Client caches total from first page

// Option 3: Cursor pagination (no count needed)
const data = await prisma.match.findMany({
  where,
  take: limit + 1, // Fetch one extra to know if hasMore
  cursor: cursor ? { id: cursor } : undefined,
});
```

### 2. Database Indexes

Ensure indexes on frequently paginated columns:

```prisma
model Match {
  // ...
  @@index([kickoffTime])  // For default sorting
  @@index([status])       // For filtering
  @@index([status, kickoffTime]) // Compound for both
}
```

### 3. Response Size

Monitor payload sizes:
- Include only necessary fields
- Use `select` in Prisma queries
- Consider field-level pagination for related data

## Migration Path

### Phase 1: Backend (Completed)
- ✅ Created pagination utilities
- ✅ Updated matches controller
- ✅ Updated Swagger documentation

### Phase 2: Mobile App (To Do)
- [ ] Update API client to handle pagination
- [ ] Implement pagination UI components
- [ ] Add infinite scroll to match lists
- [ ] Add page controls for standings/players

### Phase 3: Optimization (Future)
- [ ] Add caching layer (Redis)
- [ ] Implement cursor pagination for real-time data
- [ ] Add search functionality with pagination
- [ ] Monitor and optimize slow queries

## Summary

✅ **Offset Pagination**: Implemented for `/api/matches` endpoint
✅ **Pagination Metadata**: Complete with page info, counts, navigation flags
✅ **Swagger Docs**: Updated with pagination examples
✅ **Mobile Ready**: Response format optimized for React Native
✅ **Utilities**: Reusable pagination helpers for all endpoints

**Next Steps:**
1. Update mobile app to use pagination
2. Implement pagination for new endpoints (standings, players)
3. Add search/filter capabilities
4. Consider cursor pagination for infinite scroll

---

**Questions?** Pagination is a critical feature for performance and UX. This implementation follows REST API best practices and is production-ready.
