import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  validateImageFile,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} from './file-upload.validator';

describe('File Upload Validator', () => {
  const createMockFile = (
    overrides?: Partial<{
      buffer: Buffer;
      originalname: string;
      mimetype: string;
    }>,
  ) => ({
    buffer: Buffer.from('test image content'),
    originalname: 'test-image.png',
    mimetype: 'image/png',
    ...overrides,
  });

  describe('validateImageFile', () => {
    it('should accept valid image file', () => {
      const file = createMockFile();
      expect(() => validateImageFile(file)).not.toThrow();
    });

    it('should throw error if file buffer is missing', () => {
      const file = createMockFile({ buffer: undefined as any });
      expect(() => validateImageFile(file)).toThrow(BadRequestException);
      expect(() => validateImageFile(file)).toThrow('File is required');
    });

    it('should throw error if originalname is missing', () => {
      const file = createMockFile({ originalname: undefined as any });
      expect(() => validateImageFile(file)).toThrow(BadRequestException);
      expect(() => validateImageFile(file)).toThrow('File is required');
    });

    it('should throw error if file size exceeds 5MB', () => {
      const largeBuffer = Buffer.alloc(MAX_FILE_SIZE + 1);
      const file = createMockFile({ buffer: largeBuffer });
      expect(() => validateImageFile(file)).toThrow(BadRequestException);
      expect(() => validateImageFile(file)).toThrow(
        'File size must be less than 5MB',
      );
    });

    it('should throw error if MIME type is not allowed', () => {
      const file = createMockFile({ mimetype: 'image/gif' });
      expect(() => validateImageFile(file)).toThrow(BadRequestException);
      expect(() => validateImageFile(file)).toThrow(
        'File must be one of the following types',
      );
    });

    it('should throw error if MIME type is missing', () => {
      const file = createMockFile({ mimetype: undefined as any });
      expect(() => validateImageFile(file)).toThrow(BadRequestException);
      expect(() => validateImageFile(file)).toThrow(
        'File MIME type could not be determined',
      );
    });

    it('should accept JPEG format', () => {
      const file = createMockFile({
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
      });
      expect(() => validateImageFile(file)).not.toThrow();
    });

    it('should accept PNG format', () => {
      const file = createMockFile({
        mimetype: 'image/png',
        originalname: 'test.png',
      });
      expect(() => validateImageFile(file)).not.toThrow();
    });

    it('should accept WebP format', () => {
      const file = createMockFile({
        mimetype: 'image/webp',
        originalname: 'test.webp',
      });
      expect(() => validateImageFile(file)).not.toThrow();
    });

    it('should reject BMP format', () => {
      const file = createMockFile({ mimetype: 'image/bmp' });
      expect(() => validateImageFile(file)).toThrow(BadRequestException);
    });

    it('should reject TIFF format', () => {
      const file = createMockFile({ mimetype: 'image/tiff' });
      expect(() => validateImageFile(file)).toThrow(BadRequestException);
    });

    it('should accept file at exactly 5MB limit', () => {
      const exactBuffer = Buffer.alloc(MAX_FILE_SIZE);
      const file = createMockFile({ buffer: exactBuffer });
      expect(() => validateImageFile(file)).not.toThrow();
    });
  });
});
