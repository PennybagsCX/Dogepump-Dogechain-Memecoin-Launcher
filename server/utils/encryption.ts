/**
 * Data Encryption Utilities
 *
 * Encrypt and decrypt sensitive data at rest using AES-256-GCM
 */

import crypto from 'crypto';
import { logger } from './logger.js';

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  // Encryption key (32 bytes for AES-256)
  key: Buffer;

  // Algorithm to use
  algorithm: string;

  // IV length in bytes
  ivLength: number;

  // Authentication tag length in bytes
  authTagLength: number;
}

/**
 * Encrypted data format
 */
export interface EncryptedData {
  // Initialization vector
  iv: string;

  // Encrypted content
  data: string;

  // Authentication tag
  authTag: string;
}

/**
 * Default encryption configuration
 */
const DEFAULT_CONFIG: EncryptionConfig = {
  algorithm: 'aes-256-gcm',
  ivLength: 16, // 16 bytes for GCM
  authTagLength: 16, // 16 bytes authentication tag
  key: Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex'),
};

/**
 * Validate encryption key
 */
export function validateEncryptionKey(): boolean {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    logger.error('ENCRYPTION_KEY environment variable not set');
    return false;
  }

  // Key must be 32 bytes (64 hex characters) for AES-256
  if (key.length !== 64) {
    logger.error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    return false;
  }

  // Validate hex format
  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    logger.error('ENCRYPTION_KEY must be valid hex');
    return false;
  }

  return true;
}

/**
 * Get encryption configuration
 */
