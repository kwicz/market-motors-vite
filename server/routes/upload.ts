import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error';
import {
  processImage,
  createImageVariants,
  validateImageFile,
  generateUniqueFilename,
  bufferToDataURL,
  getImageDimensions,
  MulterFile,
} from '../utils/imageProcessor.js';
import { sendSuccess, ValidationError, AppError } from '../middleware/error';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Configure multer for memory storage (we'll process images in memory)
const storage = multer.memoryStorage();

// Multer configuration
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Maximum 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Basic file type validation (additional validation in route handler)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
        )
      );
    }
  },
});

// Validation schemas
const imageUploadSchema = z.object({
  resize: z.boolean().optional().default(true),
  quality: z.number().min(1).max(100).optional().default(85),
  format: z.enum(['jpeg', 'png', 'webp']).optional().default('jpeg'),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

/**
 * POST /api/upload/single
 * Upload a single image with optimization
 */
router.post(
  '/single',
  asyncHandler(authenticate),
  requireAdmin,
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const file = req.file as MulterFile | undefined;

    if (!file) {
      throw new ValidationError('No image file provided');
    }

    // Validate the uploaded file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      throw new ValidationError(validation.error || 'Invalid image file');
    }

    // Parse and validate request body
    const options = imageUploadSchema.parse(req.body);

    // Get image dimensions
    const dimensions = await getImageDimensions(file.buffer);

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.originalname);

    // Process the image
    const processedImage = await processImage(file.buffer, uniqueFilename, {
      width: options.width,
      height: options.height,
      quality: options.quality,
      format: options.format,
    });

    // Convert to base64 data URL for storage in database
    const dataURL = bufferToDataURL(
      processedImage.buffer,
      processedImage.mimeType
    );

    sendSuccess(
      res,
      {
        filename: processedImage.filename,
        originalName: file.originalname,
        mimeType: processedImage.mimeType,
        size: processedImage.size,
        originalSize: file.size,
        dimensions: {
          original: dimensions,
          processed: {
            width: options.width,
            height: options.height,
          },
        },
        dataURL,
        url: dataURL, // For compatibility with existing frontend code
      },
      'Image uploaded and processed successfully'
    );
  })
);

/**
 * POST /api/upload/multiple
 * Upload multiple images with optimization
 */
router.post(
  '/multiple',
  asyncHandler(authenticate),
  requireAdmin,
  upload.array('images', 10),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const files = req.files as MulterFile[] | undefined;

    if (!files || files.length === 0) {
      throw new ValidationError('No image files provided');
    }

    // Parse and validate request body
    const options = imageUploadSchema.parse(req.body);

    // Process all images
    const processedImages = await Promise.all(
      files.map(async (file) => {
        // Validate each file
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          throw new ValidationError(
            `File ${file.originalname}: ${validation.error}`
          );
        }

        // Get image dimensions
        const dimensions = await getImageDimensions(file.buffer);

        // Generate unique filename
        const uniqueFilename = generateUniqueFilename(file.originalname);

        // Process the image
        const processedImage = await processImage(file.buffer, uniqueFilename, {
          width: options.width,
          height: options.height,
          quality: options.quality,
          format: options.format,
        });

        // Convert to base64 data URL
        const dataURL = bufferToDataURL(
          processedImage.buffer,
          processedImage.mimeType
        );

        return {
          filename: processedImage.filename,
          originalName: file.originalname,
          mimeType: processedImage.mimeType,
          size: processedImage.size,
          originalSize: file.size,
          dimensions: {
            original: dimensions,
            processed: {
              width: options.width,
              height: options.height,
            },
          },
          dataURL,
          url: dataURL, // For compatibility with existing frontend code
        };
      })
    );

    sendSuccess(
      res,
      {
        images: processedImages,
        totalImages: processedImages.length,
        totalOriginalSize: files.reduce((sum, file) => sum + file.size, 0),
        totalProcessedSize: processedImages.reduce(
          (sum, img) => sum + img.size,
          0
        ),
      },
      `${processedImages.length} images uploaded and processed successfully`
    );
  })
);

/**
 * POST /api/upload/variants
 * Create multiple variants of an uploaded image
 */
router.post(
  '/variants',
  asyncHandler(authenticate),
  requireAdmin,
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const file = req.file as MulterFile | undefined;

    if (!file) {
      throw new ValidationError('No image file provided');
    }

    // Validate the uploaded file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      throw new ValidationError(validation.error || 'Invalid image file');
    }

    // Generate unique base filename
    const baseFilename = generateUniqueFilename(file.originalname);

    // Create image variants
    const variants = await createImageVariants(file.buffer, baseFilename);

    // Convert all variants to data URLs
    const variantData = {
      thumbnail: {
        ...variants.thumbnail,
        dataURL: bufferToDataURL(
          variants.thumbnail.buffer,
          variants.thumbnail.mimeType
        ),
        url: bufferToDataURL(
          variants.thumbnail.buffer,
          variants.thumbnail.mimeType
        ),
      },
      medium: {
        ...variants.medium,
        dataURL: bufferToDataURL(
          variants.medium.buffer,
          variants.medium.mimeType
        ),
        url: bufferToDataURL(variants.medium.buffer, variants.medium.mimeType),
      },
      large: {
        ...variants.large,
        dataURL: bufferToDataURL(
          variants.large.buffer,
          variants.large.mimeType
        ),
        url: bufferToDataURL(variants.large.buffer, variants.large.mimeType),
      },
    };

    sendSuccess(
      res,
      {
        originalName: file.originalname,
        originalSize: file.size,
        variants: variantData,
        totalVariants: 3,
      },
      'Image variants created successfully'
    );
  })
);

// Error handling middleware for multer errors
router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      throw new ValidationError('File too large. Maximum size is 10MB.');
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      throw new ValidationError('Too many files. Maximum is 10 files.');
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      throw new ValidationError('Unexpected field name for file upload.');
    }
    throw new ValidationError(`Upload error: ${error.message}`);
  }

  // Handle other upload-related errors
  if (error.message.includes('Invalid file type')) {
    throw new ValidationError(error.message);
  }

  next(error);
});

/**
 * GET /api/upload/info
 * Get upload configuration and limits
 */
router.get(
  '/info',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    sendSuccess(
      res,
      {
        maxFileSize: '10MB',
        maxFiles: 10,
        allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
        supportedOperations: [
          'single image upload',
          'multiple image upload',
          'image variants creation',
          'image optimization',
          'format conversion',
          'resize and compression',
        ],
        endpoints: {
          single: 'POST /api/upload/single',
          multiple: 'POST /api/upload/multiple',
          variants: 'POST /api/upload/variants',
          info: 'GET /api/upload/info',
        },
      },
      'Upload configuration retrieved successfully'
    );
  })
);

export default router;
