const Question = require('../models/questionModel');

const getQuestionStatistics = async (userId = null) => {
  try {
    const filter = userId ? { createdBy: userId } : {};
    
    const stats = await Question.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          verifiedQuestions: {
            $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] }
          },
          mcqQuestions: {
            $sum: { $cond: [{ $eq: ['$questionType', 'MCQ'] }, 1, 0] }
          },
          fibQuestions: {
            $sum: { $cond: [{ $eq: ['$questionType', 'FIB'] }, 1, 0] }
          },
          descriptiveQuestions: {
            $sum: { $cond: [{ $eq: ['$questionType', 'DESCRIPTIVE'] }, 1, 0] }
          },
          ocrQuestions: {
            $sum: { $cond: [{ $eq: ['$source', 'ocr'] }, 1, 0] }
          },
          averageConfidence: {
            $avg: '$ocrMetadata.confidence'
          }
        }
      }
    ]);

    const subjectStats = await Question.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const difficultyStats = await Question.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      overall: stats[0] || {
        totalQuestions: 0,
        verifiedQuestions: 0,
        mcqQuestions: 0,
        fibQuestions: 0,
        descriptiveQuestions: 0,
        ocrQuestions: 0,
        averageConfidence: 0
      },
      bySubject: subjectStats,
      byDifficulty: difficultyStats
    };
  } catch (error) {
    console.error('Error getting question statistics:', error);
    throw error;
  }
};

const getRecentQuestions = async (limit = 10, userId = null) => {
  try {
    const filter = userId ? { createdBy: userId } : {};
    
    const questions = await Question.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('questionText questionType subject chapter createdAt isVerified source');

    return questions;
  } catch (error) {
    console.error('Error getting recent questions:', error);
    throw error;
  }
};

const searchQuestions = async (searchTerm, filters = {}) => {
  try {
    const searchFilter = {
      $or: [
        { questionText: { $regex: searchTerm, $options: 'i' } },
        { subject: { $regex: searchTerm, $options: 'i' } },
        { chapter: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ]
    };

    Object.assign(searchFilter, filters);

    const questions = await Question.find(searchFilter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    return questions;
  } catch (error) {
    console.error('Error searching questions:', error);
    throw error;
  }
};

const bulkUpdateQuestions = async (questionIds, updateData, userId) => {
  try {
    const filter = {
      _id: { $in: questionIds },
      createdBy: userId
    };

    const result = await Question.updateMany(filter, updateData);
    return result;
  } catch (error) {
    console.error('Error bulk updating questions:', error);
    throw error;
  }
};

module.exports = {
  getQuestionStatistics,
  getRecentQuestions,
  searchQuestions,
  bulkUpdateQuestions
};
