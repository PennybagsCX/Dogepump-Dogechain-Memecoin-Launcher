/**
 * Token Validation Utilities
 *
 * Provides comprehensive validation for token launch data including:
 * - Name validation (format, length, characters)
 * - Ticker validation (format, length, uppercase)
 * - Description validation (length)
 * - Social link validation (URL formats)
 */

export interface TokenLaunchData {
  name: string;
  ticker: string;
  description: string;
  persona: string;
  socials?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: TokenLaunchData;
}

/**
 * Validates token name according to platform rules
 * - 2-50 characters
 * - Alphanumeric, spaces, hyphens, underscores only
 * - No special characters that could cause issues
 */
function validateTokenName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Token name is required' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return { valid: false, error: 'Token name must be at least 2 characters' };
  }

  if (trimmedName.length > 50) {
    return { valid: false, error: 'Token name must be 50 characters or less' };
  }

  // Allow alphanumeric, spaces, hyphens, underscores
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedName)) {
    return { valid: false, error: 'Token name contains invalid characters (use letters, numbers, spaces, hyphens, underscores)' };
  }

  return { valid: true };
}

/**
 * Validates token ticker according to platform rules
 * - 2-8 characters
 * - Uppercase alphanumeric only
 * - No special characters
 */
function validateTicker(ticker: string): { valid: boolean; error?: string } {
  if (!ticker || ticker.trim().length === 0) {
    return { valid: false, error: 'Token ticker is required' };
  }

  const trimmedTicker = ticker.trim().toUpperCase();

  if (trimmedTicker.length < 2) {
    return { valid: false, error: 'Ticker must be at least 2 characters' };
  }

  if (trimmedTicker.length > 8) {
    return { valid: false, error: 'Ticker must be 8 characters or less' };
  }

  // Only uppercase alphanumeric
  if (!/^[A-Z0-9]+$/.test(trimmedTicker)) {
    return { valid: false, error: 'Ticker must be uppercase alphanumeric only (A-Z, 0-9)' };
  }

  return { valid: true };
}

/**
 * Validates token description
 * - 10-500 characters
 * - Basic XSS protection
 */
function validateDescription(description: string): { valid: boolean; error?: string } {
  if (!description || description.trim().length === 0) {
    return { valid: false, error: 'Token description is required' };
  }

  const trimmedDescription = description.trim();

  if (trimmedDescription.length < 10) {
    return { valid: false, error: 'Description must be at least 10 characters' };
  }

  if (trimmedDescription.length > 500) {
    return { valid: false, error: 'Description must be 500 characters or less' };
  }

  // Basic XSS check - reject script tags and event handlers
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmedDescription)) {
      return { valid: false, error: 'Description contains invalid content' };
    }
  }

  return { valid: true };
}

/**
 * Validates persona field
 * - Optional, but max 200 characters if provided
 */
function validatePersona(persona: string): { valid: boolean; error?: string } {
  if (!persona || persona.trim().length === 0) {
    return { valid: true }; // Empty is OK
  }

  if (persona.length > 200) {
    return { valid: false, error: 'Persona must be 200 characters or less' };
  }

  return { valid: true };
}

/**
 * Social link validation patterns
 */
