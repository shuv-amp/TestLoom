const mongoose = require('mongoose');
const Question = require('../models/questionModel');
const User = require('../models/userModel');

const seedQuestions = async () => {
  try {
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      adminUser = new User({
        name: 'System Admin',
        email: 'admin@testloom.com',
        password: 'defaultPassword123',
        role: 'admin'
      });
      await adminUser.save();
    }

    const sampleQuestions = [
      {
        questionText: 'What is the capital of Nepal?',
        questionType: 'MCQ',
        options: [
          { label: 'A', text: 'Kathmandu', isCorrect: true },
          { label: 'B', text: 'Pokhara', isCorrect: false },
          { label: 'C', text: 'Bhaktapur', isCorrect: false },
          { label: 'D', text: 'Lalitpur', isCorrect: false }
        ],
        subject: 'Geography',
        chapter: 'Asian Countries',
        semester: 'First',
        difficulty: 'easy',
        tags: ['capitals', 'nepal', 'asia'],
        createdBy: adminUser._id,
        isVerified: true,
        verifiedBy: adminUser._id,
        source: 'manual'
      },
      {
        questionText: 'The process of photosynthesis occurs in the _______ of plant cells.',
        questionType: 'FIB',
        blanks: [
          { position: 45, answer: 'chloroplasts', placeholder: '_______' }
        ],
        subject: 'Biology',
        chapter: 'Plant Biology',
        semester: 'Second',
        difficulty: 'medium',
        tags: ['photosynthesis', 'plants', 'biology'],
        createdBy: adminUser._id,
        isVerified: true,
        verifiedBy: adminUser._id,
        source: 'manual'
      },
      {
        questionText: 'Explain the concept of recursion in programming and provide an example.',
        questionType: 'DESCRIPTIVE',
        subject: 'Computer Science',
        chapter: 'Programming Fundamentals',
        semester: 'Third',
        difficulty: 'hard',
        tags: ['recursion', 'programming', 'algorithms'],
        createdBy: adminUser._id,
        isVerified: true,
        verifiedBy: adminUser._id,
        source: 'manual'
      }
    ];

    for (const questionData of sampleQuestions) {
      const existingQuestion = await Question.findOne({
        questionText: questionData.questionText,
        subject: questionData.subject
      });

      if (!existingQuestion) {
        const question = new Question(questionData);
        await question.save();
        console.log(`Created sample question: ${questionData.questionText.substring(0, 50)}...`);
      }
    }

    console.log('Sample questions seeded successfully');
  } catch (error) {
    console.error('Error seeding questions:', error);
  }
};

module.exports = { seedQuestions };
