
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// Clear stale localStorage data from previous versions to prevent React hook errors
// This must run before any React code to prevent "Cannot read properties of null (reading 'useMemo'')" errors
const DATA_VERSION = '1.9';
const savedVersion = localStorage.getItem('dogepump_version');
if (savedVersion !== DATA_VERSION) {
  console.log('Data version mismatch detected, clearing localStorage...');
  localStorage.clear();
  localStorage.setItem('dogepump_version', DATA_VERSION);
}

// Initialize Sentry error tracking (production only)
try {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    import('@sentry/react').then(Sentry => {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        integrations: [
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
          Sentry.browserTracingIntegration(),
        ],
        beforeSend(event) {
          // Filter out sensitive data
          if (event.request?.headers) {
            delete event.request.headers['cookie'];
            delete event.request.headers['x-csrf-token'];
          }
          return event;
        },
      });
      console.log('[Sentry] Error tracking initialized');
    }).catch(err => {
      console.warn('[Sentry] Failed to initialize:', err);
    });
  }
} catch (error) {
  console.warn('[Sentry] Initialization skipped (package not installed or no DSN configured)');
}

// Validate environment variables at startup
import { validateEnvVars } from './config/envValidation';
try {
  validateEnvVars('client');
} catch (error) {
  console.error(error);
  // Show error in UI if environment variables are missing
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #000; color: #fff;">
        <div style="text-align: center; max-width: 600px; padding: 2rem;">
          <h1 style="color: #ef4444; font-size: 2rem; margin-bottom: 1rem;">⚙️ Configuration Error</h1>
          <pre style="background: #1a1a1a; padding: 1rem; border-radius: 0.5rem; overflow: auto; text-align: left; white-space: pre-wrap;">${(error as Error).message}</pre>
        </div>
      </div>
    `;
  }
  throw error;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
