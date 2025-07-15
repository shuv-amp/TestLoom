const Question = require('../models/questionModel');

const finalizeQuestions = async (req, res) => {
  try {
    const { questions, metadata } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Questions array is required and must not be empty'
      });
    }

    if (!metadata || !metadata.subject) {
      return res.status(400).json({
        success: false,
        message: 'Metadata with subject is required'
      });
    }

    const processedQuestions = [];
    const errors = [];

    for (let i = 0; i < questions.length; i++) {
      try {
        const questionData = questions[i];
        
        const questionDoc = new Question({
          questionText: questionData.questionText,
          questionType: questionData.questionType,
          subject: metadata.subject,
          chapter: metadata.chapter,
          semester: metadata.semester,
          difficulty: questionData.difficulty || metadata.difficulty || 'medium',
          tags: questionData.tags || metadata.tags || [],
          createdBy: req.user.id,
          source: 'ocr',
          ocrMetadata: {
            originalFileName: metadata.originalFileName,
            confidence: questionData.confidence,
            processedAt: new Date()
          }
        });

        if (questionData.questionType === 'MCQ') {
          if (!questionData.options || questionData.options.length < 2) {
            errors.push({ questionIndex: i, error: 'MCQ must have at least 2 options' });
            continue;
          }

          questionDoc.options = questionData.options.map(opt => ({
            label: opt.label,
            text: opt.text,
            isCorrect: opt.isCorrect || (questionData.correctAnswer === opt.label)
          }));

          const correctOptions = questionDoc.options.filter(opt => opt.isCorrect);
          if (correctOptions.length !== 1) {
            errors.push({ questionIndex: i, error: 'MCQ must have exactly one correct answer' });
            continue;
          }
        }

        if (questionData.questionType === 'FIB') {
          if (!questionData.blanks || questionData.blanks.length === 0) {
            errors.push({ questionIndex: i, error: 'Fill-in-the-blank must have at least one blank' });
            continue;
          }

          questionDoc.blanks = questionData.blanks.map(blank => ({
            position: blank.position,
            answer: blank.answer,
            placeholder: blank.placeholder
          }));
        }

        await questionDoc.save();
        processedQuestions.push(questionDoc);

      } catch (error) {
        console.error(`Error processing question ${i}:`, error);
        errors.push({ 
          questionIndex: i, 
          error: error.message || 'Failed to save question' 
        });
      }
    }

    const response = {
      success: true,
      message: `Successfully processed ${processedQuestions.length} out of ${questions.length} questions`,
      data: {
        savedQuestions: processedQuestions.length,
        totalQuestions: questions.length,
        errors: errors.length,
        questions: processedQuestions.map(q => ({
          id: q._id,
          questionText: q.questionText,
          questionType: q.questionType,
          subject: q.subject,
          chapter: q.chapter
        }))
      }
    };

    if (errors.length > 0) {
      response.warnings = errors;
    }

    res.status(201).json(response);

  } catch (error) {
    console.error('Finalize questions error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to save questions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const getQuestions = async (req, res) => {
  try {
    const { 
      subject, 
      chapter, 
      questionType, 
      difficulty,
      page = 1, 
      limit = 20,
      verified = null
    } = req.query;

    const filter = {};
    
    if (subject) filter.subject = { $regex: subject, $options: 'i' };
    if (chapter) filter.chapter = { $regex: chapter, $options: 'i' };
    if (questionType) filter.questionType = questionType;
    if (difficulty) filter.difficulty = difficulty;
    if (verified !== null) filter.isVerified = verified === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const questions = await Question.find(filter)
      .populate('createdBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Question.countDocuments(filter);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalQuestions: total,
          hasNextPage: skip + questions.length < total,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get questions error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const question = await Question.findById(id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    if (question.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this question'
      });
    }

    Object.assign(question, updateData);
    await question.save();

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });

  } catch (error) {
    console.error('Update question error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update question',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    if (question.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this question'
      });
    }

    await Question.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Delete question error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete question',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  finalizeQuestions,
  getQuestions,
  updateQuestion,
  deleteQuestion
};
