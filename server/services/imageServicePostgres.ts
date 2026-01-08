/**
 * PostgreSQL-based Image Service
 * 
 * Provides persistent image storage and management with PostgreSQL database.
 * Handles image upload, retrieval, deletion, and variant generation.
 */

import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';
import { query, transaction } from '../database/db.js';
import { logger } from '../utils/logger.js';
import { getSecurityService } from '../services/securityService.js';
import { validateFile } from '../middleware/upload.js';

export interface ImageRecord {
  id: string;
  userId: string;
  filename: string;
  originalFilename: string;
  mimetype: string;
  size: number;
  width: number | null;
  height: number | null;
  format: string;
  checksum: string;
  isTemporary: boolean;
  isDeleted: boolean;
  storagePath: string | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageVariant {
  id: string;
  imageId: string;
  name: string;
  width: number;
  height: number;
  size: number;
  format: string;
  storagePath: string;
  createdAt: Date;
}

export interface UploadResult {
  success: boolean;
  image: ImageRecord;
  variants?: ImageVariant[];
  duplicate?: boolean;
}

/**
 * PostgreSQL-based Image Service
 */
export class ImageService {
  /**
   * Stores an uploaded image
   */
  async storeImage(options: {
    userId: string;
    filename: string;
    originalFilename: string;
    buffer: Buffer;
    mimetype: string;
    isTemporary?: boolean;
    generateVariants?: boolean;
  }): Promise<UploadResult> {
    const {
      userId,
      filename,
      originalFilename,
      buffer,
      mimetype,
      isTemporary = false,
      generateVariants = true,
    } = options;

    // Validate file
    const validation = await validateFile(buffer, mimetype, filename);
    if (!validation.valid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
    }

    // Generate checksum
    const checksum = this.generateChecksum(buffer);

    // Check if image with this checksum already exists
    const existingImageResult = await query(
      'SELECT * FROM images WHERE checksum = $1 AND is_deleted = false',
      [checksum]
    );

    if (existingImageResult.rows.length > 0) {
      const existingImage = existingImageResult.rows[0];
      logger.info({
        existingImageId: existingImage.id,
        checksum,
      }, 'Duplicate image detected, returning existing image');
      
      // Get variants for existing image
      const variantsResult = await query(
        'SELECT * FROM image_variants WHERE image_id = $1',
        [existingImage.id]
      );
      
      return {
        success: true,
        image: existingImage,
        variants: variantsResult.rows,
        duplicate: true,
      };
    }

    // Strip EXIF metadata
    const securityService = getSecurityService();
    const sanitizedBuffer = await securityService.stripMetadata(buffer);

    // Get image metadata
    let metadata: any = {};
    let width: number | null = null;
    let height: number | null = null;

    try {
      const image = sharp(sanitizedBuffer);
      const imageMetadata = await image.metadata();
      width = imageMetadata.width || null;
      height = imageMetadata.height || null;
      metadata = {
        width,
        height,
        format: imageMetadata.format,
        hasAlpha: imageMetadata.hasAlpha,
        density: imageMetadata.density,
      };
    } catch (error) {
      logger.warn({ error }, 'Failed to extract image metadata');
    }

    // Determine format
    const format = this.determineFormat(mimetype, metadata.format);

    // Generate image ID first (for consistent storage path)
    const imageId = uuidv4();

    // Store image
    try {
      // Generate storage path and save to disk
      const storageType = isTemporary ? config.STORAGE.DIR_STRUCTURE.TEMP : config.STORAGE.DIR_STRUCTURE.PERMANENT;
      const storageDir = path.join(config.STORAGE.BASE_PATH, storageType, userId);
      const storageFilename = `${imageId}.${format}`;
      const storagePath = path.join(storageDir, storageFilename);

      // Ensure directory exists
      await fs.mkdir(storageDir, { recursive: true });

      // Write image file to disk
      await fs.writeFile(storagePath, sanitizedBuffer);

      logger.info({
        imageId,
        storagePath,
        size: buffer.length,
      }, 'Image file saved to disk');

      const result = await query(
        `INSERT INTO images (id, user_id, filename, original_filename, mimetype, size, width, height, format, checksum, is_temporary, is_deleted, storage_path, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
         RETURNING *`,
        [
          imageId,
          userId,
          filename,
          originalFilename,
          mimetype,
          buffer.length,
          width,
          height,
          format,
          checksum,
          isTemporary,
          false,
          storagePath,
          JSON.stringify(metadata),
        ]
      );

      const image = result.rows[0];

      // Generate and store variants if requested
      let variants: ImageVariant[] = [];
      if (generateVariants && width && height) {
        variants = await this.generateVariants(image.id, sanitizedBuffer, width, height, format);
      }

      logger.info({
        filename,
        size: buffer.length,
        variantsCount: variants.length,
      }, `Image stored: ${image.id} for user ${userId}`);

      return {
        success: true,
        image,
        variants,
        duplicate: false,
      };
    } catch (error: any) {
      // Check for PostgreSQL unique constraint violation
      if (error.code === '23505' && error.constraint === 'images_checksum_key') {
        // Another process inserted same checksum - fetch and return
        logger.info({
          checksum,
        }, 'Duplicate image detected via constraint violation');
        
        const existingImageResult = await query(
          'SELECT * FROM images WHERE checksum = $1 AND is_deleted = false',
          [checksum]
        );
        
        if (existingImageResult.rows.length > 0) {
          const existingImage = existingImageResult.rows[0];
          
          const variantsResult = await query(
            'SELECT * FROM image_variants WHERE image_id = $1',
            [existingImage.id]
          );
          
          return {
            success: true,
            image: existingImage,
            variants: variantsResult.rows,
            duplicate: true,
          };
        }
      }
      
      // Re-throw if not a duplicate constraint error
      throw error;
    }
  }

