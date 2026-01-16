/**
 * Prometheus Metrics Collection
 *
 * Comprehensive metrics collection for monitoring and observability
 */

import { Counter, Histogram, Gauge, Registry } from 'prom-client';
import { logger } from '../utils/logger.js';

/**
 * Metrics registry
 */
export const metricsRegistry = new Registry();

/**
 * HTTP request duration histogram
 */
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

/**
 * HTTP requests total counter
 */
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});

/**
 * Blockchain operations counter
 */
export const blockchainOperations = new Counter({
  name: 'blockchain_operations_total',
  help: 'Total number of blockchain operations',
  labelNames: ['operation', 'status', 'contract'],
  registers: [metricsRegistry],
});

/**
 * Transaction duration histogram
 */
export const transactionDuration = new Histogram({
  name: 'transaction_duration_seconds',
  help: 'Duration of blockchain transactions in seconds',
  labelNames: ['operation', 'contract', 'status'],
  buckets: [0.5, 1, 2, 5, 10, 30, 60, 120, 300, 600],
  registers: [metricsRegistry],
});

/**
 * Active connections gauge
 */
export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  labelNames: ['type'], // websocket, database, etc
  registers: [metricsRegistry],
});

/**
 * Database query duration histogram
 */
export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

/**
 * Cache operations counter
 */
export const cacheOperations = new Counter({
  name: 'cache_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'status'], // hit, miss, set, delete
  registers: [metricsRegistry],
});

/**
 * Error counter
 */
export const errorsTotal = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity'], // error type, severity (low, medium, high, critical)
  registers: [metricsRegistry],
});

/**
 * Gas price gauge
 */
export const gasPrice = new Gauge({
  name: 'gas_price_gwei',
  help: 'Current gas price in gwei',
  registers: [metricsRegistry],
});

/**
 * Token price gauge
 */
export const tokenPrice = new Gauge({
  name: 'token_price_usd',
  help: 'Token price in USD',
  labelNames: ['symbol'],
  registers: [metricsRegistry],
});

/**
 * Trading volume counter
 */
export const tradingVolume = new Counter({
  name: 'trading_volume_total',
  help: 'Total trading volume',
  labelNames: ['token_symbol', 'currency'],
  registers: [metricsRegistry],
});

/**
 * User activity gauge
 */
export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
  labelNames: ['timeframe'], // 1h, 24h, 7d, 30d
  registers: [metricsRegistry],
});

/**
 * System metrics
 */
export const systemMetrics = {
  memoryUsage: new Gauge({
    name: 'system_memory_usage_bytes',
    help: 'System memory usage in bytes',
    registers: [metricsRegistry],
  }),

  cpuUsage: new Gauge({
    name: 'system_cpu_usage_percent',
    help: 'System CPU usage percentage',
    registers: [metricsRegistry],
  }),

  diskUsage: new Gauge({
    name: 'system_disk_usage_bytes',
    help: 'System disk usage in bytes',
    labelNames: ['mount'],
    registers: [metricsRegistry],
  }),
};

/**
 * Rate limit metrics
 */
export const rateLimitMetrics = {
  requests: new Counter({
    name: 'rate_limit_requests_total',
    help: 'Total number of rate limit requests',
    labelNames: ['identifier', 'status'], // allowed, denied
    registers: [metricsRegistry],
  }),

  current: new Gauge({
    name: 'rate_limit_current',
    help: 'Current request count for rate limit',
    labelNames: ['identifier'],
    registers: [metricsRegistry],
  }),
};

/**
 * WebSocket metrics
 */
export const websocketMetrics = {
  connections: new Gauge({
    name: 'websocket_connections',
    help: 'Number of active WebSocket connections',
    labelNames: ['path'],
    registers: [metricsRegistry],
  }),

  messages: new Counter({
    name: 'websocket_messages_total',
    help: 'Total number of WebSocket messages',
    labelNames: ['path', 'direction'], // inbound, outbound
    registers: [metricsRegistry],
  }),

  errors: new Counter({
    name: 'websocket_errors_total',
    help: 'Total number of WebSocket errors',
    labelNames: ['path', 'error_type'],
    registers: [metricsRegistry],
  }),
};

/**
 * Metrics collector class
 */
export class MetricsCollector {
  private registry: Registry;

  constructor(registry: Registry = metricsRegistry) {
    this.registry = registry;
  }

  /**
   * Record HTTP request
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number
  ): void {
    httpRequestsTotal.labels(method, route, statusCode.toString()).inc();
    httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration / 1000); // Convert ms to seconds
  }

  /**
   * Record blockchain operation
   */
  recordBlockchainOperation(
    operation: string,
    contract: string,
    status: string
  ): void {
    blockchainOperations.labels(operation, status, contract).inc();
  }

  /**
   * Record transaction
   */
  recordTransaction(
    operation: string,
    contract: string,
    status: string,
    duration: number
  ): void {
    blockchainOperations.labels(operation, status, contract).inc();
    transactionDuration
      .labels(operation, contract, status)
      .observe(duration / 1000); // Convert ms to seconds
  }

  /**
   * Record database query
   */
  recordDatabaseQuery(
    operation: string,
    table: string,
    duration: number
  ): void {
    databaseQueryDuration.labels(operation, table).observe(duration / 1000);
  }

