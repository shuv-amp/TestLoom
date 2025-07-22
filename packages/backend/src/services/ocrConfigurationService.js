/**
 * Advanced Tesseract.js Configuration Service
 * Provides optimized OCR settings for different document types and layouts
 */
class OCRConfigurationService {
  constructor() {
    this.defaultConfig = {
      lang: 'eng',
      oem: 1, // LSTM OCR Engine Mode
      psm: 6  // Uniform block of text
    };
    
    // Document layout patterns for dynamic PSM selection
    this.layoutPatterns = {
      questionnaire: {
        indicators: ['Q.', 'Question', 'A)', 'B)', 'C)', 'D)', 'a)', 'b)', 'c)', 'd)'],
        psm: 6, // Uniform block of text
        whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,?!():-_'
      },
      form: {
        indicators: ['Name:', 'Date:', 'ID:', '___', '_____'],
        psm: 4, // Single column of text of variable sizes
        whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:-_/()'
      },
      table: {
        indicators: ['|', '│', '┃', '┆', '┊'],
        psm: 8, // Single word
        whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,'
      },
      mathematical: {
        indicators: ['+', '-', '×', '÷', '=', '∫', '∑', '√', 'π', 'α', 'β', 'γ'],
        psm: 6,
        whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-×÷=∫∑√πα βγδθλμσφχψω()[]{}.,:'
      },
      general: {
        indicators: [],
        psm: 3, // Fully automatic page segmentation
        whitelist: null // No restriction
      }
    };
    
    // Quality-based configuration adjustments
    this.qualityThresholds = {
      high: 80,    // >80: Minimal processing
      medium: 60,  // 60-80: Standard processing
      low: 40      // <60: Aggressive processing
    };
  }

  /**
   * Analyze text content to determine optimal OCR configuration
   * @param {string} preliminaryText - Initial OCR output for analysis
   * @param {number} imageQuality - Image quality score (0-100)
   * @returns {Object} - Optimized Tesseract configuration
   */
  getOptimalConfiguration(preliminaryText = '', imageQuality = 50) {
    console.log('Analyzing content for optimal OCR configuration...');
    
    // Detect document layout type
    const layoutType = this.detectLayoutType(preliminaryText);
    console.log(`Detected layout type: ${layoutType}`);
    
    // Get base configuration for layout
    const baseConfig = { ...this.layoutPatterns[layoutType] };
    
    // Adjust configuration based on image quality
    const qualityAdjustedConfig = this.adjustForQuality(baseConfig, imageQuality);
    
    // Add advanced Tesseract parameters
    const finalConfig = this.addAdvancedParameters(qualityAdjustedConfig, layoutType, imageQuality);
    
    console.log('Final OCR configuration:', finalConfig);
    return finalConfig;
  }

  /**
   * Detect document layout type based on content analysis
   */
  detectLayoutType(text) {
    const scores = {};
    
    // Calculate pattern match scores for each layout type
    for (const [layoutType, config] of Object.entries(this.layoutPatterns)) {
      scores[layoutType] = this.calculatePatternScore(text, config.indicators);
    }
    
    // Find layout type with highest score
    const bestMatch = Object.entries(scores).reduce((best, [type, score]) => 
      score > best.score ? { type, score } : best, 
      { type: 'general', score: 0 }
    );
    
    // Return best match if score is significant, otherwise default to general
    return bestMatch.score > 0.1 ? bestMatch.type : 'general';
  }