export function getEncryptionConfig(): EncryptionConfig {
  if (!validateEncryptionKey()) {
    throw new Error('Invalid encryption key configuration');
  }

  return DEFAULT_CONFIG;
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(plaintext: string): string {
  try {
    const config = getEncryptionConfig();

    // Generate random IV
    const iv = crypto.randomBytes(config.ivLength);

    // Create cipher
    const cipher = crypto.createCipheriv(
      config.algorithm,
      config.key,
      iv
    );

    // Encrypt data
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine IV + auth tag + encrypted data
    const result: EncryptedData = {
      iv: iv.toString('hex'),
      data: encrypted,
      authTag: authTag.toString('hex'),
    };

    // Return as base64 encoded JSON
    return Buffer.from(JSON.stringify(result)).toString('base64');
  } catch (error) {
    logger.error('Encryption failed', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data that was encrypted with encrypt()
 */
export function decrypt(ciphertext: string): string {
  try {
    const config = getEncryptionConfig();

    // Parse base64 encoded JSON
    const encryptedData: EncryptedData = JSON.parse(
      Buffer.from(ciphertext, 'base64').toString('utf8')
    );

    // Convert hex strings to buffers
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    const encrypted = Buffer.from(encryptedData.data, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(
      config.algorithm,
      config.key,
      iv
    );

    // Set authentication tag
    decipher.setAuthTag(authTag);

    // Decrypt data
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    logger.error('Decryption failed', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt object (converts to JSON first)
 */
export function encryptObject(obj: Record<string, any>): string {
  const json = JSON.stringify(obj);
  return encrypt(json);
}

/**
 * Decrypt object (returns parsed JSON)
 */
export function decryptObject<T = Record<string, any>>(ciphertext: string): T {
  const json = decrypt(ciphertext);
  return JSON.parse(json) as T;
}

/**
 * Encrypt specific fields in an object
 */
export function encryptFields<T extends Record<string, any>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const result = { ...obj };

  for (const field of fieldsToEncrypt) {
    const value = result[field];

    if (value !== null && value !== undefined) {
      if (typeof value === 'string') {
        (result as any)[field] = encrypt(value);
      } else {
        logger.warn({ field }, 'Cannot encrypt non-string field');
      }
    }
  }

  return result;
}

/**
 * Decrypt specific fields in an object
 */
export function decryptFields<T extends Record<string, any>>(
  obj: T,
  fieldsToDecrypt: (keyof T)[]
): T {
  const result = { ...obj };

  for (const field of fieldsToDecrypt) {
    const value = result[field];

    if (value !== null && value !== undefined) {
      if (typeof value === 'string') {
        try {
          (result as any)[field] = decrypt(value);
        } catch (error) {
          logger.error({ field, error }, 'Failed to decrypt field');
          // Keep original value if decryption fails
        }
      } else {
        logger.warn({ field }, 'Cannot decrypt non-string field');
      }
    }
  }

  return result;
}

/**
 * Generate encryption key
 */
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(32); // 32 bytes for AES-256
  return key.toString('hex');
}

/**
 * Hash sensitive data for comparison (one-way)
 */
export function hashData(data: string): string {
  return crypto
    .createHash('sha256')
    .update(data, 'utf8')
    .digest('hex');
}

/**
 * Compare hashed data with plaintext
 */
export function compareHash(plaintext: string, hash: string): boolean {
  const plaintextHash = hashData(plaintext);
  return plaintextHash === hash;
}

/**
 * Encrypt email address (with format preservation)
 */
export function encryptEmail(email: string): string {
  return encrypt(email);
}

/**
 * Decrypt email address
 */
export function decryptEmail(encryptedEmail: string): string {
  return decrypt(encryptedEmail);
}

/**
 * Encrypt phone number
 */
export function encryptPhone(phone: string): string {
  return encrypt(phone);
}

/**
 * Decrypt phone number
 */
export function decryptPhone(encryptedPhone: string): string {
  return decrypt(encryptedPhone);
}

/**
 * Encrypt sensitive user data
 */
export function encryptUserData(data: {
  email?: string;
  phone?: string;
  ssn?: string;
  [key: string]: any;
}): Record<string, any> {
  const result = { ...data };

  if (result.email) {
    result.email = encryptEmail(result.email);
  }

  if (result.phone) {
    result.phone = encryptPhone(result.phone);
  }

  if (result.ssn) {
    result.ssn = encrypt(result.ssn);
  }

  return result;
}

/**
 * Decrypt sensitive user data
 */
export function decryptUserData(data: {
  email?: string;
  phone?: string;
  ssn?: string;
  [key: string]: any;
}): Record<string, any> {
  const result = { ...data };

  if (result.email) {
    try {
      result.email = decryptEmail(result.email);
    } catch (error) {
      logger.warn('Failed to decrypt email');
    }
  }

  if (result.phone) {
    try {
      result.phone = decryptPhone(result.phone);
    } catch (error) {
      logger.warn('Failed to decrypt phone');
    }
  }

  if (result.ssn) {
    try {
      result.ssn = decrypt(result.ssn);
    } catch (error) {
      logger.warn('Failed to decrypt SSN');
    }
  }

  return result;
}

/**
 * Mask sensitive data for display (partial show)
 */
export function maskEmail(email: string): string {
  const [username, domain] = email.split('@');

  if (!domain) {
    // Invalid email format
    return email.substring(0, 3) + '***';
  }

  const visibleChars = Math.max(2, Math.floor(username.length / 3));
  const maskedUsername = username.substring(0, visibleChars) + '***';

  return `${maskedUsername}@${domain}`;
}

/**
 * Mask phone number
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 4) {
    return '***';
  }

  const visible = 3;
  const masked = digits.substring(0, visible) + '***';

  return masked;
}

/**
 * Mask string (show first N chars)
 */
export function maskString(str: string, visibleChars: number = 4): string {
  if (str.length <= visibleChars) {
    return str;
  }

  return str.substring(0, visibleChars) + '***';
}

/**
 * Encryption service class
 */
export class EncryptionService {
  private config: EncryptionConfig;

  constructor(config?: Partial<EncryptionConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    if (!validateEncryptionKey()) {
      throw new Error('Invalid encryption configuration');
    }
  }

  /**
   * Encrypt data
   */
  encrypt(plaintext: string): string {
    return encrypt(plaintext);
  }

  /**
   * Decrypt data
   */
  decrypt(ciphertext: string): string {
    return decrypt(ciphertext);
  }

  /**
   * Encrypt object
   */
  encryptObject<T extends Record<string, any>>(obj: T): string {
    return encryptObject(obj);
  }

  /**
   * Decrypt object
   */
  decryptObject<T>(ciphertext: string): T {
    return decryptObject<T>(ciphertext);
  }

  /**
   * Hash data
   */
  hash(data: string): string {
    return hashData(data);
  }

  /**
   * Compare hash
   */
  compareHash(plaintext: string, hash: string): boolean {
    return compareHash(plaintext, hash);
  }
}

/**
 * Create encryption service instance
 */
export function createEncryptionService(
  config?: Partial<EncryptionConfig>
): EncryptionService {
  return new EncryptionService(config);
}
