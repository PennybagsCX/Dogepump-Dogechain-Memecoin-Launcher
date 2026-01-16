/**
 * Network Health Monitor
 *
 * Monitors RPC endpoint health, latency, and reliability
 * Provides automatic failover to backup RPCs
 */

import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';

/**
 * RPC endpoint configuration
 */
export interface RPCEndpoint {
  url: string;
  name?: string;
  priority: number; // Lower number = higher priority
  enabled: boolean;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  url: string;
  healthy: boolean;
  latency: number; // Response time in milliseconds
  blockNumber?: bigint;
  error?: string;
  timestamp: number;
}

/**
 * RPC endpoint health status
 */
export interface EndpointHealth {
  url: string;
  name?: string;
  healthy: boolean;
  latency: number;
  lastCheck: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  totalChecks: number;
  totalFailures: number;
  totalSuccesses: number;
  averageLatency: number;
}

/**
 * Network health status
 */
export interface NetworkHealthStatus {
  healthy: boolean;
  currentEndpoint: string;
  availableEndpoints: number;
  totalEndpoints: number;
  endpoints: EndpointHealth[];
  lastSwitch: number;
  switches: number;
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  // How often to check health (milliseconds)
  checkInterval: number;

  // Timeout for health check (milliseconds)
  checkTimeout: number;

  // Number of consecutive failures before marking unhealthy
  failureThreshold: number;

  // Number of consecutive successes before marking healthy
  successThreshold: number;

  // Maximum average latency before switching (milliseconds)
  maxLatency: number;

  // Whether to automatically switch to healthier endpoints
  autoSwitch: boolean;

  // Whether to use adaptive checking (check more frequently when unhealthy)
  adaptiveChecking: boolean;
}

/**
 * Default health check configuration
 */
export const DEFAULT_HEALTH_CONFIG: HealthCheckConfig = {
  checkInterval: 60000, // 1 minute
  checkTimeout: 10000, // 10 seconds
  failureThreshold: 3,
  successThreshold: 2,
  maxLatency: 5000, // 5 seconds
  autoSwitch: true,
  adaptiveChecking: true,
};

/**
 * Network health monitor
 */
export class NetworkHealthMonitor {
  private endpoints: RPCEndpoint[];
  private health: Map<string, EndpointHealth> = new Map();
  private currentIndex: number = 0;
  private config: HealthCheckConfig;
  private checkInterval?: NodeJS.Timeout;
  private lastSwitch: number = 0;
  private switches: number = 0;

  constructor(
    endpoints: RPCEndpoint[],
    config: HealthCheckConfig = DEFAULT_HEALTH_CONFIG
  ) {
    // Sort by priority (lower number = higher priority)
    this.endpoints = endpoints
      .filter(e => e.enabled)
      .sort((a, b) => a.priority - b.priority);

    this.config = config;

    // Initialize health tracking
    for (const endpoint of this.endpoints) {
      this.health.set(endpoint.url, {
        url: endpoint.url,
        name: endpoint.name,
        healthy: false,
        latency: 0,
        lastCheck: 0,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        totalChecks: 0,
        totalFailures: 0,
        totalSuccesses: 0,
        averageLatency: 0,
      });
    }
  }

  /**
   * Perform health check on a single endpoint
   */
  private async checkEndpoint(endpoint: RPCEndpoint): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const provider = new ethers.JsonRpcProvider(endpoint.url, {
        staticNetwork: true, // Don't auto-detect network
      });

