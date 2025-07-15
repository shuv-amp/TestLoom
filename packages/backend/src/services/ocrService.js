const { createWorker } = require('tesseract.js');

class OCRService {
  constructor() {
    this.worker = null;
  }

  async initialize() {
    if (!this.worker) {
      this.worker = await createWorker();
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
    }
  }

  async extractTextFromImage(imageBuffer) {
    try {
      await this.initialize();
      
      const { data: { text } } = await this.worker.recognize(imageBuffer, {
        logger: m => console.log(`OCR Progress: ${m.status} - ${Math.round(m.progress * 100)}%`)
      });

      return text;
    } catch (error) {
      console.error('OCR extraction error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  parseQuestions(rawText) {
    if (!rawText || rawText.trim().length === 0) {
      return [];
    }

    const cleanText = rawText
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .replace(/[""'']/g, '"')
      .replace(/[–—]/g, '-')
      .trim();

    const questionPatterns = [
      /(?:^|\n)\s*(\d+[\.\)])\s*(.+?)(?=\n\s*\d+[\.\)]|\n\s*[A-Z][\.\)]|$)/gms,
      /(?:^|\n)\s*(Q[\.\s]*\d+[\.\)]?)\s*(.+?)(?=\n\s*Q[\.\s]*\d+|$)/gms,
      /(?:^|\n)\s*(Question\s+\d+[\.\:]?)\s*(.+?)(?=\n\s*Question\s+\d+|$)/gms,
      /(?:^|\n)\s*([A-Z]\d+[\.\)])\s*(.+?)(?=\n\s*[A-Z]\d+[\.\)]|$)/gms,
      /(?:^|\n)\s*(\d+[\.\)]\d+)\s*(.+?)(?=\n\s*\d+[\.\)]\d+|$)/gms
    ];

    const questions = [];
    let questionId = 1;

    for (const pattern of questionPatterns) {
      const matches = [...cleanText.matchAll(pattern)];
      
      for (const match of matches) {
        const questionMarker = match[1];
        const questionContent = match[2].trim();
        
        if (questionContent.length < 8) continue;

        const parsedQuestion = this.parseQuestionContent(questionContent, questionId);
        if (parsedQuestion && !this.isDuplicateQuestion(questions, parsedQuestion)) {
          questions.push(parsedQuestion);
          questionId++;
        }
      }
      
      if (questions.length > 0) break;
    }

    if (questions.length === 0) {
      const segments = this.splitTextIntoSegments(cleanText);
      for (let i = 0; i < segments.length; i++) {
        const parsedQuestion = this.parseQuestionContent(segments[i], i + 1);
        if (parsedQuestion && !this.isDuplicateQuestion(questions, parsedQuestion)) {
          questions.push(parsedQuestion);
        }
      }
    }

    return this.postProcessQuestions(questions);
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
