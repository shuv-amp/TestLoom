const mongoose = require('mongoose');
const Question = require('../models/questionModel');

const createIndexes = async () => {
  try {
    await Question.collection.createIndex({ subject: 1, chapter: 1, questionType: 1 });
    await Question.collection.createIndex({ createdBy: 1, createdAt: -1 });
    await Question.collection.createIndex({ tags: 1 });
    await Question.collection.createIndex({ difficulty: 1 });
    await Question.collection.createIndex({ isVerified: 1 });
    await Question.collection.createIndex({ 'ocrMetadata.confidence': -1 });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

module.exports = { createIndexes };