      // Set timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), this.config.checkTimeout);
      });

      // Get block number with timeout
      const blockNumber = await Promise.race([
        provider.getBlockNumber(),
        timeoutPromise,
      ]) as bigint;

      const latency = Date.now() - startTime;

      return {
        url: endpoint.url,
        healthy: true,
        latency,
        blockNumber,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;

      return {
        url: endpoint.url,
        healthy: false,
        latency,
        error: error?.message || 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Update health status for an endpoint
   */
  private updateHealth(result: HealthCheckResult): void {
    const current = this.health.get(result.url);
    if (!current) return;

    const updated: EndpointHealth = {
      ...current,
      healthy: result.healthy,
      latency: result.latency,
      lastCheck: result.timestamp,
      totalChecks: current.totalChecks + 1,
    };

    if (result.healthy) {
      updated.consecutiveSuccesses++;
      updated.consecutiveFailures = 0;
      updated.totalSuccesses++;
    } else {
      updated.consecutiveFailures++;
      updated.consecutiveSuccesses = 0;
      updated.totalFailures++;
    }

    // Update average latency
    const totalLatency = current.averageLatency * (current.totalChecks - 1) + result.latency;
    updated.averageLatency = totalLatency / updated.totalChecks;

    this.health.set(result.url, updated);
  }

  /**
   * Get current provider for the best endpoint
   */
  async getProvider(): Promise<ethers.Provider> {
    const endpoint = await this.selectBestEndpoint();

    logger.info({ url: endpoint.url }, 'Using RPC endpoint');

    return new ethers.JsonRpcProvider(endpoint.url, {
      staticNetwork: true,
    });
  }

  /**
   * Select the best available endpoint
   */
  private async selectBestEndpoint(): Promise<RPCEndpoint> {
    const available = this.endpoints.filter(e => {
      const health = this.health.get(e.url);
      return health &&
        health.healthy &&
        health.consecutiveSuccesses >= this.config.successThreshold;
    });

    if (available.length === 0) {
      // No healthy endpoints, use highest priority
      logger.warn('No healthy endpoints, using highest priority');
      return this.endpoints[0];
    }

    // Sort by latency (ascending)
    available.sort((a, b) => {
      const aHealth = this.health.get(a.url)!;
      const bHealth = this.health.get(b.url)!;
      return aHealth.averageLatency - bHealth.averageLatency;
    });

    const best = available[0];

    // Check if we should switch
    if (this.config.autoSwitch && best.url !== this.endpoints[this.currentIndex]?.url) {
      const newIndex = this.endpoints.findIndex(e => e.url === best.url);

      if (newIndex !== -1) {
        logger.info(
          { from: this.endpoints[this.currentIndex].url, to: best.url },
          'Switching RPC endpoint'
        );

        this.currentIndex = newIndex;
        this.lastSwitch = Date.now();
        this.switches++;
      }
    }

    return best;
  }

  /**
   * Perform health check on all endpoints
   */
  async checkAll(): Promise<HealthCheckResult[]> {
    const results = await Promise.all(
      this.endpoints.map(endpoint => this.checkEndpoint(endpoint))
    );

    for (const result of results) {
      this.updateHealth(result);
    }

    return results;
  }

  /**
   * Get health status for all endpoints
   */
  getStatus(): NetworkHealthStatus {
    const endpoints = Array.from(this.health.values());

    const currentHealth = this.health.get(this.endpoints[this.currentIndex]?.url);

    return {
      healthy: currentHealth?.healthy || false,
      currentEndpoint: this.endpoints[this.currentIndex]?.url || '',
      availableEndpoints: endpoints.filter(e => e.healthy).length,
      totalEndpoints: this.endpoints.length,
      endpoints,
      lastSwitch: this.lastSwitch,
      switches: this.switches,
    };
  }

  /**
   * Start automatic health monitoring
   */
  start(): void {
    if (this.checkInterval) {
      this.stop(); // Stop existing if any
    }

    logger.info('Starting network health monitoring');

    const performChecks = async () => {
      try {
        const results = await this.checkAll();

        const healthy = results.filter(r => r.healthy).length;
        const total = results.length;

        logger.info(
          { healthy, total },
          'Health check completed'
        );

        // Adaptive checking: check more frequently if unhealthy
        if (this.config.adaptiveChecking) {
          this.scheduleNextCheck(healthy < total);
        }
      } catch (error) {
        logger.error('Health check failed', error);
        this.scheduleNextCheck(true); // Check more frequently on error
      }
    };

    // Initial check
    performChecks();

    // Set up recurring checks
    this.checkInterval = setInterval(performChecks, this.config.checkInterval);
  }

  /**
   * Schedule next check (adaptive)
   */
  private scheduleNextCheck(unhealthy: boolean): void {
    // This is a placeholder - the actual interval is managed by setInterval
    // In a more sophisticated implementation, we could adjust the interval dynamically
    if (this.config.adaptiveChecking && unhealthy) {
      logger.debug('Unhealthy endpoints detected, will check more frequently');
    }
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
      logger.info('Stopped network health monitoring');
    }
  }

  /**
   * Get health of a specific endpoint
   */
  getEndpointHealth(url: string): EndpointHealth | undefined {
    return this.health.get(url);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<HealthCheckConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart with new configuration if running
    if (this.checkInterval) {
      this.stop();
      this.start();
    }
  }

  /**
   * Add new endpoint
   */
  addEndpoint(endpoint: RPCEndpoint): void {
    this.endpoints.push(endpoint);
    this.endpoints.sort((a, b) => a.priority - b.priority);

    this.health.set(endpoint.url, {
      url: endpoint.url,
      name: endpoint.name,
      healthy: false,
      latency: 0,
      lastCheck: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      totalChecks: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      averageLatency: 0,
    });

    logger.info({ url: endpoint.url }, 'Added RPC endpoint');
  }

  /**
   * Remove endpoint
   */
  removeEndpoint(url: string): void {
    this.endpoints = this.endpoints.filter(e => e.url !== url);
    this.health.delete(url);

    logger.info({ url }, 'Removed RPC endpoint');
  }
}

/**
 * Create a network health monitor instance
 */
export function createNetworkHealthMonitor(
  endpoints: RPCEndpoint[],
  config?: HealthCheckConfig
): NetworkHealthMonitor {
  return new NetworkHealthMonitor(endpoints, config);
}

/**
 * Quick health check
 */
export async function quickHealthCheck(
  endpoints: string[],
  timeout: number = 5000
): Promise<HealthCheckResult[]> {
  const monitor = new NetworkHealthMonitor(
    endpoints.map((url, i) => ({ url, priority: i, enabled: true })),
    { checkInterval: 0, checkTimeout: timeout, failureThreshold: 1, successThreshold: 1, maxLatency: 0, autoSwitch: false, adaptiveChecking: false }
  );

  return await monitor.checkAll();
}
