const ultraEnhancedOCRService = require('./ultraEnhancedOCRService');
const geminiQuestionParser = require('./aiQuestionParser');
const enhancedTraditionalParser = require('./enhancedTraditionalParser');

class OCRService {
  constructor() {
    this.logger = console;
  }

  /**
   * Main entry point for ultra-enhanced OCR and question parsing
   */
  async extractTextFromImage(imageBuffer, options = {}) {
    try {
      const startTime = Date.now();

      // Use ultra-enhanced OCR service
      const ocrResult = await ultraEnhancedOCRService.extractTextFromImage(imageBuffer, options);

      this.logger.info(`Ultra OCR completed with confidence: ${ocrResult.confidence} using ${ocrResult.engine} (${ocrResult.variant})`);

      return {
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        processingTime: Date.now() - startTime,
        metadata: {
          engine: ocrResult.engine,
          variant: ocrResult.variant,
          wordCount: ocrResult.wordCount,
          preprocessingAnalysis: ocrResult.preprocessingAnalysis,
          ultraProcessed: true
        }
      };
    } catch (error) {
      this.logger.error('Ultra OCR extraction error:', error);
      throw new Error(`Ultra OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Parse questions with Gemini AI-first approach and traditional fallback
   */
  async parseQuestions(rawText, options = {}) {
    try {
      const startTime = Date.now();

      if (!rawText || rawText.trim().length < 20) {
        return [];
      }

      let result = null;
      let method = 'unknown';

      // Try Gemini AI parsing first if API key is available
      if (process.env.GEMINI_API_KEY) {
        try {
          this.logger.info('Attempting Gemini AI-powered question parsing...');
          result = await geminiQuestionParser.parseQuestionsWithAI(rawText, options);
          method = 'gemini';

          // If Gemini parsing was successful and confident, use it
          if (result.success && result.confidence > 0.7 && result.questions.length > 0) {
            this.logger.info(`Gemini AI parsing successful with confidence: ${result.confidence}`);
            return this.formatQuestionsForResponse(result.questions, {
              method: 'gemini',
              confidence: result.confidence,
              processingTime: Date.now() - startTime,
              geminiTokensUsed: result.tokensUsed
            });
          }
        } catch (aiError) {
          this.logger.warn('Gemini AI parsing failed, falling back to traditional parsing:', aiError.message);
        }
      } else {
        this.logger.info('No Gemini API key found, using traditional parsing only');
      }

      // Fallback to enhanced traditional parsing
      this.logger.info('Using enhanced traditional question parsing...');
      result = enhancedTraditionalParser.parseQuestions(rawText, options);
      method = 'traditional';

      // If traditional parsing also failed, try the original parsing as last resort
      if (!result.questions || result.questions.length === 0) {
        this.logger.info('Enhanced traditional parsing failed, trying original parser...');
        result = { questions: this.parseQuestionsOriginal(rawText), confidence: 0.5 };
        method = 'original';
      }

      return this.formatQuestionsForResponse(result.questions, {
        method,
        confidence: result.confidence || 0.5,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      this.logger.error('Question parsing failed:', error);
      return [];
    }
  }

  /**
   * Format questions for consistent response structure
   */
  formatQuestionsForResponse(questions, metadata = {}) {
    return questions.map((question, index) => ({
      id: question.id || index + 1,
      questionText: question.questionText,
      questionType: question.questionType || 'MCQ',
      options: question.options || {},
      correctAnswer: question.correctAnswer || null,
      confidence: question.confidence || metadata.confidence || 0.5,
      metadata: {
        ...metadata,
        confidence: question.confidence || metadata.confidence || 0.5,
        hasDetectedAnswer: !!question.correctAnswer
      }
    }));
  }

  /**
   * Original parsing method as final fallback
   */
  parseQuestionsOriginal(rawText) {
    if (!rawText || rawText.trim().length === 0) {
      return [];
    }

    // Remove headers and useless lines
    const lines = rawText.split('\n').map(line => line.trim());
    const filteredLines = lines.filter(line => {
      // Discard lines that are headers, page numbers, or contain only underscores
      if (/^_{2,}/.test(line)) return false;
      if (/^TOP|MCQ|Computer|Page \d+/i.test(line)) return false;
      if (line.length < 8) return false;
      return true;
    });
    const cleanText = filteredLines.join('\n');

    // Split questions by Q. or Q\n or Q (with/without dot)
    const questionBlocks = cleanText.split(/\n?Q\.?\s/).filter(q => q.trim().length > 0);
    // Match options like a) LCD, b) CRT, c) LED, d) None of these (across lines)
    // Improved option extraction: split by each [a-dA-D]) marker, capturing all options individually
    const optionSplitRegex = /([a-dA-D])\)\s*([^\n]*)(?=\s*[a-dA-D]\)|$)/g;

    const questions = [];
    let questionId = 1;
    for (let block of questionBlocks) {
      // Find the question text (before first option)
      const firstOptionIdx = block.search(/[a-dA-D]\)/);
      let questionText = firstOptionIdx > 0 ? block.slice(0, firstOptionIdx).replace(/^[\d\.\)\s]+/, '').trim() : block.trim();
      // Extract options
      const options = [];
      // Use a global regex to find all option markers and their positions
      const optionMarkers = [...block.matchAll(/([a-dA-D])\)/g)];
      for (let i = 0; i < optionMarkers.length; i++) {
        const label = optionMarkers[i][1].toUpperCase();
        const startIdx = optionMarkers[i].index + 2; // after 'a)'
        const endIdx = (i < optionMarkers.length - 1) ? optionMarkers[i + 1].index : block.length;
        let text = block.slice(startIdx, endIdx).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        if (text.length > 0) {
          options.push({ label, text });
        }
      }
      if (questionText.length < 8 || options.length < 2) continue;
      questions.push({
        id: questionId++,
        questionText,
        options
      });
    }
    return questions.map(q => ({ id: q.id, questionText: q.questionText, options: q.options }));
  }

  parseQuestionContent(content, questionId) {
    const mcqPatterns = [
      /^(.+?)(?:\n|$)\s*(?:[A-Z][\.\)]\s*.+)/m,
      /^(.+?)(?=\s*[A-Z][\.\)]\s*)/m,
      /^(.+?)(?=\s*\([A-Z]\)\s*)/m
    ];

    const fibPatterns = [
      /_{3,}/,
      /\[[\s\.]*\]/,
      /\(\s*\)/,
      /\.{3,}/,
      /fill\s+in\s+the\s+blank/i,
      /complete\s+the\s+sentence/i,
      /insert\s+the\s+correct/i
    ];

    const optionPatterns = [
      /([A-Z])[\.\)]\s*(.+?)(?=\n[A-Z][\.\)]|\n\n|$)/g,
      /\(([A-Z])\)\s*(.+?)(?=\n\([A-Z]\)|\n\n|$)/g,
      /([1-4])[\.\)]\s*(.+?)(?=\n[1-4][\.\)]|\n\n|$)/g
    ];

    for (const pattern of mcqPatterns) {
      const match = content.match(pattern);
      if (match) {
        const questionText = match[1].trim();
        const options = [];

        for (const optionPattern of optionPatterns) {
          const optionMatches = [...content.matchAll(optionPattern)];

          if (optionMatches.length >= 2) {
            for (const optionMatch of optionMatches) {
              options.push({
                label: optionMatch[1],
                text: optionMatch[2].trim()
              });
            }
            break;
          }
        }

        if (options.length >= 2) {
          const detectedAnswer = this.detectCorrectAnswer(content, options);

          return {
            id: questionId,
            questionType: 'MCQ',
            questionText: this.cleanQuestionText(questionText),
            options: options,
            detectedAnswer: detectedAnswer,
            confidence: this.calculateConfidence(content, options)
          };
        }
      }
    }

    for (const pattern of fibPatterns) {
      if (pattern.test(content)) {
        const blanks = this.extractBlanks(content);

        return {
          id: questionId,
          questionType: 'FIB',
          questionText: this.cleanQuestionText(content),
          blanks: blanks,
          blankCount: blanks.length,
          detectedAnswer: null,
          confidence: blanks.length > 0 ? 0.8 : 0.5
        };
      }
    }

    if (content.length > 15 && this.isValidQuestion(content)) {
      return {
        id: questionId,
        questionType: 'DESCRIPTIVE',
        questionText: this.cleanQuestionText(content),
        confidence: 0.6
      };
    }

    return null;
  }

  extractBlanks(content) {
    const blankPatterns = [
      /_{3,}/g,
      /\[[\s\.]*\]/g,
      /\(\s*\)/g,
      /\.{3,}/g
    ];

    const blanks = [];
    let blankCount = 1;

    for (const pattern of blankPatterns) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        blanks.push({
          position: match.index,
          placeholder: match[0],
          id: blankCount++,
          length: match[0].length
        });
      }
    }

    return blanks;
  }

  isDuplicateQuestion(existingQuestions, newQuestion) {
    const similarity = 0.8;

    for (const existing of existingQuestions) {
      const similarityScore = this.calculateSimilarity(
        existing.questionText.toLowerCase(),
        newQuestion.questionText.toLowerCase()
      );

      if (similarityScore > similarity) {
        return true;
      }
    }

    return false;
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

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

  splitTextIntoSegments(text) {
    const segments = text.split(/\n\n+/);
    return segments.filter(segment => segment.trim().length > 15);
  }

  detectCorrectAnswer(content, options) {
    const answerPatterns = [
      /answer[\s:]*([A-Z])/i,
      /correct[\s:]*([A-Z])/i,
      /solution[\s:]*([A-Z])/i,
      /\(([A-Z])\)\s*✓/i,
      /([A-Z])\s*✓/i
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

  calculateConfidence(content, options) {
    let confidence = 0.5;

    if (options && options.length >= 3) confidence += 0.2;
    if (options && options.length === 4) confidence += 0.1;

    if (content.includes('?')) confidence += 0.1;

    if (/\b(what|which|how|when|where|why|who)\b/i.test(content)) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  cleanQuestionText(text) {
    return text
      .replace(/^\d+[\.\)]\s*/, '')
      .replace(/^Q[\.\s]*\d+[\.\)]?\s*/i, '')
      .replace(/^Question\s+\d+[\.\:]?\s*/i, '')
      .trim();
  }

  isValidQuestion(text) {
    const questionIndicators = [
      /\?/,
      /\b(what|which|how|when|where|why|who|define|explain|describe|calculate)\b/i,
      /\b(true|false)\b/i,
      /\b(correct|incorrect)\b/i
    ];

    return questionIndicators.some(pattern => pattern.test(text));
  }

  postProcessQuestions(questions) {
    return questions.map((question, index) => {
      question.id = index + 1;

      if (question.questionType === 'MCQ' && question.options) {
        question.options = question.options.map((option, optIndex) => ({
          ...option,
          id: `${question.id}_${optIndex + 1}`
        }));
      }

      return question;
    });
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

module.exports = new OCRService();