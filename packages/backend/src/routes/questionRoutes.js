const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { 
  finalizeQuestions, 
  getQuestions, 
  updateQuestion, 
  deleteQuestion,
  getStatistics,
  searchQuestionsByTerm
} = require('../controllers/questionController');

const router = express.Router();

router.post('/finalize', authenticateToken, finalizeQuestions);
router.get('/statistics', authenticateToken, getStatistics);
router.get('/search', authenticateToken, searchQuestionsByTerm);
router.get('/', authenticateToken, getQuestions);
router.put('/:id', authenticateToken, updateQuestion);
router.delete('/:id', authenticateToken, deleteQuestion);

module.exports = router;