  /**
   * Retrieves an image by ID
   */
  async getImage(imageId: string, options?: { variant?: string }): Promise<Buffer | null> {
    // Check if image exists and is not deleted
    const imageResult = await query(
      'SELECT * FROM images WHERE id = $1 AND is_deleted = false',
      [imageId]
    );

    if (imageResult.rows.length === 0) {
      return null;
    }

    const image = imageResult.rows[0];

    // If variant requested, return variant
    if (options?.variant) {
      const variantResult = await query(
        'SELECT * FROM image_variants WHERE image_id = $1 AND name = $2',
        [imageId, options.variant]
      );

      if (variantResult.rows.length > 0) {
        const variant = variantResult.rows[0];
        return this.readFromStorage(variant.storage_path);
      }
    }

    // Return original image
    return this.readFromStorage(image.storage_path);
  }

  /**
   * Deletes an image
   */
  async deleteImage(imageId: string, userId: string): Promise<void> {
    await transaction(async (client) => {
      // Check if user owns the image
      const imageResult = await client.query(
        'SELECT user_id FROM images WHERE id = $1 AND is_deleted = false',
        [imageId]
      );

      if (imageResult.rows.length === 0) {
        throw new Error('Image not found');
      }

      if (imageResult.rows[0].user_id !== userId) {
        throw new Error('You do not have permission to delete this image');
      }

      // Mark image as deleted (soft delete)
      await client.query(
        'UPDATE images SET is_deleted = true, updated_at = NOW() WHERE id = $1',
        [imageId]
      );

      logger.info(`Image deleted: ${imageId} by user ${userId}`);
    });
  }

