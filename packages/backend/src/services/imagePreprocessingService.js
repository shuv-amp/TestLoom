const sharp = require('sharp');
const { Jimp } = require('jimp');

/**
 * Advanced Image Preprocessing Service for OCR Enhancement
 * Implements industry-standard image enhancement techniques for optimal OCR accuracy
 */
class ImagePreprocessingService {
  constructor() {
    this.defaultDPI = 300; // Standard DPI for OCR
    this.processingStats = {
      processed: 0,
      averageProcessingTime: 0,
      successRate: 0
    };
  }

  /**
   * Main preprocessing pipeline - orchestrates all enhancement steps
   * @param {Buffer} imageBuffer - Raw image buffer
   * @param {Object} options - Processing options
   * @returns {Promise<Buffer>} - Enhanced image buffer
   */
  async enhanceForOCR(imageBuffer, options = {}) {
    const startTime = Date.now();
    
    try {
      console.log('Starting image preprocessing pipeline...');
      
      // Step 1: Image Analysis and Validation
      const imageInfo = await this.analyzeImage(imageBuffer);
      console.log('Image analysis:', imageInfo);
      
      // Step 2: Image Normalization
      let processedBuffer = await this.normalizeImage(imageBuffer, imageInfo);
      console.log('Image normalization completed');
      
      // Step 3: Orientation Correction
      processedBuffer = await this.correctOrientation(processedBuffer);
      console.log('Orientation correction completed');
      
      // Step 4: Grayscale Conversion
      processedBuffer = await this.convertToGrayscale(processedBuffer);
      console.log('Grayscale conversion completed');
      
      // Step 5: Noise Reduction
      processedBuffer = await this.reduceNoise(processedBuffer);
      console.log('Noise reduction completed');
      
      // Step 6: Contrast Enhancement
      processedBuffer = await this.enhanceContrast(processedBuffer);
      console.log('Contrast enhancement completed');
      
      // Step 7: Adaptive Binarization (Otsu's method)
      processedBuffer = await this.applyAdaptiveBinarization(processedBuffer);
      console.log('Adaptive binarization completed');
      
      // Step 8: Text Region Enhancement
      processedBuffer = await this.enhanceTextRegions(processedBuffer);
      console.log('Text region enhancement completed');
      
      // Update processing statistics
      const processingTime = Date.now() - startTime;
      this.updateStats(processingTime, true);
      
      console.log(`Image preprocessing completed in ${processingTime}ms`);
      return processedBuffer;
      
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      this.updateStats(Date.now() - startTime, false);
      throw new Error(`Image preprocessing failed: ${error.message}`);
    }
  }

  /**
   * Analyze image properties and quality
   */
  async analyzeImage(imageBuffer) {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    // Calculate quality score based on multiple factors
    const qualityScore = this.calculateImageQuality(metadata);
    
    return {
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      density: metadata.density || 72,
      format: metadata.format,
      hasAlpha: metadata.hasAlpha,
      qualityScore,
      isLowResolution: metadata.width < 800 || metadata.height < 600,
      isHighResolution: metadata.width > 3000 || metadata.height > 3000,
      aspectRatio: metadata.width / metadata.height
    };
  }

  /**
   * Calculate image quality score (0-100)
   */
  calculateImageQuality(metadata) {
    let score = 50; // Base score
    
    // Resolution scoring
    const pixelCount = metadata.width * metadata.height;
    if (pixelCount > 2000000) score += 20; // High resolution
    else if (pixelCount > 500000) score += 10; // Medium resolution
    else score -= 20; // Low resolution
    
    // DPI scoring
    if (metadata.density >= 300) score += 15;
    else if (metadata.density >= 150) score += 5;
    else score -= 10;
    
    // Format scoring
    if (['png', 'tiff', 'bmp'].includes(metadata.format)) score += 5;
    else if (metadata.format === 'jpeg') score += 2;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Normalize image format, size, and DPI
   */
  async normalizeImage(imageBuffer, imageInfo) {
    let pipeline = sharp(imageBuffer);
    
    // Set standard DPI
    pipeline = pipeline.withMetadata({ density: this.defaultDPI });
    
    // Resize if image is too large or too small
    if (imageInfo.isHighResolution) {
      // Downscale very large images while maintaining quality
      const maxDimension = 2400;
      pipeline = pipeline.resize(maxDimension, maxDimension, {
        fit: 'inside',
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3
      });
    } else if (imageInfo.isLowResolution) {
      // Upscale small images using advanced interpolation
      const scaleFactor = Math.max(
        800 / imageInfo.width,
        600 / imageInfo.height,
        1.5 // Minimum scale factor
      );
      
      pipeline = pipeline.resize(
        Math.round(imageInfo.width * scaleFactor),
        Math.round(imageInfo.height * scaleFactor),
        { kernel: sharp.kernel.cubic }
      );
    }
    
    return pipeline.png({ quality: 100 }).toBuffer();
  }

  /**
   * Detect and correct image orientation
   */
  async correctOrientation(imageBuffer) {
    // Use Sharp's built-in EXIF orientation correction
    return sharp(imageBuffer)
      .rotate() // Auto-rotate based on EXIF data
      .png()
      .toBuffer();
  }

  /**
   * Convert to grayscale using luminance-based conversion
   */
  async convertToGrayscale(imageBuffer) {
    return sharp(imageBuffer)
      .grayscale()
      .png()
      .toBuffer();
  }

  /**
   * Advanced noise reduction using median filter and morphological operations
   */
  async reduceNoise(imageBuffer) {
    // Use Jimp for advanced filtering operations
    const image = await Jimp.read(imageBuffer);
    
    // Apply median filter to remove salt-and-pepper noise
    image.median(3);
    
    // Apply slight blur to reduce random noise while preserving edges
    image.blur(0.5);
    
    return image.getBufferAsync(Jimp.MIME_PNG);
  }

  /**
   * Enhance contrast using adaptive histogram equalization
   */
  async enhanceContrast(imageBuffer) {
    return sharp(imageBuffer)
      .normalise({
        lower: 1,   // Lower percentile
        upper: 99   // Upper percentile
      })
      .linear(1.2, -(128 * 0.2)) // Slight contrast boost
      .png()
      .toBuffer();
  }

  /**
   * Apply adaptive binarization using Otsu's method
   */
  async applyAdaptiveBinarization(imageBuffer) {
    const image = await Jimp.read(imageBuffer);
    
    // Calculate optimal threshold using Otsu's method
    const threshold = this.calculateOtsuThreshold(image);
    
    // Apply threshold with slight adjustment for text
    const adjustedThreshold = Math.max(threshold * 0.85, 128);
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const gray = this.bitmap.data[idx]; // Already grayscale
      const binaryValue = gray > adjustedThreshold ? 255 : 0;
      
      this.bitmap.data[idx] = binaryValue;     // R
      this.bitmap.data[idx + 1] = binaryValue; // G
      this.bitmap.data[idx + 2] = binaryValue; // B
    });
    
