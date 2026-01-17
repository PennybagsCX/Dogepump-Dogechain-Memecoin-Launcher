/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing
 * the entire application.
 *
 * Integrates with Sentry for production error tracking.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown } from 'lucide-react';
import { Button } from './Button';

// Sentry temporarily disabled for debugging
const logger = {
  error: (context: string, message: string, error?: any) => {
    console.error(`[${context}]`, message, error);
  }
};

interface Props {
  children?: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

interface ErrorFallbackProps {
  error: Error;
  retry: () => void;
}

/**
 * Default error fallback UI
 */
function DefaultErrorFallback({ error, retry }: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0A0A0A] border border-red-900/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-transparent"></div>

        {/* Error icon */}
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={40} className="text-red-500" />
        </div>

        {/* Error message */}
        <h1 className="text-3xl font-comic font-bold text-white mb-4">Something went wrong</h1>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          We encountered an unexpected error. The issue has been reported to our team.
        </p>

        {/* Error preview */}
        <div className="bg-white/5 p-4 rounded-xl text-left mb-6 border border-white/5">
          <code className="text-xs text-red-400 font-mono break-words">
            {error.message || 'Unknown Error'}
          </code>
        </div>

        {/* Expandable error details (development only) */}
        {import.meta.env.DEV && (
          <details className="mb-6 text-left">
            <summary
              onClick={() => setShowDetails(!showDetails)}
              className="cursor-pointer text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-2"
            >
              <ChevronDown
                size={14}
                className={`transition-transform ${showDetails ? 'rotate-180' : ''}`}
              />
              Error Details (Dev Only)
            </summary>
            <div className="mt-3 p-4 bg-black/50 rounded-lg overflow-auto max-h-48 border border-white/5">
              <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap break-words">
                {error.stack}
              </pre>
            </div>
          </details>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mb-4">
          <Button
            onClick={retry}
            className="flex-1 gap-2 bg-doge hover:bg-doge-light text-black font-bold"
          >
            <RefreshCw size={18} /> Try Again
          </Button>
          <Button
            onClick={() => (window.location.href = '/')}
            className="flex-1 gap-2 bg-white/10 hover:bg-white/20 text-white font-bold"
          >
            <Home size={18} /> Go Home
          </Button>
        </div>

        {/* Reset warning */}
        <p className="text-xs text-gray-600">
          If the problem persists, try resetting the application.
        </p>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console
    console.error('Uncaught error:', error, errorInfo);
    logger.error('React Error Caught', error.message, {
      error,
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    // Reset error state to retry rendering
    this.setState({ hasError: false, error: null });
  };

  private handleReset = () => {
    // Clear local storage and reload
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error!}
          retry={this.handleRetry}
        />
      );
    }

    return (this as any).props.children;
  }
}

/**
 * Higher-order component to wrap a component in an error boundary
 *
 * @example
 * const SafeComponent = withErrorBoundary(MyComponent);
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>
): React.ComponentType<P> {
  const WrappedComponent: React.ComponentType<P> = (props) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default ErrorBoundary;
