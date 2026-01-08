import sharp, { Sharp, Metadata } from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import config from '../config.js';
import logger from '../utils/logger.js';
import {
  UploadedFile,
  ProcessingOptions,
  ImageDimensions,
  ImageFormat,
  ImageProcessingResult,
  ImageMetadataResult,
  ImageVariant,
} from '../types/index.js';
import {
  getFormatFromMimeType,
  isSupportedFormat,
  validateDimensions,
  parseQuality,
  getDefaultQuality,
  generateFilename,
  calculateDimensions,
} from '../utils/imageUtils.js';

/**
 * Image Service
 *
 * Comprehensive image processing service using Sharp for server-side image operations.
 * Supports multiple formats (JPEG, PNG, WebP, AVIF), compression, resizing, metadata stripping,
 * and multiple size variants generation.
 *
 * Features:
 * - Format conversion (JPEG, PNG, WebP, AVIF)
 * - Image resizing with aspect ratio preservation
 * - Quality-based compression
 * - Multiple size variants (thumbnail, small, medium, large, extra-large)
 * - EXIF/metadata stripping for privacy
 * - Progressive loading support
 * - Transparent image handling
 * - Comprehensive error handling
 * - Image validation and integrity checks
 */
export class ImageService {
  /**
   * Main image processing function
   * Applies multiple transformations based on provided options
   */
  async processImage(
    imageBuffer: Buffer,
    options: ProcessingOptions = {}
  ): Promise<ImageProcessingResult> {
    try {
      // Validate input
      if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
        throw new Error('Invalid image buffer provided');
      }

      // Create Sharp instance
      let sharpInstance: Sharp = sharp(imageBuffer, {
        failOnError: true,
        unlimited: false,
      });

      // Get original metadata
      const metadata = await sharpInstance.metadata();

      // Validate image integrity
      if (!metadata.format || !metadata.width || !metadata.height) {
        throw new Error('Invalid or corrupted image');
      }

      // Validate dimensions
      const dimensionsValidation = validateDimensions(
        metadata.width,
        metadata.height,
        config.IMAGE.MIN_WIDTH,
        config.IMAGE.MIN_HEIGHT,
        config.IMAGE.MAX_WIDTH,
        config.IMAGE.MAX_HEIGHT
      );

      if (!dimensionsValidation.valid) {
        throw new Error(dimensionsValidation.error);
      }

      // Strip metadata if requested or by default
      if (options.stripMetadata !== false) {
        sharpInstance = sharpInstance.withMetadata({ exif: undefined });
      }

      // Resize if dimensions specified
      if (options.width || options.height) {
        const calculatedDims = calculateDimensions(
          metadata.width,
          metadata.height,
          options.width,
          options.height,
          options.fit || 'cover'
        );

        sharpInstance = sharpInstance.resize(calculatedDims.width, calculatedDims.height, {
          fit: options.fit || 'cover',
          background: options.background || config.IMAGE.BACKGROUND_COLOR,
          withoutEnlargement: options.withoutEnlargement !== false,
        });
      }

      // Determine output format
      const outputFormat: ImageFormat = options.format || config.IMAGE.DEFAULT_FORMAT;

      // Validate format
      if (!isSupportedFormat(outputFormat)) {
        throw new Error(`Unsupported format: ${outputFormat}`);
      }

      // Determine quality
      const quality = parseQuality(options.quality);

      // Apply format-specific settings
      switch (outputFormat) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({
            quality,
            progressive: options.progressive || config.IMAGE.PROGRESSIVE,
            mozjpeg: true,
          });
          break;

        case 'png':
          sharpInstance = sharpInstance.png({
            quality,
            progressive: options.progressive || config.IMAGE.PROGRESSIVE,
            compressionLevel: 9,
            adaptiveFiltering: true,
          });
          break;

        case 'webp':
          sharpInstance = sharpInstance.webp({
            quality,
            effort: 4, // High quality
            smartSubsample: true,
          });
          break;

        case 'avif':
          sharpInstance = sharpInstance.avif({
            quality,
            effort: 6, // High quality
            chromaSubsampling: '4:4:4',
          });
          break;
      }

      // Process image
      const processedBuffer = await sharpInstance.toBuffer();

      // Get final metadata
      const finalMetadata = await sharp(processedBuffer).metadata();

