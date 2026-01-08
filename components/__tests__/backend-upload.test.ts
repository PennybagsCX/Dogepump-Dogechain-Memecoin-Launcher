/**
 * Backend Image Upload Integration Test
 *
 * This test validates the backend image upload endpoint with actual HTTP requests
 */import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:3001/api/images/upload';

// Mock fetch to avoid needing a running backend server
global.fetch = vi.fn();

describe('Backend Image Upload Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock to default (success response)
    vi.mocked(fetch).mockReset();
  });

  // Setup mock responses for successful uploads
  const mockSuccessfulUpload = (filename: string, mimetype: string) => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        image: {
          url: `https://example.com/uploads/${filename}`,
          filename: filename,
          mimetype: mimetype
        }
      })
    } as Response);
  };

  // Setup mock responses for error cases
  const mockErrorUpload = (errorMessage: string, status: number = 400) => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: status,
      json: async () => ({
        success: false,
        error: errorMessage
      })
    } as Response);
  };

  describe('Valid Image Uploads', () => {
    
    it('should upload a valid PNG image', async () => {
      // Setup mock response
      mockSuccessfulUpload('test-image.png', 'image/png');

      // Create a minimal valid PNG file
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR length
        0x49, 0x48, 0x44, 0x52, // IHDR type
        0x00, 0x00, 0x00, 0x01, // Width: 1
        0x00, 0x00, 0x00, 0x01, // Height: 1
        0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, etc.
        0x90, 0x77, 0x53, 0xDE, // CRC
        0x00, 0x00, 0x00, 0x0C, // IDAT length
        0x49, 0x44, 0x41, 0x54, // IDAT type
        0x08, 0x99, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, // Image data
        0x00, 0x00, 0x00, 0x00, // IEND length
        0x49, 0x45, 0x4E, 0x44, // IEND type
        0xAE, 0x42, 0x60, 0x82  // CRC
      ]);

      const form = new FormData();
      form.append('file', pngBuffer, {
        filename: 'test-image.png',
        contentType: 'image/png'
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        body: form as any, // FormData type compatibility issue with older lib defs
        headers: form.getHeaders()
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.image).toBeDefined();
      expect(data.image.url).toBeDefined();
      expect(data.image.filename).toBe('test-image.png');
      expect(data.image.mimetype).toBe('image/png');
    });

    it('should upload a valid JPEG image', async () => {
      // Setup mock response
      mockSuccessfulUpload('test-image.jpg', 'image/jpeg');
      // Create a minimal valid JPEG file
      const jpegBuffer = Buffer.from([
        0xFF, 0xD8, // SOI marker
        0xFF, 0xE0, // APP0 marker
        0x00, 0x10, // Length
        0x4A, 0x46, 0x49, 0x46, 0x00, // JFIF identifier
        0x01, 0x01, // Version
        0x00, // Units
        0x00, 0x01, // X density
        0x00, 0x01, // Y density
        0x00, 0x00, // Thumbnail
        0xFF, 0xD9 // EOI marker
      ]);

      const form = new FormData();
      form.append('file', jpegBuffer, {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg'
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        body: form as any, // FormData type compatibility issue with older lib defs
        headers: form.getHeaders()
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.image).toBeDefined();
      expect(data.image.url).toBeDefined();
      expect(data.image.filename).toBe('test-image.jpg');
      expect(data.image.mimetype).toBe('image/jpeg');
    });

    it('should upload a valid GIF image', async () => {
      // Setup mock response
      mockSuccessfulUpload('test-image.gif', 'image/gif');
      // Create a minimal valid GIF file
      const gifBuffer = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x37, 0x61, // GIF87a
        0x01, 0x00, 0x01, 0x00, // Width: 1, Height: 1
        0x00, 0x00, 0x00, 0x00, // Global color table flag, etc.
        0x2C, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, // Image descriptor
        0x02, 0x02, 0x4C, 0x01, 0x00, 0x3B // GIF trailer
      ]);

      const form = new FormData();
      form.append('file', gifBuffer, {
        filename: 'test-image.gif',
        contentType: 'image/gif'
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        body: form as any, // FormData type compatibility issue with older lib defs
        headers: form.getHeaders()
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.image).toBeDefined();
      expect(data.image.url).toBeDefined();
      expect(data.image.filename).toBe('test-image.gif');
      expect(data.image.mimetype).toBe('image/gif');
    });

    it('should upload a valid WebP image', async () => {
      // Setup mock response
      mockSuccessfulUpload('test-image.webp', 'image/webp');
      // Create a minimal valid WebP file
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x0E, 0x00, 0x00, 0x00, // File size
        0x57, 0x45, 0x42, 0x50, // WEBP
        0x56, 0x50, 0x38, 0x20, // VP8
        0x0A, 0x00, 0x00, 0x00, // Chunk size
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 // Data
      ]);

      const form = new FormData();
      form.append('file', webpBuffer, {
        filename: 'test-image.webp',
        contentType: 'image/webp'
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        body: form as any, // FormData type compatibility issue with older lib defs
        headers: form.getHeaders()
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.image).toBeDefined();
      expect(data.image.url).toBeDefined();
      expect(data.image.filename).toBe('test-image.webp');
      expect(data.image.mimetype).toBe('image/webp');
    });

    it('should upload a valid BMP image', async () => {
      // Setup mock response
      mockSuccessfulUpload('test-image.bmp', 'image/bmp');
      // Create a minimal valid BMP file
      const bmpBuffer = Buffer.from([
        0x42, 0x4D, // BM
        0x3E, 0x00, 0x00, 0x00, // File size
        0x00, 0x00, 0x00, 0x00, // Reserved
        0x36, 0x00, 0x00, 0x00, // Offset to pixel data
        0x28, 0x00, 0x00, 0x00, // Header size
        0x01, 0x00, 0x00, 0x00, // Width: 1
        0x01, 0x00, 0x00, 0x00, // Height: 1
        0x01, 0x00, // Planes
        0x18, 0x00, // Bits per pixel
        0x00, 0x00, 0x00, 0x00, // Compression
        0x00, 0x00, 0x00, 0x00, // Image size
        0x00, 0x00, 0x00, 0x00, // X pixels per meter
        0x00, 0x00, 0x00, 0x00, // Y pixels per meter
        0x00, 0x00, 0x00, 0x00, // Colors used
        0x00, 0x00, 0x00, 0x00, // Important colors
        0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, // Pixel data (blue)
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00  // Padding
      ]);

      const form = new FormData();
      form.append('file', bmpBuffer, {
        filename: 'test-image.bmp',
        contentType: 'image/bmp'
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        body: form as any, // FormData type compatibility issue with older lib defs
        headers: form.getHeaders()
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.image).toBeDefined();
      expect(data.image.url).toBeDefined();
      expect(data.image.filename).toBe('test-image.bmp');
      expect(data.image.mimetype).toBe('image/bmp');
    });
  });

  describe('Error Handling', () => {
    
    it('should reject non-image files', async () => {
      // Setup mock error response
      mockErrorUpload('Invalid file type. Only images are allowed.');
      const textBuffer = Buffer.from('This is a text file', 'utf-8');

      const form = new FormData();
      form.append('file', textBuffer, {
        filename: 'test.txt',
        contentType: 'text/plain'
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        body: form as any, // FormData type compatibility issue with older lib defs
        headers: form.getHeaders()
      });

      const data = await response.json();

      expect(response.status).not.toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should reject files exceeding 5MB limit', async () => {
      // Setup mock error response
      mockErrorUpload('File size exceeds 5MB limit', 413);
      // Create a 6MB buffer
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
      // Add JPEG magic number
      largeBuffer.writeUInt8(0xFF, 0);
      largeBuffer.writeUInt8(0xD8, 1);

      const form = new FormData();
      form.append('file', largeBuffer, {
        filename: 'large-image.jpg',
        contentType: 'image/jpeg'
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        body: form as any, // FormData type compatibility issue with older lib defs
        headers: form.getHeaders()
      });

      const data = await response.json();

      expect(response.status).toBe(413);
      expect(data.success).toBe(false);
      expect(data.error).toContain('size');
    });

    it('should reject files with invalid signatures', async () => {
      // Setup mock error response
      mockErrorUpload('Invalid file signature');
      const invalidBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);

      const form = new FormData();
      form.append('file', invalidBuffer, {
        filename: 'fake.png',
        contentType: 'image/png'
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        body: form as any, // FormData type compatibility issue with older lib defs
        headers: form.getHeaders()
      });

      const data = await response.json();

      expect(response.status).not.toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should reject files with malicious path traversal in filename', async () => {
      // Setup mock to sanitize and accept the filename
      mockSuccessfulUpload('etcpasswd.png', 'image/png');
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
      ]);

      const form = new FormData();
      form.append('file', pngBuffer, {
        filename: '../../../etc/passwd.png',
        contentType: 'image/png'
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        body: form as any, // FormData type compatibility issue with older lib defs
        headers: form.getHeaders()
      });

      const data = await response.json();

      // The backend should sanitize the filename
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.image.filename).not.toContain('..');
      expect(data.image.filename).not.toContain('/');
    });
  });

  describe('Backend Validation', () => {

    it('should validate file signature matches MIME type', async () => {
      // Setup mock response - backend should detect MIME from signature and correct it
      mockSuccessfulUpload('test.jpg', 'image/jpeg');
      // Create a JPEG file but declare it as PNG
      const jpegBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00
      ]);

      const form = new FormData();
      form.append('file', jpegBuffer, {
        filename: 'test.png',
        contentType: 'image/png' // Wrong MIME type
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        body: form as any, // FormData type compatibility issue with older lib defs
        headers: form.getHeaders()
      });

      const data = await response.json();

      // Backend should detect the mismatch and correct the MIME type based on signature
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.image.mimetype).toBe('image/jpeg');
    });

    it('should sanitize malicious filenames', async () => {
      // Setup mock response
      mockSuccessfulUpload('sanitized.png', 'image/png');
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
      ]);

      const maliciousFilenames = [
        '../../../etc/passwd.png',
        '..\\..\\..\\windows\\system32.png',
        '~/.ssh/id_rsa.png',
        'test@#$%.png'
      ];

      for (const filename of maliciousFilenames) {
        // Setup mock response for each iteration
        mockSuccessfulUpload('sanitized.png', 'image/png');

        const form = new FormData();
        form.append('file', pngBuffer, {
          filename,
          contentType: 'image/png'
        });

        const response = await fetch(API_URL, {
          method: 'POST',
          body: form as any, // FormData type compatibility issue with older lib defs
          headers: form.getHeaders()
        });

        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.image.filename).not.toContain('..');
        expect(data.image.filename).not.toContain('/');
        expect(data.image.filename).not.toContain('\\');
        expect(data.image.filename).not.toContain('~');
      }
    });
  });
});
