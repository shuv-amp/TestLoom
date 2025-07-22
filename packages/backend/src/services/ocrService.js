const { createWorker } = require('tesseract.js');
const imagePreprocessingService = require('./imagePreprocessingService');
const ocrConfigurationService = require('./ocrConfigurationService');
const ocrPostProcessingService = require('./ocrPostProcessingService');

/**
 * Enhanced OCR Service with Industry-Leading Accuracy
 * Implements advanced image preprocessing, optimized Tesseract configuration,
 * and sophisticated post-processing for question paper recognition
 */
class EnhancedOCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.processingStats = {
      totalProcessed: 0,
      averageProcessingTime: 0,
      averageAccuracy: 0,
      lastProcessedAt: null
    };
    
    // Performance monitoring
    this.performanceMetrics = {
      preprocessingTime: [],
      ocrTime: [],
      postprocessingTime: [],
      totalTime: []
    };
  }

  /**
   * Initialize OCR service with enhanced configuration
   */
  async initialize() {
    if (!this.isInitialized) {
      console.log('Initializing Enhanced OCR Service...');
      
      try {
        // Create Tesseract worker with performance optimizations
        this.worker = await createWorker();
        
        // Load language models
        const langConfig = ocrConfigurationService.getLanguageConfiguration('eng');
        console.log('Loading language models:', langConfig.languages);
        
        this.isInitialized = true;
        console.log('Enhanced OCR Service initialized successfully');
        
      } catch (error) {
        console.error('OCR initialization failed:', error);
        throw new Error(`OCR initialization failed: ${error.message}`);
      }
    }
  }

  /**
   * Main OCR processing pipeline with advanced enhancements
   * @param {Buffer} imageBuffer - Raw image buffer
   * @param {Object} options - Processing options
   */
  async extractTextFromImage(imageBuffer, options = {}) {
    const startTime = Date.now();
    const processingLog = [];
    
    try {
      await this.initialize();
      
      processingLog.push(`Started OCR processing at ${new Date().toISOString()}`);
      
      // Step 1: Advanced Image Preprocessing
      const preprocessingStart = Date.now();
      processingLog.push('Starting image preprocessing...');
      
      const enhancedImageBuffer = await imagePreprocessingService.enhanceForOCR(imageBuffer, options);
      
      const preprocessingTime = Date.now() - preprocessingStart;
      this.performanceMetrics.preprocessingTime.push(preprocessingTime);
      processingLog.push(`Image preprocessing completed in ${preprocessingTime}ms`);
      
      // Step 2: Preliminary OCR for configuration optimization
      const preliminaryStart = Date.now();
      processingLog.push('Performing preliminary OCR for optimization...');
      
      const preliminaryResult = await this.worker.recognize(enhancedImageBuffer, {
        lang: 'eng',
        options: {
          tessedit_pageseg_mode: 3, // Fully automatic
          tessedit_ocr_engine_mode: 1 // LSTM only
        }
      });
      
      const preliminaryTime = Date.now() - preliminaryStart;
      processingLog.push(`Preliminary OCR completed in ${preliminaryTime}ms`);
      
      // Step 3: Optimize OCR Configuration
      const configStart = Date.now();
      processingLog.push('Optimizing OCR configuration...');
      
      const imageQuality = await this.assessImageQuality(enhancedImageBuffer);
      const optimalConfig = ocrConfigurationService.getOptimalConfiguration(
        preliminaryResult.data.text,
        imageQuality
      );
      
      const configTime = Date.now() - configStart;
      processingLog.push(`Configuration optimization completed in ${configTime}ms`);
      processingLog.push(`Optimal configuration: PSM=${optimalConfig.psm}, OEM=${optimalConfig.oem}`);
      
      // Step 4: Enhanced OCR Processing
      const ocrStart = Date.now();
      processingLog.push('Performing enhanced OCR processing...');
      
      const enhancedResult = await this.worker.recognize(enhancedImageBuffer, {
        lang: optimalConfig.lang,
        options: optimalConfig.options
      });
      
      const ocrTime = Date.now() - ocrStart;
      this.performanceMetrics.ocrTime.push(ocrTime);
      processingLog.push(`Enhanced OCR completed in ${ocrTime}ms`);
      
      // Step 5: Advanced Post-Processing
      const postprocessingStart = Date.now();
      processingLog.push('Starting advanced post-processing...');
      
      const processedResult = await ocrPostProcessingService.processOCROutput(
        enhancedResult.data.text,
        {
          confidence: enhancedResult.data.confidence,
          words: enhancedResult.data.words || []
        },
        options
      );
      
      const postprocessingTime = Date.now() - postprocessingStart;
      this.performanceMetrics.postprocessingTime.push(postprocessingTime);
      processingLog.push(`Post-processing completed in ${postprocessingTime}ms`);
      
      // Step 6: Final Quality Assessment and Reporting
      const totalTime = Date.now() - startTime;
      this.performanceMetrics.totalTime.push(totalTime);
      
      const finalResult = {
        text: processedResult.cleanedText,
        confidence: enhancedResult.data.confidence,
        structuredData: processedResult.structuredData,
        qualityMetrics: processedResult.qualityMetrics,
        processingInfo: {
          totalTime,
          preprocessingTime,
          ocrTime,
          postprocessingTime,
          imageQuality,
          configuration: optimalConfig,
          processingLog: process.env.NODE_ENV === 'development' ? processingLog : undefined
        },
        rawData: process.env.NODE_ENV === 'development' ? {
          originalText: enhancedResult.data.text,
          preliminaryText: preliminaryResult.data.text
        } : undefined
      };
      
      // Update statistics
      this.updateProcessingStats(totalTime, processedResult.qualityMetrics.overallScore);
      
      processingLog.push(`Total processing completed in ${totalTime}ms`);
      console.log(`OCR processing completed successfully in ${totalTime}ms`);
      
      return finalResult;
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error('Enhanced OCR processing failed:', error);
      processingLog.push(`Processing failed: ${error.message}`);
      
      throw new Error(`OCR processing failed after ${totalTime}ms: ${error.message}`);
    }
  }

  /**
   * Parse questions from enhanced OCR output
   * @param {string} text - Processed OCR text
   * @param {Object} structuredData - Pre-processed structured data
   */
  parseQuestions(text, structuredData = null) {
    console.log('Parsing questions from enhanced OCR output...');
    
    try {
      // If we have structured data from post-processing, use it
      if (structuredData && Array.isArray(structuredData)) {
        return this.convertStructuredDataToQuestions(structuredData);
      }
      
      // Fallback to original parsing method with enhancements
      return this.parseQuestionsLegacy(text);
      
    } catch (error) {
      console.error('Question parsing failed:', error);
      throw new Error(`Question parsing failed: ${error.message}`);
    }
  }

  /**
   * Convert structured data to question format
   */
  convertStructuredDataToQuestions(structuredData) {
    return structuredData.map(questionData => {
      const question = {
        id: questionData.id,
        questionText: questionData.questionText,
        questionType: questionData.type,
        confidence: questionData.confidence,
        rawText: questionData.rawText
      };
      
      // Add type-specific data
      if (questionData.type === 'MCQ' && questionData.options) {
        question.options = questionData.options;
      } else if (questionData.type === 'FIB' && questionData.blanks) {
        question.blanks = questionData.blanks;
        question.blankCount = questionData.blanks.length;
      }
      
      // Add validation information
      if (questionData.validation) {
        question.validation = questionData.validation;
        question.qualityScore = questionData.validation.score;
      }
      
      return question;
    });
  }

  /**
   * Legacy question parsing method (enhanced)
   */
  parseQuestionsLegacy(rawText) {
    if (!rawText || rawText.trim().length === 0) {
      return [];
    }

    // Enhanced text cleaning
    const lines = rawText.split('\n').map(line => line.trim());
    const filteredLines = lines.filter(line => {
      // More sophisticated filtering
      if (/^_{2,}/.test(line)) return false;
      if (/^(TOP|MCQ|Computer|Page\s+\d+|Name:|Date:|ID:)/i.test(line)) return false;
      if (line.length < 5) return false;
      if (/^[^\w\s]+$/.test(line)) return false; // Only special characters
      return true;
    });
    
    const cleanText = filteredLines.join('\n');

    // Enhanced question splitting
    const questionBlocks = this.splitIntoQuestionBlocks(cleanText);
    
    const questions = [];
    let questionId = 1;
    
    for (const block of questionBlocks) {
      const parsedQuestion = this.parseQuestionBlock(block, questionId);
      if (parsedQuestion) {
        questions.push(parsedQuestion);
        questionId++;
      }
    }
    
    return this.postProcessQuestions(questions);
  }

  /**
   * Enhanced question block splitting
   */
  splitIntoQuestionBlocks(text) {
    // Multiple splitting strategies
    const strategies = [
      /(?:^|\n)\s*Q\.?\s*\d*\.?\s*/gi,
      /(?:^|\n)\s*\d+\.?\s*(?=[A-Z])/gi,
      /(?:^|\n)\s*(?=\w.*\?)/gi
    ];
    
    for (const strategy of strategies) {
      const blocks = text.split(strategy).filter(block => block.trim().length > 15);
      if (blocks.length > 1) {
        return blocks;
      }
    }
    
    // If no strategy works, return whole text as single block
    return [text];
  }

  /**
   * Enhanced question block parsing
   */
  parseQuestionBlock(block, questionId) {
    // Try to detect question type and structure
    const questionData = this.analyzeQuestionStructure(block);
    
    if (!questionData) {
      return null;
    }
    
    return {
      id: questionId,
      questionText: questionData.questionText,
      questionType: questionData.type,
      options: questionData.options || [],
      blanks: questionData.blanks || [],
      confidence: questionData.confidence || 0.5,
      detectedAnswer: questionData.detectedAnswer,
      rawText: block
    };
  }

  /**
   * Analyze question structure with enhanced patterns
   */
  analyzeQuestionStructure(block) {
    // MCQ detection
    const mcqResult = this.detectMCQ(block);
    if (mcqResult) return mcqResult;
    
    // FIB detection
    const fibResult = this.detectFIB(block);
    if (fibResult) return fibResult;
    
    // Descriptive detection
    if (this.isValidQuestion(block)) {
      return {
        type: 'DESCRIPTIVE',
        questionText: this.cleanQuestionText(block),
        confidence: 0.6
      };
    }
    
    return null;
  }

  /**
   * Enhanced MCQ detection
   */
  detectMCQ(block) {
    const optionPatterns = [
      /([A-D])\)\s*(.+?)(?=\s*[A-D]\)|$)/gi,
      /\(([A-D])\)\s*(.+?)(?=\s*\([A-D]\)|$)/gi,
      /([a-d])\)\s*(.+?)(?=\s*[a-d]\)|$)/gi
    ];
    
    for (const pattern of optionPatterns) {
      const options = [];
      let match;
      
      while ((match = pattern.exec(block)) !== null) {
        options.push({
          label: match[1].toUpperCase(),
          text: match[2].trim()
        });
      }
      
      if (options.length >= 2) {
        const questionText = this.extractQuestionFromMCQ(block, pattern);
        return {
          type: 'MCQ',
          questionText: this.cleanQuestionText(questionText),
          options: options,
          confidence: this.calculateMCQConfidence(questionText, options),
          detectedAnswer: this.detectCorrectAnswer(block, options)
        };
      }
    }
    
    return null;
  }

  /**
   * Extract question text from MCQ block
   */
  extractQuestionFromMCQ(block, optionPattern) {
    const firstOptionMatch = block.match(optionPattern);
    if (firstOptionMatch) {
      return block.substring(0, firstOptionMatch.index).trim();
    }
    return block;
  }

  /**
   * Enhanced FIB detection
   */
  detectFIB(block) {
    const blankPatterns = [
      /_{3,}/g,
      /\[[\s\.]*\]/g,
      /\(\s*\)/g,
      /\.{3,}/g,
      /\b__+\b/g
    ];
    
    for (const pattern of blankPatterns) {
      const matches = [...block.matchAll(pattern)];
      if (matches.length > 0) {
        const blanks = matches.map((match, index) => ({
          id: index + 1,
          position: match.index,
          placeholder: match[0],
          length: match[0].length
        }));
        
        return {
          type: 'FIB',
          questionText: this.cleanQuestionText(block),
          blanks: blanks,
          confidence: Math.min(0.8, 0.5 + blanks.length * 0.1)
        };
      }
    }
    
    return null;
  }

  /**
   * Assess image quality for optimization
   */
  async assessImageQuality(imageBuffer) {
    try {
      // Use preprocessing service to get detailed quality metrics
      const analysisResult = await imagePreprocessingService.analyzeImage(imageBuffer);
      return analysisResult.qualityScore;
    } catch (error) {
      console.warn('Image quality assessment failed, using default:', error.message);
      return 50; // Default medium quality
    }
  }

  /**
   * Enhanced confidence calculation
   */
  calculateMCQConfidence(questionText, options) {
    let confidence = 0.3; // Base confidence
    
    // Question text quality
    if (questionText.length > 10) confidence += 0.1;
    if (/\?/.test(questionText)) confidence += 0.1;
    if (/\b(what|which|how|when|where|why|who)\b/i.test(questionText)) confidence += 0.1;
    
    // Options quality
    if (options.length >= 3) confidence += 0.1;
    if (options.length === 4) confidence += 0.1;
    
    const avgOptionLength = options.reduce((sum, opt) => sum + opt.text.length, 0) / options.length;
    if (avgOptionLength > 3 && avgOptionLength < 50) confidence += 0.1;
    
    // Check for realistic options
    const validOptions = options.filter(opt => opt.text.length > 1 && !/^[^\w]*$/.test(opt.text));
    if (validOptions.length === options.length) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Enhanced answer detection
   */
  detectCorrectAnswer(content, options) {
    const answerPatterns = [
      /(?:answer|correct|solution)[\s:]*([A-D])/i,
      /\(([A-D])\)\s*✓/i,
      /([A-D])\s*✓/i,
      /\b([A-D])\s+is\s+correct/i
    ];

    for (const pattern of answerPatterns) {
      const match = content.match(pattern);
      if (match) {
        const answerLabel = match[1].toUpperCase();
        if (options.some(opt => opt.label === answerLabel)) {
          return answerLabel;
        }
      }
    }

    return null;
  }

  /**
   * Enhanced question validation
   */
  isValidQuestion(text) {
    const questionIndicators = [
      /\?/,
      /\b(what|which|how|when|where|why|who|define|explain|describe|calculate|solve|find|determine)\b/i,
      /\b(true|false)\b/i,
      /\b(correct|incorrect)\b/i,
      /\b(choose|select|identify|match)\b/i
    ];

    const minLength = 8;
    const hasValidStructure = questionIndicators.some(pattern => pattern.test(text));
    
    return text.length >= minLength && hasValidStructure;
  }

  /**
   * Enhanced question text cleaning
   */
  cleanQuestionText(text) {
    return text
      .replace(/^\d+[\.\)]\s*/, '')
      .replace(/^Q[\.\s]*\d+[\.\)]?\s*/i, '')
      .replace(/^Question\s+\d+[\.\:]?\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Enhanced post-processing with validation
   */
  postProcessQuestions(questions) {
    const processedQuestions = questions
      .filter(q => q && q.questionText && q.questionText.length > 5)
      .map((question, index) => {
        question.id = index + 1;
        
        // Enhanced MCQ processing
        if (question.questionType === 'MCQ' && question.options) {
          question.options = question.options
            .filter(opt => opt.text && opt.text.length > 0)
            .map((option, optIndex) => ({
              ...option,
              id: `${question.id}_${optIndex + 1}`,
              label: option.label || String.fromCharCode(65 + optIndex) // A, B, C, D
            }));
          
          // Remove if insufficient options
          if (question.options.length < 2) {
            question.questionType = 'DESCRIPTIVE';
            delete question.options;
          }
        }
        
        // Enhanced FIB processing
        if (question.questionType === 'FIB' && question.blanks) {
          question.blankCount = question.blanks.length;
          if (question.blankCount === 0) {
            question.questionType = 'DESCRIPTIVE';
            delete question.blanks;
          }
        }
        
        return question;
      });
    
    // Remove duplicates
    return this.removeDuplicateQuestions(processedQuestions);
  }

  /**
   * Remove duplicate questions using advanced similarity detection
   */
  removeDuplicateQuestions(questions) {
    const uniqueQuestions = [];
    const similarityThreshold = 0.8;
    
    for (const question of questions) {
      const isDuplicate = uniqueQuestions.some(existing => {
        const similarity = this.calculateSimilarity(
          existing.questionText.toLowerCase(),
          question.questionText.toLowerCase()
        );
        return similarity > similarityThreshold;
      });
      
      if (!isDuplicate) {
        uniqueQuestions.push(question);
      }
    }
    
    return uniqueQuestions;
  }

  /**
   * Calculate text similarity using enhanced algorithm
   */
  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Update processing statistics
   */
  updateProcessingStats(processingTime, qualityScore) {
    this.processingStats.totalProcessed++;
    this.processingStats.lastProcessedAt = new Date();
    
    // Update average processing time
    const totalTime = this.performanceMetrics.totalTime;
    this.processingStats.averageProcessingTime = 
      totalTime.reduce((sum, time) => sum + time, 0) / totalTime.length;
    
    // Update average accuracy
    this.processingStats.averageAccuracy = 
      (this.processingStats.averageAccuracy * (this.processingStats.totalProcessed - 1) + qualityScore) / 
      this.processingStats.totalProcessed;
  }

  /**
   * Get comprehensive processing statistics
   */
  getProcessingStats() {
    const recentMetrics = this.getRecentPerformanceMetrics();
    
    return {
      ...this.processingStats,
      averageProcessingTime: Math.round(this.processingStats.averageProcessingTime),
      averageAccuracy: Math.round(this.processingStats.averageAccuracy * 100) / 100,
      recentPerformance: recentMetrics,
      imagePreprocessingStats: imagePreprocessingService.getStats()
    };
  }

  /**
   * Get recent performance metrics
   */
  getRecentPerformanceMetrics(sampleSize = 10) {
    const getRecentAverage = (arr) => {
      const recent = arr.slice(-sampleSize);
      return recent.length > 0 ? recent.reduce((sum, val) => sum + val, 0) / recent.length : 0;
    };
    
    return {
      avgPreprocessingTime: Math.round(getRecentAverage(this.performanceMetrics.preprocessingTime)),
      avgOcrTime: Math.round(getRecentAverage(this.performanceMetrics.ocrTime)),
      avgPostprocessingTime: Math.round(getRecentAverage(this.performanceMetrics.postprocessingTime)),
      avgTotalTime: Math.round(getRecentAverage(this.performanceMetrics.totalTime))
    };
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    console.log('Cleaning up Enhanced OCR Service...');
    
    try {
      if (this.worker) {
        await this.worker.terminate();
        this.worker = null;
      }
      
      this.isInitialized = false;
      console.log('Enhanced OCR Service cleanup completed');
      
    } catch (error) {
      console.error('OCR cleanup failed:', error);
    }
  }
}

module.exports = new EnhancedOCRService();
