/**
 * OCR Configuration Management Service
 * Manages environment-specific OCR settings and performance tuning
 */
class OCRConfigManager {
  constructor() {
    this.configurations = {
      development: {
        // Development optimized for debugging and detailed logging
        tesseract: {
          workerPoolSize: 1,
          enableLogging: true,
          enableDebugOutput: true,
          timeout: 60000, // 60 seconds for debugging
          oem: 1, // LSTM only
          psm: 3  // Fully automatic page segmentation
        },
        imageProcessing: {
          enablePreprocessing: true,
          enableQualityAssessment: true,
          enableAdvancedFiltering: true,
          preserveIntermediateResults: true,
          defaultDPI: 300,
          maxImageSize: 5 * 1024 * 1024 // 5MB
        },
        postProcessing: {
          enableDictionaryCorrection: true,
          enableMathematicalCorrection: true,
          enableConfidenceScoring: true,
          minimumConfidenceThreshold: 0.3,
          enableValidation: true
        },
        performance: {
          enableMetricsCollection: true,
          enableCaching: false, // Disabled for development
          maxCacheSize: 50,
          cacheTimeout: 300000 // 5 minutes
        }
      },
      
      production: {
        // Production optimized for performance and reliability
        tesseract: {
          workerPoolSize: process.env.OCR_WORKER_POOL_SIZE || 2,
          enableLogging: false,
          enableDebugOutput: false,
          timeout: 30000, // 30 seconds
          oem: 1, // LSTM only
          psm: 6  // Uniform block of text
        },
        imageProcessing: {
          enablePreprocessing: true,
          enableQualityAssessment: true,
          enableAdvancedFiltering: true,
          preserveIntermediateResults: false,
          defaultDPI: 300,
          maxImageSize: 10 * 1024 * 1024 // 10MB
        },
        postProcessing: {
          enableDictionaryCorrection: true,
          enableMathematicalCorrection: true,
          enableConfidenceScoring: true,
          minimumConfidenceThreshold: 0.5,
          enableValidation: true
        },
        performance: {
          enableMetricsCollection: true,
          enableCaching: true,
          maxCacheSize: 200,
          cacheTimeout: 3600000 // 1 hour
        }
      },
      
      testing: {
        // Testing optimized for speed and consistency
        tesseract: {
          workerPoolSize: 1,
          enableLogging: false,
          enableDebugOutput: false,
          timeout: 15000, // 15 seconds
          oem: 1, // LSTM only
          psm: 6  // Uniform block of text
        },
        imageProcessing: {
          enablePreprocessing: true,
          enableQualityAssessment: false,
          enableAdvancedFiltering: false,
          preserveIntermediateResults: false,
          defaultDPI: 150, // Lower DPI for faster processing
          maxImageSize: 2 * 1024 * 1024 // 2MB
        },
        postProcessing: {
          enableDictionaryCorrection: true,
          enableMathematicalCorrection: false,
          enableConfidenceScoring: false,
          minimumConfidenceThreshold: 0.4,
          enableValidation: false
        },
        performance: {
          enableMetricsCollection: false,
          enableCaching: false,
          maxCacheSize: 10,
          cacheTimeout: 60000 // 1 minute
        }
      }
    };
    
    // Quality-based configuration overrides
    this.qualityConfigurations = {
      high: {
        tesseract: { psm: 3, oem: 1 },
        imageProcessing: { enableAdvancedFiltering: true },
        postProcessing: { minimumConfidenceThreshold: 0.7 }
      },
      medium: {
        tesseract: { psm: 6, oem: 1 },
        imageProcessing: { enableAdvancedFiltering: true },
        postProcessing: { minimumConfidenceThreshold: 0.5 }
      },
      low: {
        tesseract: { psm: 8, oem: 2 }, // Single word, LSTM + Legacy
        imageProcessing: { enableAdvancedFiltering: true },
        postProcessing: { minimumConfidenceThreshold: 0.3 }
      }
    };
    
    // Document type specific configurations
    this.documentTypeConfigurations = {
      questionnaire: {
        tesseract: {
          psm: 6, // Uniform block of text
          whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,?!():-_'
        },
        postProcessing: {
          enableMCQDetection: true,
          enableFIBDetection: true,
          enableDescriptiveDetection: true
        }
      },
      form: {
        tesseract: {
          psm: 4, // Single column of text
          whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:-_/()'
        },
        postProcessing: {
          enableMCQDetection: false,
          enableFIBDetection: true,
          enableDescriptiveDetection: false
        }
      },
      mathematical: {
        tesseract: {
          psm: 6,
          whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-×÷=∫∑√πα βγδθλμσφχψω()[]{}.,:',
          blacklist: '~`@#$%^&*'
        },
        postProcessing: {
          enableMathematicalCorrection: true,
          enableSymbolCorrection: true
        }
      }
    };
    
    this.currentEnvironment = process.env.NODE_ENV || 'development';
    this.currentConfig = this.buildConfiguration();
  }

