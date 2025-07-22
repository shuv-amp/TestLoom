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
      // Preserve line breaks for structure detection
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      
      // Remove excessive whitespace but preserve structure
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      
      // Remove common OCR artifacts
      .replace(/[""'']/g, '"')  // Normalize quotes
      .replace(/[–—]/g, '-')    // Normalize dashes
      .replace(/…/g, '...')     // Normalize ellipsis
      
      // Remove isolated special characters but preserve structure markers
      .replace(/(?<!\w)[!@#$%^&*+={}[\]|\\:";'<>?,./](?!\w)/g, '')
      
      // Clean up question numbering with better pattern recognition
      .replace(/(?:^|\n)\s*(?:Q|Question)\s*\.?\s*(\d+)\s*\.?\s*/gi, '\nQ$1. ')
      .replace(/(?:^|\n)\s*(\d+)\s*\.(?!\d)/gi, '\nQ$1. ')
      
      // Clean up option labels with enhanced pattern matching
      .replace(/(?:^|\n)\s*([A-E])\s*[\)\.\:]\s*/gi, '\n$1) ')
      .replace(/(?:^|\n)\s*\(\s*([A-E])\s*\)\s*/gi, '\n$1) ')
      
      // Remove header/footer artifacts with expanded patterns
      .replace(/^(Page\s+\d+|TOP|MCQ|Computer|Name:.*|Date:.*|Score:.*|Time:.*|Instructions:.*)/gmi, '')
      .replace(/(?:^|\n)(Header|Footer|Page \d+ of \d+|Continue on next page)/gmi, '')
      
      // Remove duplicate question markers
      .replace(/(\nQ\d+\. )+/g, '$1')
      
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
   * Split text into question blocks with enhanced detection
   */
  splitIntoQuestionBlocks(text) {
    // Enhanced question marker patterns
    const questionMarkers = [
      /(?:^|\n)\s*Q\.?\s*(\d+)\s*\.?\s*/gi,           // Q1. or Q.1 or Q 1.
      /(?:^|\n)\s*Question\s+(\d+)\s*[\.\:\-]?\s*/gi, // Question 1:
      /(?:^|\n)\s*(\d+)\s*\.(?!\d)/gi,                // 1. (but not 1.5)
      /(?:^|\n)\s*\[(\d+)\]\s*/gi,                    // [1]
      /(?:^|\n)\s*\((\d+)\)\s*/gi                     // (1)
    ];
    
    let blocks = [];
    let bestSplit = [];
    let maxBlocks = 0;
    
    // Try each pattern and use the one that gives the most reasonable splits
    for (const pattern of questionMarkers) {
      const splits = text.split(pattern).filter(block => block.trim().length > 20);
      if (splits.length > maxBlocks && splits.length < 50) { // Reasonable range
        maxBlocks = splits.length;
        bestSplit = splits;
      }
    }
    
    // If no good split found, try paragraph-based splitting
    if (bestSplit.length < 2) {
      bestSplit = text.split(/\n\s*\n/).filter(block => block.trim().length > 20);
    }
    
    // Final fallback - split by double newlines or long single newlines
    if (bestSplit.length < 2) {
      bestSplit = text.split(/\n(?=\s*[A-Z].*\?)/g).filter(block => block.trim().length > 20);
    }
    
    return bestSplit.map(block => block.trim());
  }

  /**
   * Analyze individual question block with enhanced logic
   */
  analyzeQuestionBlock(block, questionId) {
    // Clean and normalize the block
    const normalizedBlock = this.normalizeQuestionBlock(block);
    
    // Separate question from options more precisely
    const parsedData = this.parseQuestionAndOptions(normalizedBlock);
    
    if (!parsedData.questionText || parsedData.questionText.length < 5) {
      return null; // Skip invalid blocks
    }
    
    // Determine question type with enhanced detection
    const questionType = this.determineQuestionType(parsedData);
    
    const questionData = {
      id: questionId,
      type: questionType.type,
      questionText: parsedData.questionText,
      confidence: questionType.confidence,
      rawText: block
    };
    
    // Add type-specific data
    if (questionType.type === 'MCQ') {
      questionData.options = parsedData.options;
      questionData.confidence = this.calculateMCQConfidence(questionData);
    } else if (questionType.type === 'FIB') {
      questionData.blanks = this.extractBlanks(parsedData.questionText);
      questionData.confidence = this.calculateFIBConfidence(questionData);
    }
    
    return questionData;
  }

  /**
   * Normalize question block for better parsing
   */
  normalizeQuestionBlock(block) {
    return block
      // Remove leading question numbers/markers
      .replace(/^(?:Q\.?\s*\d*\.?\s*|Question\s+\d+\s*[\.\:\-]?\s*|\d+\s*\.(?!\d)\s*)/i, '')
      
      // Ensure proper line breaks before options
      .replace(/([.!?])\s*([A-E])\s*[\)\.\:]/, '$1\n$2) ')
      
      // Clean up option formatting
      .replace(/\n\s*([A-E])\s*[\)\.\:]\s*/gi, '\n$1) ')
      
      // Remove excessive spacing
      .replace(/\s+/g, ' ')
      .replace(/\n\s+/g, '\n')
      
      .trim();
  }

  /**
   * Parse question text and options with enhanced separation logic
   */
  parseQuestionAndOptions(block) {
    const result = {
      questionText: '',
      options: []
    };
    
    // Split by option markers
    const optionPattern = /\n([A-E])\)\s*/gi;
    const parts = block.split(optionPattern);
    
    if (parts.length > 1) {
      // First part is question text
      result.questionText = parts[0].trim();
      
      // Extract options
      for (let i = 1; i < parts.length; i += 2) {
        if (i + 1 < parts.length) {
          const label = parts[i].toUpperCase();
          const text = parts[i + 1].trim();
          
          // Validate option
          if (text.length > 0 && text.length < 500) { // Reasonable option length
            result.options.push({
              label: label,
              text: this.cleanOptionText(text)
            });
          }
        }
      }
    } else {
      // No clear options found - might be descriptive or FIB
      result.questionText = block.trim();
    }
    
    // Post-process question text
    result.questionText = this.cleanQuestionText(result.questionText);
    
    return result;
  }

  /**
   * Determine question type with enhanced logic
   */
  determineQuestionType(parsedData) {
    // MCQ detection with multiple criteria
    if (parsedData.options.length >= 2) {
      let mcqConfidence = 0.8;
      
      // Check for question indicator
      if (/[?]/.test(parsedData.questionText)) {
        mcqConfidence += 0.1;
      }
      
      // Check option quality
      const validOptions = parsedData.options.filter(opt => 
        opt.text.length > 2 && opt.text.length < 200
      );
      
      if (validOptions.length === parsedData.options.length) {
        mcqConfidence += 0.05;
      }
      
      // Check for typical MCQ phrases
      if (/\b(choose|select|which|best describes|most likely|correct)\b/i.test(parsedData.questionText)) {
        mcqConfidence += 0.05;
      }
      
      return { type: 'MCQ', confidence: Math.min(mcqConfidence, 1.0) };
    }
    
    // Fill-in-the-blank detection
    const blankPatterns = [
      /_{3,}/g,                    // Underscores
      /\[[\s\.]*\]/g,             // Empty brackets
      /\(\s*\)/g,                 // Empty parentheses
      /\.{3,}/g,                  // Dots
      /\b(blank|fill|complete)\b/i // Keywords
    ];
    
    let blankCount = 0;
    for (const pattern of blankPatterns) {
      const matches = parsedData.questionText.match(pattern);
      if (matches) {
        blankCount += matches.length;
      }
    }
    
    if (blankCount > 0 || /\b(fill|complete|blank)\b/i.test(parsedData.questionText)) {
      return { type: 'FIB', confidence: 0.7 + Math.min(blankCount * 0.1, 0.2) };
    }
    
    // True/False detection
    if (/\b(true|false|T\/F|yes\/no)\b/i.test(parsedData.questionText)) {
      return { type: 'TRUEFALSE', confidence: 0.8 };
    }
    
    // Default to descriptive
    return { type: 'DESCRIPTIVE', confidence: 0.6 };
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
   * Extract MCQ options with enhanced validation
   */
  extractOptions(text) {
    const options = [];
    const patterns = [
      /([A-E])\)\s*(.+?)(?=\s*[A-E]\)|$)/gi,          // A) option
      /([A-E])\.\s*(.+?)(?=\s*[A-E]\.|$)/gi,          // A. option
      /([A-E])\:\s*(.+?)(?=\s*[A-E]\:|$)/gi,          // A: option
      /\(([A-E])\)\s*(.+?)(?=\s*\([A-E]\)|$)/gi       // (A) option
    ];
    
    let bestOptions = [];
    let maxValidOptions = 0;
    
    // Try each pattern and use the best result
    for (const pattern of patterns) {
      const currentOptions = [];
      let match;
      
      while ((match = pattern.exec(text)) !== null) {
        const label = match[1].toUpperCase();
        const optionText = this.cleanOptionText(match[2]);
        
        // Validate option text
        if (this.isValidOption(optionText)) {
          currentOptions.push({
            label: label,
            text: optionText,
            position: match.index
          });
        }
      }
      
      // Use this pattern if it gives more valid options
      if (currentOptions.length > maxValidOptions) {
        maxValidOptions = currentOptions.length;
        bestOptions = currentOptions;
      }
    }
    
    // Sort options by position and label to maintain order
    return bestOptions.sort((a, b) => a.label.charCodeAt(0) - b.label.charCodeAt(0));
  }

  /**
   * Validate if text is a reasonable option
   */
  isValidOption(text) {
    if (!text || text.length < 1 || text.length > 300) {
      return false;
    }
    
    // Check for common invalid patterns
    const invalidPatterns = [
      /^[^a-zA-Z0-9]*$/,  // Only special characters
      /^[.\-_\s]+$/,      // Only separators
      /^\d+\s*$$/,        // Only numbers
    ];
    
    for (const pattern of invalidPatterns) {
      if (pattern.test(text)) {
        return false;
      }
    }
    
    return true;
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
   * Clean question text with enhanced processing
   */
  cleanQuestionText(text) {
    return text
      // Remove question numbers and prefixes
      .replace(/^(?:Q\.?\s*\d*\.?\s*|Question\s+\d+\s*[\.\:\-]?\s*|\d+\s*\.(?!\d)\s*)/i, '')
      
      // Remove trailing option indicators that got mixed in
      .replace(/\s*[A-E]\s*[\)\.\:]\s*.*$/i, '')
      
      // Clean up whitespace and punctuation
      .replace(/\s+/g, ' ')
      .replace(/^\s*[\.\-\:]\s*/, '') // Remove leading punctuation
      
      // Ensure proper sentence structure
      .replace(/([.!?])\s*([a-z])/g, '$1 $2') // Space after punctuation
      
      .trim();
  }

  /**
   * Clean option text with enhanced processing  
   */
  cleanOptionText(text) {
    return text
      // Remove trailing option markers that might have been captured
      .replace(/\s*[A-E]\s*[\)\.\:]\s*$/i, '')
      
      // Clean up line breaks and excessive spacing
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      
      // Remove leading/trailing punctuation artifacts
      .replace(/^[\.\-\:\)]+\s*/, '')
      .replace(/\s*[\.\-\:]+$/, '')
      
      // Fix common OCR issues in options
      .replace(/\bi\b/g, 'I') // Standalone 'i' should be 'I'
      .replace(/\bo\b/g, '0') // Standalone 'o' might be '0' in math
      
      .trim();
  }

  /**
   * Calculate confidence for MCQ questions with enhanced metrics
   */
  calculateMCQConfidence(questionData) {
    let confidence = 0.4; // Base confidence
    
    // Check for proper option count (2-5 is reasonable for MCQ)
    const optionCount = questionData.options.length;
    if (optionCount >= 2 && optionCount <= 5) {
      confidence += 0.3;
      if (optionCount === 4) confidence += 0.1; // Bonus for typical 4-option MCQ
    } else if (optionCount > 5) {
      confidence -= 0.2; // Penalty for too many options
    }
    
    // Check for question indicators
    if (/[?]/.test(questionData.questionText)) {
      confidence += 0.1;
    }
    
    // Check for MCQ keywords
    const mcqKeywords = /\b(choose|select|which|best|most|correct|appropriate|following)\b/i;
    if (mcqKeywords.test(questionData.questionText)) {
      confidence += 0.1;
    }
    
    // Check option quality
    const validOptions = questionData.options.filter(opt => 
      opt.text.length > 3 && opt.text.length < 150 && 
      !opt.text.match(/^[^a-zA-Z0-9]*$/) // Not just special characters
    );
    
    const optionQuality = validOptions.length / questionData.options.length;
    confidence += optionQuality * 0.2;
    
    // Check for balanced option lengths (good MCQs have similar length options)
    if (questionData.options.length > 1) {
      const lengths = questionData.options.map(opt => opt.text.length);
      const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
      const stdDev = Math.sqrt(variance);
      
      // Lower standard deviation indicates more balanced options
      if (stdDev < avgLength * 0.5) {
        confidence += 0.05;
      }
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
    // First pass - basic validation
    let validatedData = structuredData.map(question => {
      const validation = this.validateQuestion(question, confidence);
      return {
        ...question,
        validation: validation,
        confidence: Math.min(question.confidence * validation.score, 1.0)
      };
    });
    
    // Second pass - cross-question validation and cleanup
    validatedData = this.performCrossValidation(validatedData);
    
    // Third pass - remove obviously invalid questions
    return validatedData.filter(question => this.shouldKeepQuestion(question));
  }

  /**
   * Cross-validation between questions to catch edge cases
   */
  performCrossValidation(questions) {
    return questions.map((question, index) => {
      const updatedQuestion = { ...question };
      
      // Check for duplicate questions
      const duplicates = questions.filter((q, i) => 
        i !== index && this.areQuestionsSimilar(question, q)
      );
      
      if (duplicates.length > 0) {
        updatedQuestion.validation.issues.push('Potential duplicate question detected');
        updatedQuestion.confidence *= 0.7;
      }
      
      // Check for questions that are actually options from previous question
      if (index > 0) {
        const prevQuestion = questions[index - 1];
        if (this.looksLikeOption(question, prevQuestion)) {
          updatedQuestion.validation.issues.push('May be misidentified option');
          updatedQuestion.confidence *= 0.3;
        }
      }
      
      // Validate question length relative to options
      if (question.type === 'MCQ' && question.options) {
        const avgOptionLength = question.options.reduce((sum, opt) => 
          sum + opt.text.length, 0) / question.options.length;
        
        if (question.questionText.length < avgOptionLength * 0.3) {
          updatedQuestion.validation.issues.push('Question too short relative to options');
          updatedQuestion.confidence *= 0.6;
        }
      }
      
      return updatedQuestion;
    });
  }

  /**
   * Check if two questions are similar (potential duplicates)
   */
  areQuestionsSimilar(q1, q2) {
    if (!q1.questionText || !q2.questionText) return false;
    
    const text1 = q1.questionText.toLowerCase().replace(/\s+/g, ' ').trim();
    const text2 = q2.questionText.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Simple similarity check - can be enhanced with more sophisticated algorithms
    const similarity = this.calculateTextSimilarity(text1, text2);
    return similarity > 0.8;
  }

  /**
   * Check if a question looks like it should be an option
   */
  looksLikeOption(question, prevQuestion) {
    if (!question.questionText || question.questionText.length > 100) {
      return false;
    }
    
    // Check if it starts with option-like patterns
    const optionPatterns = [
      /^[A-E]\s*[\)\.\:]/,
      /^(All of the above|None of the above|Both A and B)/i,
      /^(True|False|Yes|No)$/i
    ];
    
    return optionPatterns.some(pattern => pattern.test(question.questionText.trim()));
  }

  /**
   * Decide whether to keep a question based on validation results
   */
  shouldKeepQuestion(question) {
    // Remove questions with very low confidence
    if (question.confidence < 0.2) {
      return false;
    }
    
    // Remove questions that are too short to be meaningful
    if (!question.questionText || question.questionText.length < 10) {
      return false;
    }
    
    // Remove questions that are just punctuation or numbers
    if (/^[^a-zA-Z]*$/.test(question.questionText)) {
      return false;
    }
    
    // Remove MCQ questions without valid options
    if (question.type === 'MCQ' && (!question.options || question.options.length < 2)) {
      return false;
    }
    
    return true;
  }

  /**
   * Calculate text similarity using simple algorithm
   */
  calculateTextSimilarity(text1, text2) {
    if (text1 === text2) return 1.0;
    
    const len1 = text1.length;
    const len2 = text2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1.0;
    
    const editDistance = this.countCorrections(text1, text2);
    return 1.0 - (editDistance / maxLen);
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