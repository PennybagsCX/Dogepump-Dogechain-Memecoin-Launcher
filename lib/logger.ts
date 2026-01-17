/**
 * Structured Logging Service
 *
 * Provides environment-aware logging with levels and error tracking.
 * - Development: All logs enabled including debug
 * - Production: Only error and warning logs
 *
 * Errors in production are automatically sent to Sentry for tracking.
 */

// Sentry temporarily disabled for debugging
let Sentry: any = null;
try {
  Sentry = require('@sentry/react');
} catch (e) {
  // Sentry not available
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enableStackTrace: boolean;
}

interface AppContext {
  userId?: string;
  userAgent?: string;
  url?: string;
  route?: string;
  features?: string[];
}

// Development: Debug logs enabled
// Production: Error logs only
const config: LoggerConfig = {
  level: import.meta.env.DEV ? 'debug' : 'error',
  enableStackTrace: import.meta.env.DEV,
};

// Log level hierarchy (higher number = more severe)
const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Application context for Sentry
let appContext: AppContext = {};

/**
 * Initialize application context for error tracking
 * Call this once during app initialization with user/environment info
 */
export function initAppContext(context: AppContext) {
  appContext = context;

  // Set user context in Sentry if available
  if (import.meta.env.PROD && context.userId) {
    Sentry.setUser({
      id: context.userId,
    });
  }
}

/**
 * Update application context dynamically
 */
export function updateAppContext(updates: Partial<AppContext>) {
  appContext = { ...appContext, ...updates };

  // Update Sentry user if userId changed
  if (import.meta.env.PROD && updates.userId) {
    Sentry.setUser({
      id: updates.userId,
    });
  }
}

/**
 * Get current application context
 */
export function getAppContext(): AppContext {
  return { ...appContext };
}

/**
 * Check if a log level should be output based on current configuration
 */
function shouldLog(level: LogLevel): boolean {
  return logLevels[level] >= logLevels[config.level];
}

/**
 * Add breadcrumb for tracking user actions
 * Breadcrumbs appear in Sentry error timeline
 */