  /**
   * Get current configuration
   */
  getConfiguration() {
    return this.currentConfig;
  }

  /**
   * Get configuration for specific environment
   */
  getEnvironmentConfiguration(environment) {
    return this.configurations[environment] || this.configurations.development;
  }

  /**
   * Build configuration for current environment
   */
  buildConfiguration() {
    const baseConfig = this.configurations[this.currentEnvironment] || this.configurations.development;
    
    // Apply environment variable overrides
    const config = this.applyEnvironmentOverrides(baseConfig);
    
    return config;
  }

  /**
   * Apply environment variable overrides
   */
  applyEnvironmentOverrides(baseConfig) {
    const config = JSON.parse(JSON.stringify(baseConfig)); // Deep clone
    
    // Tesseract overrides
    if (process.env.OCR_WORKER_POOL_SIZE) {
      config.tesseract.workerPoolSize = parseInt(process.env.OCR_WORKER_POOL_SIZE);
    }
    
    if (process.env.OCR_TIMEOUT) {
      config.tesseract.timeout = parseInt(process.env.OCR_TIMEOUT);
    }
    
    if (process.env.OCR_OEM) {
      config.tesseract.oem = parseInt(process.env.OCR_OEM);
    }
    
    if (process.env.OCR_PSM) {
      config.tesseract.psm = parseInt(process.env.OCR_PSM);
    }
    
    // Image processing overrides
    if (process.env.OCR_DEFAULT_DPI) {
      config.imageProcessing.defaultDPI = parseInt(process.env.OCR_DEFAULT_DPI);
    }
    
    if (process.env.OCR_MAX_IMAGE_SIZE) {
      config.imageProcessing.maxImageSize = parseInt(process.env.OCR_MAX_IMAGE_SIZE);
    }
    
    if (process.env.OCR_ENABLE_PREPROCESSING !== undefined) {
      config.imageProcessing.enablePreprocessing = process.env.OCR_ENABLE_PREPROCESSING === 'true';
    }
    
    // Post-processing overrides
    if (process.env.OCR_MIN_CONFIDENCE) {
      config.postProcessing.minimumConfidenceThreshold = parseFloat(process.env.OCR_MIN_CONFIDENCE);
    }
    
    // Performance overrides
    if (process.env.OCR_ENABLE_CACHING !== undefined) {
      config.performance.enableCaching = process.env.OCR_ENABLE_CACHING === 'true';
    }
    
    if (process.env.OCR_CACHE_SIZE) {
      config.performance.maxCacheSize = parseInt(process.env.OCR_CACHE_SIZE);
    }
    
    if (process.env.OCR_CACHE_TIMEOUT) {
      config.performance.cacheTimeout = parseInt(process.env.OCR_CACHE_TIMEOUT);
    }
    
    return config;
  }

  /**
   * Get optimized configuration for specific image quality
   */
  getQualityOptimizedConfiguration(imageQuality) {
    let qualityLevel = 'medium';
    
    if (imageQuality >= 80) {
      qualityLevel = 'high';
    } else if (imageQuality < 50) {
      qualityLevel = 'low';
    }
    
    const baseConfig = this.getConfiguration();
    const qualityOverrides = this.qualityConfigurations[qualityLevel];
    
    return this.mergeConfigurations(baseConfig, qualityOverrides);
  }

  /**
   * Get configuration for specific document type
   */
  getDocumentTypeConfiguration(documentType) {
    const baseConfig = this.getConfiguration();
    const documentOverrides = this.documentTypeConfigurations[documentType];
    
    if (!documentOverrides) {
      return baseConfig;
    }
    
    return this.mergeConfigurations(baseConfig, documentOverrides);
  }

  /**
   * Get optimized configuration combining quality and document type
   */
  getOptimizedConfiguration(imageQuality, documentType) {
    let config = this.getConfiguration();
    
    // Apply quality optimizations
    if (imageQuality !== undefined) {
      const qualityConfig = this.getQualityOptimizedConfiguration(imageQuality);
      config = this.mergeConfigurations(config, qualityConfig);
    }
    
    // Apply document type optimizations
    if (documentType) {
      const documentConfig = this.getDocumentTypeConfiguration(documentType);
      config = this.mergeConfigurations(config, documentConfig);
    }
    
    return config;
  }

  /**
   * Merge configurations with deep merge
   */
  mergeConfigurations(baseConfig, overrideConfig) {
    const merged = JSON.parse(JSON.stringify(baseConfig)); // Deep clone
    
    for (const [key, value] of Object.entries(overrideConfig)) {
      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        if (!merged[key]) {
          merged[key] = {};
        }
        merged[key] = { ...merged[key], ...value };
      } else {
        merged[key] = value;
      }
    }
    
