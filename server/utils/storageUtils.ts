import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { logger } from './logger';
import type { StoragePathComponents } from '../types';

/**
 * Storage utility functions for file system operations
 */

/**
 * Generate a unique file ID
 */
export function generateFileId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate a checksum for a buffer
 */
export function generateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Build storage path from components
 * Format: {basePath}/{userId}/{tokenId}/{variant}/{filename}
 */
export function buildStoragePath(components: StoragePathComponents): string {
  const parts: string[] = [
    components.basePath,
    components.userId,
  ];

  if (components.tokenId) {
    parts.push(components.tokenId);
  }

  if (components.variant) {
    parts.push(components.variant);
  }

  parts.push(components.filename);

  return path.join(...parts);
}

/**
 * Parse storage path into components
 */
export function parseStoragePath(filePath: string, basePath: string): StoragePathComponents | null {
  const relativePath = path.relative(basePath, filePath);
  const parts = relativePath.split(path.sep);

  if (parts.length < 2) {
    return null;
  }

  const components: StoragePathComponents = {
    basePath,
    userId: parts[0],
    filename: parts[parts.length - 1],
  };

  // Check if tokenId exists (second to last part if variant exists, or second part)
  if (parts.length >= 4) {
    components.tokenId = parts[1];
    components.variant = parts[2];
  } else if (parts.length === 3) {
    // Could be {userId}/{tokenId}/{filename} or {userId}/{variant}/{filename}
    // We'll assume variant if it's a known variant name
    const knownVariants = ['thumbnail', 'small', 'medium', 'large', 'xlarge', 'original'];
    if (knownVariants.includes(parts[1])) {
      components.variant = parts[1];
    } else {
      components.tokenId = parts[1];
    }
  }

  return components;
}

/**
 * Ensure directory exists, create if it doesn't
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    logger.info(`Created directory: ${dirPath}`);
  }
}

/**
 * Get file size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    logger.error(error, `Error getting file size for ${filePath}:`);
    throw error;
  }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete file if it exists
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    await fs.unlink(filePath);
    logger.info(`Deleted file: ${filePath}`);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.error(error, `Error deleting file ${filePath}:`);
    }
    return false;
  }
}

/**
 * Delete directory and all contents
 */
export async function deleteDirectory(dirPath: string): Promise<boolean> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
    logger.info(`Deleted directory: ${dirPath}`);
    return true;
  } catch (error) {
    logger.error(error, `Error deleting directory ${dirPath}:`);
    return false;
  }
}

/**
 * List all files in directory recursively
 */
export async function listFilesRecursively(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  async function traverse(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  await traverse(dirPath);
  return files;
}

/**
 * Get directory size recursively
 */
export async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  async function calculateSize(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await calculateSize(fullPath);
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }
  }

  await calculateSize(dirPath);
  return totalSize;
}

/**
 * Move file from source to destination
 */
export async function moveFile(source: string, destination: string): Promise<void> {
  // Ensure destination directory exists
  await ensureDirectory(path.dirname(destination));

  await fs.rename(source, destination);
  logger.info(`Moved file from ${source} to ${destination}`);
}

/**
 * Copy file from source to destination
 */
export async function copyFile(source: string, destination: string): Promise<void> {
  // Ensure destination directory exists
  await ensureDirectory(path.dirname(destination));

  await fs.copyFile(source, destination);
  logger.info(`Copied file from ${source} to ${destination}`);
}

/**
 * Get file stats
 */
export async function getFileStats(filePath: string) {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
    };
  } catch (error) {
    logger.error(error, `Error getting file stats for ${filePath}:`);
    throw error;
  }
}

/**
 * Clean up empty directories recursively
 */
export async function cleanupEmptyDirectories(dirPath: string): Promise<void> {
  try {
    const entries = await fs.readdir(dirPath);

    if (entries.length === 0) {
      await fs.rmdir(dirPath);
      logger.info(`Removed empty directory: ${dirPath}`);
      return;
    }

    // Check subdirectories
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        await cleanupEmptyDirectories(fullPath);
      }
    }

    // Check if directory is now empty
    const newEntries = await fs.readdir(dirPath);
    if (newEntries.length === 0) {
      await fs.rmdir(dirPath);
      logger.info(`Removed empty directory: ${dirPath}`);
    }
  } catch (error) {
    // Ignore errors for non-existent directories
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.error(error, `Error cleaning up directory ${dirPath}:`);
    }
  }
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and special characters
  return filename
    .replace(/[\/\\]/g, '_')
    .replace(/\.{2,}/g, '_')
    .replace(/[<>:"|?*]/g, '_')
    .trim();
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return ext.startsWith('.') ? ext.slice(1) : ext;
}

/**
 * Generate unique filename with timestamp
 */
export function generateUniqueFilename(originalFilename: string): string {
  const ext = getFileExtension(originalFilename);
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `${timestamp}-${random}.${ext}`;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file path is within base directory
 */
export function validatePath(basePath: string, filePath: string): boolean {
  const resolvedBase = path.resolve(basePath);
  const resolvedFile = path.resolve(filePath);

  return resolvedFile.startsWith(resolvedBase);
}

/**
 * Get relative path from base
 */
export function getRelativePath(basePath: string, filePath: string): string {
  return path.relative(basePath, filePath);
}
