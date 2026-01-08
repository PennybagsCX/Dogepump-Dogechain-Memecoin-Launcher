/**
 * Test Utilities for Image Upload Testing
 * 
 * Provides helper functions to create test images of various formats and sizes
 */

/**
 * Create a test image file with specified format and size
 */
export async function createTestImage(
  format: 'jpeg' | 'png' | 'gif' | 'webp' | 'bmp',
  sizeKB: number,
  filename?: string
): Promise<File> {
  // Create a canvas to generate an image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Calculate dimensions based on desired size (rough approximation)
  const dimensions = calculateDimensions(format, sizeKB);
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  
  // Draw a simple pattern
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#00FF00';
  ctx.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = '#0000FF';
  ctx.fillRect(canvas.width / 2, canvas.height / 2, canvas.width / 4, canvas.height / 4);
  
  // Convert to blob
  const mimeType = `image/${format}`;
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        resolve(new Blob([], { type: mimeType }));
      }
    }, mimeType, 0.9);
  });
  
  const name = filename || `test_${format}_${sizeKB}KB.${format}`;
  return new File([blob], name, { type: mimeType });
}

/**
 * Calculate canvas dimensions to approximate a target file size
 */
function calculateDimensions(format: string, sizeKB: number): { width: number; height: number } {
  // These are rough approximations
  const baseSize = 100; // KB for 100x100
  const factor = Math.sqrt(sizeKB / baseSize);
  const baseDimension = 100;
  
  return {
    width: Math.floor(baseDimension * factor),
    height: Math.floor(baseDimension * factor),
  };
}

/**
 * Create a test file with specific bytes (for testing file signatures)
 */
export function createTestFile(
  bytes: number[],
  filename: string,
  mimeType: string
): File {
  const arrayBuffer = new ArrayBuffer(bytes.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  uint8Array.set(bytes);
  return new File([arrayBuffer], filename, { type: mimeType });
}

/**
 * Create a large test image (> 5MB)
 */
export async function createLargeTestImage(): Promise<File> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Create a very large image
  canvas.width = 4000;
  canvas.height = 4000;
  
  // Fill with pattern
  for (let i = 0; i < canvas.width; i += 10) {
    for (let j = 0; j < canvas.height; j += 10) {
      ctx.fillStyle = `rgb(${i % 256}, ${j % 256}, ${(i + j) % 256})`;
      ctx.fillRect(i, j, 10, 10);
    }
  }
  
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        resolve(new Blob([], { type: 'image/jpeg' }));
      }
    }, 'image/jpeg', 0.95);
  });
  
  return new File([blob], 'large_image.jpg', { type: 'image/jpeg' });
}

/**
 * Create a test file with fake image extension
 */
export function createFakeImageFile(): File {
  // Text content with .jpg extension
  const textContent = 'This is not an image file';
  const blob = new Blob([textContent], { type: 'text/plain' });
  return new File([blob], 'fake.jpg', { type: 'text/plain' });
}

/**
 * Create a test file with path traversal in filename
 */
export function createPathTraversalFile(): File {
  const jpegBytes = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01];
  const arrayBuffer = new ArrayBuffer(jpegBytes.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  uint8Array.set(jpegBytes);
  return new File([arrayBuffer], '../../../etc/passwd.jpg', { type: 'image/jpeg' });
}

/**
 * Create a test file with special characters in filename
 */
export function createSpecialCharsFile(): File {
  const pngBytes = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D];
  const arrayBuffer = new ArrayBuffer(pngBytes.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  uint8Array.set(pngBytes);
  return new File([arrayBuffer], 'my@image#file$name%.png', { type: 'image/png' });
}

/**
 * Create a very small test image (< 1KB)
 */
export async function createSmallTestImage(): Promise<File> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  canvas.width = 10;
  canvas.height = 10;
  
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(0, 0, 10, 10);
  
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        resolve(new Blob([], { type: 'image/png' }));
      }
    }, 'image/png');
  });
  
  return new File([blob], 'tiny.png', { type: 'image/png' });
}

/**
 * Create a test file exactly at 5MB limit
 */
export async function createExactly5MBImage(): Promise<File> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Calculate dimensions for ~5MB
  canvas.width = 3500;
  canvas.height = 3500;
  
  // Fill with pattern
  for (let i = 0; i < canvas.width; i += 20) {
    for (let j = 0; j < canvas.height; j += 20) {
      ctx.fillStyle = `rgb(${(i * 7) % 256}, ${(j * 5) % 256}, ${((i + j) * 3) % 256})`;
      ctx.fillRect(i, j, 20, 20);
    }
  }
  
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        resolve(new Blob([], { type: 'image/jpeg' }));
      }
    }, 'image/jpeg', 0.9);
  });
  
  return new File([blob], 'exactly_5mb.jpg', { type: 'image/jpeg' });
}

/**
 * Image format magic numbers for testing
 */
export const IMAGE_MAGIC_NUMBERS = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  gif: [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46],
  bmp: [0x42, 0x4D],
};

/**
 * Create a test file with specific magic numbers
 */
export function createFileWithMagicNumbers(
  magicNumbers: number[],
  filename: string,
  mimeType: string
): File {
  const arrayBuffer = new ArrayBuffer(magicNumbers.length + 100); // Add some padding
  const uint8Array = new Uint8Array(arrayBuffer);
  uint8Array.set(magicNumbers);
  
  return new File([arrayBuffer], filename, { type: mimeType });
}
