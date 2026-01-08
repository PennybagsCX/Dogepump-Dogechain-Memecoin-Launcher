/**
 * Sentry Client for Frontend Error Tracking
 *
 * Provides error tracking and performance monitoring using Sentry.
 * This service is optional - if Sentry is not configured, errors will be logged to console.
 */

import * as Sentry from '@sentry/browser';
import React from 'react';

// Check if Sentry is configured
const SENTRY_DSN = process.env.SENTRY_DSN || '';
const SENTRY_ENABLED = !!SENTRY_DSN && SENTRY_DSN !== '';

/**
 * Initialize Sentry for frontend
 */
export function initSentry() {
  if (!SENTRY_ENABLED) {
    console.log('Sentry not configured for frontend, using console logging fallback');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '1.0.0',

    // Tracing options
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),

    // Before send callback to filter sensitive data
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

    // Before breadcrumb callback to filter sensitive breadcrumbs
    beforeBreadcrumb(breadcrumb, hint) {
      // Filter sensitive breadcrumbs
      if (breadcrumb.category === 'http' && breadcrumb.data) {
        delete breadcrumb.data['authorization'];
        delete breadcrumb.data['cookie'];
      }
      return breadcrumb;
    },

    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',
  });

  console.log('Sentry initialized for frontend');
}

/**
 * Capture exception
 */
export function captureException(error: Error | unknown, context?: Record<string, any>): void {
  if (SENTRY_ENABLED) {
    Sentry.captureException(error, {
      tags: {
        environment: process.env.NODE_ENV || 'development',
        ...context,
      },
      extra: context,
    });
  } else {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error('Exception captured', {
      error: errorObj.message,
      stack: errorObj.stack,
      context,
    });
  }
}

/**
 * Capture message
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
): void {
  if (SENTRY_ENABLED) {
    Sentry.captureMessage(message, {
      level,
      tags: {
        environment: process.env.NODE_ENV || 'development',
        ...context,
      },
      extra: context,
    });
  } else {
    const logMethod = level === 'error' ? console.error : level === 'warning' ? console.warn : console.info;
    logMethod(message, context);
  }
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
  category: string,
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
): void {
  if (SENTRY_ENABLED) {
    Sentry.addBreadcrumb({
      category,
      message,
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  } else {
    console.debug('Breadcrumb added', { category, message, level, data });
  }
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; username?: string }): void {
  if (SENTRY_ENABLED) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }
}

/**
 * Clear user context
 */
export function clearUser(): void {
  if (SENTRY_ENABLED) {
    Sentry.setUser(null);
  }
}

/**
 * Set tag
 */
export function setTag(key: string, value: string): void {
  if (SENTRY_ENABLED) {
    Sentry.setTag(key, value);
  }
}

/**
 * Set context
 */
export function setContext(key: string, context: Record<string, any>): void {
  if (SENTRY_ENABLED) {
    Sentry.setContext(key, context);
  }
}

/**
 * Start transaction for performance monitoring
 */
export function startTransaction(name: string, op: string): any {
  if (SENTRY_ENABLED) {
    return Sentry.startSpan({ name }, (span) => {
      span?.setAttribute('op', op);
      return span;
    });
  }
  return null;
}

/**
 * Set transaction status
 */
export function setTransactionStatus(
  transaction: any,
  status: 'ok' | 'cancelled' | 'unknown' | 'internal_error' | 'unauthenticated' | 'permission_denied' | 'not_found' | 'already_exists' | 'invalid_argument' | 'deadline_exceeded' | 'unavailable' | 'resource_exhausted'
): void {
  if (transaction) {
    transaction.setStatus({ status });
    transaction.end();
  }
}

/**
 * Flush pending events
 */
export async function flush(timeoutMs: number = 2000): Promise<boolean> {
  if (SENTRY_ENABLED) {
    await Sentry.flush(timeoutMs);
    return true;
  }
  return true;
}

/**
 * Get Sentry availability
 */
export function isAvailable(): boolean {
  return SENTRY_ENABLED;
}

/**
 * React Error Boundary component
 */
interface SentryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface SentryErrorBoundaryState {
  hasError: boolean;
}

export class SentryErrorBoundary extends React.Component<SentryErrorBoundaryProps, SentryErrorBoundaryState> {
  declare readonly props: SentryErrorBoundaryProps;
  state: SentryErrorBoundaryState = { hasError: false };

  constructor(props: SentryErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SentryErrorBoundaryState {
    captureException(error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureException(error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if ((this.state as SentryErrorBoundaryState).hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize Sentry on load
if (typeof window !== 'undefined') {
  initSentry();
}