    return image.getBufferAsync(Jimp.MIME_PNG);
  }

  /**
   * Calculate optimal threshold using Otsu's method
   */
  calculateOtsuThreshold(image) {
    // Build histogram
    const histogram = new Array(256).fill(0);
    const total = image.bitmap.width * image.bitmap.height;
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const gray = this.bitmap.data[idx];
      histogram[gray]++;
    });
    
    // Calculate optimal threshold using Otsu's method
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }
    
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let varMax = 0;
    let threshold = 0;
    
    for (let t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;
      
      wF = total - wB;
      if (wF === 0) break;
      
      sumB += t * histogram[t];
      
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      
      const varBetween = wB * wF * (mB - mF) * (mB - mF);
      
      if (varBetween > varMax) {
        varMax = varBetween;
        threshold = t;
      }
    }
    
    return threshold;
  }

  /**
   * Enhance text regions using morphological operations
   */
  async enhanceTextRegions(imageBuffer) {
    const image = await Jimp.read(imageBuffer);
    
    // Apply morphological closing to connect broken characters
    const kernel = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ];
    
    // This is a simplified morphological operation
    // In a production environment, you might want to use OpenCV bindings
    const enhanced = this.applyMorphologicalClosing(image, kernel);
    
    return enhanced.getBufferAsync(Jimp.MIME_PNG);
  }

  /**
   * Simplified morphological closing operation
   */
  applyMorphologicalClosing(image, kernel) {
    // Create a copy for processing
    const result = image.clone();
    const kernelSize = 3;
    const offset = Math.floor(kernelSize / 2);
    
    // Apply dilation followed by erosion (closing operation)
    for (let pass = 0; pass < 2; pass++) {
      const temp = result.clone();
      
      result.scan(offset, offset, 
        image.bitmap.width - kernelSize, 
        image.bitmap.height - kernelSize, 
        function (x, y, idx) {
          let maxValue = 0;
          
          // Check kernel neighborhood
          for (let ky = -offset; ky <= offset; ky++) {
            for (let kx = -offset; kx <= offset; kx++) {
              const pixelIdx = temp.getPixelIndex(x + kx, y + ky);
              const pixelValue = temp.bitmap.data[pixelIdx];
              maxValue = Math.max(maxValue, pixelValue);
            }
          }
          
          if (pass === 0) {
            // Dilation pass
            this.bitmap.data[idx] = maxValue;
            this.bitmap.data[idx + 1] = maxValue;
            this.bitmap.data[idx + 2] = maxValue;
          } else {
            // Erosion pass (inverted logic for closing)
            let minValue = 255;
            for (let ky = -offset; ky <= offset; ky++) {
              for (let kx = -offset; kx <= offset; kx++) {
                const pixelIdx = temp.getPixelIndex(x + kx, y + ky);
                const pixelValue = temp.bitmap.data[pixelIdx];
                minValue = Math.min(minValue, pixelValue);
              }
            }
            this.bitmap.data[idx] = minValue;
            this.bitmap.data[idx + 1] = minValue;
            this.bitmap.data[idx + 2] = minValue;
          }
        });
    }
    
    return result;
  }

  /**
   * Update processing statistics
   */
  updateStats(processingTime, success) {
    this.processingStats.processed++;
    
    // Update average processing time
    this.processingStats.averageProcessingTime = 
      (this.processingStats.averageProcessingTime * (this.processingStats.processed - 1) + processingTime) / 
      this.processingStats.processed;
    
    // Update success rate
    if (success) {
      this.processingStats.successRate = 
        (this.processingStats.successRate * (this.processingStats.processed - 1) + 100) / 
        this.processingStats.processed;
    } else {
      this.processingStats.successRate = 
        (this.processingStats.successRate * (this.processingStats.processed - 1)) / 
        this.processingStats.processed;
    }
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return {
      ...this.processingStats,
      averageProcessingTime: Math.round(this.processingStats.averageProcessingTime),
      successRate: Math.round(this.processingStats.successRate * 100) / 100
    };
  }

  /**
   * Reset processing statistics
   */
  resetStats() {
    this.processingStats = {
      processed: 0,
      averageProcessingTime: 0,
      successRate: 0
    };
  }
}

module.exports = new ImagePreprocessingService();