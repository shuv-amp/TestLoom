const crypto = require('crypto');

/**
 * OCR Result Caching Service
 * Implements intelligent caching for OCR results to improve performance
 */
class OCRCacheService {
  constructor() {
    this.cache = new Map();
    this.hashCache = new Map(); // Cache for image hashes
    this.stats = {
      hits: 0,
      misses: 0,
      stores: 0,
      evictions: 0,
      totalSize: 0
    };
    
    this.config = {
      maxSize: process.env.OCR_CACHE_MAX_SIZE || 100,
      maxAge: process.env.OCR_CACHE_MAX_AGE || 3600000, // 1 hour
      maxMemoryUsage: process.env.OCR_CACHE_MAX_MEMORY || 50 * 1024 * 1024, // 50MB
      compressionEnabled: true,
      persistenceEnabled: false // Could be extended to persist to Redis/File
    };
    
    this.isEnabled = process.env.OCR_CACHE_ENABLED !== 'false';
    
    // Cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    console.log(`OCR Cache initialized: enabled=${this.isEnabled}, maxSize=${this.config.maxSize}, maxAge=${this.config.maxAge}ms`);
  }

  /**
   * Generate cache key from image buffer
   */
  generateCacheKey(imageBuffer, options = {}) {
    try {
      // Create hash from image content and processing options
      const imageHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
      const optionsHash = crypto.createHash('md5').update(JSON.stringify(options)).digest('hex');
      
      return `ocr_${imageHash}_${optionsHash}`;
    } catch (error) {
      console.warn('Failed to generate cache key:', error.message);
      return null;
    }
  }

  /**
   * Check if result is cached
   */
  get(imageBuffer, options = {}) {
    if (!this.isEnabled) return null;
    
    const cacheKey = this.generateCacheKey(imageBuffer, options);
    if (!cacheKey) return null;
    
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.config.maxAge) {
      this.cache.delete(cacheKey);
      this.stats.evictions++;
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    
    // Update access time for LRU
    cached.lastAccessed = Date.now();
    
    // Return decompressed result
    return this.decompressResult(cached.data);
  }

  /**
   * Store result in cache
   */
  set(imageBuffer, options = {}, result) {
    if (!this.isEnabled) return false;
    
    const cacheKey = this.generateCacheKey(imageBuffer, options);
    if (!cacheKey) return false;
    
    try {
      const compressed = this.compressResult(result);
      const entry = {
        data: compressed,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        size: this.calculateSize(compressed),
        originalSize: this.calculateSize(result)
      };
      
      // Check if we need to make space
      this.makeSpace(entry.size);
      
      this.cache.set(cacheKey, entry);
      this.stats.stores++;
      this.stats.totalSize += entry.size;
      
      console.log(`OCR result cached: key=${cacheKey.substr(0, 16)}..., size=${entry.size} bytes, compression=${((1 - entry.size / entry.originalSize) * 100).toFixed(1)}%`);
      
      return true;
    } catch (error) {
      console.warn('Failed to cache OCR result:', error.message);
      return false;
    }
  }

  /**
   * Compress result for storage
   */
  compressResult(result) {
    if (!this.config.compressionEnabled) return result;
    
    try {
      // Simple compression: remove debug data and compress text
      const compressed = {
        text: result.text,
        confidence: result.confidence,
        structuredData: result.structuredData,
        qualityMetrics: result.qualityMetrics ? {
          overallScore: result.qualityMetrics.overallScore,
          textQuality: { score: result.qualityMetrics.textQuality?.score },
          structureQuality: { score: result.qualityMetrics.structureQuality?.score }
        } : undefined,
        processingInfo: result.processingInfo ? {
          totalTime: result.processingInfo.totalTime,
          imageQuality: result.processingInfo.imageQuality,
          configuration: result.processingInfo.configuration
        } : undefined
      };
      
      return compressed;
    } catch (error) {
      console.warn('Failed to compress result:', error.message);
      return result;
    }
  }

  /**
   * Decompress result from storage
   */
  decompressResult(compressed) {
    // For now, just return the compressed result as-is
    // Could implement actual compression/decompression here
    return compressed;
  }

  /**
   * Calculate approximate size of object in bytes
   */
  calculateSize(obj) {
    try {
      return Buffer.byteLength(JSON.stringify(obj), 'utf8');
    } catch (error) {
      return 1000; // Fallback estimate
    }
  }

  /**
   * Make space in cache if needed
   */
  makeSpace(requiredSize) {
    // Check if we need to make space
    if (this.cache.size < this.config.maxSize && 
        this.stats.totalSize + requiredSize < this.config.maxMemoryUsage) {
      return;
    }
    
    // Get entries sorted by last access time (LRU)
    const entries = Array.from(this.cache.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => a.lastAccessed - b.lastAccessed);
    
    // Remove oldest entries until we have space
    let spaceFreed = 0;
    let entriesRemoved = 0;
    
    for (const entry of entries) {
      if (this.cache.size - entriesRemoved <= this.config.maxSize * 0.8 && 
          this.stats.totalSize - spaceFreed + requiredSize <= this.config.maxMemoryUsage * 0.8) {
        break;
      }
      
      this.cache.delete(entry.key);
      spaceFreed += entry.size;
      entriesRemoved++;
      this.stats.evictions++;
    }
    
    this.stats.totalSize -= spaceFreed;
    
    if (entriesRemoved > 0) {
      console.log(`OCR Cache: Evicted ${entriesRemoved} entries, freed ${spaceFreed} bytes`);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    if (!this.isEnabled) return;
    
    const now = Date.now();
    let cleaned = 0;
    let spaceFreed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.maxAge) {
        spaceFreed += entry.size;
        this.cache.delete(key);
        cleaned++;
        this.stats.evictions++;
      }
    }
    
