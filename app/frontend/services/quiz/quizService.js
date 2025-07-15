export class QuizService {
  constructor() {
    this.questions = [];
  }

  createQuizFromOCR(results) {
    const quiz = {
      title: 'Generated Quiz',
      questions: this.processOCRQuestions(results.questions),
      createdAt: new Date(),
      createdBy: 'OCR System'
    };
    return quiz;
  }

  processOCRQuestions(rawQuestions) {
    return rawQuestions.map((question, index) => {
      // Basic question processing to clean up OCR output
      const cleanedQuestion = this.cleanQuestion(question);
      
      return {
        id: `q${index + 1}`,
        text: cleanedQuestion,
        type: this.detectQuestionType(cleanedQuestion),
        options: this.generateOptions(cleanedQuestion),
        correctAnswer: null, // Will be set by user
        difficulty: 'medium',
        category: 'auto-generated'
      };
    });
  }

  cleanQuestion(question) {
    // Remove any OCR artifacts and clean up the question text
    return question
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces
      .replace(/\n/g, ' ') // Remove newlines
      .replace(/\s*\d+\.\s*/g, ''); // Remove question numbers
  }

  detectQuestionType(question) {
    // Basic question type detection
    if (question.toLowerCase().includes('true or false')) {
      return 'boolean';
    }
    if (question.toLowerCase().includes('choose the correct')) {
      return 'multiple-choice';
    }
    return 'fill-in';
  }

  generateOptions(question) {
    // Generate placeholder options for multiple choice questions
    if (this.detectQuestionType(question) === 'multiple-choice') {
      return [
        { text: 'Option A', isCorrect: false },
        { text: 'Option B', isCorrect: false },
        { text: 'Option C', isCorrect: false },
        { text: 'Option D', isCorrect: false }
      ];
    }
    return null;
  }

  async saveQuiz(quiz) {
    // TODO: Implement quiz saving to database
    // This would typically involve an API call
    return quiz;
  }
}
