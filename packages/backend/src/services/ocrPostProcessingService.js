/**
 * Advanced OCR Post-Processing Service
 * Implements sophisticated text cleaning, validation, and correction algorithms
 */
class OCRPostProcessingService {
  constructor() {
    // Common OCR errors and their corrections
    this.commonCorrections = {
      // Character substitutions
      'rn': 'm', 'vv': 'w', 'VV': 'W', 'ii': 'll', 'Il': 'll',
      '0O': 'OO', 'O0': '00', '5S': 'SS', 'S5': '55',
      '6G': 'GG', 'G6': '66', '8B': 'BB', 'B8': '88',
      '1l': 'll', 'l1': '11', '2Z': 'ZZ', 'Z2': '22',
      
      // Word-level corrections
      'tlie': 'the', 'tiie': 'the', 'tne': 'the',
      'anci': 'and', 'anc1': 'and', 'ancl': 'and',
      'wliicli': 'which', 'wliich': 'which', 'wnicli': 'which',
      'witli': 'with', 'witii': 'with', 'vvith': 'with',
      'trom': 'from', 'frorn': 'from', 'fronl': 'from',
      'tliat': 'that', 'tiiat': 'that', 'tnat': 'that',
      'questlon': 'question', 'questiion': 'question',
      'answwer': 'answer', 'answver': 'answer', 'answier': 'answer'
    };
    
    // Mathematical symbol corrections
    this.mathCorrections = {
      'x': '×', 'X': '×', // Multiplication
      '*': '×',
      '/': '÷',
      'pi': 'π', 'Pi': 'π', 'PI': 'π',
      'alpha': 'α', 'Alpha': 'α',
      'beta': 'β', 'Beta': 'β',
      'gamma': 'γ', 'Gamma': 'γ',
      'delta': 'δ', 'Delta': 'Δ',
      'theta': 'θ', 'Theta': 'Θ',
      'lambda': 'λ', 'Lambda': 'Λ',
      'sigma': 'σ', 'Sigma': 'Σ',
      'sqrt': '√', 'SQRT': '√',
      'integral': '∫', 'INTEGRAL': '∫',
      'sum': '∑', 'SUM': '∑'
    };
    
    // Question patterns for validation
    this.questionPatterns = {
      mcq: {
        pattern: /Q\.?\s*\d*\.?\s*(.+?)(?=\s*[A-D]\)|$)/i,
        optionPattern: /([A-D])\)\s*(.+?)(?=\s*[A-D]\)|$)/gi,
        confidence: 0.8
      },
      fib: {
        pattern: /(.+?)(?:_{3,}|\[[\s\.]*\]|\(\s*\)|\.\.\.)(.+)/i,
        blankPattern: /_{3,}|\[[\s\.]*\]|\(\s*\)|\.\.\./g,
        confidence: 0.7
      },
      descriptive: {
        pattern: /Q\.?\s*\d*\.?\s*(.+)/i,
        confidence: 0.6
      }
    };
    
    // Confidence scoring weights
    this.confidenceWeights = {
      wordCount: 0.2,
      avgWordLength: 0.15,
      specialChars: 0.1,
      questionStructure: 0.25,
      dictionaryWords: 0.2,
      coherence: 0.1
    };
  }

  /**
   * Main post-processing pipeline
   * @param {string} rawText - Raw OCR output
   * @param {Object} confidence - OCR confidence data
   * @param {Object} options - Processing options
   */
  async processOCROutput(rawText, confidence = {}, options = {}) {
    console.log('Starting OCR post-processing pipeline...');
    
    try {
      // Step 1: Initial text cleaning
      let cleanedText = this.initialTextCleaning(rawText);
      
      // Step 2: Character-level corrections
      cleanedText = this.applyCharacterCorrections(cleanedText);
      
      // Step 3: Word-level corrections
      cleanedText = this.applyWordCorrections(cleanedText);
      
      // Step 4: Mathematical symbol corrections
      if (this.containsMathematicalContent(cleanedText)) {
        cleanedText = this.applyMathematicalCorrections(cleanedText);
      }
      
      // Step 5: Structure validation and enhancement
      const structuredData = this.extractQuestionStructure(cleanedText);
      
      // Step 6: Content validation
      const validatedData = this.validateContent(structuredData, confidence);
      
      // Step 7: Quality assessment
      const qualityMetrics = this.assessQuality(rawText, cleanedText, validatedData);
      
      console.log('OCR post-processing completed successfully');
      
      return {
        originalText: rawText,
        cleanedText: cleanedText,
        structuredData: validatedData,
        qualityMetrics: qualityMetrics,
        processingInfo: {
          correctionsMade: this.countCorrections(rawText, cleanedText),
          processingTime: Date.now()
        }
      };
      
    } catch (error) {
      console.error('OCR post-processing failed:', error);
      throw new Error(`Post-processing failed: ${error.message}`);
    }
  }

  /**
   * Initial text cleaning - remove noise and normalize whitespace
   */
  initialTextCleaning(text) {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      
      // Remove common OCR artifacts
      .replace(/[""'']/g, '"')  // Normalize quotes
      .replace(/[–—]/g, '-')    // Normalize dashes
      .replace(/…/g, '...')     // Normalize ellipsis
      
      // Remove isolated special characters
      .replace(/\s+[!@#$%^&*()+={}[\]|\\:";'<>?,./]\s+/g, ' ')
      
      // Clean up question numbering
      .replace(/Q\s*\.?\s*(\d+)\s*\.?\s*/gi, 'Q$1. ')
      
      // Clean up option labels
      .replace(/([A-D])\s*\)\s*/gi, '$1) ')
      .replace(/\(\s*([A-D])\s*\)\s*/gi, '($1) ')
      
      // Remove header/footer artifacts
      .replace(/^(Page\s+\d+|TOP|MCQ|Computer|Name:.*|Date:.*)/gmi, '')
      
      .trim();
  }

  /**
   * Apply character-level corrections
   */
  applyCharacterCorrections(text) {
    let correctedText = text;
    
    // Apply common character substitutions
    for (const [error, correction] of Object.entries(this.commonCorrections)) {
      const regex = new RegExp(error, 'g');
      correctedText = correctedText.replace(regex, correction);
    }
    
    // Context-aware number/letter corrections
    correctedText = this.applyContextualCorrections(correctedText);
    
    return correctedText;
  }

  /**
   * Apply context-aware corrections for ambiguous characters
   */
  applyContextualCorrections(text) {
    // Correct 0/O based on context
    text = text.replace(/\b0+\b/g, (match) => {
      // If surrounded by letters, likely should be O
      return match.replace(/0/g, 'O');
    });
    
    // Correct 1/I/l based on context
    text = text.replace(/\b1([a-z]+)\b/gi, 'I$1'); // Word beginning
    text = text.replace(/\b([a-z]+)1\b/gi, '$1l'); // Word ending
    
    // Correct 5/S based on context
    text = text.replace(/5([a-z])/gi, 'S$1');
    text = text.replace(/([a-z])5/gi, '$1s');
    
    return text;
  }

  /**
   * Apply word-level corrections using dictionary and patterns
   */
  applyWordCorrections(text) {
    let correctedText = text;
    
    // Apply word-level corrections
    for (const [error, correction] of Object.entries(this.commonCorrections)) {
      if (error.length > 2) { // Word-level corrections
        const regex = new RegExp(`\\b${error}\\b`, 'gi');
        correctedText = correctedText.replace(regex, correction);
      }
    }
    
    // Apply pattern-based corrections
    correctedText = this.applyPatternCorrections(correctedText);
    
    return correctedText;
  }

  /**
   * Apply pattern-based corrections
   */
  applyPatternCorrections(text) {
    // Fix common question word patterns
    text = text.replace(/\bwh(at|ich|en|ere|y|o)\b/gi, (match) => {
      const corrections = {
        'wnat': 'what', 'wnich': 'which', 'wnen': 'when',
        'wnere': 'where', 'wny': 'why', 'wno': 'who'
      };
      return corrections[match.toLowerCase()] || match;
    });
    
    // Fix option patterns
    text = text.replace(/[A-D]\s*\)\s*([A-Z])/g, (match, letter) => {
      return match.charAt(0) + ') ' + letter;
    });
    
    return text;
  }

  /**
   * Apply mathematical symbol corrections
   */
  applyMathematicalCorrections(text) {
    let correctedText = text;
    
    for (const [error, correction] of Object.entries(this.mathCorrections)) {
      let regex;
      // Use word boundaries only for alphanumeric errors
      if (/^[a-zA-Z0-9]+$/.test(error)) {
        regex = new RegExp(`\\b${error}\\b`, 'gi');
      } else {
        // Escape special regex characters
        const escaped = error.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escaped, 'gi');
      }
      correctedText = correctedText.replace(regex, correction);
    }
    
    // Fix mathematical expressions
    correctedText = correctedText
      .replace(/(\d)\s*x\s*(\d)/gi, '$1 × $2')
      .replace(/(\d)\s*\/\s*(\d)/gi, '$1 ÷ $2')
      .replace(/sqrt\s*\(\s*([^)]+)\s*\)/gi, '√($1)');
    
    return correctedText;
  }

  /**
   * Check if text contains mathematical content
   */
  containsMathematicalContent(text) {
    const mathIndicators = [
      /\b(equation|formula|calculate|solve|derivative|integral)\b/i,
      /[+\-×÷=∫∑√π]/,
      /\b(sin|cos|tan|log|ln|exp)\b/i,
      /\b(alpha|beta|gamma|delta|theta|lambda|sigma)\b/i
    ];
    
    return mathIndicators.some(pattern => pattern.test(text));
  }

  /**
   * Extract question structure from cleaned text
   */
  extractQuestionStructure(text) {
    const questions = [];
    
    // Split text into potential question blocks
    const questionBlocks = this.splitIntoQuestionBlocks(text);
    
    for (let i = 0; i < questionBlocks.length; i++) {
      const block = questionBlocks[i];
      const questionData = this.analyzeQuestionBlock(block, i + 1);
      
      if (questionData) {
        questions.push(questionData);
      }
    }
    
    return questions;
  }

  /**
   * Split text into question blocks
   */
  splitIntoQuestionBlocks(text) {
    // Split by question markers
    const questionMarkers = /(?:^|\n)\s*Q\.?\s*\d*\.?\s*/gi;
    let blocks = text.split(questionMarkers).filter(block => block.trim().length > 10);
    
    // If no clear question markers, try other patterns
    if (blocks.length < 2) {
      blocks = text.split(/\n\s*\d+\.?\s*/).filter(block => block.trim().length > 10);
    }
    
    return blocks;
  }

  /**
   * Analyze individual question block
   */
  analyzeQuestionBlock(block, questionId) {
    // Try to match different question types
    for (const [type, config] of Object.entries(this.questionPatterns)) {
      const result = this.matchQuestionType(block, type, config, questionId);
      if (result) {
        return result;
      }
    }
    
    // If no specific type matched, treat as descriptive
    return {
      id: questionId,
      type: 'DESCRIPTIVE',
      questionText: this.cleanQuestionText(block),
      confidence: 0.5,
      rawText: block
    };
  }

  /**
   * Match question block against specific type pattern
   */
  matchQuestionType(block, type, config, questionId) {
    const match = block.match(config.pattern);
    if (!match) return null;
    
    const questionData = {
      id: questionId,
      type: type.toUpperCase(),
      questionText: this.cleanQuestionText(match[1] || match[0]),
      confidence: config.confidence,
      rawText: block
    };
    
    // Extract type-specific data
    if (type === 'mcq') {
      questionData.options = this.extractOptions(block);
      questionData.confidence = this.calculateMCQConfidence(questionData);
    } else if (type === 'fib') {
      questionData.blanks = this.extractBlanks(block);
      questionData.confidence = this.calculateFIBConfidence(questionData);
    }
    
    return questionData;
  }

  /**
   * Extract MCQ options from text
   */
  extractOptions(text) {
    const options = [];
    const optionPattern = /([A-D])\)\s*(.+?)(?=\s*[A-D]\)|$)/gi;
    let match;
    
    while ((match = optionPattern.exec(text)) !== null) {
      options.push({
        label: match[1].toUpperCase(),
        text: this.cleanOptionText(match[2])
      });
    }
    
    return options;
  }

  /**
   * Extract blanks from fill-in-the-blank questions
   */
  extractBlanks(text) {
    const blanks = [];
    const blankPattern = /_{3,}|\[[\s\.]*\]|\(\s*\)|\.\.\./g;
    let match;
    let blankCount = 1;
    
    while ((match = blankPattern.exec(text)) !== null) {
      blanks.push({
        id: blankCount++,
        position: match.index,
        placeholder: match[0],
        length: match[0].length
      });
    }
    
    return blanks;
  }

  /**
   * Clean question text
   */
  cleanQuestionText(text) {
    return text
      .replace(/^\d+\.?\s*/, '') // Remove question numbers
      .replace(/^Q\.?\s*\d*\.?\s*/i, '') // Remove Q prefixes
      .trim();
  }

  /**
   * Clean option text
   */
  cleanOptionText(text) {
    return text
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate confidence for MCQ questions
   */
  calculateMCQConfidence(questionData) {
    let confidence = 0.5;
    
    // Check for proper option count
    if (questionData.options.length >= 2 && questionData.options.length <= 5) {
      confidence += 0.2;
    }
    
    // Check for question indicators
    if (/\?/.test(questionData.questionText)) {
      confidence += 0.1;
    }
    
    // Check for option quality
    const avgOptionLength = questionData.options.reduce((sum, opt) => 
      sum + opt.text.length, 0) / questionData.options.length;
    
    if (avgOptionLength > 5 && avgOptionLength < 50) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate confidence for Fill-in-the-Blank questions
   */
  calculateFIBConfidence(questionData) {
    let confidence = 0.5;
    
    // Check for proper blank count
    if (questionData.blanks.length > 0 && questionData.blanks.length <= 5) {
      confidence += 0.2;
    }
    
    // Check for context around blanks
    if (questionData.questionText.length > 20) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Validate content quality and consistency
   */
  validateContent(structuredData, confidence = {}) {
    return structuredData.map(question => {
      const validation = this.validateQuestion(question, confidence);
      return {
        ...question,
        validation: validation,
        confidence: Math.min(question.confidence * validation.score, 1.0)
      };
    });
  }

  /**
   * Validate individual question
   */
  validateQuestion(question, confidence) {
    const validation = {
      score: 1.0,
      issues: [],
      suggestions: []
    };
    
    // Validate question text
    if (question.questionText.length < 10) {
      validation.score *= 0.7;
      validation.issues.push('Question text too short');
      validation.suggestions.push('Consider combining with nearby text');
    }
    
    // Type-specific validation
    if (question.type === 'MCQ') {
      this.validateMCQ(question, validation);
    } else if (question.type === 'FIB') {
      this.validateFIB(question, validation);
    }
    
    return validation;
  }

  /**
   * Validate MCQ question
   */
  validateMCQ(question, validation) {
    if (!question.options || question.options.length < 2) {
      validation.score *= 0.5;
      validation.issues.push('Insufficient options for MCQ');
      validation.suggestions.push('Check for missing option text');
    }
    
    if (question.options && question.options.length > 5) {
      validation.score *= 0.8;
      validation.issues.push('Too many options for typical MCQ');
      validation.suggestions.push('Verify option extraction accuracy');
    }
  }

  /**
   * Validate Fill-in-the-Blank question
   */
  validateFIB(question, validation) {
    if (!question.blanks || question.blanks.length === 0) {
      validation.score *= 0.3;
      validation.issues.push('No blanks detected for FIB question');
      validation.suggestions.push('Check blank pattern recognition');
    }
  }

  /**
   * Assess overall quality of OCR processing
   */
  assessQuality(originalText, cleanedText, structuredData) {
    const metrics = {
      textQuality: this.assessTextQuality(originalText, cleanedText),
      structureQuality: this.assessStructureQuality(structuredData),
      overallScore: 0,
      recommendations: []
    };
    
    // Calculate overall score
    metrics.overallScore = (metrics.textQuality.score + metrics.structureQuality.score) / 2;
    
    // Generate recommendations
    if (metrics.overallScore < 0.6) {
      metrics.recommendations.push('Consider re-scanning with higher quality settings');
    }
    if (metrics.textQuality.score < 0.5) {
      metrics.recommendations.push('Text quality is poor - manual review recommended');
    }
    if (metrics.structureQuality.score < 0.5) {
      metrics.recommendations.push('Question structure unclear - manual parsing may be needed');
    }
    
    return metrics;
  }

  /**
   * Assess text quality
   */
  assessTextQuality(originalText, cleanedText) {
    const corrections = this.countCorrections(originalText, cleanedText);
    const correctionRatio = corrections / Math.max(originalText.length, 1);
    
    return {
      score: Math.max(0, 1 - correctionRatio * 2),
      correctionsMade: corrections,
      correctionRatio: correctionRatio,
      readability: this.assessReadability(cleanedText)
    };
  }

  /**
   * Assess structure quality
   */
  assessStructureQuality(structuredData) {
    if (!structuredData.length) {
      return { score: 0, questionsFound: 0, avgConfidence: 0 };
    }
    
    const avgConfidence = structuredData.reduce((sum, q) => sum + q.confidence, 0) / structuredData.length;
    const wellStructuredQuestions = structuredData.filter(q => q.confidence > 0.7).length;
    const structureScore = wellStructuredQuestions / structuredData.length;
    
    return {
      score: (avgConfidence + structureScore) / 2,
      questionsFound: structuredData.length,
      avgConfidence: avgConfidence,
      wellStructuredRatio: structureScore
    };
  }

  /**
   * Assess text readability
   */
  assessReadability(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / Math.max(words.length, 1);
    const longWords = words.filter(word => word.length > 6).length;
    
    return {
      wordCount: words.length,
      avgWordLength: avgWordLength,
      longWordRatio: longWords / Math.max(words.length, 1),
      readabilityScore: Math.max(0, Math.min(1, (10 - avgWordLength) / 5))
    };
  }

  /**
   * Count corrections made during processing
   */
  countCorrections(original, processed) {
    if (original === processed) return 0;
    
    // Simple edit distance calculation
    const matrix = [];
    const len1 = original.length;
    const len2 = processed.length;
    
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (original.charAt(i - 1) === processed.charAt(j - 1)) {
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
    
    return matrix[len1][len2];
  }
}

module.exports = new OCRPostProcessingService();