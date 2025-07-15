const path = require('path');
const fs = require('fs').promises;

class OCRUtils {
  static supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'];
  static maxFileSize = 10 * 1024 * 1024;

  static validateImageFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors };
    }

    if (!this.supportedImageTypes.includes(file.mimetype)) {
      errors.push(`Unsupported file type. Supported types: ${this.supportedImageTypes.join(', ')}`);
    }

    if (file.size > this.maxFileSize) {
      errors.push(`File size too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    if (file.size === 0) {
      errors.push('File is empty');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static generateFileName(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(originalName);
    return `ocr_${timestamp}_${random}${extension}`;
  }

  static async ensureUploadDirectory(uploadPath) {
    try {
      await fs.access(uploadPath);
    } catch (error) {
      await fs.mkdir(uploadPath, { recursive: true });
    }
  }

  static async cleanupTempFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to cleanup temp file ${filePath}:`, error.message);
    }
  }

  static formatOCRResponse(questions, processingTime, metadata = {}) {
    return {
      success: true,
      data: {
        questions,
        totalQuestions: questions.length,
        processingTime: `${processingTime}ms`,
        metadata: {
          processedAt: new Date().toISOString(),
          ...metadata
        }
      }
    };
  }

  static formatErrorResponse(error, statusCode = 500) {
    return {
      success: false,
      error: {
        message: error.message,
        statusCode,
        timestamp: new Date().toISOString()
      }
    };
  }

  static preprocessImageForOCR(imagePath) {
    return {
      path: imagePath,
      tesseractOptions: {
        tessedit_pageseg_mode: '6',
        tessedit_ocr_engine_mode: '3',
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,()[]{}?!:;-+=/\\@#$%^&*_|~`"\' \n\t'
      }
    };
  }
}

module.exports = OCRUtils;
