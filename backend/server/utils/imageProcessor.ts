import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { Request } from 'express';

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface ProcessedImage {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}

// Define the Multer file interface
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer: Buffer;
}

/**
 * Process and optimize an image buffer
 */
export async function processImage(
  buffer: Buffer,
  originalFilename: string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const {
    width = 1920,
    height = 1080,
    quality = 85,
    format = 'jpeg',
    fit = 'cover',
  } = options;

  try {
    let sharpInstance = sharp(buffer);

    // Get image metadata
    const metadata = await sharpInstance.metadata();

    // Resize image if needed
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit,
        withoutEnlargement: true,
      });
    }

    // Convert to specified format and optimize
    let processedBuffer: Buffer;
    let mimeType: string;

    switch (format) {
      case 'jpeg':
        processedBuffer = await sharpInstance
          .jpeg({ quality, progressive: true })
          .toBuffer();
        mimeType = 'image/jpeg';
        break;
      case 'png':
        processedBuffer = await sharpInstance
          .png({ quality, progressive: true })
          .toBuffer();
        mimeType = 'image/png';
        break;
      case 'webp':
        processedBuffer = await sharpInstance.webp({ quality }).toBuffer();
        mimeType = 'image/webp';
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Generate processed filename
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    const processedFilename = `${basename}_${width}x${height}.${format}`;

    return {
      buffer: processedBuffer,
      filename: processedFilename,
      mimeType,
      size: processedBuffer.length,
    };
  } catch (error) {
    throw new Error(
      `Image processing failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Create multiple sizes of an image (thumbnail, medium, large)
 */
export async function createImageVariants(
  buffer: Buffer,
  originalFilename: string
): Promise<{
  thumbnail: ProcessedImage;
  medium: ProcessedImage;
  large: ProcessedImage;
}> {
  const [thumbnail, medium, large] = await Promise.all([
    processImage(buffer, originalFilename, {
      width: 300,
      height: 200,
      quality: 80,
      format: 'jpeg',
    }),
    processImage(buffer, originalFilename, {
      width: 800,
      height: 600,
      quality: 85,
      format: 'jpeg',
    }),
    processImage(buffer, originalFilename, {
      width: 1920,
      height: 1080,
      quality: 90,
      format: 'jpeg',
    }),
  ]);

  return { thumbnail, medium, large };
}

/**
 * Validate image file type and size
 */
export function validateImageFile(
  file: MulterFile,
  maxSizeInMB: number = 10
): { isValid: boolean; error?: string } {
  // Check file type
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
    };
  }

  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `File size too large. Maximum size is ${maxSizeInMB}MB.`,
    };
  }

  return { isValid: true };
}

/**
 * Generate a unique filename with timestamp
 */
export function generateUniqueFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const basename = path.basename(originalFilename, ext);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  return `${basename}_${timestamp}_${random}${ext}`;
}

/**
 * Save processed image to file system
 */
export async function saveImageToFile(
  processedImage: ProcessedImage,
  uploadDir: string
): Promise<string> {
  try {
    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, processedImage.filename);
    await fs.writeFile(filePath, processedImage.buffer);

    return filePath;
  } catch (error) {
    throw new Error(
      `Failed to save image: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Convert image buffer to base64 data URL
 */
export function bufferToDataURL(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Get image dimensions from buffer
 */
export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width?: number; height?: number }> {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
    };
  } catch (error) {
    throw new Error(
      `Failed to get image dimensions: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
