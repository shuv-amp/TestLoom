const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D', 'E']
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  isCorrect: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const blankSchema = new mongoose.Schema({
  position: {
    type: Number,
    required: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  placeholder: String
}, { _id: false });

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    minlength: [5, 'Question text must be at least 5 characters long']
  },
  questionType: {
    type: String,
    required: true,
    enum: ['MCQ', 'FIB', 'DESCRIPTIVE'],
    default: 'MCQ'
  },
  options: {
    type: [optionSchema],
    validate: {
      validator: function(options) {
        if (this.questionType === 'MCQ') {
          return options && options.length >= 2 && options.length <= 5;
        }
        return true;
      },
      message: 'MCQ questions must have 2-5 options'
    }
  },
  blanks: {
    type: [blankSchema],
    validate: {
      validator: function(blanks) {
        if (this.questionType === 'FIB') {
          return blanks && blanks.length >= 1;
        }
        return true;
      },
      message: 'Fill-in-the-blank questions must have at least one blank'
    }
  },
  correctAnswer: {
    type: String,
    validate: {
      validator: function(answer) {
        if (this.questionType === 'MCQ') {
          return this.options && this.options.some(opt => opt.label === answer);
        }
        return true;
      },
      message: 'Correct answer must match one of the option labels'
    }
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  chapter: {
    type: String,
    trim: true
  },
  semester: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  source: {
    type: String,
    enum: ['manual', 'ocr', 'import'],
    default: 'manual'
  },
  ocrMetadata: {
    originalFileName: String,
    confidence: Number,
    processedAt: Date
  }
}, {
  timestamps: true
});

questionSchema.index({ subject: 1, chapter: 1, questionType: 1 });
questionSchema.index({ createdBy: 1, createdAt: -1 });
questionSchema.index({ tags: 1 });

questionSchema.pre('save', function(next) {
  if (this.questionType === 'MCQ' && this.options) {
    const correctOptions = this.options.filter(opt => opt.isCorrect);
    if (correctOptions.length !== 1) {
      return next(new Error('MCQ questions must have exactly one correct answer'));
    }
    this.correctAnswer = correctOptions[0].label;
  }
  
  if (this.isVerified && !this.verifiedAt) {
    this.verifiedAt = new Date();
  }
  
  next();
});

questionSchema.methods.toJSON = function() {
  const question = this.toObject();
  
  if (question.questionType === 'MCQ') {
    question.options = question.options.map(opt => ({
      label: opt.label,
      text: opt.text,
      isCorrect: opt.isCorrect
    }));
  }
  
  return question;
};

module.exports = mongoose.model('Question', questionSchema);
