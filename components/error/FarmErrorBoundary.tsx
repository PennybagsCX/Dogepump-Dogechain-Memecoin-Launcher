import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { playSound } from '../../services/audio';

/**
 * Props for FarmErrorBoundary component
 */
interface FarmErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * State for FarmErrorBoundary component
 */
interface FarmErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * FarmErrorBoundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing
 * the entire application.
 *
 * Features:
 * - Catches all React errors in child components
 * - Logs errors to console and optionally to external service
 * - Displays user-friendly error message
 * - Provides recovery options (retry, go home)
 * - Preserves error context for debugging
 *
 * @example
 * ```tsx
 * <FarmErrorBoundary>
 *   <FarmCard farm={farm} />
 * </FarmErrorBoundary>
 * ```
 */
export class FarmErrorBoundary extends Component<
  FarmErrorBoundaryProps,
  FarmErrorBoundaryState
> {
  constructor(props: FarmErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<FarmErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console
    console.error('[FarmErrorBoundary] Caught error:', error);
    console.error('[FarmErrorBoundary] Error info:', errorInfo);

    // Log error component stack
    console.error(
      '[FarmErrorBoundary] Component stack:',
      errorInfo.componentStack
    );

    // Save error info to state
    this.setState({
      error,
      errorInfo,
    });

    // Play error sound
    try {
      playSound('error');
    } catch (soundError) {
      console.error('[FarmErrorBoundary] Failed to play error sound:', soundError);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        console.error('[FarmErrorBoundary] Error in error handler:', handlerError);
      }
    }

    // Log to external service (e.g., Sentry) if configured
    // This is where you would integrate with your error tracking service
    try {
      // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
      console.log('[FarmErrorBoundary] Error would be sent to external monitoring service');
    } catch (logError) {
      console.error('[FarmErrorBoundary] Failed to log to external service:', logError);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    playSound('click');
  };

  handleGoHome = () => {
    window.location.href = '/earn';
    playSound('click');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-red-500/5 border border-red-500/30 rounded-3xl p-8 text-center relative overflow-hidden">
            {/* Background glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/10 blur-[60px] rounded-full pointer-events-none"></div>

            <div className="relative z-10">
              {/* Error Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full mb-6">
                <AlertTriangle size={40} className="text-red-500" />
              </div>

              {/* Error Title */}
              <h2 className="text-2xl font-bold text-white mb-3">
                Oops! Something Went Wrong
              </h2>

              {/* Error Message */}
              <p className="text-gray-400 mb-6">
                An error occurred while loading this farm component. Don't worry, your funds are safe.
              </p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-400 mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="bg-black/30 rounded-lg p-4 mt-2 overflow-auto max-h-48">
                    <p className="text-red-400 text-xs font-mono mb-2">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="text-gray-500 text-xs overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-red-500/25"
                >
                  <RefreshCw size={20} />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
                >
                  <Home size={20} />
                  <span>Go to Earn Page</span>
                </button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-gray-500 mt-6">
                If this problem persists, please clear your browser cache and try again.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook version of FarmErrorBoundary (for functional components)
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { ErrorBoundary } = useFarmErrorBoundary();
 *
 *   return (
 *     <ErrorBoundary>
 *       <FarmContent />
 *     </ErrorBoundary>
 *   );
 * };
 * ```
 */
export function useFarmErrorBoundary() {
  return {
    ErrorBoundary: FarmErrorBoundary,
  };
}

export default FarmErrorBoundary;
