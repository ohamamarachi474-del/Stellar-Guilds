import { BadRequestException } from '@nestjs/common';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const FILE_SIZE_ERROR_MESSAGE = `File size must be less than 5MB`;
export const FILE_TYPE_ERROR_MESSAGE = `File must be one of the following types: ${ALLOWED_MIME_TYPES.join(', ')}`;

/**
 * Validates an uploaded file's size and MIME type
 * Should be called before passing the file to StorageService
 */
export function validateImageFile(file: {
  buffer: Buffer;
  originalname: string;
  mimetype?: string;
}): void {
  if (!file?.buffer || !file?.originalname) {
    throw new BadRequestException('File is required');
  }

  // Validate file size
  if (file.buffer.length > MAX_FILE_SIZE) {
    throw new BadRequestException(FILE_SIZE_ERROR_MESSAGE);
  }

  // Validate MIME type
  const mimeType = file.mimetype;
  if (!mimeType) {
    throw new BadRequestException('File MIME type could not be determined');
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new BadRequestException(FILE_TYPE_ERROR_MESSAGE);
  }
}
