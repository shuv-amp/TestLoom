class EnhancedTraditionalParser {
    constructor() {
        this.logger = console;
    }

    /**
     * Enhanced traditional parsing with better regex patterns and error handling
     */
    parseQuestions(rawText, options = {}) {
        try {
            const startTime = Date.now();

            if (!rawText || rawText.trim().length === 0) {
                return { questions: [], confidence: 0, method: 'traditional' };
            }

            // Clean and preprocess text
            const cleanedText = this.preprocessText(rawText);

            // Try different parsing strategies
            const strategies = [
                this.parseNumberedQuestions.bind(this),
                this.parseQFormatQuestions.bind(this),
                this.parseBlockQuestions.bind(this),
                this.parseInlineQuestions.bind(this)
            ];

            let bestResult = { questions: [], confidence: 0 };

            for (const strategy of strategies) {
                try {
                    const result = strategy(cleanedText, options);
                    if (result.questions.length > bestResult.questions.length ||
                        (result.questions.length === bestResult.questions.length && result.confidence > bestResult.confidence)) {
                        bestResult = result;
                    }
                } catch (error) {
                    this.logger.warn(`Parsing strategy failed:`, error.message);
                }
            }

            // Post-process and validate questions
            const validQuestions = this.postProcessQuestions(bestResult.questions);
            const processingTime = Date.now() - startTime;

            this.logger.info(`Traditional parsing completed in ${processingTime}ms. Found ${validQuestions.length} questions.`);

            return {
                questions: validQuestions,
                confidence: this.calculateConfidence(validQuestions, cleanedText),
                processingTime,
                method: 'traditional'
            };

        } catch (error) {
            this.logger.error('Traditional parsing failed:', error);
            return { questions: [], confidence: 0, error: error.message, method: 'traditional' };
        }
    }

    /**
     * Preprocess text for better parsing
     */
    preprocessText(text) {
        return text
            // Normalize whitespace
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\t/g, ' ')
            .replace(/\s+/g, ' ')

            // Fix common OCR errors
            .replace(/(\d+)\s*\.\s*(?=[A-Z])/g, '$1. ') // Question numbering
            .replace(/([a-eA-E])\s*[\)\.\]]\s*/g, '$1) ') // Option markers
            .replace(/\bQ\s*(\d+)/gi, 'Q$1') // Question labels
            .replace(/\b0(?=[A-Za-z])/g, 'O') // OCR: 0 -> O
            .replace(/\b1(?=[A-Za-z])/g, 'l') // OCR: 1 -> l
            .replace(/\brn\b/g, 'm') // OCR: rn -> m
            .replace(/\bvv\b/g, 'w') // OCR: vv -> w

            // Remove noise
            .replace(/^(PAGE|EXAM|TEST|QUIZ|UNIVERSITY|COLLEGE).*$/gmi, '')
            .replace(/^\d+\s*$/gm, '') // Standalone page numbers
            .replace(/^_{3,}.*$/gm, '') // Underline separators
            .replace(/^=+.*$/gm, '') // Equal sign separators

            .trim();
    }

    /**
     * Parse numbered questions (1. 2. 3.)
     */
    parseNumberedQuestions(text, options = {}) {
        const questions = [];

        // Split by numbered questions
        const questionPattern = /(?:^|\n)\s*(\d+)\s*\.\s*(.+?)(?=(?:\n\s*\d+\s*\.)|$)/gs;
        const matches = [...text.matchAll(questionPattern)];

        for (const match of matches) {
            const questionNumber = parseInt(match[1]);
            const questionContent = match[2].trim();

            const parsedQuestion = this.parseQuestionContent(questionContent, questionNumber);
            if (parsedQuestion) {
                questions.push(parsedQuestion);
            }
        }

        return {
            questions,
            confidence: questions.length > 0 ? 0.8 : 0
        };
    }

    /**
     * Parse Q format questions (Q1. Q2. etc.)
     */
    parseQFormatQuestions(text, options = {}) {
        const questions = [];

        // Split by Q format questions
        const questionPattern = /(?:^|\n)\s*Q\.?\s*(\d+)\.?\s*(.+?)(?=(?:\n\s*Q\.?\s*\d+)|$)/gs;
        const matches = [...text.matchAll(questionPattern)];

        for (const match of matches) {
            const questionNumber = parseInt(match[1]);
            const questionContent = match[2].trim();

            const parsedQuestion = this.parseQuestionContent(questionContent, questionNumber);
            if (parsedQuestion) {
                questions.push(parsedQuestion);
            }
        }

        return {
            questions,
            confidence: questions.length > 0 ? 0.85 : 0
        };
    }

    /**
     * Parse block-based questions (separated by double newlines)
     */
    parseBlockQuestions(text, options = {}) {
        const questions = [];
        const blocks = text.split(/\n\s*\n/).filter(block => block.trim().length > 20);

        let questionId = 1;
        for (const block of blocks) {
            const parsedQuestion = this.parseQuestionContent(block.trim(), questionId);
            if (parsedQuestion) {
                questions.push(parsedQuestion);
                questionId++;
            }
        }

        return {
            questions,
            confidence: questions.length > 0 ? 0.7 : 0
        };
    }

    /**
     * Parse inline questions (questions without clear separators)
     */
    parseInlineQuestions(text, options = {}) {
        const questions = [];

        // Look for question patterns within the text
        const questionIndicators = /(?:what|which|how|when|where|why|who|define|explain|describe|calculate|choose|select).+?\?/gi;
        const matches = [...text.matchAll(questionIndicators)];

        let questionId = 1;
        for (const match of matches) {
            const questionText = match[0].trim();

            // Try to find options after the question
            const afterQuestionText = text.substring(match.index + match[0].length);
            const options = this.extractOptionsFromText(afterQuestionText);

            if (options.length >= 2) {
                questions.push({
                    id: questionId++,
                    questionText,
                    questionType: 'MCQ',
                    options: this.formatOptions(options)
                });
            } else {
                questions.push({
                    id: questionId++,
                    questionText,
                    questionType: 'DESCRIPTIVE'
                });
            }
        }

        return {
            questions,
            confidence: questions.length > 0 ? 0.6 : 0
        };
    }

    /**
     * Parse content of a single question
     */
    parseQuestionContent(content, questionId) {
        if (content.length < 10) return null;

        // Remove question numbering from the beginning of content
        const cleanedContent = this.removeQuestionNumbering(content);

        // Detect question type and extract components
        const questionType = this.detectQuestionType(cleanedContent);

        switch (questionType) {
            case 'MCQ':
                return this.parseMCQQuestion(cleanedContent, questionId);
            case 'FIB':
                return this.parseFIBQuestion(cleanedContent, questionId);
            case 'DESCRIPTIVE':
                return this.parseDescriptiveQuestion(cleanedContent, questionId);
            default:
                return null;
        }
    }

    /**
     * Remove question numbering from text
     */
    removeQuestionNumbering(text) {
        // Remove patterns like "3.", "Q3.", "Question 3:", etc. from the beginning
        return text
            .replace(/^\s*(?:\d+\.?\s*|\w+\.?\s*\d+\.?\s*|question\s*\d+\.?\s*:?\s*)/i, '')
            .replace(/^\s*(?:que\.?\s*\d+\.?\s*|q\.?\s*\d+\.?\s*)/i, '')
            .trim();
    }

    /**
     * Detect question type from content
     */
    detectQuestionType(content) {
        // Check for multiple choice indicators
        if (this.hasMCQIndicators(content)) {
            return 'MCQ';
        }

        // Check for fill-in-the-blank indicators
        if (this.hasFIBIndicators(content)) {
            return 'FIB';
        }

        // Default to descriptive
        return 'DESCRIPTIVE';
    }

    /**
     * Check if content has MCQ indicators
     */
    hasMCQIndicators(content) {
        const mcqPatterns = [
            /[a-eA-E]\s*[\)\.\]]\s*.+/g,
            /\([a-eA-E]\)\s*.+/g,
            /[1-5]\s*[\)\.\]]\s*.+/g
        ];

        const optionCount = mcqPatterns.reduce((count, pattern) => {
            const matches = content.match(pattern);
            return Math.max(count, matches ? matches.length : 0);
        }, 0);

        return optionCount >= 2;
    }

    /**
     * Check if content has fill-in-the-blank indicators
     */
    hasFIBIndicators(content) {
        const fibPatterns = [
            /_{3,}/,
            /\[[\s\.]*\]/,
            /\(\s*\)/,
            /\.{3,}/,
            /fill\s+in\s+the\s+blank/i,
            /complete\s+the\s+sentence/i
        ];

        return fibPatterns.some(pattern => pattern.test(content));
    }

    /**
     * Parse MCQ question
     */
    parseMCQQuestion(content, questionId) {
        // Extract question text (before first option)
        const firstOptionMatch = content.match(/[a-eA-E]\s*[\)\.\]]/);
        if (!firstOptionMatch) return null;

        const questionText = content.substring(0, firstOptionMatch.index).trim();
        if (questionText.length < 5) return null;

        // Extract options
        const options = this.extractOptionsFromText(content);
        if (options.length < 2) return null;

        // Try to detect correct answer
        const correctAnswer = this.detectCorrectAnswer(content, options);

        const result = {
            id: questionId,
            questionText: this.cleanQuestionText(questionText),
            questionType: 'MCQ',
            options: this.formatOptions(options)
        };

        if (correctAnswer) {
            result.correctAnswer = correctAnswer;
        }

        return result;
    }

    /**
     * Parse fill-in-the-blank question
     */
    parseFIBQuestion(content, questionId) {
        // Try to detect answer for FIB questions
        const correctAnswer = this.detectFIBAnswer(content);

        const result = {
            id: questionId,
            questionText: this.cleanQuestionText(content),
            questionType: 'FIB'
        };

        if (correctAnswer) {
            result.correctAnswer = correctAnswer;
        }

        return result;
    }

    /**
     * Parse descriptive question
     */
    parseDescriptiveQuestion(content, questionId) {
        // Try to detect answer for descriptive questions
        const correctAnswer = this.detectDescriptiveAnswer(content);

        const result = {
            id: questionId,
            questionText: this.cleanQuestionText(content),
            questionType: 'DESCRIPTIVE'
        };

        if (correctAnswer) {
            result.correctAnswer = correctAnswer;
        }

        return result;
    }

    /**
     * Extract options from text using multiple patterns
     */
    extractOptionsFromText(text) {
        const optionPatterns = [
            /([a-eA-E])\s*\)\s*(.+?)(?=\n[a-eA-E]\s*\)|$)/g,
            /([a-eA-E])\s*\.\s*(.+?)(?=\n[a-eA-E]\s*\.|$)/g,
            /\(([a-eA-E])\)\s*(.+?)(?=\n\([a-eA-E]\)|$)/g,
            /([1-5])\s*\)\s*(.+?)(?=\n[1-5]\s*\)|$)/g
        ];

        let bestOptions = [];

        for (const pattern of optionPatterns) {
            const matches = [...text.matchAll(pattern)];
            const options = matches.map(match => ({
                label: match[1].toLowerCase(),
                text: this.cleanOptionText(match[2].trim())
            })).filter(opt => opt.text.length > 0);

            if (options.length > bestOptions.length) {
                bestOptions = options;
            }
        }

        return bestOptions;
    }

    /**
     * Clean option text by removing numbering
     */
    cleanOptionText(text) {
        // Remove leading numbers, letters, or patterns like "1)", "a)", etc.
        return text
            .replace(/^\s*(?:[a-eA-E1-5][\)\.\]]\s*|[a-eA-E1-5]\s+)/, '')
            .trim();
    }

    /**
     * Format options into the required structure
     */
    formatOptions(options) {
        const formatted = {};
        for (const option of options) {
            formatted[option.label] = option.text;
        }
        return formatted;
    }

    /**
     * Detect correct answer for MCQ questions
     */
    detectCorrectAnswer(content, options) {
        const answerPatterns = [
            /answer[\s:]*([a-eA-E])/i,
            /correct[\s:]*([a-eA-E])/i,
            /solution[\s:]*([a-eA-E])/i,
            /ans[\s:]*([a-eA-E])/i,
            /\(([a-eA-E])\)\s*✓/i,
            /([a-eA-E])\s*✓/i,
            /([a-eA-E])\s*\*\*/i, // Bold marking
            /\*\*([a-eA-E])\s*\)/i, // Bold option
        ];

        for (const pattern of answerPatterns) {
            const match = content.match(pattern);
            if (match) {
                const answerLabel = match[1].toLowerCase();
                if (options.some(opt => opt.label === answerLabel)) {
                    return answerLabel;
                }
            }
        }

        return null;
    }

    /**
     * Detect correct answer for FIB questions
     */
    detectFIBAnswer(content) {
        const fibAnswerPatterns = [
            /answer[\s:]+([^.\n]+)/i,
            /correct[\s:]+([^.\n]+)/i,
            /solution[\s:]+([^.\n]+)/i,
            /ans[\s:]+([^.\n]+)/i,
        ];

        for (const pattern of fibAnswerPatterns) {
            const match = content.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }

        return null;
    }

    /**
     * Detect correct answer for descriptive questions
     */
    detectDescriptiveAnswer(content) {
        const descriptiveAnswerPatterns = [
            /answer[\s:]+([^.\n]{10,})/i,
            /solution[\s:]+([^.\n]{10,})/i,
            /explanation[\s:]+([^.\n]{10,})/i,
        ];

        for (const pattern of descriptiveAnswerPatterns) {
            const match = content.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }

        return null;
    }

    /**
     * Clean question text
     */
    cleanQuestionText(text) {
        return text
            .replace(/^\d+[\.\)]\s*/, '') // Remove question numbers
            .replace(/^Q\.?\s*\d+[\.\)]?\s*/i, '') // Remove Q labels
            .replace(/^Question\s+\d+[\.\:]?\s*/i, '') // Remove "Question" labels
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Post-process and validate questions
     */
    postProcessQuestions(questions) {
        return questions
            .filter(question => this.isValidQuestion(question))
            .map((question, index) => ({
                ...question,
                id: index + 1
            }))
            .filter(question => !this.isDuplicate(question, questions));
    }

    /**
     * Validate question structure
     */
    isValidQuestion(question) {
        if (!question.questionText || question.questionText.length < 5) {
            return false;
        }

        if (question.questionType === 'MCQ') {
            return question.options && Object.keys(question.options).length >= 2;
        }

        return true;
    }

    /**
     * Check for duplicate questions
     */
    isDuplicate(question, allQuestions) {
        const similarity = this.calculateTextSimilarity(
            question.questionText.toLowerCase(),
            allQuestions.map(q => q.questionText.toLowerCase())
        );

        return similarity > 0.85;
    }

    /**
     * Calculate text similarity using simple approach
     */
    calculateTextSimilarity(text, otherTexts) {
        let maxSimilarity = 0;

        for (const otherText of otherTexts) {
            if (text === otherText) continue;

            const similarity = this.jaccardSimilarity(text, otherText);
            maxSimilarity = Math.max(maxSimilarity, similarity);
        }

        return maxSimilarity;
    }

    /**
     * Calculate Jaccard similarity between two texts
     */
    jaccardSimilarity(text1, text2) {
        const words1 = new Set(text1.split(/\s+/));
        const words2 = new Set(text2.split(/\s+/));

        const intersection = new Set([...words1].filter(word => words2.has(word)));
        const union = new Set([...words1, ...words2]);

        return intersection.size / union.size;
    }

    /**
     * Calculate overall confidence based on parsing results
     */
    calculateConfidence(questions, originalText) {
        if (questions.length === 0) return 0;

        let confidence = 0.5; // Base confidence

        // Increase confidence based on structure quality
        const mcqQuestions = questions.filter(q => q.questionType === 'MCQ');
        const avgOptionsPerMCQ = mcqQuestions.length > 0 ?
            mcqQuestions.reduce((sum, q) => sum + Object.keys(q.options || {}).length, 0) / mcqQuestions.length : 0;

        if (avgOptionsPerMCQ >= 4) confidence += 0.2;
        if (avgOptionsPerMCQ >= 3) confidence += 0.1;

        // Increase confidence for reasonable question count
        if (questions.length >= 5 && questions.length <= 50) confidence += 0.1;

        // Increase confidence for proper question indicators
        const questionIndicators = questions.filter(q =>
            /\?$/.test(q.questionText) ||
            /^(what|which|how|when|where|why|who)/i.test(q.questionText)
        ).length;

        confidence += (questionIndicators / questions.length) * 0.2;

        return Math.min(confidence, 1.0);
    }
}

module.exports = new EnhancedTraditionalParser();