  /**
   * Lists images for a user
   */
  async listImages(options: {
    userId: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ images: ImageRecord[]; total: number }> {
    const {
      userId,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = options;

    const offset = (page - 1) * limit;

    // Validate sort field
    const allowedSortFields = ['created_at', 'updated_at', 'filename', 'size'];
    if (!allowedSortFields.includes(sortBy)) {
      throw new Error(`Invalid sort field: ${sortBy}`);
    }

    const result = await query(
      `SELECT * FROM images 
       WHERE user_id = $1 AND is_deleted = false 
       ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as count FROM images WHERE user_id = $1 AND is_deleted = false',
      [userId]
    );

    return {
      images: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  /**
   * Gets image metadata
   */
  async getImageMetadata(imageId: string): Promise<any | null> {
    const result = await query(
      'SELECT metadata, created_at, updated_at, size, width, height, format FROM images WHERE id = $1 AND is_deleted = false',
      [imageId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const image = result.rows[0];
    return {
      ...image.metadata,
      createdAt: image.created_at,
      updatedAt: image.updated_at,
      size: image.size,
      width: image.width,
      height: image.height,
      format: image.format,
    };
  }

  /**
   * Generates image variants
   */
  private async generateVariants(
    imageId: string,
    buffer: Buffer,
    originalWidth: number,
    originalHeight: number,
    format: string
  ): Promise<ImageVariant[]> {
    const variants: ImageVariant[] = [];
    const sizes = [
      { name: 'thumbnail', width: config.IMAGE.SIZES.THUMBNAIL },
      { name: 'small', width: config.IMAGE.SIZES.SMALL },
      { name: 'medium', width: config.IMAGE.SIZES.MEDIUM },
      { name: 'large', width: config.IMAGE.SIZES.LARGE },
      { name: 'extra_large', width: config.IMAGE.SIZES.EXTRA_LARGE },
    ];

    const image = sharp(buffer);
    const aspectRatio = originalWidth / originalHeight;

    for (const size of sizes) {
      // Skip if requested size is larger than original
      if (size.width > originalWidth) {
        continue;
      }

      // Calculate height maintaining aspect ratio
      const height = Math.round(size.width / aspectRatio);

      // Generate variant
      const variantBuffer = await image
        .resize(size.width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFormat(format as any, {
          quality: config.IMAGE.QUALITY.MEDIUM,
        })
        .toBuffer();

      if (!variantBuffer) {
        logger.warn(`Failed to generate variant: ${size.name}`);
        continue;
      }

      // Store variant
      const result = await query(
        `INSERT INTO image_variants (image_id, name, width, height, size, format, storage_path, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           RETURNING *`,
        [
          imageId,
          size.name,
          size.width,
          height,
          variantBuffer.length,
          format,
          null, // storage_path would be set by storage service
        ]
      );

      variants.push(result.rows[0]);
    }

    logger.info(`Generated ${variants.length} variants for image ${imageId}`);
    return variants;
  }

  /**
   * Generates checksum for file
   */
  private generateChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Determines image format
   */
  private determineFormat(mimetype: string, sharpFormat: string | undefined): string {
    const formatMap: Record<string, string> = {
      'image/jpeg': 'jpeg',
      'image/jpg': 'jpeg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/avif': 'avif',
      'image/gif': 'gif',
    };

    return formatMap[mimetype] || sharpFormat || 'jpeg';
  }

  /**
   * Reads image from storage
   */
  private async readFromStorage(storagePath: string | null): Promise<Buffer | null> {
    if (!storagePath) {
      logger.warn('Storage path is null, cannot read image');
      return null;
    }

    try {
      // Check if file exists
      await fs.access(storagePath);

      // Read and return the image buffer
      const buffer = await fs.readFile(storagePath);
      logger.info({
        storagePath,
        size: buffer.length,
      }, 'Image read from storage');
      return buffer;
    } catch (error) {
      logger.error({
        storagePath,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to read image from storage');
      return null;
    }
  }

  /**
   * Cleans up old temporary images
   */
  async cleanupTemporaryImages(olderThanHours: number = 24): Promise<number> {
    // First count the images to be deleted
    const countResult = await query(
      `SELECT COUNT(*) as count FROM images
       WHERE is_temporary = true
       AND created_at < NOW() - INTERVAL '${olderThanHours} hours'`,
      []
    );

    const count = parseInt(countResult.rows[0].count);

    // Then perform the update
    if (count > 0) {
      await query(
        `UPDATE images SET is_deleted = true, updated_at = NOW()
         WHERE is_temporary = true
         AND created_at < NOW() - INTERVAL '${olderThanHours} hours'`,
        []
      );
      logger.info(`Cleaned up ${count} temporary images older than ${olderThanHours} hours`);
    }

    return count;
  }

  /**
   * Gets storage usage for a user
   */
  async getUserStorageUsage(userId: string): Promise<{ totalSize: number; imageCount: number }> {
    const result = await query(
      `SELECT 
         COALESCE(SUM(size), 0) as total_size,
         COUNT(*) as image_count
       FROM images 
       WHERE user_id = $1 AND is_deleted = false`,
      [userId]
    );

    return {
      totalSize: parseInt(result.rows[0].total_size),
      imageCount: parseInt(result.rows[0].image_count),
    };
  }
}

// Export singleton instance
export const imageService = new ImageService();

// Start cleanup interval for temporary images
setInterval(() => {
  imageService.cleanupTemporaryImages();
}, config.STORAGE.CLEANUP_INTERVAL);