    this.stats.totalSize -= spaceFreed;
    
    if (cleaned > 0) {
      console.log(`OCR Cache cleanup: Removed ${cleaned} expired entries, freed ${spaceFreed} bytes`);
    }
  }

  /**
   * Check if image might be a duplicate
   */
  async checkDuplicate(imageBuffer, threshold = 0.95) {
    if (!this.isEnabled) return null;
    
    try {
      const imageHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
      
      // Check for exact match first
      for (const [key, value] of this.hashCache.entries()) {
        if (key === imageHash) {
          return {
            isDuplicate: true,
            similarity: 1.0,
            cacheKey: value.cacheKey,
            lastSeen: value.timestamp
          };
        }
      }
      
      // Store hash for future duplicate detection
      this.hashCache.set(imageHash, {
        timestamp: Date.now(),
        cacheKey: this.generateCacheKey(imageBuffer)
      });
      
      // Clean up old hashes
      if (this.hashCache.size > this.config.maxSize * 2) {
        const oldestHashes = Array.from(this.hashCache.entries())
          .sort(([, a], [, b]) => a.timestamp - b.timestamp)
          .slice(0, this.hashCache.size - this.config.maxSize);
        
        for (const [hash] of oldestHashes) {
          this.hashCache.delete(hash);
        }
      }
      
      return {
        isDuplicate: false,
        similarity: 0,
        imageHash: imageHash
      };
    } catch (error) {
      console.warn('Failed to check for duplicate:', error.message);
      return null;
    }
  }

  /**
   * Preload cache with common results
   */
  preload(entries) {
    if (!this.isEnabled) return;
    
    let loaded = 0;
    
    for (const entry of entries) {
      if (entry.imageBuffer && entry.result) {
        if (this.set(entry.imageBuffer, entry.options || {}, entry.result)) {
          loaded++;
        }
      }
    }
    
    console.log(`OCR Cache preloaded with ${loaded} entries`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? this.stats.hits / (this.stats.hits + this.stats.misses) 
      : 0;
    
    return {
      enabled: this.isEnabled,
      size: this.cache.size,
      maxSize: this.config.maxSize,
      memoryUsage: this.stats.totalSize,
      maxMemoryUsage: this.config.maxMemoryUsage,
      hitRate: Math.round(hitRate * 100) / 100,
      stats: {
        hits: this.stats.hits,
        misses: this.stats.misses,
        stores: this.stats.stores,
        evictions: this.stats.evictions
      },
      efficiency: {
        averageHitsPerEntry: this.cache.size > 0 ? this.stats.hits / this.cache.size : 0,
        memoryEfficiency: this.config.maxMemoryUsage > 0 
          ? (1 - this.stats.totalSize / this.config.maxMemoryUsage) 
          : 1
      }
    };
  }

  /**
   * Clear entire cache
   */
  clear() {
    const oldSize = this.cache.size;
    const oldMemory = this.stats.totalSize;
    
    this.cache.clear();
    this.hashCache.clear();
    this.stats.totalSize = 0;
    
    console.log(`OCR Cache cleared: ${oldSize} entries, ${oldMemory} bytes freed`);
  }

  /**
   * Enable/disable cache
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    
    if (!enabled) {
      this.clear();
    }
    
    console.log(`OCR Cache ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Trigger cleanup if size limits changed
    if (newConfig.maxSize || newConfig.maxMemoryUsage) {
      this.makeSpace(0);
    }
    
    console.log('OCR Cache configuration updated:', newConfig);
  }

  /**
   * Export cache for analysis
   */
  exportCache() {
    const entries = [];
    
    for (const [key, value] of this.cache.entries()) {
      entries.push({
        key: key.substr(0, 16) + '...', // Truncate for privacy
        timestamp: value.timestamp,
        lastAccessed: value.lastAccessed,
        size: value.size,
        age: Date.now() - value.timestamp,
        accessCount: value.accessCount || 1
      });
    }
    
    return {
      entries: entries,
      stats: this.getStats(),
      config: this.config
    };
  }

  /**
   * Validate cache integrity
   */
  validate() {
    let issues = [];
    let totalCalculatedSize = 0;
    
    for (const [key, value] of this.cache.entries()) {
      // Check timestamp
      if (!value.timestamp || value.timestamp > Date.now()) {
        issues.push(`Invalid timestamp for key ${key.substr(0, 16)}...`);
      }
      
      // Check size
      if (!value.size || value.size < 0) {
        issues.push(`Invalid size for key ${key.substr(0, 16)}...`);
      } else {
        totalCalculatedSize += value.size;
      }
      
      // Check data
      if (!value.data) {
        issues.push(`Missing data for key ${key.substr(0, 16)}...`);
      }
    }
    
    // Check total size
    if (Math.abs(totalCalculatedSize - this.stats.totalSize) > 1000) {
      issues.push(`Size mismatch: calculated=${totalCalculatedSize}, stored=${this.stats.totalSize}`);
      this.stats.totalSize = totalCalculatedSize; // Fix it
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues,
      correctedSize: totalCalculatedSize
    };
  }

  /**
   * Cleanup on service shutdown
   */
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.clear();
    console.log('OCR Cache service shutdown');
  }
}

module.exports = new OCRCacheService();