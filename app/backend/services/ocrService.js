const Tesseract = require('tesseract.js');

class OCRQuestionParser {
  constructor(options = {}) {
    this.language = options.language || 'eng';
    this.psm = options.psm || '6';
    this.oem = options.oem || '3';
  }

  parseQuestionsFromText(extractedText) {
    if (!extractedText || typeof extractedText !== 'string') {
      throw new Error('Invalid input: extractedText must be a non-empty string');
    }

    const cleanedText = this.preprocessText(extractedText);
    const questionBlocks = this.splitIntoQuestionBlocks(cleanedText);
    const parsedQuestions = [];

    for (const block of questionBlocks) {
      try {
        const question = this.parseQuestionBlock(block);
        if (question) {
          parsedQuestions.push(question);
        }
      } catch (error) {
        console.error(`Error parsing question block: ${error.message}`);
        continue;
      }
    }

    return parsedQuestions;
  }

  preprocessText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  splitIntoQuestionBlocks(text) {
    const questionPattern = /(?=^\s*\d+\.?\s+)/gm;
    const blocks = text.split(questionPattern).filter(block => block.trim().length > 0);
    
    return blocks.map(block => block.trim());
  }

  parseQuestionBlock(block) {
    const questionNumberPattern = /^(\d+)\.?\s+(.+?)(?=\n\s*[A-E]\)|\n\s*\([A-E]\)|\n\s*[A-E]\.|\n\s*[A-E]\s+)/s;
    const match = block.match(questionNumberPattern);

    if (!match) {
      return null;
    }

    const questionNumber = parseInt(match[1], 10);
    const questionText = match[2].trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');

    const optionsText = block.substring(match[0].length);
    const options = this.parseOptions(optionsText);

    if (Object.keys(options).length === 0) {
      return null;
    }

    return {
      questionNumber,
      questionText,
      options
    };
  }

  parseOptions(optionsText) {
    const patterns = [
      /([A-E])\)\s*(.+?)(?=\n\s*[A-E]\)|\n\s*$|$)/gs,
      /\(([A-E])\)\s*(.+?)(?=\n\s*\([A-E]\)|\n\s*$|$)/gs,
      /([A-E])[\.\s]+(.+?)(?=\n\s*[A-E][\.\s]|\n\s*$|$)/gs,
      /([A-E])\s+(.+?)(?=\n\s*[A-E]\s|\n\s*$|$)/gs
    ];

    const options = {};

    for (const pattern of patterns) {
      const matches = [...optionsText.matchAll(pattern)];
      
      if (matches.length > 0) {
        for (const match of matches) {
          const optionLetter = match[1].toUpperCase();
          const optionText = match[2]
            .trim()
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ');
          
          if (optionText && !options[optionLetter]) {
            options[optionLetter] = optionText;
          }
        }
        
        if (Object.keys(options).length > 0) {
          break;
        }
      }
    }

    return options;
  }

  async processImageToQuestions(imagePath, options = {}) {
    try {
      const { data: { text } } = await Tesseract.recognize(imagePath, this.language, {
        logger: options.logger || null,
        ...options.tesseractOptions
      });

      return this.parseQuestionsFromText(text);
    } catch (error) {
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  async processImageBufferToQuestions(imageBuffer, options = {}) {
    try {
      const { data: { text } } = await Tesseract.recognize(imageBuffer, this.language, {
        logger: options.logger || null,
        ...options.tesseractOptions
      });

      return this.parseQuestionsFromText(text);
    } catch (error) {
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  validateQuestions(questions) {
    const validQuestions = [];
    const errors = [];

    for (const question of questions) {
      const validation = this.validateSingleQuestion(question);
      if (validation.isValid) {
        validQuestions.push(question);
      } else {
        errors.push({
          questionNumber: question.questionNumber,
          errors: validation.errors
        });
      }
    }

    return {
      validQuestions,
      errors,
      totalProcessed: questions.length,
      validCount: validQuestions.length
    };
  }

  validateSingleQuestion(question) {
    const errors = [];

    if (!question.questionNumber || question.questionNumber < 1) {
      errors.push('Invalid question number');
    }

    if (!question.questionText || question.questionText.trim().length < 5) {
      errors.push('Question text too short or missing');
    }

    if (!question.options || Object.keys(question.options).length < 2) {
      errors.push('Insufficient options (minimum 2 required)');
    }

    for (const [letter, text] of Object.entries(question.options || {})) {
      if (!text || text.trim().length < 1) {
        errors.push(`Option ${letter} is empty or invalid`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = OCRQuestionParser;
