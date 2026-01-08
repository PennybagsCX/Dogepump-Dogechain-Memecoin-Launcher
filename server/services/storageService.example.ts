/**
 * Storage Service Usage Examples
 *
 * This file demonstrates how to use the storage service in various scenarios.
 */

import { storageService } from './storageService';
import type { StoreImageOptions, ListImagesOptions, CleanupOptions } from '../types';

// Example 1: Basic Image Upload
async function basicUpload(userId: string, tokenId: string, imageBuffer: Buffer, filename: string) {
  const image = await storageService.storeImage({
    userId,
    tokenId,
    filename,
    buffer: imageBuffer,
    mimetype: 'image/jpeg',
    isTemporary: false,
    generateVariants: true,
  });

  console.log('Image stored:', image.id);
  console.log('Variants:', image.variants.map(v => v.name));
  return image;
}

// Example 2: Temporary Upload with Validation
async function uploadWithValidation(userId: string, imageBuffer: Buffer, filename: string) {
  // Store as temporary first
  const tempImage = await storageService.storeImage({
    userId,
    filename,
    buffer: imageBuffer,
    mimetype: 'image/png',
    isTemporary: true,
    ttl: 3600000, // 1 hour
    generateVariants: true,
  });

  // Validate image (your validation logic)
  const isValid = await validateImage(tempImage);

  if (isValid) {
    // Move to permanent storage
    await storageService.moveToPermanent(tempImage.id);
    console.log('Image moved to permanent storage');
    return tempImage;
  } else {
    // Delete invalid image
    await storageService.deleteImage(tempImage.id);
    throw new Error('Image validation failed');
  }
}

// Example 3: Upload with Deduplication
async function uploadWithDeduplication(userId: string, imageBuffer: Buffer, filename: string) {
  const image = await storageService.storeImage({
    userId,
    filename,
    buffer: imageBuffer,
    mimetype: 'image/webp',
    isTemporary: false,
    deduplicate: true, // Enable deduplication
    generateVariants: true,
  });

  // If a duplicate was found, image.id will be the same as the original
  console.log('Image ID:', image.id);
  console.log('Is duplicate:', image.metadata.checksum);

  return image;
}

// Example 4: Retrieve Image Variants
async function getImageVariants(imageId: string) {
  // Get original
  const original = await storageService.getImage(imageId, { variant: 'original' });

  // Get thumbnail
  const thumbnail = await storageService.getImage(imageId, { variant: 'thumbnail' });

  // Get medium (fallback to original if not available)
  const medium = await storageService.getImage(imageId, {
    variant: 'medium',
    fallbackToOriginal: true,
  });

  return { original, thumbnail, medium };
}

