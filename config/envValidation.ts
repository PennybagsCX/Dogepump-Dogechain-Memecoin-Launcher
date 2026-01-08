/**
 * Environment Variable Validation
 *
 * Validates that all required environment variables are set at startup.
 * Fails fast with clear error messages if required variables are missing.
 */

interface EnvConfig {
  required: string[];
  optional?: string[];
}

const ENV_CONFIGS: Record<'client' | 'server', EnvConfig> = {
  client: {
    required: [
      'VITE_API_URL'
    ],
    optional: [
      'VITE_WS_PRICE_URL',
      'VITE_DC_TOKEN_ADDRESS',
      'VITE_WDOGE_TOKEN_ADDRESS'
    ]
  },
  server: {
    required: [
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET'
    ],
    optional: [
      'S3_ENDPOINT',
      'S3_ACCESS_KEY_ID',
      'S3_SECRET_ACCESS_KEY',
      'S3_REGION',
      'S3_BUCKET'
    ]
  }
};

/**
 * Validate environment variables for the specified environment type
 * @param type - 'client' for frontend, 'server' for backend
 * @throws Error if required environment variables are missing
 */
export function validateEnvVars(type: 'client' | 'server'): void {
  const config = ENV_CONFIGS[type];
  const missing: string[] = [];
  const usingDefaults: string[] = [];

  // Check required variables
  config.required.forEach(varName => {
    const value = import.meta.env[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
    }
  });

  // Check optional variables
  config.optional?.forEach(varName => {
    const value = import.meta.env[varName];
    if (!value || value.trim() === '') {
      usingDefaults.push(varName);
    }
  });

  // Throw error if required variables are missing
  if (missing.length > 0) {
    throw new Error(
      `\n\n❌ Missing Required Environment Variables\n\n` +
      `The following environment variables are required but not set:\n` +
      `  ${missing.map(v => `  • ${v}`).join('\n')}\n\n` +
      `Please check your .env file and ensure all required variables are set.\n` +
      `Copy .env.example to .env and fill in the values.\n\n` +
      `Then restart the development server.\n`
    );
  }

  // Warn about optional variables using defaults
  if (usingDefaults.length > 0) {
    console.warn(
      `\n⚠️  Optional Environment Variables Not Set\n` +
      `The following optional variables are not set and will use defaults:\n` +
      `  ${usingDefaults.map(v => `  • ${v}`).join('\n')}\n`
    );
  }

  // Log success in development
  if (import.meta.env.DEV) {
    console.log('✅ Environment variables validated successfully');
  }
}

/**
 * Get environment variable or throw if missing
 */
export function getEnvVar(varName: string): string {
  const value = import.meta.env[varName];
  if (!value || value.trim() === '') {
    throw new Error(`Environment variable ${varName} is required but not set`);
  }
  return value;
}

/**
 * Get environment variable with default value
 */
export function getEnvVarOrDefault(varName: string, defaultValue: string): string {
  const value = import.meta.env[varName];
  return (value && value.trim() !== '') ? value : defaultValue;
}

/**
 * Validate API URL format
 */
export function validateApiUrl(url: string): void {
  try {
    new URL(url);
  } catch (error) {
    throw new Error(
      `Invalid API URL format: ${url}\n` +
      `Expected format: http://localhost:3001 or https://api.example.com`
    );
  }
}
