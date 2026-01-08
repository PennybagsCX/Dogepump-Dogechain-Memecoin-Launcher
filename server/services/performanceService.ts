/**
 * Performance Monitoring Service
 * 
 * Provides performance monitoring and metrics collection.
 * This service tracks API response times, database query times, and custom metrics.
 */

import { logger } from '../utils/logger.js';
import { sentryService } from './sentryService.js';

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  activeConnections: number;
  databaseQueryCount: number;
  databaseAverageQueryTime: number;
}

/**
 * Performance Service
 */
export class PerformanceService {
  private metrics: Map<string, number[]> = new Map();
  private requestCount: number = 0;
  private errorCount: number = 0;
  private activeConnections: number = 0;
  private databaseQueryTimes: number[] = [];
  private maxStoredMetrics = 1000;

  /**
   * Record request duration
   */
  recordRequest(endpoint: string, durationMs: number, error: boolean = false): void {
    this.requestCount++;
    if (error) {
      this.errorCount++;
    }

    // Store metric for endpoint
    const endpointMetrics = this.metrics.get(endpoint) || [];
    endpointMetrics.push(durationMs);
    
    // Keep only last N measurements
    if (endpointMetrics.length > this.maxStoredMetrics) {
      endpointMetrics.shift();
    }
    
    this.metrics.set(endpoint, endpointMetrics);

    // Log slow requests
    if (durationMs > 1000) {
      logger.warn({
        endpoint,
        durationMs,
      }, 'Slow request detected');
      
      sentryService.captureMessage('Slow request detected', 'warning', {
        endpoint,
        durationMs,
      });
    }
  }

  /**
   * Record database query duration
   */
  recordDatabaseQuery(query: string, durationMs: number): void {
    this.databaseQueryTimes.push(durationMs);
    
    // Keep only last N measurements
    if (this.databaseQueryTimes.length > this.maxStoredMetrics) {
      this.databaseQueryTimes.shift();
    }

    // Log slow queries
    if (durationMs > 100) {
      logger.warn({
        query: query.substring(0, 200),
        durationMs,
      }, 'Slow database query detected');
      
      sentryService.captureMessage('Slow database query detected', 'warning', {
        query: query.substring(0, 200),
        durationMs,
      });
    }
  }

  /**
   * Increment active connections
   */
  incrementActiveConnections(): void {
    this.activeConnections++;
  }

  /**
   * Decrement active connections
   */
  decrementActiveConnections(): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) {
      return 0;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Calculate average
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    const allDurations = Array.from(this.metrics.values()).flat();
    
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      averageResponseTime: this.calculateAverage(allDurations),
      p50ResponseTime: this.calculatePercentile(allDurations, 50),
      p95ResponseTime: this.calculatePercentile(allDurations, 95),
      p99ResponseTime: this.calculatePercentile(allDurations, 99),
      activeConnections: this.activeConnections,
      databaseQueryCount: this.databaseQueryTimes.length,
      databaseAverageQueryTime: this.calculateAverage(this.databaseQueryTimes),
    };
  }

  /**
   * Get metrics for specific endpoint
   */
  getEndpointMetrics(endpoint: string): {
    count: number;
    average: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const durations = this.metrics.get(endpoint);
    if (!durations || durations.length === 0) {
      return null;
    }

    return {
      count: durations.length,
      average: this.calculateAverage(durations),
      p50: this.calculatePercentile(durations, 50),
      p95: this.calculatePercentile(durations, 95),
      p99: this.calculatePercentile(durations, 99),
    };
  }

  /**
   * Get error rate
   */
  getErrorRate(): number {
    if (this.requestCount === 0) {
      return 0;
    }
    return (this.errorCount / this.requestCount) * 100;
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics.clear();
    this.requestCount = 0;
    this.errorCount = 0;
    this.databaseQueryTimes = [];
    logger.info('Performance metrics reset');
  }

  /**
   * Log current metrics
   */
  logMetrics(): void {
    const metrics = this.getMetrics();

    const errorRate = metrics.requestCount > 0
      ? (metrics.errorCount / metrics.requestCount) * 100
      : 0;

    logger.info({
      requestCount: metrics.requestCount,
      errorCount: metrics.errorCount,
      errorRate: `${errorRate.toFixed(2)}%`,
      averageResponseTime: `${metrics.averageResponseTime.toFixed(2)}ms`,
      p50ResponseTime: `${metrics.p50ResponseTime.toFixed(2)}ms`,
      p95ResponseTime: `${metrics.p95ResponseTime.toFixed(2)}ms`,
      p99ResponseTime: `${metrics.p99ResponseTime.toFixed(2)}ms`,
      activeConnections: metrics.activeConnections,
      databaseQueryCount: metrics.databaseQueryCount,
      databaseAverageQueryTime: `${metrics.databaseAverageQueryTime.toFixed(2)}ms`,
    }, 'Performance metrics');
  }

  /**
   * Create performance monitoring middleware
   */
  createMiddleware() {
    return async (request: any, reply: any, done: any) => {
      const startTime = Date.now();
      this.incrementActiveConnections();

      // Add response listener
      reply.addHook('onSend', async () => {
        const duration = Date.now() - startTime;
        this.recordRequest(request.url, duration, reply.statusCode >= 400);
        this.decrementActiveConnections();
      });

      done();
    };
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();

// Log metrics every 5 minutes
setInterval(() => {
  performanceService.logMetrics();
}, 5 * 60 * 1000);

// Reset metrics every hour
setInterval(() => {
  performanceService.resetMetrics();
}, 60 * 60 * 1000);
