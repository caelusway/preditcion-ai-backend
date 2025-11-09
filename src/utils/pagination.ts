import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Parse pagination parameters from request query
 * @param req Express request
 * @param defaultLimit Default items per page (default: 20)
 * @param maxLimit Maximum items per page (default: 100)
 */
export function parsePaginationParams(
  req: Request,
  defaultLimit: number = 20,
  maxLimit: number = 100
): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  let limit = parseInt(req.query.limit as string) || defaultLimit;

  // Enforce max limit
  limit = Math.min(limit, maxLimit);
  limit = Math.max(1, limit); // Ensure at least 1

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  totalItems: number
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    currentPage: page,
    itemsPerPage: limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  totalItems: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: createPaginationMeta(page, limit, totalItems),
  };
}

/**
 * Get Prisma pagination options
 */
export function getPrismaPagination(params: PaginationParams) {
  return {
    skip: params.skip,
    take: params.limit,
  };
}

/**
 * Cursor-based pagination params (for infinite scroll)
 */
export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Parse cursor pagination parameters
 */
export function parseCursorPaginationParams(
  req: Request,
  defaultLimit: number = 20,
  maxLimit: number = 100
): CursorPaginationParams {
  const cursor = req.query.cursor as string | undefined;
  let limit = parseInt(req.query.limit as string) || defaultLimit;

  // Enforce max limit
  limit = Math.min(limit, maxLimit);
  limit = Math.max(1, limit);

  return { cursor, limit };
}

/**
 * Create cursor-based paginated response
 */
export function createCursorPaginatedResponse<T extends { id: string }>(
  data: T[],
  limit: number
): CursorPaginatedResponse<T> {
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    data: items,
    nextCursor,
    hasMore,
  };
}
