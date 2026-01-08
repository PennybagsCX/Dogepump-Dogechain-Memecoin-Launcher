import { config } from '../config.js';
import { ValidationResult } from '../types/index.js';

/**
 * Validates an email address
 * @param email - Email address to validate
 * @returns True if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

/**
 * Validates a password against security requirements
 * @param password - Password to validate
 * @returns Validation result with errors if any
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { valid: false, errors };
  }
  
  const { AUTH } = config;
  
  // Check minimum length
  if (password.length < AUTH.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${AUTH.PASSWORD_MIN_LENGTH} characters long`);
  }
  
  // Check maximum length (prevent DoS)
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  
  // Check for uppercase letters
  if (AUTH.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check for lowercase letters
  if (AUTH.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check for numbers
  if (AUTH.PASSWORD_REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for special characters
  if (AUTH.PASSWORD_REQUIRE_SPECIAL) {
    const hasSpecial = new RegExp(`[${AUTH.PASSWORD_SPECIAL_CHARS}]`).test(password);
    if (!hasSpecial) {
      errors.push(`Password must contain at least one special character (${AUTH.PASSWORD_SPECIAL_CHARS})`);
    }
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'monkey', 'master', 'dragon', '111111', 'baseball',
    'iloveyou', 'trustno1', 'sunshine', 'princess', 'admin'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password.');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a username
 * @param username - Username to validate
 * @returns Validation result with errors if any
 */
export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];
  
  if (!username || typeof username !== 'string') {
    errors.push('Username is required');
    return { valid: false, errors };
  }
  
  const trimmedUsername = username.trim();
  const { AUTH } = config;
  
  // Check minimum length
  if (trimmedUsername.length < AUTH.USERNAME_MIN_LENGTH) {
    errors.push(`Username must be at least ${AUTH.USERNAME_MIN_LENGTH} characters long`);
  }
  
  // Check maximum length
  if (trimmedUsername.length > AUTH.USERNAME_MAX_LENGTH) {
    errors.push(`Username must be no more than ${AUTH.USERNAME_MAX_LENGTH} characters long`);
  }
  
  // Check for valid characters
  if (!AUTH.USERNAME_PATTERN.test(trimmedUsername)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }
  
  // Check for reserved usernames
  const reservedUsernames = [
    'admin', 'administrator', 'root', 'system', 'api',
    'www', 'mail', 'ftp', 'localhost', 'test', 'demo'
  ];
  
  if (reservedUsernames.includes(trimmedUsername.toLowerCase())) {
    errors.push('This username is reserved and cannot be used');
  }
  
  // Check for leading/trailing underscores
  if (trimmedUsername.startsWith('_') || trimmedUsername.endsWith('_')) {
    errors.push('Username cannot start or end with an underscore');
  }
  
  // Check for consecutive underscores
  if (trimmedUsername.includes('__')) {
    errors.push('Username cannot contain consecutive underscores');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a wallet address (Ethereum/Dogechain format)
 * @param address - Wallet address to validate
 * @returns True if valid, false otherwise
 */
export function validateWalletAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Check for 0x prefix and correct length (42 characters for Ethereum/Dogechain)
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  return addressRegex.test(address.trim());
}

/**
 * Sanitizes user input to prevent injection attacks
 * @param input - Input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
}

/**
 * Generates a secure random password
 * @param length - Length of the password (default: 16)
 * @returns Generated password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + special;
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Checks if a password meets strength requirements
 * @param password - Password to check
 * @returns Password strength score (0-4)
 */
export function checkPasswordStrength(password: string): number {
  let strength = 0;
  
  if (!password || typeof password !== 'string') {
    return 0;
  }
  
  // Length check
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  
  // Complexity checks
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  // Cap at 4
  return Math.min(strength, 4);
}

/**
 * Gets a human-readable password strength description
 * @param password - Password to evaluate
 * @returns Strength description
 */
export function getPasswordStrengthDescription(password: string): string {
  const strength = checkPasswordStrength(password);
  
  const descriptions = [
    'Very Weak',
    'Weak',
    'Fair',
    'Good',
    'Strong'
  ];
  
  return descriptions[strength];
}

/**
 * Validates that two passwords match
 * @param password - First password
 * @param confirmPassword - Second password to compare
 * @returns True if passwords match, false otherwise
 */
export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword && password.length > 0;
}

/**
 * Checks if an email is from a disposable email domain
 * @param email - Email address to check
 * @returns True if disposable, false otherwise
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const domain = email.split('@')[1]?.toLowerCase();
  
  // List of common disposable email domains
  const disposableDomains = [
    'tempmail.com', 'guerrillamail.com', 'mailinator.com',
    '10minutemail.com', 'yopmail.com', 'throwawaymail.com',
    'getairmail.com', 'sharklasers.com', 'fakeinbox.com'
  ];
  
  return disposableDomains.includes(domain);
}

/**
 * Extracts the domain from an email address
 * @param email - Email address
 * @returns Domain name or empty string if invalid
 */
export function extractEmailDomain(email: string): string {
  if (!validateEmail(email)) {
    return '';
  }
  
  return email.split('@')[1]?.toLowerCase() || '';
}

/**
 * Validates file type for image uploads
 * @param mimetype - MIME type to validate
 * @returns True if valid, false otherwise
 */
export function validateFileType(mimetype: string): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
  return allowedTypes.includes(mimetype);
}

/**
 * Validates file size
 * @param size - File size in bytes
 * @param maxSize - Maximum allowed size in bytes
 * @returns True if valid, false otherwise
 */
export function validateFileSize(size: number, maxSize: number): boolean {
  return size <= maxSize;
}

/**
 * Validates comment content
 * @param content - Comment content to validate
 * @returns Validation result with errors if any
 */
export function validateCommentContent(content: string): ValidationResult {
  const errors: string[] = [];

  if (!content || typeof content !== 'string') {
    errors.push('Comment content cannot be empty');
    return { valid: false, errors };
  }

  const trimmedContent = content.trim();

  if (trimmedContent.length === 0) {
    errors.push('Comment content cannot be empty');
  }

  if (trimmedContent.length > 1000) {
    errors.push('Comment content cannot exceed 1000 characters');
  }

  // Check for excessive whitespace
  if (/^\s+$/.test(content)) {
    errors.push('Comment content cannot consist only of whitespace');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