// Example 5: List User Images
async function listUserImages(userId: string, page: number = 1, limit: number = 20) {
  const images = await storageService.listImages({
    userId,
    limit,
    offset: (page - 1) * limit,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  console.log(`Found ${images.length} images for user ${userId}`);
  return images;
}

// Example 6: List Token Images
async function listTokenImages(userId: string, tokenId: string) {
  const images = await storageService.listImages({
    userId,
    tokenId,
    sortBy: 'createdAt',
    sortOrder: 'asc',
  });

  console.log(`Found ${images.length} images for token ${tokenId}`);
  return images;
}

// Example 7: List Temporary Images
async function listTemporaryImages(userId: string) {
  const tempImages = await storageService.listImages({
    userId,
    isTemporary: true,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  console.log(`Found ${tempImages.length} temporary images`);
  return tempImages;
}

// Example 8: Delete Image
async function deleteImage(imageId: string) {
  const success = await storageService.deleteImage(imageId);

  if (success) {
    console.log(`Image ${imageId} deleted successfully`);
  } else {
    console.log(`Failed to delete image ${imageId}`);
  }

  return success;
}

// Example 9: Batch Delete
async function batchDeleteImages(imageIds: string[]) {
  const result = await storageService.batchDeleteImages(imageIds);

  console.log(`Processed: ${result.processed}`);
  console.log(`Failed: ${result.failed}`);

  if (result.errors.length > 0) {
    console.error('Errors:', result.errors);
  }

  return result;
}

// Example 10: Cleanup Old Temporary Files
async function cleanupOldFiles() {
  const result = await storageService.cleanupOldImages({
    olderThan: new Date(Date.now() - 86400000), // 24 hours ago
    temporaryOnly: true,
    dryRun: false,
  });

  console.log(`Cleanup completed: ${result.processed} files processed`);
  return result;
}

// Example 11: Dry Run Cleanup
async function previewCleanup() {
  const result = await storageService.cleanupOldImages({
    olderThan: new Date(Date.now() - 86400000),
    temporaryOnly: true,
    dryRun: true, // Don't actually delete
  });

  console.log(`Would delete ${result.processed} files`);
  return result;
}

// Example 12: Get Storage Statistics
async function getStorageInfo() {
  const stats = await storageService.getStorageStats();

  console.log('Storage Statistics:');
  console.log(`Total Images: ${stats.totalImages}`);
  console.log(`Total Size: ${formatBytes(stats.totalSize)}`);
  console.log(`Total Variants: ${stats.totalVariants}`);
  console.log(`Temp Images: ${stats.tempImages}`);
  console.log(`Permanent Images: ${stats.permanentImages}`);
  console.log(`Storage Usage: ${formatBytes(stats.storageUsage)} / ${formatBytes(stats.storageLimit)}`);
  console.log(`Usage Percentage: ${((stats.storageUsage / stats.storageLimit) * 100).toFixed(2)}%`);

  if (stats.oldestFile) {
    console.log(`Oldest File: ${stats.oldestFile.toISOString()}`);
  }
  if (stats.newestFile) {
    console.log(`Newest File: ${stats.newestFile.toISOString()}`);
  }

  return stats;
}

// Example 13: Check Available Space Before Upload
async function uploadWithSpaceCheck(userId: string, imageBuffer: Buffer, filename: string) {
  // Check if there's enough space
  const hasSpace = await storageService.hasAvailableSpace(imageBuffer.length);

  if (!hasSpace) {
    throw new Error('Insufficient storage space');
  }

  // Proceed with upload
  const image = await storageService.storeImage({
    userId,
    filename,
    buffer: imageBuffer,
    mimetype: 'image/jpeg',
    isTemporary: false,
    generateVariants: true,
  });

  return image;
}

// Example 14: Get Image URL
async function getImageUrls(imageId: string) {
  const originalUrl = storageService.getImageUrl(imageId, 'original');
  const thumbnailUrl = storageService.getImageUrl(imageId, 'thumbnail');
  const mediumUrl = storageService.getImageUrl(imageId, 'medium');

  return {
    original: originalUrl,
    thumbnail: thumbnailUrl,
    medium: mediumUrl,
  };
}

// Example 15: Complete Upload Flow with Error Handling
async function completeUploadFlow(userId: string, tokenId: string, imageBuffer: Buffer, filename: string) {
  try {
    // Step 1: Check file size
    if (imageBuffer.length > 52428800) { // 50MB
      throw new Error('File too large');
    }

    // Step 2: Check available space
    const hasSpace = await storageService.hasAvailableSpace(imageBuffer.length * 2); // Account for variants
    if (!hasSpace) {
      throw new Error('Insufficient storage space');
    }

    // Step 3: Store as temporary
    const tempImage = await storageService.storeImage({
      userId,
      tokenId,
      filename,
      buffer: imageBuffer,
      mimetype: 'image/jpeg',
      isTemporary: true,
      ttl: 3600000, // 1 hour
      generateVariants: true,
      deduplicate: true,
    });

    // Step 4: Validate image
    const isValid = await validateImage(tempImage);
    if (!isValid) {
      await storageService.deleteImage(tempImage.id);
      throw new Error('Image validation failed');
    }

    // Step 5: Move to permanent storage
    await storageService.moveToPermanent(tempImage.id);

    // Step 6: Return result
    return {
      success: true,
      image: tempImage,
      urls: {
        original: storageService.getImageUrl(tempImage.id, 'original'),
        thumbnail: storageService.getImageUrl(tempImage.id, 'thumbnail'),
        medium: storageService.getImageUrl(tempImage.id, 'medium'),
      },
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// Example 16: Scheduled Cleanup Job
async function scheduledCleanupJob() {
  // Run cleanup every hour
  setInterval(async () => {
    console.log('Running scheduled cleanup...');

    const result = await storageService.cleanupOldImages({
      olderThan: new Date(Date.now() - 86400000), // 24 hours
      temporaryOnly: true,
      dryRun: false,
    });

    console.log(`Cleanup completed: ${result.processed} files processed, ${result.failed} failed`);

    // Get updated stats
    const stats = await storageService.getStorageStats();
    console.log(`Current storage usage: ${formatBytes(stats.storageUsage)}`);
  }, 3600000); // 1 hour
}

// Example 17: Storage Monitoring
async function monitorStorage() {
  const stats = await storageService.getStorageStats();
  const usagePercent = (stats.storageUsage / stats.storageLimit) * 100;

  // Alert if usage is high
  if (usagePercent > 90) {
    console.error('WARNING: Storage usage is above 90%!');
    // Send alert to monitoring service
    // alertService.send('Storage usage critical', { usagePercent });
  } else if (usagePercent > 75) {
    console.warn('WARNING: Storage usage is above 75%');
    // Send warning to monitoring service
    // alertService.send('Storage usage high', { usagePercent });
  }

  return stats;
}

// Example 18: User Storage Cleanup
async function cleanupUserStorage(userId: string) {
  const result = await storageService.cleanupOldImages({
    olderThan: new Date(Date.now() - 604800000), // 7 days
    temporaryOnly: true,
    userId,
    dryRun: false,
  });

  console.log(`Cleaned up ${result.processed} files for user ${userId}`);
  return result;
}

// Helper function: Format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Helper function: Validate image (placeholder)
async function validateImage(image: any): Promise<boolean> {
  // Your validation logic here
  // Check dimensions, format, content, etc.
  return true;
}

// Export examples
export {
  basicUpload,
  uploadWithValidation,
  uploadWithDeduplication,
  getImageVariants,
  listUserImages,
  listTokenImages,
  listTemporaryImages,
  deleteImage,
  batchDeleteImages,
  cleanupOldFiles,
  previewCleanup,
  getStorageInfo,
  uploadWithSpaceCheck,
  getImageUrls,
  completeUploadFlow,
  scheduledCleanupJob,
  monitorStorage,
  cleanupUserStorage,
};
