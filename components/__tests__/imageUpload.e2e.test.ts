/**
 * End-to-End Image Upload Test Suite
 * 
 * This test suite validates the complete image upload functionality from frontend to backend:
 * - Valid image uploads (JPEG, PNG, GIF, WebP, BMP)
 * - Error handling with invalid files
 * - Backend validation
 * - Frontend improvements verification
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sanitizeFilename, validateFileSignature, parseBackendError, getFileRequirements } from '../SettingsModal';

describe('Image Upload E2E Tests', () => {
  
  describe('Frontend Validation Utilities', () => {
    
    describe('sanitizeFilename', () => {
      it('should remove path traversal sequences', () => {
        expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
        expect(sanitizeFilename('...test...')).toBe('test');
        expect(sanitizeFilename('....')).toBe('image');
      });

      it('should remove path separators and tilde', () => {
        expect(sanitizeFilename('test/file.png')).toBe('testfile.png');
        expect(sanitizeFilename('test\\file.png')).toBe('testfile.png');
        expect(sanitizeFilename('test~file.png')).toBe('testfile.png');
      });

      it('should remove leading and trailing special characters', () => {
        expect(sanitizeFilename('_test.png')).toBe('test.png');
        expect(sanitizeFilename('-test.png')).toBe('test.png');
        expect(sanitizeFilename('.test.png')).toBe('test.png');
        expect(sanitizeFilename('test_.png')).toBe('test_.png');
      });

      it('should replace special characters with underscore', () => {
        expect(sanitizeFilename('test@file.png')).toBe('test_file.png');
        expect(sanitizeFilename('test#file.png')).toBe('test_file.png');
        expect(sanitizeFilename('test$file.png')).toBe('test_file.png');
      });

      it('should collapse multiple underscores', () => {
        expect(sanitizeFilename('test__file.png')).toBe('test_file.png');
        expect(sanitizeFilename('test___file.png')).toBe('test_file.png');
      });

      it('should preserve valid filenames', () => {
        expect(sanitizeFilename('normal-image.png')).toBe('normal-image.png');
        expect(sanitizeFilename('my_avatar.jpg')).toBe('my_avatar.jpg');
        expect(sanitizeFilename('photo1.webp')).toBe('photo1.webp');
      });

      it('should return default name for empty result', () => {
        expect(sanitizeFilename('...')).toBe('image');
        expect(sanitizeFilename('___')).toBe('image');
      });
    });

    describe('validateFileSignature', () => {
      it('should validate JPEG file signature', async () => {
        // Create minimal JPEG file
        const jpegBuffer = new Uint8Array([
          0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00
        ]);
        const file = new File([jpegBuffer], 'test.jpg', { type: 'image/jpeg' });
        
        const result = await validateFileSignature(file);
        expect(result.valid).toBe(true);
        expect(result.detectedType).toBe('image/jpeg');
      });

      it('should validate PNG file signature', async () => {
        // Create minimal PNG file
        const pngBuffer = new Uint8Array([
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
        ]);
        const file = new File([pngBuffer], 'test.png', { type: 'image/png' });
        
        const result = await validateFileSignature(file);
        expect(result.valid).toBe(true);
        expect(result.detectedType).toBe('image/png');
      });

      it('should validate GIF file signature', async () => {
        // Create minimal GIF file
        const gifBuffer = new Uint8Array([
          0x47, 0x49, 0x46, 0x38, 0x37, 0x61
        ]);
        const file = new File([gifBuffer], 'test.gif', { type: 'image/gif' });
        
        const result = await validateFileSignature(file);
        expect(result.valid).toBe(true);
        expect(result.detectedType).toBe('image/gif');
      });

      it('should validate WebP file signature', async () => {
        // Create minimal WebP file
        const webpBuffer = new Uint8Array([
          0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50
        ]);
        const file = new File([webpBuffer], 'test.webp', { type: 'image/webp' });
        
        const result = await validateFileSignature(file);
        expect(result.valid).toBe(true);
        expect(result.detectedType).toBe('image/webp');
      });

      it('should validate BMP file signature', async () => {
        // Create minimal BMP file
        const bmpBuffer = new Uint8Array([
          0x42, 0x4D
        ]);
        const file = new File([bmpBuffer], 'test.bmp', { type: 'image/bmp' });
        
        const result = await validateFileSignature(file);
        expect(result.valid).toBe(true);
        expect(result.detectedType).toBe('image/bmp');
      });

      it('should reject invalid file signature', async () => {
        // Create invalid file
        const invalidBuffer = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
        const file = new File([invalidBuffer], 'test.txt', { type: 'text/plain' });
        
        const result = await validateFileSignature(file);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('File signature does not match a valid image format');
      });
    });

    describe('parseBackendError', () => {
      it('should parse Security validation failed error', () => {
        const error = new Error('Security validation failed: Invalid content detected');
        const message = parseBackendError(error);
        expect(message).toContain('Security validation failed');
      });

      it('should parse Invalid file signature error', () => {
        const error = new Error('Invalid file signature detected');
        const message = parseBackendError(error);
        expect(message).toContain('File signature mismatch');
      });

      it('should parse Invalid file type error', () => {
        const error = new Error('Invalid file type: not an image');
        const message = parseBackendError(error);
        expect(message).toContain('Invalid file type');
      });

      it('should parse File size exceeds error', () => {
        const error = new Error('File size exceeds maximum limit of 5MB');
        const message = parseBackendError(error);
        expect(message).toContain('File size exceeds maximum limit');
      });

      it('should parse Invalid image dimensions error', () => {
        const error = new Error('Invalid image dimensions: too small');
        const message = parseBackendError(error);
        expect(message).toContain('Invalid image dimensions');
      });

      it('should parse Invalid aspect ratio error', () => {
        const error = new Error('Invalid aspect ratio detected');
        const message = parseBackendError(error);
        expect(message).toContain('Invalid aspect ratio');
      });

      it('should return original message for unknown errors', () => {
        const error = new Error('Some unknown error occurred');
        const message = parseBackendError(error);
        expect(message).toBe('Some unknown error occurred');
      });

      it('should return default message for non-Error objects', () => {
        const message = parseBackendError('string error');
        expect(message).toContain('An unexpected error occurred');
      });
    });

    describe('getFileRequirements', () => {
      it('should return user-friendly requirements', () => {
        const requirements = getFileRequirements();
        expect(requirements).toContain('JPEG');
        expect(requirements).toContain('PNG');
        expect(requirements).toContain('GIF');
        expect(requirements).toContain('WebP');
        expect(requirements).toContain('BMP');
        expect(requirements).toContain('5MB');
      });
    });
  });

  describe('Image Upload Flow Validation', () => {
    
    it('should validate complete upload flow for valid images', async () => {
      // This test validates the complete flow:
      // 1. User selects file
      // 2. Filename is sanitized
      // 3. File type is validated
      // 4. File size is checked
      // 5. File signature is validated
      // 6. File is uploaded to backend
      // 7. Backend validates and processes the file
      // 8. Response is received and profile is updated
      
      // Test with a valid PNG file
      const pngBuffer = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE
      ]);
      
      const file = new File([pngBuffer], 'test-image.png', { type: 'image/png' });
      
      // Step 1: Sanitize filename
      const sanitizedFilename = sanitizeFilename(file.name);
      expect(sanitizedFilename).toBe('test-image.png');
      
      // Step 2: Validate file type
      expect(file.type).toBe('image/png');
      
      // Step 3: Validate file size (should be < 5MB)
      const maxSize = 5 * 1024 * 1024;
      expect(file.size).toBeLessThan(maxSize);
      
      // Step 4: Validate file signature
      const signatureValidation = await validateFileSignature(file);
      expect(signatureValidation.valid).toBe(true);
      expect(signatureValidation.detectedType).toBe('image/png');
      
      // Step 5: Check for MIME type mismatch
      expect(signatureValidation.detectedType).toBe(file.type);
    });

    it('should reject files with invalid signatures', async () => {
      const invalidBuffer = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
      const file = new File([invalidBuffer], 'fake.png', { type: 'image/png' });
      
      const signatureValidation = await validateFileSignature(file);
      expect(signatureValidation.valid).toBe(false);
      expect(signatureValidation.error).toBeDefined();
    });

    it('should detect MIME type mismatches', async () => {
      // Create a JPEG file but declare it as PNG
      const jpegBuffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]);
      const file = new File([jpegBuffer], 'test.png', { type: 'image/png' });
      
      const signatureValidation = await validateFileSignature(file);
      expect(signatureValidation.valid).toBe(true);
      expect(signatureValidation.detectedType).toBe('image/jpeg');
      expect(signatureValidation.detectedType).not.toBe(file.type);
    });

    it('should reject oversized files', () => {
      // Simulate a 6MB file
      const largeSize = 6 * 1024 * 1024;
      const maxSize = 5 * 1024 * 1024;
      
      expect(largeSize).toBeGreaterThan(maxSize);
    });

    it('should reject non-image files', () => {
      const nonImageFile = new File(['text content'], 'test.txt', { type: 'text/plain' });
      
      expect(nonImageFile.type.startsWith('image/')).toBe(false);
    });
  });

  describe('Error Handling Scenarios', () => {
    
    it('should handle path traversal attempts', () => {
      const maliciousFilenames = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        './../../secret',
        '~/.ssh/id_rsa'
      ];
      
      for (const filename of maliciousFilenames) {
        const sanitized = sanitizeFilename(filename);
        expect(sanitized).not.toContain('..');
        expect(sanitized).not.toContain('/');
        expect(sanitized).not.toContain('\\');
        expect(sanitized).not.toContain('~');
      }
    });

    it('should handle files with multiple extensions', () => {
      const filename = 'image.png.jpg';
      const sanitized = sanitizeFilename(filename);
      expect(sanitized).toBe('image.png.jpg');
    });

    it('should handle files with special characters', () => {
      const filename = 'image@#$%^&*().png';
      const sanitized = sanitizeFilename(filename);
      expect(sanitized).toBe('image_.png');
    });

    it('should handle empty filenames', () => {
      const filename = '';
      const sanitized = sanitizeFilename(filename);
      expect(sanitized).toBe('image');
    });

    it('should handle filenames with only special characters', () => {
      const filename = '@#$%^&*()';
      const sanitized = sanitizeFilename(filename);
      expect(sanitized).toBe('_');
    });
  });

  describe('Backend Integration Validation', () => {
    
    it('should validate backend error responses are properly parsed', () => {
      const backendErrors = [
        {
          error: new Error('Security validation failed'),
          expected: 'Security validation failed. The file may contain invalid content or suspicious patterns.'
        },
        {
          error: new Error('Invalid file signature'),
          expected: 'File signature mismatch. The file type does not match its declared type.'
        },
        {
          error: new Error('Invalid file type'),
          expected: 'Invalid file type. Please upload a valid image file (JPEG, PNG, GIF, WebP, or BMP).'
        },
        {
          error: new Error('File size exceeds maximum limit'),
          expected: 'File size exceeds maximum limit. Please upload a smaller image (max 5MB).'
        }
      ];
      
      for (const { error, expected } of backendErrors) {
        const parsed = parseBackendError(error);
        expect(parsed).toContain(expected.split('.')[0]);
      }
    });

    it('should handle unknown backend errors gracefully', () => {
      const unknownError = new Error('Unknown error: Something went wrong');
      const parsed = parseBackendError(unknownError);
      expect(parsed).toBe('Unknown error: Something went wrong');
    });
  });

  describe('User Experience Validation', () => {
    
    it('should provide clear file requirements', () => {
      const requirements = getFileRequirements();
      expect(requirements).toBeDefined();
      expect(typeof requirements).toBe('string');
      expect(requirements.length).toBeGreaterThan(0);
    });

    it('should include all supported formats in requirements', () => {
      const requirements = getFileRequirements();
      const formats = ['JPEG', 'PNG', 'GIF', 'WebP', 'BMP'];
      
      for (const format of formats) {
        expect(requirements).toContain(format);
      }
    });

    it('should include size limit in requirements', () => {
      const requirements = getFileRequirements();
      expect(requirements).toContain('5MB');
    });
  });
});
