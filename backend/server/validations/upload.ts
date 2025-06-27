import { z } from 'zod';

// Image upload options validation
export const imageUploadOptionsSchema = z.object({
  resize: z.boolean().optional().default(true),
  quality: z.number().min(1).max(100).optional().default(85),
  format: z.enum(['jpeg', 'png', 'webp']).optional().default('jpeg'),
  width: z.number().positive().max(4000).optional(),
  height: z.number().positive().max(4000).optional(),
});

// File validation schema
export const fileValidationSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/webp'], {
    errorMap: () => ({
      message: 'Only JPEG, PNG, and WebP images are allowed',
    }),
  }),
  size: z.number().max(10 * 1024 * 1024, 'File size cannot exceed 10MB'),
});

// Multiple files validation
export const multipleFilesSchema = z
  .array(fileValidationSchema)
  .min(1, 'At least one file is required')
  .max(10, 'Cannot upload more than 10 files at once');

// Image processing result schema
export const processedImageSchema = z.object({
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  originalSize: z.number(),
  dataURL: z.string(),
  url: z.string(),
  dimensions: z.object({
    original: z.object({
      width: z.number().optional(),
      height: z.number().optional(),
    }),
    processed: z.object({
      width: z.number().optional(),
      height: z.number().optional(),
    }),
  }),
});

export type ImageUploadOptions = z.infer<typeof imageUploadOptionsSchema>;
export type ProcessedImageResult = z.infer<typeof processedImageSchema>;
