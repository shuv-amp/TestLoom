const { GoogleGenerativeAI } = require('@google/generative-ai');

const CODE_BLOCK_REGEX = /```(?:json)?([\s\S]*?)```/i;

class GeminiQuestionParser {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' }); // Free tier model
        this.logger = console;
    }

    /**
     * Parse questions using Gemini AI with structured output
     */
    async parseQuestionsWithAI(rawText, options = {}) {
        try {
            const startTime = Date.now();

            if (!rawText || rawText.trim().length < 20) {
                throw new Error('Text too short for AI parsing');
            }

            // Clean the text first
            const cleanedText = this.preprocessText(rawText);

            const prompt = this.buildGeminiPrompt(cleanedText, options);

            this.logger.info('Sending text to Gemini AI for parsing...');

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const aiResultText = response.text();

            this.logger.debug('Raw Gemini AI response:', aiResultText);

            // Remove code block markers if present
            let cleanedResponse = aiResultText;
            const codeBlockMatch = CODE_BLOCK_REGEX.exec(aiResultText);
            if (codeBlockMatch) {
                cleanedResponse = codeBlockMatch[1].trim();
            }

            // Try to extract JSON object
            let aiResult;
            try {
                // Remove any trailing commas (common LLM issue)
                cleanedResponse = cleanedResponse.replace(/,\s*([}\]])/g, '$1');
                // Find the first and last curly braces
                const firstCurly = cleanedResponse.indexOf('{');
                const lastCurly = cleanedResponse.lastIndexOf('}');
                if (firstCurly !== -1 && lastCurly !== -1) {
                    const jsonStr = cleanedResponse.substring(firstCurly, lastCurly + 1);
                    aiResult = JSON.parse(jsonStr);
                } else {
                    throw new Error('No JSON object found in response');
                }
            } catch (parseError) {
                this.logger.error('Failed to parse Gemini response as JSON:', parseError.message);
                throw new Error('Invalid JSON response from Gemini AI');
            }

            // Validate and format the AI response
            const parsedQuestions = this.validateAndFormatAIResponse(aiResult);

            const processingTime = Date.now() - startTime;
            this.logger.info(`Gemini AI parsing completed in ${processingTime}ms. Found ${parsedQuestions.length} questions.`);

            return {
                success: true,
                questions: parsedQuestions,
                confidence: this.calculateAIConfidence(aiResult),
                processingTime,
                tokensUsed: response.usageMetadata?.totalTokenCount || 0,
                method: 'gemini'
            };

        } catch (error) {
            this.logger.error('Gemini AI parsing failed:', error);
            throw new Error(`Gemini AI parsing failed: ${error.message}`);
        }
    }

    /**
     * Build comprehensive prompt for Gemini AI
     */
    buildGeminiPrompt(text, options = {}) {
        return `You are an expert at parsing educational exam questions from OCR text. Your task is to extract and structure questions from the provided text with maximum accuracy.

INSTRUCTIONS:
1. Identify individual questions from the text, even if formatting is imperfect due to OCR
2. For each question, extract:
   - The question text (clean and complete)
   - All answer options (for MCQ)
   - Question type (MCQ, FIB, DESCRIPTIVE)
3. Handle OCR errors intelligently (fix obvious mistakes like "0" instead of "O", "rn" instead of "m")
4. Ignore headers, footers, page numbers, and irrelevant text
5. Return ONLY valid, complete questions

QUESTION TYPES:
- MCQ: Multiple choice with 2-5 options (a, b, c, d, e)
- FIB: Fill in the blank (contains underscores, blanks, or "fill in" instructions)
- DESCRIPTIVE: Open-ended questions requiring detailed answers

CRITICAL: You MUST return ONLY a valid JSON object with this EXACT structure:
{
  "questions": [
    {
      "questionText": "What is the primary function of Node.js?",
      "questionType": "MCQ",
      "options": {
        "a": "Client-side scripting",
        "b": "Server-side scripting", 
        "c": "Database management",
        "d": "UI design"
      }
    }
  ],
  "metadata": {
    "totalQuestions": 1,
    "questionTypes": {"MCQ": 1},
    "confidence": 0.9
  }
}

For FIB and DESCRIPTIVE questions, omit the "options" field.

QUALITY STANDARDS:
- Question text must be grammatically correct and complete
- Options must be distinct and relevant
- Fix obvious OCR errors automatically
- Ensure questions make logical sense in the ${options.subject || 'general'} subject context
- Maintain original numbering if present

TEXT TO PARSE:
${text}

${options.subject ? `\nSubject context: ${options.subject}` : ''}
${options.expectedQuestionCount ? `\nExpected question count: approximately ${options.expectedQuestionCount}` : ''}

Remember: Return ONLY the JSON object, no other text.`;
    }

    /**
     * Preprocess text before sending to AI
     */
    preprocessText(text) {
        return text
            // Remove excessive whitespace
            .replace(/\s+/g, ' ')
            // Fix common OCR errors
            .replace(/(\d+)\s*\.\s*(?=[A-Z])/g, '$1. ') // Fix question numbering
            .replace(/([a-d])\s*\)\s*/gi, '$1) ') // Fix option formatting
            .replace(/\b0(?=[A-Za-z])/g, 'O') // Common OCR error: 0 instead of O
            .replace(/\b1(?=[A-Za-z])/g, 'l') // Common OCR error: 1 instead of l
            // Remove headers and footers
            .replace(/^(PAGE|EXAM|TEST|QUIZ).*$/gmi, '')
            .replace(/^\d+\s*$/gm, '') // Remove standalone page numbers
            .trim();
    }

    /**
     * Validate and format AI response
     */
    validateAndFormatAIResponse(aiResult) {
        if (!aiResult.questions || !Array.isArray(aiResult.questions)) {
            throw new Error('Invalid AI response format: missing questions array');
        }

        const validQuestions = [];

        for (const [index, question] of aiResult.questions.entries()) {
            try {
                const validatedQuestion = this.validateQuestion(question, index + 1);
                if (validatedQuestion) {
                    validQuestions.push(validatedQuestion);
                }
            } catch (error) {
                this.logger.warn(`Question ${index + 1} validation failed:`, error.message);
            }
        }

        return validQuestions;
    }

    /**
     * Validate individual question
     */
    validateQuestion(question, id) {
        // Required fields
        if (!question.questionText || question.questionText.trim().length < 5) {
            throw new Error('Question text is missing or too short');
        }

        if (!question.questionType || !['MCQ', 'FIB', 'DESCRIPTIVE'].includes(question.questionType)) {
            throw new Error('Invalid or missing question type');
        }

        const validatedQuestion = {
            id,
            questionText: question.questionText.trim(),
            questionType: question.questionType
        };

        // Validate MCQ questions
        if (question.questionType === 'MCQ') {
            if (!question.options || typeof question.options !== 'object') {
                throw new Error('MCQ question missing options');
            }

            const optionEntries = Object.entries(question.options);
            if (optionEntries.length < 2 || optionEntries.length > 5) {
                throw new Error('MCQ must have 2-5 options');
            }

            // Validate option format
            const validOptions = {};
            for (const [label, text] of optionEntries) {
                if (!/^[a-eA-E]$/.test(label)) {
                    throw new Error(`Invalid option label: ${label}`);
                }
                if (!text || text.trim().length < 1) {
                    throw new Error(`Option ${label} is empty`);
                }
                validOptions[label.toLowerCase()] = text.trim();
            }

            validatedQuestion.options = validOptions;
        }

        return validatedQuestion;
    }

    /**
     * Calculate confidence score from AI response
     */
    calculateAIConfidence(aiResult) {
        if (!aiResult.metadata) return 0.8; // Default confidence

        const baseConfidence = aiResult.metadata.confidence || 0.8;
        const questionCount = aiResult.questions?.length || 0;

        // Adjust based on question count (more questions = more confidence in parsing)
        let adjustedConfidence = baseConfidence;
        if (questionCount > 5) adjustedConfidence += 0.1;
        if (questionCount > 10) adjustedConfidence += 0.05;

        return Math.min(adjustedConfidence, 1.0);
    }

    /**
     * Batch parsing for multiple text blocks
     */
    async batchParseQuestions(textBlocks, options = {}) {
        const results = [];
        const batchSize = 3; // Process 3 at a time to avoid rate limits

        for (let i = 0; i < textBlocks.length; i += batchSize) {
            const batch = textBlocks.slice(i, i + batchSize);

            const batchPromises = batch.map(async (text, index) => {
                try {
                    const result = await this.parseQuestionsWithAI(text, {
                        ...options,
                        batchIndex: i + index
                    });
                    return { success: true, ...result };
                } catch (error) {
                    this.logger.error(`Batch parsing failed for text block ${i + index}:`, error);
                    return {
                        success: false,
                        error: error.message,
                        batchIndex: i + index
                    };
                }
            });

            const batchResults = await Promise.allSettled(batchPromises);
            results.push(...batchResults.map(r => r.value || r.reason));

            // Rate limiting delay
            if (i + batchSize < textBlocks.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return results;
    }

    /**
     * Smart text chunking for large documents
     */
    chunkTextForParsing(text, maxChunkSize = 8000) {
        if (text.length <= maxChunkSize) {
            return [text];
        }

        const chunks = [];
        const questionMarkers = text.match(/(?:^|\n)\s*(?:Q\.?\s*\d+|Question\s+\d+|\d+\s*\.)/gi) || [];

        if (questionMarkers.length > 1) {
            // Split by question markers
            const parts = text.split(/(?=(?:^|\n)\s*(?:Q\.?\s*\d+|Question\s+\d+|\d+\s*\.))/gi);

            let currentChunk = '';
            for (const part of parts) {
                if (currentChunk.length + part.length <= maxChunkSize) {
                    currentChunk += part;
                } else {
                    if (currentChunk) chunks.push(currentChunk.trim());
                    currentChunk = part;
                }
            }
            if (currentChunk) chunks.push(currentChunk.trim());
        } else {
            // Split by paragraphs if no clear question markers
            const paragraphs = text.split(/\n\s*\n/);
            let currentChunk = '';

            for (const paragraph of paragraphs) {
                if (currentChunk.length + paragraph.length <= maxChunkSize) {
                    currentChunk += '\n\n' + paragraph;
                } else {
                    if (currentChunk) chunks.push(currentChunk.trim());
                    currentChunk = paragraph;
                }
            }
            if (currentChunk) chunks.push(currentChunk.trim());
        }

        return chunks.filter(chunk => chunk.length > 50); // Filter out tiny chunks
    }

    /**
     * Health check for Gemini AI service
     */
    async healthCheck() {
        try {
            const testText = "Q1. What is 2+2? a) 3 b) 4 c) 5 d) 6";
            const result = await this.parseQuestionsWithAI(testText);

            return {
                status: 'healthy',
                questionsFound: result.questions.length,
                tokensUsed: result.tokensUsed,
                model: 'gemini-1.5-flash'
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
}

module.exports = new GeminiQuestionParser();