  /**
   * Calculate pattern match score for layout type detection
   */
  calculatePatternScore(text, indicators) {
    if (!indicators.length) return 0;
    
    const textLower = text.toLowerCase();
    let totalMatches = 0;
    
    for (const indicator of indicators) {
      const regex = new RegExp(indicator.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = (textLower.match(regex) || []).length;
      totalMatches += matches;
    }
    
    // Normalize score by text length and number of indicators
    return totalMatches / (text.length / 100 + indicators.length);
  }

  /**
   * Adjust configuration based on image quality
   */
  adjustForQuality(baseConfig, imageQuality) {
    const config = { ...baseConfig };
    
    if (imageQuality >= this.qualityThresholds.high) {
      // High quality: Use optimal settings
      config.oem = 1; // LSTM only
      
    } else if (imageQuality >= this.qualityThresholds.medium) {
      // Medium quality: Balanced approach
      config.oem = 1; // LSTM only
      config.psm = Math.min(config.psm + 1, 13); // Slightly more aggressive segmentation
      
    } else {
      // Low quality: Aggressive processing
      config.oem = 2; // LSTM + Legacy combined
      config.psm = 8; // Single word for better character recognition
    }
    
    return config;
  }

  /**
   * Add advanced Tesseract parameters for enhanced accuracy
   */
  addAdvancedParameters(config, layoutType, imageQuality) {
    const advancedConfig = {
      ...this.defaultConfig,
      ...config,
      options: {
        // Core OCR parameters
        tessedit_pageseg_mode: config.psm,
        tessedit_ocr_engine_mode: config.oem,
        
        // Character recognition improvements
        tessedit_char_blacklist: this.getCharacterBlacklist(layoutType),
        tessedit_char_whitelist: config.whitelist,
        
        // Word recognition parameters
        tessedit_enable_dict_correction: layoutType !== 'mathematical' ? 1 : 0,
        tessedit_enable_bigram_correction: 1,
        tessedit_enable_numeric_mode: layoutType === 'form' || layoutType === 'mathematical' ? 1 : 0,
        
        // Layout analysis
        textord_really_old_xheight: imageQuality < this.qualityThresholds.medium ? 1 : 0,
        textord_min_linesize: imageQuality < this.qualityThresholds.low ? 1.25 : 2.5,
        
        // Character segmentation
        chop_enable: 1,
        use_new_state_cost: 1,
        segment_segcost_rating: 1,
        
        // Quality thresholds
        tessedit_reject_bad_qual_wds: 1,
        tessedit_good_quality_unrej: 1,
        
        // Debugging (only in development)
        ...(process.env.NODE_ENV === 'development' && {
          tessedit_dump_pageseg_images: 0,
          tessedit_create_hocr: 0,
          tessedit_create_tsv: 0
        })
      }
    };
    
    // Add confidence and quality reporting
    advancedConfig.outputFormat = {
      text: true,
      hocr: false,
      tsv: true, // For confidence scores
      pdf: false,
      unlv: false,
      osd: false
    };
    
    return advancedConfig;
  }

  /**
   * Get character blacklist based on layout type
   */
  getCharacterBlacklist(layoutType) {
    const blacklists = {
      questionnaire: '~`@#$%^&*+=[]{}\\|<>',
      form: '~`@#$%^&*+=[]{}\\|<>',
      table: '~`@#$%^&*+={}\\<>',
      mathematical: '~`@#$%',
      general: '~`@#$%^&*+=[]{}\\|<>'
    };
    
    return blacklists[layoutType] || blacklists.general;
  }

  /**
   * Get language models configuration
   * @param {string} primaryLang - Primary language code
   * @param {Array} additionalLangs - Additional language codes
   */
  getLanguageConfiguration(primaryLang = 'eng', additionalLangs = []) {
    const supportedLanguages = [
      'eng', 'spa', 'fra', 'deu', 'ita', 'por', 'rus', 'chi_sim', 'chi_tra',
      'jpn', 'kor', 'ara', 'hin', 'nep', 'mar', 'ben', 'tel', 'tam'
    ];
    
    // Validate primary language
    if (!supportedLanguages.includes(primaryLang)) {
      console.warn(`Unsupported primary language: ${primaryLang}, falling back to 'eng'`);
      primaryLang = 'eng';
    }
    
    // Filter and validate additional languages
    const validAdditionalLangs = additionalLangs.filter(lang => 
      supportedLanguages.includes(lang) && lang !== primaryLang
    );
    
    // Combine languages (limit to 3 for performance)
    const languages = [primaryLang, ...validAdditionalLangs.slice(0, 2)];
    
    return {
      lang: languages.join('+'),
      languages: languages,
      primary: primaryLang
    };
  }

  /**
   * Get configuration for specific question types
   */
  getQuestionTypeConfiguration(questionType) {
    const configs = {
      MCQ: {
        psm: 6, // Uniform block of text
        whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,?!():-_',
        enable_dict_correction: 1
      },
      FIB: {
        psm: 4, // Single column of text
        whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,?!():-_ ',
        enable_dict_correction: 1
      },
      DESCRIPTIVE: {
        psm: 3, // Fully automatic page segmentation
        whitelist: null, // No restriction
        enable_dict_correction: 1
      },
      MATHEMATICAL: {
        psm: 6,
        whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-×÷=∫∑√πα βγδθλμσφχψω()[]{}.,:',
        enable_dict_correction: 0
      }
    };
    
    return configs[questionType] || configs.MCQ;
  }

  /**
   * Performance optimization settings
   */
  getPerformanceConfiguration() {
    return {
      // Tesseract worker settings
      corePath: process.env.TESSERACT_CORE_PATH || undefined,
      workerPath: process.env.TESSERACT_WORKER_PATH || undefined,
      
      // Processing limits
      maxProcessingTime: 30000, // 30 seconds timeout
      maxImageSize: 5 * 1024 * 1024, // 5MB max image size
      
      // Memory management
      workerPoolSize: process.env.OCR_WORKER_POOL_SIZE || 1,
      enableWorkerRecycling: true,
      maxWorkerAge: 300000, // 5 minutes
      
      // Caching
      enableResultCaching: process.env.NODE_ENV === 'production',
      cacheMaxAge: 3600000, // 1 hour
      cacheMaxSize: 100 // Max cached results
    };
  }

  /**
   * Validation configuration for post-processing
   */
  getValidationConfiguration() {
    return {
      // Confidence thresholds
      minWordConfidence: 30,
      minLineConfidence: 50,
      minPageConfidence: 60,
      
      // Text validation patterns
      validationPatterns: {
        questionNumber: /^Q\.?\s*\d+/i,
        optionLabel: /^[A-D]\)|^\([A-D]\)|^[a-d]\)|^\([a-d]\)/,
        mathExpression: /[\+\-\×\÷\=\∫\∑\√\π]/,
        blankIndicator: /_{3,}|\[[\s\.]*\]|\(\s*\)|\.\.\./
      },
      
      // Dictionary-based corrections
      commonCorrections: {
        'rn': 'm',
        'vv': 'w',
        '0': 'O', // Context-dependent
        '1': 'I', // Context-dependent
        '5': 'S', // Context-dependent
        '6': 'G', // Context-dependent
        '8': 'B'  // Context-dependent
      }
    };
  }
}

module.exports = new OCRConfigurationService();