      return {
        success: true,
        buffer: processedBuffer,
        metadata: this.extractMetadata(finalMetadata, processedBuffer.length),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      logger.error({ error: errorMessage }, 'Image processing failed');
      return {
        success: false,
        buffer: Buffer.alloc(0),
        metadata: {} as ImageMetadataResult,
        error: errorMessage,
      };
    }
  }

  /**
   * Compress image with specified quality
   */
  async compressImage(
    imageBuffer: Buffer,
    quality: number = config.IMAGE.QUALITY.MEDIUM,
    format?: ImageFormat
  ): Promise<ImageProcessingResult> {
    return this.processImage(imageBuffer, {
      quality: parseQuality(quality),
      format,
    });
  }

  /**
   * Resize image to specified dimensions
   */
  async resizeImage(
    imageBuffer: Buffer,
    width?: number,
    height?: number,
    options: {
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
      withoutEnlargement?: boolean;
      background?: string;
    } = {}
  ): Promise<ImageProcessingResult> {
    return this.processImage(imageBuffer, {
      width,
      height,
      fit: options.fit || 'cover',
      withoutEnlargement: options.withoutEnlargement,
      background: options.background,
    });
  }

  /**
   * Convert image to different format
   */
  async convertFormat(
    imageBuffer: Buffer,
    targetFormat: ImageFormat,
    quality?: number
  ): Promise<ImageProcessingResult> {
    return this.processImage(imageBuffer, {
      format: targetFormat,
      quality: quality || getDefaultQuality(targetFormat),
    });
  }

  /**
   * Generate thumbnail version
   */
  async generateThumbnail(
    imageBuffer: Buffer,
    size: number = config.IMAGE.SIZES.THUMBNAIL,
    quality: number = config.IMAGE.QUALITY.MEDIUM,
    format?: ImageFormat
  ): Promise<ImageProcessingResult> {
    return this.processImage(imageBuffer, {
      width: size,
      height: size,
      fit: 'cover',
      quality,
      format,
    });
  }

  /**
   * Generate multiple size variants
   */
  async generateVariants(
    imageBuffer: Buffer,
    baseFilename: string,
    formats: ImageFormat[] = ['webp', 'jpeg'],
    sizes: Array<{ name: string; size: number }> = [
      { name: 'thumbnail', size: config.IMAGE.SIZES.THUMBNAIL },
      { name: 'small', size: config.IMAGE.SIZES.SMALL },
      { name: 'medium', size: config.IMAGE.SIZES.MEDIUM },
      { name: 'large', size: config.IMAGE.SIZES.LARGE },
    ]
  ): Promise<ImageVariant[]> {
    const variants: ImageVariant[] = [];

    for (const format of formats) {
      for (const { name, size } of sizes) {
        const result = await this.generateThumbnail(imageBuffer, size, config.IMAGE.QUALITY.MEDIUM, format);

        if (result.success) {
          const filename = generateFilename(baseFilename, format, `${name}_${size}`);
          variants.push({
            name: `${name}_${format}`,
            width: result.metadata.width,
            height: result.metadata.height,
            format,
            quality: config.IMAGE.QUALITY.MEDIUM,
            url: `/uploads/${filename}`,
            size: result.metadata.size,
          });
        }
      }
    }

    return variants;
  }

  /**
   * Strip EXIF and other metadata from image
   */
  async stripMetadata(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const stripped = await sharp(imageBuffer)
        .withMetadata({ exif: undefined })
        .toBuffer();
      return stripped;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to strip image metadata';
      logger.error({ error: errorMessage }, 'Failed to strip metadata');
      throw new Error('Failed to strip image metadata');
    }
  }

  /**
   * Validate image integrity and format
   */
  async validateImage(file: UploadedFile): Promise<{ valid: boolean; error?: string; metadata?: Metadata }> {
    try {
      // Check file size
      if (file.data.length > config.MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `File size exceeds maximum allowed size of ${config.MAX_FILE_SIZE} bytes`,
        };
      }

      // Check MIME type
      const format = getFormatFromMimeType(file.mimetype);
      if (!format) {
        return {
          valid: false,
          error: `Unsupported MIME type: ${file.mimetype}`,
        };
      }

      // Check if format is allowed
      if (!config.IMAGE.ALLOWED_FORMATS.includes(format)) {
        return {
          valid: false,
          error: `Format not allowed: ${format}`,
        };
      }

      // Try to parse image with Sharp
      const metadata = await sharp(file.data).metadata();

      // Validate image has required metadata
      if (!metadata.format || !metadata.width || !metadata.height) {
        return {
          valid: false,
          error: 'Invalid or corrupted image',
        };
      }

      // Validate dimensions
      const dimensionsValidation = validateDimensions(
        metadata.width,
        metadata.height,
        config.IMAGE.MIN_WIDTH,
        config.IMAGE.MIN_HEIGHT,
        config.IMAGE.MAX_WIDTH,
        config.IMAGE.MAX_HEIGHT
      );

      if (!dimensionsValidation.valid) {
        return {
          valid: false,
          error: dimensionsValidation.error,
        };
      }

      return {
        valid: true,
        metadata,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      logger.error({ error: errorMessage }, 'Image validation failed');
      return {
        valid: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(imageBuffer: Buffer): Promise<ImageDimensions> {
    try {
      const metadata = await sharp(imageBuffer).metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Could not determine image dimensions');
      }

      return {
        width: metadata.width,
        height: metadata.height,
        aspectRatio: metadata.width / metadata.height,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get image dimensions';
      logger.error({ error: errorMessage }, 'Failed to get image dimensions');
      throw new Error('Failed to get image dimensions');
    }
  }

  /**
   * Get comprehensive image metadata
   */
  async getImageMetadata(imageBuffer: Buffer): Promise<ImageMetadataResult> {
    try {
      const metadata = await sharp(imageBuffer).metadata();

      return this.extractMetadata(metadata, imageBuffer.length);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get image metadata';
      logger.error({ error: errorMessage }, 'Failed to get image metadata');
      throw new Error('Failed to get image metadata');
    }
  }

  /**
   * Extract and format metadata from Sharp metadata object
   */
  private extractMetadata(metadata: Metadata, size: number): ImageMetadataResult {
    return {
      format: metadata.format || 'unknown',
      width: metadata.width || 0,
      height: metadata.height || 0,
      space: metadata.space || 'srgb',
      channels: metadata.channels || 3,
      depth: metadata.depth || 'uchar',
      density: metadata.density || 72,
      hasAlpha: metadata.hasAlpha || false,
      hasProfile: metadata.hasProfile || false,
      orientation: metadata.orientation || 1,
      size,
    };
  }

  /**
   * Upload and process image
   * Saves processed image to disk and returns URL
   */
  async uploadImage(
    file: UploadedFile,
    userId: string,
    options: ProcessingOptions = {}
  ): Promise<{ success: boolean; url?: string; error?: string; variants?: ImageVariant[] }> {
    try {
      // Validate image
      const validation = await this.validateImage(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Create upload directory if it doesn't exist
      await fs.mkdir(config.UPLOAD_DIR, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const baseFilename = `${userId}_${timestamp}_${random}`;

      // Process image
      const processed = await this.processImage(file.data, options);

      if (!processed.success) {
        return {
          success: false,
          error: processed.error,
        };
      }

      // Determine format
      const format = options.format || config.IMAGE.DEFAULT_FORMAT;
      const filename = generateFilename(baseFilename, format);
      const filepath = path.join(config.UPLOAD_DIR, filename);

      // Save processed image
      await fs.writeFile(filepath, processed.buffer);

      // Generate variants if requested
      let variants: ImageVariant[] = [];
      if (!options.width && !options.height) {
        variants = await this.generateVariants(file.data, baseFilename, [format]);

        // Save variants
        for (const variant of variants) {
          const variantPath = path.join(config.UPLOAD_DIR, path.basename(variant.url));
          const variantResult = await this.generateThumbnail(
            file.data,
            parseInt(variant.name.split('_')[1]),
            config.IMAGE.QUALITY.MEDIUM,
            format
          );

          if (variantResult.success) {
            await fs.writeFile(variantPath, variantResult.buffer);
          }
        }
      }

      return {
        success: true,
        url: `/uploads/${filename}`,
        variants,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
      logger.error({ error: errorMessage }, 'Image upload failed');
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Retrieve image from disk
   */
  async getImage(imagePath: string): Promise<Buffer | null> {
    try {
      const fullPath = path.join(config.UPLOAD_DIR, imagePath);
      const buffer = await fs.readFile(fullPath);
      return buffer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve image';
      logger.error({ error: errorMessage }, 'Failed to retrieve image');
      return null;
    }
  }

  /**
   * Delete image from disk
   */
  async deleteImage(imagePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(config.UPLOAD_DIR, imagePath);
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
      logger.error({ error: errorMessage }, 'Failed to delete image');
      return false;
    }
  }

  /**
   * Batch process multiple images
   */
  async batchProcessImages(
    images: Array<{ buffer: Buffer; options: ProcessingOptions }>
  ): Promise<ImageProcessingResult[]> {
    const results: ImageProcessingResult[] = [];

    for (const { buffer, options } of images) {
      const result = await this.processImage(buffer, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Optimize image for web (convert to WebP, compress, strip metadata)
   */
  async optimizeForWeb(imageBuffer: Buffer): Promise<ImageProcessingResult> {
    return this.processImage(imageBuffer, {
      format: 'webp',
      quality: config.IMAGE.QUALITY.MEDIUM,
      stripMetadata: true,
    });
  }

  /**
   * Create placeholder image
   */
  async createPlaceholder(
    width: number,
    height: number,
    color: string = '#cccccc'
  ): Promise<Buffer> {
    try {
      const svg = `
        <svg width="${width}" height="${height}">
          <rect width="100%" height="100%" fill="${color}"/>
        </svg>
      `;

      const buffer = await sharp(Buffer.from(svg)).toBuffer();
      return buffer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create placeholder image';
      logger.error({ error: errorMessage }, 'Failed to create placeholder');
      throw new Error('Failed to create placeholder image');
    }
  }
}

// Export singleton instance
export default new ImageService();
