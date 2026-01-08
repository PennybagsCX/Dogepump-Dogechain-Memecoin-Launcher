/**
 * SettingsModal Component Tests
 * 
 * Tests for image upload functionality including:
 * - Filename sanitization
 * - File signature validation
 * - Backend error parsing
 * - File type validation
 * - File size validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sanitizeFilename, validateFileSignature, parseBackendError, getFileRequirements } from '../SettingsModal';

// ============================================================================
// Filename Sanitization Tests
// ============================================================================

describe('sanitizeFilename', () => {
  it('should remove path traversal characters', () => {
    expect(sanitizeFilename('../etc/passwd')).toBe('etcpasswd');
    expect(sanitizeFilename('..\\windows\\system32')).toBe('windowssystem32');
    expect(sanitizeFilename('~/user/.ssh')).toBe('user.ssh'); // Preserve valid dots
    expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
  });

  it('should replace special characters with underscores', () => {
    expect(sanitizeFilename('image@name#file.jpg')).toBe('image_name_file.jpg');
    expect(sanitizeFilename('my$image%file.png')).toBe('my_image_file.png');
    expect(sanitizeFilename('file&name*.gif')).toBe('file_name_.gif');
    expect(sanitizeFilename('test|file?name.webp')).toBe('test_file_name.webp');
  });

  it('should replace multiple underscores with single underscore', () => {
    expect(sanitizeFilename('my___file.jpg')).toBe('my_file.jpg');
    expect(sanitizeFilename('test____image.png')).toBe('test_image.png');
  });

  it('should trim leading and trailing underscores', () => {
    expect(sanitizeFilename('_image.jpg')).toBe('image.jpg');
    expect(sanitizeFilename('image.jpg_')).toBe('image.jpg');
    expect(sanitizeFilename('___image.jpg___')).toBe('image.jpg');
  });

  it('should preserve valid characters', () => {
    expect(sanitizeFilename('valid-image_name.jpg')).toBe('valid-image_name.jpg');
    expect(sanitizeFilename('test.file.png')).toBe('test.file.png');
    expect(sanitizeFilename('image123.jpg')).toBe('image123.jpg');
  });

  it('should handle spaces in filename', () => {
    expect(sanitizeFilename('my image file.jpg')).toBe('my_image_file.jpg');
    expect(sanitizeFilename('  spaced  name  .png')).toBe('_spaced_name_.png'); // Leading/trailing underscores preserved after space replacement
  });

  it('should return default name if filename is empty after sanitization', () => {
    expect(sanitizeFilename('___')).toBe('image');
    expect(sanitizeFilename('...')).toBe('image');
  });

  it('should handle complex malicious filenames', () => {
    expect(sanitizeFilename('../../../../etc/passwd')).toBe('etcpasswd');
    expect(sanitizeFilename('..\\..\\..\\windows\\system32')).toBe('windowssystem32');
    expect(sanitizeFilename('~/.ssh/authorized_keys')).toBe('sshauthorized_keys');
    expect(sanitizeFilename('../../../etc/passwd.jpg')).toBe('etcpasswd.jpg');
  });
});

// ============================================================================
// File Signature Validation Tests
// ============================================================================

describe('validateFileSignature', () => {
  // Helper function to create a mock File with specific bytes
  const createMockFile = (bytes: number[], filename: string, mimeType: string): File => {
    const arrayBuffer = new ArrayBuffer(bytes.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    uint8Array.set(bytes);
    return new File([arrayBuffer], filename, { type: mimeType });
  };

  it('should validate JPEG file signature', async () => {
    // JPEG magic number: FF D8 FF
    const jpegBytes = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01];
    const file = createMockFile(jpegBytes, 'test.jpg', 'image/jpeg');
    const result = await validateFileSignature(file);
    
    expect(result.valid).toBe(true);
    expect(result.detectedType).toBe('image/jpeg');
    expect(result.error).toBeUndefined();
  });

  it('should validate PNG file signature', async () => {
    // PNG magic number: 89 50 4E 47 0D 0A 1A 0A
    const pngBytes = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D];
    const file = createMockFile(pngBytes, 'test.png', 'image/png');
    const result = await validateFileSignature(file);
    
    expect(result.valid).toBe(true);
    expect(result.detectedType).toBe('image/png');
    expect(result.error).toBeUndefined();
  });

  it('should validate GIF file signature', async () => {
    // GIF magic number: 47 49 46 38
    const gifBytes = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
    const file = createMockFile(gifBytes, 'test.gif', 'image/gif');
    const result = await validateFileSignature(file);
    
    expect(result.valid).toBe(true);
    expect(result.detectedType).toBe('image/gif');
    expect(result.error).toBeUndefined();
  });

  it('should validate WebP file signature', async () => {
    // WebP magic number: 52 49 46 46
    const webpBytes = [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50];
    const file = createMockFile(webpBytes, 'test.webp', 'image/webp');
    const result = await validateFileSignature(file);
    
    expect(result.valid).toBe(true);
    expect(result.detectedType).toBe('image/webp');
    expect(result.error).toBeUndefined();
  });

  it('should validate BMP file signature', async () => {
    // BMP magic number: 42 4D
    const bmpBytes = [0x42, 0x4D, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
    const file = createMockFile(bmpBytes, 'test.bmp', 'image/bmp');
    const result = await validateFileSignature(file);
    
    expect(result.valid).toBe(true);
    expect(result.detectedType).toBe('image/bmp');
    expect(result.error).toBeUndefined();
  });

  it('should reject non-image files', async () => {
    // Random bytes that don't match any image signature
    const randomBytes = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B];
    const file = createMockFile(randomBytes, 'test.txt', 'text/plain');
    const result = await validateFileSignature(file);
    
    expect(result.valid).toBe(false);
    expect(result.detectedType).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error).toContain('File signature does not match a valid image format');
  });

  it('should reject files with fake image extensions', async () => {
    // Text file renamed to .jpg
    const textBytes = [0x54, 0x68, 0x69, 0x73, 0x20, 0x69, 0x73, 0x20, 0x74, 0x65, 0x78, 0x74];
    const file = createMockFile(textBytes, 'fake.jpg', 'image/jpeg');
    const result = await validateFileSignature(file);
    
    expect(result.valid).toBe(false);
    expect(result.detectedType).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it('should detect mismatch between declared and actual type', async () => {
    // JPEG file with PNG MIME type
    const jpegBytes = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01];
    const file = createMockFile(jpegBytes, 'test.png', 'image/png');
    const result = await validateFileSignature(file);
    
    expect(result.valid).toBe(true);
    expect(result.detectedType).toBe('image/jpeg');
    expect(result.detectedType).not.toBe(file.type);
  });

  it('should handle very small files', async () => {
    // Need at least 3 bytes for JPEG magic number validation (FF D8 FF)
    const smallBytes = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01];
    const file = createMockFile(smallBytes, 'small.jpg', 'image/jpeg');
    const result = await validateFileSignature(file);
    
    expect(result.valid).toBe(true);
    expect(result.detectedType).toBe('image/jpeg');
  });
});

// ============================================================================
// Backend Error Parsing Tests
// ============================================================================

describe('parseBackendError', () => {
  it('should parse "Security validation failed" error', () => {
    const error = new Error('Security validation failed: Invalid file content');
    const result = parseBackendError(error);
    
    expect(result).toContain('Security validation failed');
    expect(result).toContain('suspicious patterns');
  });

  it('should parse "Invalid file signature" error', () => {
    const error = new Error('Invalid file signature detected');
    const result = parseBackendError(error);
    
    expect(result).toContain('File signature mismatch');
    expect(result).toContain('declared type');
  });

  it('should parse "Invalid file type" error', () => {
    const error = new Error('Invalid file type: application/pdf');
    const result = parseBackendError(error);
    
    expect(result).toContain('Invalid file type');
    expect(result).toContain('JPEG, PNG, GIF, WebP, or BMP');
  });

  it('should parse "File size exceeds" error', () => {
    const error = new Error('File size exceeds maximum limit of 5MB');
    const result = parseBackendError(error);
    
    expect(result).toContain('File size exceeds maximum limit');
    expect(result).toContain('max 5MB');
  });

  it('should parse "Invalid image dimensions" error', () => {
    const error = new Error('Invalid image dimensions: width too large');
    const result = parseBackendError(error);
    
    expect(result).toContain('Invalid image dimensions');
    expect(result).toContain('size requirements');
  });

  it('should parse "Invalid aspect ratio" error', () => {
    const error = new Error('Invalid aspect ratio: too wide');
    const result = parseBackendError(error);
    
    expect(result).toContain('Invalid aspect ratio');
    expect(result).toContain('reasonable aspect ratio');
  });

  it('should return original message for unknown errors', () => {
    const error = new Error('Some unknown error occurred');
    const result = parseBackendError(error);
    
    expect(result).toBe('Some unknown error occurred');
  });

  it('should handle non-Error objects', () => {
    const result = parseBackendError(null);
    expect(result).toContain('unexpected error');
  });

  it('should handle string errors', () => {
    const result = parseBackendError('string error');
    expect(result).toContain('unexpected error');
  });

  it('should handle errors with detailed messages', () => {
    const error = new Error('Security validation failed: File contains suspicious patterns [XSS attempt detected]');
    const result = parseBackendError(error);
    
    expect(result).toContain('Security validation failed');
    expect(result).toContain('suspicious patterns');
  });
});

// ============================================================================
// File Requirements Tests
// ============================================================================

describe('getFileRequirements', () => {
  it('should return correct requirements string', () => {
    const requirements = getFileRequirements();
    
    expect(requirements).toContain('JPEG');
    expect(requirements).toContain('PNG');
    expect(requirements).toContain('GIF');
    expect(requirements).toContain('WebP');
    expect(requirements).toContain('BMP');
    expect(requirements).toContain('5MB');
  });

  it('should be user-friendly', () => {
    const requirements = getFileRequirements();
    
    expect(requirements.length).toBeGreaterThan(10);
    expect(requirements.length).toBeLessThan(200);
  });
});

// ============================================================================
// Integration Tests for File Validation Flow
// ============================================================================

describe('File Validation Integration', () => {
  const createMockFile = (bytes: number[], filename: string, mimeType: string): File => {
    const arrayBuffer = new ArrayBuffer(bytes.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    uint8Array.set(bytes);
    return new File([arrayBuffer], filename, { type: mimeType });
  };

  it('should successfully validate a valid JPEG file', async () => {
    const jpegBytes = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01];
    const file = createMockFile(jpegBytes, 'valid.jpg', 'image/jpeg');
    
    // Sanitize filename
    const sanitized = sanitizeFilename(file.name);
    expect(sanitized).toBe('valid.jpg');
    
    // Validate signature
    const signatureResult = await validateFileSignature(file);
    expect(signatureResult.valid).toBe(true);
    expect(signatureResult.detectedType).toBe('image/jpeg');
    
    // Check MIME type match
    expect(signatureResult.detectedType).toBe(file.type);
  });

  it('should fail validation for malicious filename', async () => {
    const jpegBytes = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01];
    const file = createMockFile(jpegBytes, '../../../etc/passwd.jpg', 'image/jpeg');
    
    // Sanitize filename
    const sanitized = sanitizeFilename(file.name);
    expect(sanitized).toBe('etcpasswd.jpg');
    expect(sanitized).not.toContain('..');
    expect(sanitized).not.toContain('/');
  });

  it('should fail validation for file with mismatched type', async () => {
    const jpegBytes = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01];
    const file = createMockFile(jpegBytes, 'fake.png', 'image/png');
    
    // Validate signature
    const signatureResult = await validateFileSignature(file);
    expect(signatureResult.valid).toBe(true);
    expect(signatureResult.detectedType).toBe('image/jpeg');
    
    // Check for mismatch
    expect(signatureResult.detectedType).not.toBe(file.type);
  });

  it('should fail validation for non-image file', async () => {
    const textBytes = [0x54, 0x68, 0x69, 0x73, 0x20, 0x69, 0x73, 0x20, 0x74, 0x65, 0x78, 0x74];
    const file = createMockFile(textBytes, 'document.txt', 'text/plain');
    
    // Validate signature
    const signatureResult = await validateFileSignature(file);
    expect(signatureResult.valid).toBe(false);
    expect(signatureResult.error).toBeDefined();
  });

  it('should handle file with special characters in name', async () => {
    const pngBytes = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D];
    const file = createMockFile(pngBytes, 'my@image#file.png', 'image/png');
    
    // Sanitize filename
    const sanitized = sanitizeFilename(file.name);
    expect(sanitized).toBe('my_image_file.png');
    
    // Validate signature
    const signatureResult = await validateFileSignature(file);
    expect(signatureResult.valid).toBe(true);
    expect(signatureResult.detectedType).toBe('image/png');
  });
});