function addBreadcrumb(
  category: string,
  message: string,
  level: any = 'info',
  data?: Record<string, any>
) {
  if (import.meta.env.PROD && Sentry) {
    Sentry.addBreadcrumb({
      category,
      message,
      level,
      data: {
        ...data,
        ...appContext,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Enrich Sentry scope with comprehensive context
 */
function enrichScope(scope: any, context: string, extra?: Record<string, any>) {
  // Basic context tag
  scope.setTag('logger_context', context);
  scope.setTag('environment', import.meta.env.MODE);

  // App context
  scope.setContext('application', {
    url: appContext.url || window.location.href,
    route: appContext.route || window.location.pathname,
    userAgent: appContext.userAgent || navigator.userAgent,
    features: appContext.features || [],
  });

  // Extra data
  if (extra) {
    scope.setExtra('context_data', extra);
  }

  // Request info (if available)
  try {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (perfData) {
      scope.setContext('performance', {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        pageLoad: perfData.loadEventEnd - perfData.fetchStart,
      });
    }
  } catch {
    // Ignore performance API errors
  }

  // Memory info (if available)
  if ((performance as any).memory) {
    scope.setContext('memory', {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
    });
  }
}

/**
 * Create custom fingerprint for error grouping
 */
function createFingerprint(context: string, message: string, errorType?: string): string[] {
  const fingerprint = [
    context,
    message.substring(0, 100), // First 100 chars of message
  ];

  if (errorType) {
    fingerprint.push(errorType);
  }

  return fingerprint;
}

/**
 * Structured logger with environment-aware output
 */
export const logger = {
  /**
   * Debug level logging (development only)
   * Use for detailed debugging information
   */
  debug: (context: string, message: string, data?: any) => {
    if (shouldLog('debug')) {
      if (data) {
        console.debug(`[${context}]`, message, data);
      } else {
        console.debug(`[${context}]`, message);
      }

      // Add breadcrumb for tracking
      addBreadcrumb('debug', message, 'debug', data);
    }
  },

  /**
   * Info level logging
   * Use for general informational messages
   */
  info: (context: string, message: string, data?: any) => {
    if (shouldLog('info')) {
      if (data) {
        console.info(`[${context}]`, message, data);
      } else {
        console.info(`[${context}]`, message);
      }

      // Add breadcrumb for tracking
      addBreadcrumb('info', message, 'info', data);
    }
  },

  /**
   * Warning level logging
   * Use for warnings that don't prevent operation
   */
  warn: (context: string, message: string, data?: any) => {
    if (shouldLog('warn')) {
      if (data) {
        console.warn(`[${context}]`, message, data);
      } else {
        console.warn(`[${context}]`, message);
      }

      // Add breadcrumb for tracking warnings
      addBreadcrumb('warning', message, 'warning', data);
    }
  },

  /**
   * Error level logging
   * Use for errors and exceptions
   * In production, sends to Sentry for tracking
   */
  error: (context: string, message: string, error?: Error | any) => {
    if (shouldLog('error')) {
      if (error) {
        console.error(`[${context}]`, message, error);
      } else {
        console.error(`[${context}]`, message);
      }

      // Add error breadcrumb
      addBreadcrumb('error', message, 'error', error);

      // Send to Sentry in production
      if (import.meta.env.PROD && Sentry) {
        if (error instanceof Error) {
          Sentry.withScope((scope: any) => {
            enrichScope(scope, context, { message });
            scope.setLevel('error');

            // Set custom fingerprint for better grouping
            scope.setFingerprint(createFingerprint(context, message, error.name));

            // Add stack trace context
            if (error.stack) {
              scope.setExtra('stack_trace', error.stack);
            }

            Sentry.captureException(error);
          });
        } else if (typeof error === 'object') {
          // For non-Error objects, capture as message with extra data
          Sentry.withScope((scope) => {
            enrichScope(scope, context, { message });
            scope.setLevel('error');
            scope.setExtra('error_object', error);
            scope.setFingerprint(createFingerprint(context, message, 'object'));

            Sentry.captureMessage(message, 'error');
          });
        } else if (typeof error === 'string') {
          Sentry.withScope((scope) => {
            enrichScope(scope, context, { message, errorString: error });
            scope.setLevel('error');
            scope.setFingerprint(createFingerprint(context, message, 'string'));

            Sentry.captureMessage(`${message}: ${error}`, 'error');
          });
        } else {
          Sentry.withScope((scope) => {
            enrichScope(scope, context, { message });
            scope.setLevel('error');
            scope.setFingerprint(createFingerprint(context, message, 'unknown'));

            Sentry.captureMessage(message, 'error');
          });
        }
      }
    }
  },
};

/**
 * Create a scoped logger for a specific context
 * Useful for logging in specific components or modules
 *
 * @param context - Context name for all logs from this logger
 * @returns Scoped logger object
 *
 * @example
 * const tokenLogger = createLogger('TOKEN_PAGE');
 * tokenLogger.info('Token loaded', { tokenId: 'abc' });
 */
export function createLogger(context: string) {
  return {
    debug: (message: string, data?: any) => logger.debug(context, message, data),
    info: (message: string, data?: any) => logger.info(context, message, data),
    warn: (message: string, data?: any) => logger.warn(context, message, data),
    error: (message: string, error?: Error | any) => logger.error(context, message, error),
  };
}

/**
 * Log user action for analytics
 *
 * @param action - Action name (e.g., 'token_view', 'trade_execute')
 * @param data - Additional data about the action
 */
export function logAction(action: string, data?: Record<string, any>) {
  logger.info('USER_ACTION', action, data);
  addBreadcrumb('user_action', action, 'info', data);
}

/**
 * Log performance metrics
 *
 * @param operation - Operation name
 * @param duration - Duration in milliseconds
 */
export function logPerformance(operation: string, duration: number) {
  if (duration > 1000) {
    // Warn if operation takes more than 1 second
    logger.warn('PERFORMANCE', `Slow operation: ${operation} took ${duration}ms`, { operation, duration });
  } else {
    logger.debug('PERFORMANCE', `${operation} completed in ${duration}ms`, { operation, duration });
  }

  // Track slow operations in Sentry
  if (import.meta.env.PROD && duration > 2000) {
    Sentry.captureMessage(`Slow operation: ${operation} (${duration.toFixed(0)}ms)`, 'warning');
  }
}

/**
 * Measure and log async operation performance
 *
 * @param name - Operation name
 * @param operation - Async function to measure
 * @returns Result of the operation
 */
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await operation();
    const duration = performance.now() - start;
    logPerformance(name, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error(name, `Operation failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Log component render performance
 * Use in useEffect to measure render times
 *
 * @param componentName - Name of the component
 * @param renderStart - Start time from performance.now()
 */
export function logRenderPerformance(componentName: string, renderStart: number) {
  const renderTime = performance.now() - renderStart;

  if (renderTime > 16) {
    // Slower than 60fps
    logger.warn('RENDER', `Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`, {
      component: componentName,
      renderTime,
    });
  } else {
    logger.debug('RENDER', `${componentName} rendered in ${renderTime.toFixed(2)}ms`, {
      component: componentName,
      renderTime,
    });
  }

  // Track performance in Sentry
  if (import.meta.env.PROD && renderTime > 100) {
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `Component render: ${componentName}`,
      data: { renderTime },
      level: 'warning',
    });
  }
}

/**
 * Log Web3 interaction
 *
 * @param action - Web3 action (connect_wallet, sign_transaction, etc.)
 * @param data - Additional data
 */
export function logWeb3Action(action: string, data?: Record<string, any>) {
  logger.info('WEB3', action, data);
  addBreadcrumb('web3', action, 'info', data);
}

/**
 * Log API call
 *
 * @param endpoint - API endpoint
 * @param method - HTTP method
 * @param duration - Call duration in ms
 */
export function logApiCall(endpoint: string, method: string, duration: number) {
  logger.debug('API', `${method} ${endpoint} - ${duration.toFixed(0)}ms`, { endpoint, method, duration });
  addBreadcrumb('api', `${method} ${endpoint}`, 'info', { duration });
}

/**
 * Log transaction
 *
 * @param type - Transaction type (buy, sell, launch)
 * @param data - Transaction data
 */
export function logTransaction(type: string, data: Record<string, any>) {
  logger.info('TRANSACTION', `Transaction: ${type}`, data);
  addBreadcrumb('transaction', type, 'info', data);
}

/**
 * Clear user context on logout
 */
export function clearUserContext() {
  appContext = {};
  if (import.meta.env.PROD) {
    Sentry.setUser(null);
  }
}

/**
 * Set release version for Sentry
 *
 * @param version - Application version
 */
export function setRelease(version: string) {
  if (import.meta.env.PROD) {
    Sentry.setRelease(version);
  }
}

/**
 * Set environment tag for Sentry
 *
 * @param environment - Environment name
 */
export function setEnvironment(environment: string) {
  if (import.meta.env.PROD) {
    Sentry.setEnvironment(environment);
  }
}