const SOCIAL_PATTERNS = {
  website: {
    pattern: /^https?:\/\/(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+([\/\?#].*)?$/i,
    allowSubdomains: true,
    example: 'https://example.com'
  },
  twitter: {
    pattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]{1,15}\/?$/,
    allowSubdomains: false,
    example: 'https://x.com/username'
  },
  telegram: {
    pattern: /^https?:\/\/t\.me\/[a-zA-Z0-9_]{5,32}\/?$/,
    allowSubdomains: false,
    example: 'https://t.me/username'
  },
  discord: {
    pattern: /^https?:\/\/(discord\.gg|discord\.com)\/[a-zA-Z0-9-]+\/?$/,
    allowSubdomains: false,
    example: 'https://discord.gg/invitecode'
  }
};

/**
 * Validates a social link URL
 */
function validateSocialLink(platform: keyof typeof SOCIAL_PATTERNS, url: string): { valid: boolean; error?: string } {
  if (!url || url.trim().length === 0) {
    return { valid: true }; // Empty is OK
  }

  const config = SOCIAL_PATTERNS[platform];
  if (!config) {
    return { valid: false, error: `Unknown platform: ${platform}` };
  }

  // Check for dangerous protocols
  if (/^(javascript|data|vbscript):/i.test(url)) {
    return { valid: false, error: 'Dangerous URL protocol detected' };
  }

  if (!config.pattern.test(url)) {
    return {
      valid: false,
      error: `Invalid ${platform} URL format. Expected format: ${config.example}`
    };
  }

  return { valid: true };
}

/**
 * Sanitizes input to prevent XSS attacks
 * Strips HTML tags and dangerous content
 */
function sanitizeInput(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim(); // Trim whitespace
}

/**
 * Main validation function for token launch data
 * Validates all fields and returns sanitized data
 */
export function validateTokenLaunch(data: TokenLaunchData): ValidationResult {
  const errors: string[] = [];

  // Validate name
  const nameValidation = validateTokenName(data.name);
  if (!nameValidation.valid) {
    errors.push(nameValidation.error!);
  }

  // Validate ticker
  const tickerValidation = validateTicker(data.ticker);
  if (!tickerValidation.valid) {
    errors.push(tickerValidation.error!);
  }

  // Validate description
  const descValidation = validateDescription(data.description);
  if (!descValidation.valid) {
    errors.push(descValidation.error!);
  }

  // Validate persona
  const personaValidation = validatePersona(data.persona);
  if (!personaValidation.valid) {
    errors.push(personaValidation.error!);
  }

  // Validate social links
  const socialErrors: string[] = [];
  if (data.socials) {
    if (data.socials.website) {
      const websiteValidation = validateSocialLink('website', data.socials.website);
      if (!websiteValidation.valid) {
        socialErrors.push(websiteValidation.error!);
      }
    }

    if (data.socials.twitter) {
      const twitterValidation = validateSocialLink('twitter', data.socials.twitter);
      if (!twitterValidation.valid) {
        socialErrors.push(twitterValidation.error!);
      }
    }

    if (data.socials.telegram) {
      const telegramValidation = validateSocialLink('telegram', data.socials.telegram);
      if (!telegramValidation.valid) {
        socialErrors.push(telegramValidation.error!);
      }
    }

    if (data.socials.discord) {
      const discordValidation = validateSocialLink('discord', data.socials.discord);
      if (!discordValidation.valid) {
        socialErrors.push(discordValidation.error!);
      }
    }
  }

  errors.push(...socialErrors);

  // If there are errors, return invalid
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // All valid - return sanitized data
  return {
    valid: true,
    errors: [],
    sanitized: {
      name: sanitizeInput(data.name),
      ticker: data.ticker.trim().toUpperCase(),
      description: sanitizeInput(data.description),
      persona: data.persona ? sanitizeInput(data.persona) : '',
      socials: data.socials ? {
        website: data.socials.website || undefined,
        twitter: data.socials.twitter || undefined,
        telegram: data.socials.telegram || undefined,
        discord: data.socials.discord || undefined
      } : undefined
    }
  };
}

/**
 * Quick validation for form input (real-time feedback)
 * Returns only the first error for quick feedback
 */
export function validateTokenLaunchQuick(data: Partial<TokenLaunchData>): string | null {
  if (data.name) {
    const nameValidation = validateTokenName(data.name);
    if (!nameValidation.valid) return nameValidation.error || null;
  }

  if (data.ticker) {
    const tickerValidation = validateTicker(data.ticker);
    if (!tickerValidation.valid) return tickerValidation.error || null;
  }

  if (data.description) {
    const descValidation = validateDescription(data.description);
    if (!descValidation.valid) return descValidation.error || null;
  }

  return null;
}
