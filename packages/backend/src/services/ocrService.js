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
      .trim();

    const questionPatterns = [
      /(?:^|\n)\s*(\d+[\.\)])\s*(.+?)(?=\n\s*\d+[\.\)]|\n\s*[A-Z][\.\)]|$)/gm,
      /(?:^|\n)\s*(Q[\.\s]*\d+[\.\)]?)\s*(.+?)(?=\n\s*Q[\.\s]*\d+|$)/gm,
      /(?:^|\n)\s*(Question\s+\d+[\.\:]?)\s*(.+?)(?=\n\s*Question\s+\d+|$)/gm
    ];

    const questions = [];
    let questionId = 1;

    for (const pattern of questionPatterns) {
      const matches = [...cleanText.matchAll(pattern)];
      
      for (const match of matches) {
        const questionMarker = match[1];
        const questionContent = match[2].trim();
        
        if (questionContent.length < 10) continue;

        const parsedQuestion = this.parseQuestionContent(questionContent, questionId);
        if (parsedQuestion) {
          questions.push(parsedQuestion);
          questionId++;
        }
      }
      
      if (questions.length > 0) break;
    }

    if (questions.length === 0) {
      const fallbackQuestion = this.parseQuestionContent(cleanText, 1);
      if (fallbackQuestion) {
        questions.push(fallbackQuestion);
      }
    }

    return questions;
  }

  parseQuestionContent(content, questionId) {
    const mcqPatterns = [
      /^(.+?)(?:\n|$)\s*(?:[A-Z][\.\)]\s*.+)/m,
      /^(.+?)(?=\s*[A-Z][\.\)]\s*)/m
    ];

    const fibPatterns = [
      /_{3,}/,
      /\[[\s\.]*\]/,
      /\(\s*\)/,
      /fill\s+in\s+the\s+blank/i
    ];

    const optionPattern = /([A-Z])[\.\)]\s*(.+?)(?=\n[A-Z][\.\)]|\n\n|$)/g;

    for (const pattern of mcqPatterns) {
      const match = content.match(pattern);
      if (match) {
        const questionText = match[1].trim();
        const options = [];
        
        const optionMatches = [...content.matchAll(optionPattern)];
        
        if (optionMatches.length >= 2) {
          for (const optionMatch of optionMatches) {
            options.push({
              label: optionMatch[1],
              text: optionMatch[2].trim()
            });
          }

          return {
            id: questionId,
            questionType: 'MCQ',
            questionText: questionText,
            options: options,
            detectedAnswer: null
          };
        }
      }
    }

    for (const pattern of fibPatterns) {
      if (pattern.test(content)) {
        return {
          id: questionId,
          questionType: 'FIB',
          questionText: content.trim(),
          blanks: this.extractBlanks(content),
          detectedAnswer: null
        };
      }
    }

    if (content.length > 20) {
      return {
        id: questionId,
        questionType: 'UNKNOWN',
        questionText: content.trim(),
        rawContent: content
      };
    }

    return null;
  }

  extractBlanks(content) {
    const blankPatterns = [
      /_{3,}/g,
      /\[[\s\.]*\]/g,
      /\(\s*\)/g
    ];

    const blanks = [];
    let blankCount = 1;

    for (const pattern of blankPatterns) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        blanks.push({
          position: match.index,
          placeholder: match[0],
          id: blankCount++
        });
      }
    }

    return blanks;
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

module.exports = new OCRService();
