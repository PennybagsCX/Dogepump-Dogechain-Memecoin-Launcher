/**
 * Environment Variable Validation
 *
 * Validates that all required environment variables are set at startup.
 * Fails fast with clear error messages if required variables are missing.
 *
 * This should be imported in main.tsx to validate environment on app start.
 */

interface EnvSchema {
  // Required
  VITE_API_URL: string;

  // Optional
  VITE_WS_PRICE_URL?: string;
  VITE_SENTRY_DSN?: string;
  VITE_ENABLE_TEST_DATA?: string;
  VITE_PUBLIC_RPC_URL?: string;
  VITE_PUBLIC_EXPLORER_URL?: string;
}

/**
 * Validate all required environment variables
 * Throws error with helpful message if any are missing
 */
function validateEnv(): EnvSchema {
  // Required variables
  const required: (keyof EnvSchema)[] = ['VITE_API_URL'];

  const missing = required.filter(key => {
    const value = import.meta.env[key];
    return !value || value.trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing.map(k => `  • ${k}`).join('\n')}\n\n` +
      `Please add them to your .env file:\n` +
      `${missing.map(k => `${k}=your_value_here`).join('\n')}\n\n` +
      `Then restart the development server.`
    );
  }

  // Validate API URL format
  const apiUrl = import.meta.env.VITE_API_URL!;
  try {
    new URL(apiUrl);
  } catch {
    throw new Error(`❌ Invalid VITE_API_URL format: "${apiUrl}"\nMust be a valid URL (e.g., http://localhost:3001)`);
  }

  // Validate optional variables that are provided
  const optionalWithValidation: (keyof EnvSchema)[] = [
    'VITE_WS_PRICE_URL',
    'VITE_SENTRY_DSN',
  ];

  for (const key of optionalWithValidation) {
    const value = import.meta.env[key];
    if (value && value.trim() !== '') {
      if (key.includes('URL') || key === 'VITE_SENTRY_DSN') {
        try {
          new URL(value);
        } catch {
          throw new Error(`❌ Invalid ${key} format: "${value}"`);
        }
      }
    }
  }

  // Warn if in production with test data enabled
  if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_TEST_DATA === 'true') {
    console.warn(
      '⚠️ WARNING: VITE_ENABLE_TEST_DATA is enabled in PRODUCTION!\n' +
      'This should NEVER be enabled in production builds.'
    );
  }

  return {
    VITE_API_URL: import.meta.env.VITE_API_URL!,
    VITE_WS_PRICE_URL: import.meta.env.VITE_WS_PRICE_URL,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_ENABLE_TEST_DATA: import.meta.env.VITE_ENABLE_TEST_DATA,
    VITE_PUBLIC_RPC_URL: import.meta.env.VITE_PUBLIC_RPC_URL,
    VITE_PUBLIC_EXPLORER_URL: import.meta.env.VITE_PUBLIC_EXPLORER_URL,
  };
}

// Validate environment variables immediately when this module is imported
// This ensures we fail fast if configuration is missing
export const env = validateEnv();

/**
 * Get validated environment variables
 * Returns readonly object to prevent accidental modification
 */
export function getEnv(): Readonly<EnvSchema> {
  return env;
}

/**
 * Check if test data mode is enabled
 * Should only be true in development with explicit opt-in
 */
export function isTestDataEnabled(): boolean {
  return (
    !import.meta.env.PROD &&
    import.meta.env.VITE_ENABLE_TEST_DATA === 'true'
  );
}

/**
 * Check if Sentry is configured
 */
export function isSentryEnabled(): boolean {
  return !!env.VITE_SENTRY_DSN;
}

/**
 * Check if WebSocket price updates are configured
 */
export function isWebSocketPriceEnabled(): boolean {
  return !!env.VITE_WS_PRICE_URL;
}

/**
 * Log environment configuration (development only)
 */
if (import.meta.env.DEV) {
  console.group('🔧 Environment Configuration');
  console.log('Mode:', import.meta.env.MODE);
  console.log('API URL:', env.VITE_API_URL);
  console.log('WebSocket:', env.VITE_WS_PRICE_URL || 'Not configured');
  console.log('Sentry:', env.VITE_SENTRY_DSN ? 'Configured' : 'Not configured');
  console.log('Test Data:', isTestDataEnabled() ? '⚠️ ENABLED' : 'Disabled');
  console.groupEnd();
}
