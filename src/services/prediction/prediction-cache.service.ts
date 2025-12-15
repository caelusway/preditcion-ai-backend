import { CompletePrediction, CachedPrediction } from '../../types/prediction.types';
import { logger } from '../../lib/logger';

export class PredictionCacheService {
  private cache: Map<string, CachedPrediction> = new Map();
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Get cached prediction for a match
   */
  get(matchId: string): CompletePrediction | null {
    const cached = this.cache.get(matchId);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(matchId);
      logger.debug({ matchId }, 'Cache expired, removed');
      return null;
    }

    logger.debug({ matchId }, 'Cache hit');
    return cached.prediction;
  }

  /**
   * Store prediction in cache
   */
  set(matchId: string, prediction: CompletePrediction, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.DEFAULT_TTL);

    this.cache.set(matchId, {
      prediction,
      createdAt: Date.now(),
      expiresAt,
    });

    logger.debug({ matchId, expiresAt: new Date(expiresAt) }, 'Cached prediction');
  }

  /**
   * Invalidate cache for a match
   */
  invalidate(matchId: string): void {
    this.cache.delete(matchId);
    logger.debug({ matchId }, 'Cache invalidated');
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    logger.info('Prediction cache cleared');
  }

  /**
   * Calculate dynamic TTL based on match kickoff time
   * Closer to match = shorter TTL (more frequent updates)
   */
  calculateTTL(matchKickoff: Date): number {
    const now = new Date();
    const hoursUntilMatch = (matchKickoff.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilMatch <= 0) {
      // Match started or finished - very short cache
      return 2 * 60 * 1000; // 2 minutes
    }
    if (hoursUntilMatch <= 2) {
      // Less than 2 hours - short cache
      return 5 * 60 * 1000; // 5 minutes
    }
    if (hoursUntilMatch <= 6) {
      // 2-6 hours - medium cache
      return 15 * 60 * 1000; // 15 minutes
    }
    if (hoursUntilMatch <= 24) {
      // 6-24 hours - standard cache
      return 30 * 60 * 1000; // 30 minutes
    }
    // More than 24 hours - long cache
    return 60 * 60 * 1000; // 1 hour
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; entries: Array<{ matchId: string; expiresIn: number }> } {
    const entries: Array<{ matchId: string; expiresIn: number }> = [];
    const now = Date.now();

    for (const [matchId, cached] of this.cache.entries()) {
      entries.push({
        matchId,
        expiresIn: Math.max(0, Math.round((cached.expiresAt - now) / 1000)),
      });
    }

    return {
      size: this.cache.size,
      entries,
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [matchId, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(matchId);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug({ removed }, 'Cleaned up expired cache entries');
    }

    return removed;
  }
}

export const predictionCacheService = new PredictionCacheService();
