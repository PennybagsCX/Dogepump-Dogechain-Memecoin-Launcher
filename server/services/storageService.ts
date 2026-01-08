import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import config from '../config';
import { logger } from '../utils/logger';
import {
  generateFileId,
  generateChecksum,
  buildStoragePath,
  parseStoragePath,
  ensureDirectory,
  fileExists,
  deleteFile,
  deleteDirectory,
  listFilesRecursively,
  getDirectorySize,
  getFileSize,
  moveFile,
  copyFile,
  getFileStats,
  cleanupEmptyDirectories,
  sanitizeFilename,
  generateUniqueFilename,
  formatBytes,
  validatePath,
} from '../utils/storageUtils';
import type {
  StorageBackend,
  StoredImage,
  StorageStats,
  StoreImageOptions,
  GetImageOptions,
  ListImagesOptions,
  CleanupOptions,
  BatchOperationResult,
  ImageVariant,
  ImageStorageMetadata,
  ImageFormat,
} from '../types';

/**
 * Storage Service - S3-like API for local file storage
 * Designed for easy migration to MinIO or S3
 */
class StorageService {
  private basePath: string;
  private backend: StorageBackend;
  private checksumCache: Map<string, string> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.basePath = config.STORAGE.BASE_PATH;
    this.backend = config.STORAGE.BACKEND;
  }

  /**
   * Initialize storage service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Create base directories
      await this.ensureBaseDirectories();

      // Start cleanup interval
      this.startCleanupInterval();

      this.initialized = true;
      logger.info(`Storage service initialized with ${this.backend} backend`);
    } catch (error) {
      logger.error(error, 'Failed to initialize storage service:');
      throw error;
    }
  }

  /**
   * Ensure base directories exist
   */
  private async ensureBaseDirectories(): Promise<void> {
    const directories = [
      path.join(this.basePath, config.STORAGE.DIR_STRUCTURE.TEMP),
      path.join(this.basePath, config.STORAGE.DIR_STRUCTURE.PERMANENT),
    ];

    for (const dir of directories) {
      await ensureDirectory(dir);
    }
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    setInterval(async () => {
      try {
        await this.cleanupOldImages({
          olderThan: new Date(Date.now() - config.STORAGE.TEMP_FILE_TTL),
          temporaryOnly: true,
        });
      } catch (error) {
        logger.error(error, 'Error in automatic cleanup:');
      }
    }, config.STORAGE.CLEANUP_INTERVAL);
  }

  /**
   * Store an image with metadata
   * S3-like API: putObject equivalent
   */
  async storeImage(options: StoreImageOptions): Promise<StoredImage> {
    const {
      userId,
      tokenId,
      filename: originalFilename,
      buffer,
      mimetype,
      isTemporary = false,
      ttl,
      generateVariants = true,
      deduplicate = config.STORAGE.ENABLE_DEDUPLICATION,
    } = options;

    // Validate file size
    if (buffer.length > config.STORAGE.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${formatBytes(config.STORAGE.MAX_FILE_SIZE)}`);
    }

    // Validate file type
    if (!config.STORAGE.ALLOWED_TYPES.includes(mimetype)) {
      throw new Error(`File type ${mimetype} is not allowed`);
    }

    // Generate checksum for deduplication
    const checksum = generateChecksum(buffer);

    // Check for duplicate if deduplication is enabled
    if (deduplicate) {
      const existingImage = await this.findByChecksum(checksum, userId);
      if (existingImage) {
        logger.info(`Found duplicate image, returning existing: ${existingImage.id}`);
        return existingImage;
      }
    }

    // Generate unique ID and filename
    const imageId = generateFileId();
    const sanitizedFilename = sanitizeFilename(originalFilename);
    const uniqueFilename = generateUniqueFilename(sanitizedFilename);

    // Determine storage type directory
    const storageType = isTemporary ? config.STORAGE.DIR_STRUCTURE.TEMP : config.STORAGE.DIR_STRUCTURE.PERMANENT;

    // Build path for original image
    const originalPath = buildStoragePath({
      basePath: this.basePath,
      userId,
      tokenId,
      variant: 'original',
      filename: uniqueFilename,
    });

    // Ensure directory exists
    await ensureDirectory(path.dirname(originalPath));

    // Store original image
    await fs.writeFile(originalPath, buffer);

    // Get image metadata
    const metadata = await this.getImageMetadata(buffer, mimetype);

    // Generate variants if requested
    const variants: ImageVariant[] = [];
    if (generateVariants) {
      await this.generateImageVariants(
        buffer,
        imageId,
        userId,
        tokenId,
        uniqueFilename,
        metadata.format,
        variants,
      );
    }

    // Create stored image object
    const storedImage: StoredImage = {
      id: imageId,
      userId,
      tokenId,
      filename: uniqueFilename,
      originalPath,
      variants,
      metadata: {
        ...metadata,
        checksum,
        uploadedAt: new Date(),
      },
      isTemporary,
      createdAt: new Date(),
      expiresAt: isTemporary && ttl ? new Date(Date.now() + ttl) : undefined,
      size: buffer.length,
      checksum,
    };

    // Cache checksum
    this.checksumCache.set(checksum, imageId);

    logger.info(`Stored image: ${imageId} (${formatBytes(buffer.length)})`);
    return storedImage;
  }

  /**
   * Get image by ID
   * S3-like API: getObject equivalent
   */
  async getImage(imageId: string, options: GetImageOptions = {}): Promise<Buffer | null> {
    const { variant = 'original', fallbackToOriginal = true } = options;

    // Find image by ID (this would typically query a database)
    // For now, we'll search the filesystem
    const imagePath = await this.findImagePathById(imageId, variant);

    if (!imagePath) {
      if (fallbackToOriginal && variant !== 'original') {
        return this.getImage(imageId, { variant: 'original', fallbackToOriginal: false });
      }
      return null;
    }

    try {
      const buffer = await fs.readFile(imagePath);
      return buffer;
    } catch (error) {
      logger.error(error, `Error reading image ${imageId}:`);
      return null;
    }
  }

  /**
   * Delete image and all variants
   * S3-like API: deleteObject equivalent
   */
  async deleteImage(imageId: string): Promise<boolean> {
    try {
      // Find all files for this image
      const files = await this.findImageFilesById(imageId);

      if (files.length === 0) {
        logger.warn(`Image not found: ${imageId}`);
        return false;
      }

      // Delete all files
      let deletedCount = 0;
      for (const file of files) {
        if (await deleteFile(file)) {
          deletedCount++;
        }
      }

      // Cleanup empty directories
      if (files.length > 0) {
        await cleanupEmptyDirectories(path.dirname(files[0]));
      }

      logger.info(`Deleted image ${imageId} (${deletedCount} files)`);
      return true;
    } catch (error) {
      logger.error(error, `Error deleting image ${imageId}:`);
      return false;
    }
  }

  /**
   * List images by criteria
   * S3-like API: listObjects equivalent
   */
  async listImages(options: ListImagesOptions = {}): Promise<StoredImage[]> {
    const {
      userId,
      tokenId,
      isTemporary,
      limit = 100,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    let images: StoredImage[] = [];

    // Search in appropriate directory
    const storageType = isTemporary === undefined
      ? undefined
      : (isTemporary ? config.STORAGE.DIR_STRUCTURE.TEMP : config.STORAGE.DIR_STRUCTURE.PERMANENT);

    const searchPaths: string[] = [];

    if (userId) {
      if (tokenId) {
        searchPaths.push(path.join(this.basePath, storageType || '', userId, tokenId));
      } else {
        searchPaths.push(path.join(this.basePath, storageType || '', userId));
      }
    } else if (storageType) {
      searchPaths.push(path.join(this.basePath, storageType));
    } else {
      searchPaths.push(this.basePath);
    }

    // Collect images from all search paths
    for (const searchPath of searchPaths) {
      try {
        const files = await listFilesRecursively(searchPath);
        for (const file of files) {
          // Only process original images (not variants)
          if (file.includes('/original/')) {
            const image = await this.createStoredImageFromPath(file);
            if (image) {
              images.push(image);
            }
          }
        }
      } catch (error) {
        // Directory might not exist
        continue;
      }
    }

    // Sort images
    images.sort((a, b) => {
      const comparison = a[sortBy] < b[sortBy] ? -1 : 1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    return images.slice(offset, offset + limit);
  }

  /**
   * Clean up old or temporary images
   */
  async cleanupOldImages(options: CleanupOptions = {}): Promise<BatchOperationResult> {
    const {
      olderThan = new Date(Date.now() - config.STORAGE.TEMP_FILE_TTL),
      temporaryOnly = true,
      dryRun = false,
      userId,
    } = options;

    const result: BatchOperationResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Determine which directories to clean
      const directoriesToClean: string[] = [];

      if (temporaryOnly) {
        directoriesToClean.push(path.join(this.basePath, config.STORAGE.DIR_STRUCTURE.TEMP));
      } else {
        directoriesToClean.push(this.basePath);
      }

      for (const dir of directoriesToClean) {
        const files = await listFilesRecursively(dir);

        for (const file of files) {
          try {
            const stats = await getFileStats(file);
            const components = parseStoragePath(file, this.basePath);

            // Check if file matches criteria
            if (stats.modified < olderThan) {
              if (userId && components?.userId !== userId) {
                continue;
              }

              if (!dryRun) {
                await deleteFile(file);
              }

              result.processed++;
              logger.info(`${dryRun ? '[DRY RUN] ' : ''}Cleaned up file: ${file}`);
            }
          } catch (error) {
            result.failed++;
            result.errors.push({ id: file, error: (error as Error).message });
          }
        }
      }

      // Cleanup empty directories
      if (!dryRun) {
        for (const dir of directoriesToClean) {
          await cleanupEmptyDirectories(dir);
        }
      }

      logger.info(`Cleanup completed: ${result.processed} files processed, ${result.failed} failed`);
    } catch (error) {
      result.success = false;
      logger.error(error, 'Error during cleanup:');
    }

    return result;
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    const stats: StorageStats = {
      totalImages: 0,
      totalSize: 0,
      totalVariants: 0,
      tempImages: 0,
      permanentImages: 0,
      storageUsage: 0,
      storageLimit: config.STORAGE.MAX_STORAGE_SIZE,
    };

    try {
      // Get all files
      const allFiles = await listFilesRecursively(this.basePath);

      let oldestDate: Date | undefined;
      let newestDate: Date | undefined;

      for (const file of allFiles) {
        const fileStats = await getFileStats(file);
        const components = parseStoragePath(file, this.basePath);

        stats.totalSize += fileStats.size;

        // Track dates
        if (!oldestDate || fileStats.created < oldestDate) {
          oldestDate = fileStats.created;
        }
        if (!newestDate || fileStats.created > newestDate) {
          newestDate = fileStats.created;
        }

        // Count by type
        if (components) {
          const isTemp = file.includes(config.STORAGE.DIR_STRUCTURE.TEMP);
          const isOriginal = file.includes('/original/');

          if (isOriginal) {
            if (isTemp) {
              stats.tempImages++;
            } else {
              stats.permanentImages++;
            }
            stats.totalImages++;
          } else {
            stats.totalVariants++;
          }
        }
      }

      stats.storageUsage = stats.totalSize;
      stats.oldestFile = oldestDate;
      stats.newestFile = newestDate;

      logger.info(`Storage stats: ${formatBytes(stats.totalSize)} used, ${stats.totalImages} images`);
    } catch (error) {
      logger.error(error, 'Error getting storage stats:');
    }

    return stats;
  }

  /**
   * Move image from temporary to permanent storage
   */
  async moveToPermanent(imageId: string): Promise<boolean> {
    try {
      const files = await this.findImageFilesById(imageId);

      if (files.length === 0) {
        logger.warn(`Image not found: ${imageId}`);
        return false;
      }

      for (const file of files) {
        if (file.includes(config.STORAGE.DIR_STRUCTURE.TEMP)) {
          const newPath = file.replace(
            `/${config.STORAGE.DIR_STRUCTURE.TEMP}/`,
            `/${config.STORAGE.DIR_STRUCTURE.PERMANENT}/`
          );
          await moveFile(file, newPath);
        }
      }

      logger.info(`Moved image ${imageId} to permanent storage`);
      return true;
    } catch (error) {
      logger.error(error, `Error moving image ${imageId} to permanent storage:`);
      return false;
    }
  }

  /**
   * Batch delete images
   * S3-like API: deleteObjects equivalent
   */
  async batchDeleteImages(imageIds: string[]): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    };

    for (const imageId of imageIds) {
      try {
        const deleted = await this.deleteImage(imageId);
        if (deleted) {
          result.processed++;
        } else {
          result.failed++;
          result.errors.push({ id: imageId, error: 'Image not found' });
        }
      } catch (error) {
        result.failed++;
        result.errors.push({ id: imageId, error: (error as Error).message });
      }
    }

    return result;
  }

  /**
   * Check if storage has space available
   */
  async hasAvailableSpace(requiredSize: number): Promise<boolean> {
    const stats = await this.getStorageStats();
    return (stats.storageUsage + requiredSize) <= stats.storageLimit;
  }

  /**
   * Get image URL for serving
   */
  getImageUrl(imageId: string, variant: string = 'original'): string {
    return `/api/images/${imageId}?variant=${variant}`;
  }

  // Private helper methods

  /**
   * Generate image variants
   */
  private async generateImageVariants(
    buffer: Buffer,
    imageId: string,
    userId: string,
    tokenId: string | undefined,
    filename: string,
    format: ImageFormat,
    variants: ImageVariant[],
  ): Promise<void> {
    const sizes = [
      { name: 'thumbnail', width: config.IMAGE.SIZES.THUMBNAIL, quality: config.IMAGE.QUALITY.LOW },
      { name: 'small', width: config.IMAGE.SIZES.SMALL, quality: config.IMAGE.QUALITY.MEDIUM },
      { name: 'medium', width: config.IMAGE.SIZES.MEDIUM, quality: config.IMAGE.QUALITY.MEDIUM },
      { name: 'large', width: config.IMAGE.SIZES.LARGE, quality: config.IMAGE.QUALITY.HIGH },
      { name: 'xlarge', width: config.IMAGE.SIZES.EXTRA_LARGE, quality: config.IMAGE.QUALITY.HIGH },
    ];

    for (const size of sizes) {
      try {
        const variantBuffer = await sharp(buffer)
          .resize(size.width, size.width, { fit: 'inside', withoutEnlargement: true })
          .toFormat(format, { quality: size.quality })
          .toBuffer();

        const variantPath = buildStoragePath({
          basePath: this.basePath,
          userId,
          tokenId,
          variant: size.name,
          filename,
        });

        await ensureDirectory(path.dirname(variantPath));
        await fs.writeFile(variantPath, variantBuffer);

        const metadata = await sharp(variantBuffer).metadata();

        variants.push({
          name: size.name,
          width: metadata.width || size.width,
          height: metadata.height || size.width,
          format,
          quality: size.quality,
          url: this.getImageUrl(imageId, size.name),
          size: variantBuffer.length,
        });

        logger.info(`Generated variant ${size.name} for image ${imageId}`);
      } catch (error) {
        logger.error(error, `Error generating variant ${size.name} for image ${imageId}:`);
      }
    }
  }

  /**
   * Get image metadata from buffer
   */
  private async getImageMetadata(buffer: Buffer, mimetype: string): Promise<Omit<ImageStorageMetadata, 'checksum' | 'uploadedAt'>> {
    const metadata = await sharp(buffer).metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: (metadata.format as ImageFormat) || 'jpeg',
      size: buffer.length,
      mimetype,
    };
  }

  /**
   * Find image path by ID
   */
  private async findImagePathById(imageId: string, variant: string): Promise<string | null> {
    const files = await this.findImageFilesById(imageId);
    return files.find(file => file.includes(`/${variant}/`)) || null;
  }

  /**
   * Find all files for an image by ID
   */
  private async findImageFilesById(imageId: string): Promise<string[]> {
    const allFiles = await listFilesRecursively(this.basePath);
    return allFiles.filter(file => file.includes(imageId));
  }

  /**
   * Find image by checksum
   */
  private async findByChecksum(checksum: string, userId: string): Promise<StoredImage | null> {
    // Check cache first
    const cachedId = this.checksumCache.get(checksum);
    if (cachedId) {
      const files = await this.findImageFilesById(cachedId);
      if (files.length > 0) {
        return this.createStoredImageFromPath(files[0]);
      }
    }

    // Search filesystem
    const files = await listFilesRecursively(this.basePath);
    for (const file of files) {
      if (file.includes('/original/')) {
        try {
          const buffer = await fs.readFile(file);
          const fileChecksum = generateChecksum(buffer);

          if (fileChecksum === checksum) {
            const components = parseStoragePath(file, this.basePath);
            if (components?.userId === userId) {
              return this.createStoredImageFromPath(file);
            }
          }
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Create StoredImage object from file path
   */
  private async createStoredImageFromPath(filePath: string): Promise<StoredImage | null> {
    try {
      const components = parseStoragePath(filePath, this.basePath);
      if (!components) {
        return null;
      }

      const buffer = await fs.readFile(filePath);
      const stats = await getFileStats(filePath);
      const metadata = await sharp(buffer).metadata();
      const checksum = generateChecksum(buffer);

      // Find all variants
      const variants: ImageVariant[] = [];
      const variantDir = path.dirname(filePath).replace('/original', '');
      const variantFiles = await listFilesRecursively(variantDir);

      for (const variantFile of variantFiles) {
        if (variantFile !== filePath && variantFile.includes(components.filename)) {
          const variantName = path.basename(path.dirname(variantFile));
          const variantBuffer = await fs.readFile(variantFile);
          const variantMetadata = await sharp(variantBuffer).metadata();

          variants.push({
            name: variantName,
            width: variantMetadata.width || 0,
            height: variantMetadata.height || 0,
            format: (variantMetadata.format as ImageFormat) || 'jpeg',
            quality: 80,
            url: this.getImageUrl(components.userId, variantName),
            size: variantBuffer.length,
          });
        }
      }

      // Extract image ID from path (would normally come from database)
      const imageId = path.basename(path.dirname(path.dirname(filePath))) || generateFileId();

      return {
        id: imageId,
        userId: components.userId,
        tokenId: components.tokenId,
        filename: components.filename,
        originalPath: filePath,
        variants,
        metadata: {
          width: metadata.width || 0,
          height: metadata.height || 0,
          format: (metadata.format as ImageFormat) || 'jpeg',
          size: buffer.length,
          mimetype: `image/${metadata.format}`,
          checksum,
          uploadedAt: stats.created,
        },
        isTemporary: filePath.includes(config.STORAGE.DIR_STRUCTURE.TEMP),
        createdAt: stats.created,
        size: buffer.length,
        checksum,
      };
    } catch (error) {
      logger.error(error, `Error creating stored image from path ${filePath}:`);
      return null;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
