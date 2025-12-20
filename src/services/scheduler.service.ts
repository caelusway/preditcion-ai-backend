import { matchSyncService } from './match-sync.service';
import { couponService } from './coupon.service';
import { logger } from '../lib/logger';
import { env } from '../config/env';

/**
 * Scheduler service for automated sync tasks
 * Uses setInterval for scheduling since we're keeping dependencies minimal
 */
export class SchedulerService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Sync interval in milliseconds (default: 6 hours)
  private readonly SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.syncInterval) {
      logger.warn('Scheduler already running');
      return;
    }

    logger.info('Starting match sync scheduler...');

    // Run initial sync after 1 minute (give time for app to fully start)
    setTimeout(() => {
      this.runSync();
    }, 60 * 1000);

    // Schedule recurring sync
    this.syncInterval = setInterval(() => {
      this.runSync();
    }, this.SYNC_INTERVAL_MS);

    logger.info({
      intervalHours: this.SYNC_INTERVAL_MS / (60 * 60 * 1000),
    }, 'Scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Scheduler stopped');
    }
  }

  /**
   * Run sync task
   */
  private async runSync(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Sync already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    logger.info('Starting scheduled match sync...');

    try {
      const result = await matchSyncService.syncAllMatches();
      logger.info({
        fixtures: result.fixtures,
        finished: result.finished,
        odds: result.odds,
      }, 'Scheduled sync completed successfully');

      // Update coupon results after syncing finished matches
      const couponResult = await couponService.updateAllCouponResults();
      logger.info({
        selectionsUpdated: couponResult.selectionsUpdated,
        couponsUpdated: couponResult.couponsUpdated,
      }, 'Coupon results updated');
    } catch (error) {
      logger.error({ error }, 'Scheduled sync failed');
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manually trigger a sync
   */
  async triggerSync(): Promise<{
    fixtures: { processed: number; failed: number };
    finished: { processed: number; failed: number };
    odds: { processed: number; failed: number };
    coupons: { selectionsUpdated: number; couponsUpdated: number };
  }> {
    if (this.isRunning) {
      throw new Error('Sync already in progress');
    }

    this.isRunning = true;
    try {
      const result = await matchSyncService.syncAllMatches();

      // Update coupon results after syncing finished matches
      const couponResult = await couponService.updateAllCouponResults();

      return {
        ...result,
        coupons: couponResult,
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Check if sync is currently running
   */
  isSyncRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get scheduler status
   */
  async getStatus(): Promise<{
    isSchedulerRunning: boolean;
    isSyncRunning: boolean;
    lastSync: any;
    nextSyncIn: string;
  }> {
    const lastSync = await matchSyncService.getLastSyncStatus();

    return {
      isSchedulerRunning: this.syncInterval !== null,
      isSyncRunning: this.isRunning,
      lastSync,
      nextSyncIn: this.syncInterval ? `${this.SYNC_INTERVAL_MS / (60 * 60 * 1000)} hours` : 'Not scheduled',
    };
  }
}

export const schedulerService = new SchedulerService();
