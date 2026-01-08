/**
 * Sentry Error Tracking Service
 * 
 * Provides error tracking and performance monitoring using Sentry.
 * This service is optional - if Sentry is not configured, errors will be logged to console.
 */

import { logger } from '../utils/logger.js';
import { config } from '../config.js';

// Sentry client type (lazy import to avoid requiring Sentry when not configured)
let sentryClient: any = null;
let sentryAvailable = false;

/**
 * Sentry Service
 * 
 * Provides error tracking and performance monitoring with fallback to console logging
 */
export class SentryService {
  private breadcrumbs: Array<{ category: string; message: string; level: string; timestamp: number }> = [];
  private maxBreadcrumbs = 100;

  /**
   * Initialize Sentry connection
   */
  async initialize(): Promise<void> {
    if (!config.SENTRY.DSN) {
      logger.info('Sentry not configured, using console logging fallback');
      return;
    }

    try {
      // Dynamic import to avoid requiring Sentry when not configured
      const { init, captureException, captureMessage, withScope } = await import('@sentry/node');

      init({
        dsn: config.SENTRY.DSN,
        environment: config.NODE_ENV,
        release: process.env.npm_package_version || '1.0.0',
        tracesSampleRate: config.SENTRY.TRACES_SAMPLE_RATE ? parseFloat(config.SENTRY.TRACES_SAMPLE_RATE) : 0.1,
        profilesSampleRate: config.SENTRY.PROFILES_SAMPLE_RATE ? parseFloat(config.SENTRY.PROFILES_SAMPLE_RATE) : 0.1,
        beforeSend(event, hint) {
          // Filter out sensitive data
          if (event.request) {
            // Remove sensitive headers
            if (event.request.headers) {
              delete event.request.headers['authorization'];
              delete event.request.headers['cookie'];
              delete event.request.headers['x-api-key'];
            }
            // Remove sensitive data from request body
            if (event.request.data) {
              if (event.request.data.password) {
                event.request.data.password = '[REDACTED]';
              }
              if (event.request.data.token) {
                event.request.data.token = '[REDACTED]';
              }
              if (event.request.data.refreshToken) {
                event.request.data.refreshToken = '[REDACTED]';
              }
            }
          }
          return event;
        },
        beforeBreadcrumb(breadcrumb, hint) {
          // Filter sensitive breadcrumbs
          if (breadcrumb.category === 'http' && breadcrumb.data) {
            delete breadcrumb.data['authorization'];
            delete breadcrumb.data['cookie'];
          }
          return breadcrumb;
        },
        integrations: [
          // Add any custom integrations here
        ],
      });

      sentryAvailable = true;
      logger.info('Sentry initialized successfully');
    } catch (error) {
      logger.warn({
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to initialize Sentry, using console logging fallback');
      sentryAvailable = false;
    }
  }

  /**
   * Capture exception
   */
  captureException(error: Error | unknown, context?: Record<string, any>): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    if (sentryAvailable && sentryClient) {
      try {
        const { captureException } = require('@sentry/node');
        captureException(errorObj, {
          tags: {
            environment: config.NODE_ENV,
            ...context,
          },
          extra: context,
        });
      } catch (err) {
        logger.error({ error: err }, 'Failed to capture exception in Sentry');
      }
    } else {
      logger.error({
        error: errorObj.message,
        stack: errorObj.stack,
        context,
      }, 'Exception captured');
    }
  }

  /**
   * Capture message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>): void {
    if (sentryAvailable && sentryClient) {
      try {
        const { captureMessage } = require('@sentry/node');
        captureMessage(message, level, {
          tags: {
            environment: config.NODE_ENV,
            ...context,
          },
          extra: context,
        });
      } catch (err) {
        logger.error({ error: err }, 'Failed to capture message in Sentry');
      }
    } else {
      const logMethod = level === 'error' ? logger.error : level === 'warning' ? logger.warn : logger.info;
      logMethod({ ...context, message }, message);
    }
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(category: string, message: string, level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, any>): void {
    const breadcrumb = {
      category,
      message,
      level,
      timestamp: Date.now(),
    };

    // Add to internal breadcrumbs
    this.breadcrumbs.push(breadcrumb);
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }

    if (sentryAvailable && sentryClient) {
      try {
        const { addBreadcrumb } = require('@sentry/node');
        addBreadcrumb({
          category,
          message,
          level,
          data,
          timestamp: breadcrumb.timestamp / 1000,
        });
      } catch (err) {
        logger.error({ error: err }, 'Failed to add breadcrumb in Sentry');
      }
    } else {
      logger.debug({ category, message, level, data }, 'Breadcrumb added');
    }
  }

  /**
   * Set user context
   */
  setUser(user: { id: string; email?: string; username?: string }): void {
    if (sentryAvailable && sentryClient) {
      try {
        const { setUser } = require('@sentry/node');
        setUser({
          id: user.id,
          email: user.email,
          username: user.username,
        });
      } catch (err) {
        logger.error({ error: err }, 'Failed to set user in Sentry');
      }
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (sentryAvailable && sentryClient) {
      try {
        const { setUser } = require('@sentry/node');
        setUser(null);
      } catch (err) {
        logger.error({ error: err }, 'Failed to clear user in Sentry');
      }
    }
  }

  /**
   * Set tag
   */
  setTag(key: string, value: string): void {
    if (sentryAvailable && sentryClient) {
      try {
        const { setTag } = require('@sentry/node');
        setTag(key, value);
      } catch (err) {
        logger.error({ error: err }, 'Failed to set tag in Sentry');
      }
    }
  }

  /**
   * Set context
   */
  setContext(key: string, context: Record<string, any>): void {
    if (sentryAvailable && sentryClient) {
      try {
        const { setContext } = require('@sentry/node');
        setContext(key, context);
      } catch (err) {
        logger.error({ error: err }, 'Failed to set context in Sentry');
      }
    }
  }

  /**
   * Start transaction for performance monitoring
   */
  startTransaction(name: string, op: string): any {
    if (sentryAvailable && sentryClient) {
      try {
        const { startSpan } = require('@sentry/node');
        return startSpan({
          name,
          op,
        });
      } catch (err) {
        logger.error({ error: err }, 'Failed to start transaction in Sentry');
        return null;
      }
    }
    return null;
  }

  /**
   * Set transaction status
   */
  setTransactionStatus(transaction: any, status: 'ok' | 'cancelled' | 'unknown' | 'internal_error' | 'unauthenticated' | 'permission_denied' | 'not_found' | 'already_exists' | 'invalid_argument' | 'deadline_exceeded' | 'unavailable' | 'resource_exhausted'): void {
    if (transaction) {
      try {
        transaction.setStatus({ status });
        transaction.end();
      } catch (err) {
        logger.error({ error: err }, 'Failed to set transaction status in Sentry');
      }
    }
  }

  /**
   * Flush pending events
   */
  async flush(timeoutMs: number = 2000): Promise<boolean> {
    if (sentryAvailable && sentryClient) {
      try {
        const { flush } = require('@sentry/node');
        await flush(timeoutMs);
        return true;
      } catch (err) {
        logger.error({ error: err }, 'Failed to flush Sentry');
        return false;
      }
    }
    return true;
  }

  /**
   * Get Sentry availability
   */
  isAvailable(): boolean {
    return sentryAvailable;
  }

  /**
   * Get breadcrumbs count
   */
  getBreadcrumbsCount(): number {
    return this.breadcrumbs.length;
  }

  /**
   * Clear breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }
}

// Export singleton instance
export const sentryService = new SentryService();

// Initialize Sentry service
sentryService.initialize().catch((error) => {
  logger.error({ error }, 'Failed to initialize Sentry service');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await sentryService.flush(2000);
});

process.on('SIGINT', async () => {
  await sentryService.flush(2000);
});
