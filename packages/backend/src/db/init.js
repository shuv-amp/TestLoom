const mongoose = require('mongoose');
require('dotenv').config();
const { createIndexes } = require('./migrations/createQuestionIndexes');
const { seedQuestions } = require('./seeds/sampleQuestions');

const initializeDatabase = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/testloom');
    console.log('✅ Connected to MongoDB');

    console.log('🔧 Creating database indexes...');
    await createIndexes();

    console.log('🌱 Seeding sample data...');
    await seedQuestions();

    console.log('🎉 Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