  /**
   * Record cache operation
   */
  recordCacheOperation(operation: string, status: string): void {
    cacheOperations.labels(operation, status).inc();
  }

  /**
   * Record error
   */
  recordError(type: string, severity: string): void {
    errorsTotal.labels(type, severity).inc();
  }

  /**
   * Update gas price
   */
  updateGasPrice(gwei: number): void {
    gasPrice.set(gwei);
  }

  /**
   * Update token price
   */
  updateTokenPrice(symbol: string, priceUsd: number): void {
    tokenPrice.labels(symbol).set(priceUsd);
  }

  /**
   * Record trading volume
   */
  recordTradingVolume(symbol: string, currency: string, amount: number): void {
    tradingVolume.labels(symbol, currency).inc(amount);
  }

  /**
   * Update active users
   */
  updateActiveUsers(timeframe: string, count: number): void {
    activeUsers.labels(timeframe).set(count);
  }

  /**
   * Update system metrics
   */
  updateSystemMetrics(): void {
    const usage = process.memoryUsage();

    systemMetrics.memoryUsage.set(usage.heapUsed);

    // CPU usage would need additional instrumentation
    // For now, we can track it externally via Node.js metrics
  }

  /**
   * Increment active connections
   */
  incrementConnections(type: string): void {
    activeConnections.labels(type).inc();
  }

  /**
   * Decrement active connections
   */
  decrementConnections(type: string): void {
    activeConnections.labels(type).dec();
  }

  /**
   * Record rate limit request
   */
  recordRateLimitRequest(identifier: string, status: string): void {
    rateLimitMetrics.requests.labels(identifier, status).inc();
  }

  /**
   * Update rate limit current
   */
  updateRateLimitCurrent(identifier: string, count: number): void {
    rateLimitMetrics.current.labels(identifier).set(count);
  }

  /**
   * Record WebSocket connection
   */
  recordWebSocketConnection(path: string, connected: boolean): void {
    if (connected) {
      websocketMetrics.connections.labels(path).inc();
    } else {
      websocketMetrics.connections.labels(path).dec();
    }
  }

  /**
   * Record WebSocket message
   */
  recordWebSocketMessage(path: string, direction: string): void {
    websocketMetrics.messages.labels(path, direction).inc();
  }

  /**
   * Record WebSocket error
   */
  recordWebSocketError(path: string, errorType: string): void {
    websocketMetrics.errors.labels(path, errorType).inc();
  }

  /**
   * Get metrics as Prometheus format
   */
  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.registry.reset();
    logger.info('Metrics reset');
  }

  /**
   * Get metrics as JSON
   */
  async getMetricsAsJSON(): Promise<Record<string, any>> {
    const metrics = await this.registry.getMetricsAsJSON();

    return metrics.reduce((acc, metric) => {
      acc[metric.name] = metric;
      return acc;
    }, {} as Record<string, any>);
  }
}

/**
 * Create metrics collector instance
 */
export function createMetricsCollector(
  registry?: Registry
): MetricsCollector {
  return new MetricsCollector(registry);
}

/**
 * Middleware for HTTP metrics
 */
export function metricsMiddleware(collector: MetricsCollector) {
  return async (
    request: {
      method?: string;
      route?: string;
      url?: string;
    },
    response?: {
      statusCode?: number;
    },
    err?: any
  ) => {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      const method = request.method || 'UNKNOWN';
      const route = request.route?.path || request.url || 'unknown';
      const statusCode = response?.statusCode || 500;

      collector.recordHttpRequest(method, route, statusCode, duration);

      // Record error if present
      if (err) {
        collector.recordError('http_request', 'high');
      }
    };
  };
}

/**
 * Start system metrics collection
 */
export function startSystemMetricsCollection(
  collector: MetricsCollector,
  interval: number = 60000 // 1 minute
): NodeJS.Timeout {
  logger.info({ interval }, 'Starting system metrics collection');

  return setInterval(() => {
    collector.updateSystemMetrics();
  }, interval);
}

/**
 * Express middleware for metrics endpoint
 */
export function metricsEndpoint(collector: MetricsCollector) {
  return async (req: any, res: any) => {
    try {
      res.set('Content-Type', 'text/plain');
      res.send(await collector.getMetrics());
    } catch (error) {
      logger.error('Failed to get metrics', error);
      res.status(500).send('Failed to collect metrics');
    }
  };
}

/**
 * Fastify plugin for metrics
 */
export async function fastifyMetricsPlugin(
  fastify: any,
  options: {
    collector: MetricsCollector;
    endpoint?: string;
  }
) {
  const { collector, endpoint = '/metrics' } = options;

  // Register metrics endpoint
  fastify.get(endpoint, async (request: any, reply: any) => {
    reply.type('text/plain');
    return await collector.getMetrics();
  });

  // Add request hooks
  fastify.addHook('onRequest', (request: any, reply: any, done) => {
    request.startTime = Date.now();
    done();
  });

  fastify.addHook('onResponse', async (request: any, reply: any, done) => {
    const duration = Date.now() - request.startTime;
    const method = request.raw.method;
    const route = request.routeOptions?.url || request.url || 'unknown';
    const statusCode = reply.statusCode;

    collector.recordHttpRequest(method, route, statusCode, duration);
    done();
  });

  logger.info({ endpoint }, 'Metrics endpoint registered');
}