    return merged;
  }

  /**
   * Update configuration at runtime
   */
  updateConfiguration(updates) {
    this.currentConfig = this.mergeConfigurations(this.currentConfig, updates);
    return this.currentConfig;
  }

  /**
   * Reset configuration to environment defaults
   */
  resetConfiguration() {
    this.currentConfig = this.buildConfiguration();
    return this.currentConfig;
  }

  /**
   * Validate configuration
   */
  validateConfiguration(config = this.currentConfig) {
    const errors = [];
    
    // Validate Tesseract settings
    if (config.tesseract.workerPoolSize < 1 || config.tesseract.workerPoolSize > 10) {
      errors.push('Worker pool size must be between 1 and 10');
    }
    
    if (config.tesseract.timeout < 5000 || config.tesseract.timeout > 300000) {
      errors.push('Timeout must be between 5 seconds and 5 minutes');
    }
    
    if (![0, 1, 2, 3].includes(config.tesseract.oem)) {
      errors.push('OEM must be 0, 1, 2, or 3');
    }
    
    if (config.tesseract.psm < 0 || config.tesseract.psm > 13) {
      errors.push('PSM must be between 0 and 13');
    }
    
    // Validate image processing settings
    if (config.imageProcessing.defaultDPI < 72 || config.imageProcessing.defaultDPI > 600) {
      errors.push('Default DPI must be between 72 and 600');
    }
    
    if (config.imageProcessing.maxImageSize < 100000 || config.imageProcessing.maxImageSize > 50 * 1024 * 1024) {
      errors.push('Max image size must be between 100KB and 50MB');
    }
    
    // Validate post-processing settings
    if (config.postProcessing.minimumConfidenceThreshold < 0 || config.postProcessing.minimumConfidenceThreshold > 1) {
      errors.push('Minimum confidence threshold must be between 0 and 1');
    }
    
    // Validate performance settings
    if (config.performance.maxCacheSize < 0 || config.performance.maxCacheSize > 1000) {
      errors.push('Max cache size must be between 0 and 1000');
    }
    
    if (config.performance.cacheTimeout < 0 || config.performance.cacheTimeout > 86400000) {
      errors.push('Cache timeout must be between 0 and 24 hours');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Get configuration summary for monitoring
   */
  getConfigurationSummary() {
    const config = this.getConfiguration();
    
    return {
      environment: this.currentEnvironment,
      tesseract: {
        workerPoolSize: config.tesseract.workerPoolSize,
        timeout: config.tesseract.timeout,
        oem: config.tesseract.oem,
        psm: config.tesseract.psm
      },
      imageProcessing: {
        preprocessingEnabled: config.imageProcessing.enablePreprocessing,
        defaultDPI: config.imageProcessing.defaultDPI,
        maxImageSize: Math.round(config.imageProcessing.maxImageSize / (1024 * 1024)) + 'MB'
      },
      postProcessing: {
        dictionaryCorrectionEnabled: config.postProcessing.enableDictionaryCorrection,
        minimumConfidenceThreshold: config.postProcessing.minimumConfidenceThreshold
      },
      performance: {
        cachingEnabled: config.performance.enableCaching,
        maxCacheSize: config.performance.maxCacheSize,
        metricsCollectionEnabled: config.performance.enableMetricsCollection
      }
    };
  }

  /**
   * Export configuration for external tools
   */
  exportConfiguration(format = 'json') {
    const config = this.getConfiguration();
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(config, null, 2);
      
      case 'env':
        return this.configurationToEnvFormat(config);
      
      case 'yaml':
        // Would require yaml library
        throw new Error('YAML export not implemented');
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert configuration to environment variable format
   */
  configurationToEnvFormat(config) {
    const envVars = [];
    
    envVars.push(`OCR_WORKER_POOL_SIZE=${config.tesseract.workerPoolSize}`);
    envVars.push(`OCR_TIMEOUT=${config.tesseract.timeout}`);
    envVars.push(`OCR_OEM=${config.tesseract.oem}`);
    envVars.push(`OCR_PSM=${config.tesseract.psm}`);
    envVars.push(`OCR_DEFAULT_DPI=${config.imageProcessing.defaultDPI}`);
    envVars.push(`OCR_MAX_IMAGE_SIZE=${config.imageProcessing.maxImageSize}`);
    envVars.push(`OCR_ENABLE_PREPROCESSING=${config.imageProcessing.enablePreprocessing}`);
    envVars.push(`OCR_MIN_CONFIDENCE=${config.postProcessing.minimumConfidenceThreshold}`);
    envVars.push(`OCR_ENABLE_CACHING=${config.performance.enableCaching}`);
    envVars.push(`OCR_CACHE_SIZE=${config.performance.maxCacheSize}`);
    envVars.push(`OCR_CACHE_TIMEOUT=${config.performance.cacheTimeout}`);
    
    return envVars.join('\n');
  }
}

module.exports = new OCRConfigManager();
