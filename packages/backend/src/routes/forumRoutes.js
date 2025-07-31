const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { body } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Validation rules
const categoryValidation = [
    body('name')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Category name must be between 3 and 50 characters'),
    body('description')
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Description must be between 10 and 500 characters'),
    body('color')
        .optional()
        .isHexColor()
        .withMessage('Please provide a valid hex color'),
    body('icon')
        .optional()
        .isString()
        .withMessage('Icon must be a string')
];

const threadValidation = [
    body('title')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Thread title must be between 5 and 200 characters'),
    body('content')
        .trim()
        .isLength({ min: 10, max: 10000 })
        .withMessage('Thread content must be between 10 and 10000 characters'),
    body('categoryId')
        .isMongoId()
        .withMessage('Please provide a valid category ID'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    body('tags.*')
        .trim()
        .isLength({ max: 20 })
        .withMessage('Each tag cannot exceed 20 characters')
];

const postValidation = [
    body('content')
        .trim()
        .isLength({ min: 2, max: 5000 })
        .withMessage('Post content must be between 2 and 5000 characters'),
    body('threadId')
        .isMongoId()
        .withMessage('Please provide a valid thread ID'),
    body('parentPostId')
        .optional()
        .isMongoId()
        .withMessage('Please provide a valid parent post ID')
];

const moderationValidation = [
    body('action')
        .isIn(['pin', 'unpin', 'lock', 'unlock', 'delete', 'restore'])
        .withMessage('Invalid moderation action'),
    body('reason')
        .optional()
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('Reason must be between 5 and 500 characters')
];

// Validation middleware
const validateReply = [
    body('content').trim().isLength({ min: 1 }).withMessage('Reply content is required')
];

const validateVote = [
    body('voteType').isIn(['upvote', 'downvote']).withMessage('Vote type must be upvote or downvote')
];

// Helper function to handle vote logic
const handleVote = async (model, id, userId, voteType) => {
    const item = await model.findById(id);
    if (!item) throw new Error('Item not found');

    const upvoteIndex = item.upvotes.indexOf(userId);
    const downvoteIndex = item.downvotes.indexOf(userId);

    if (voteType === 'upvote') {
        if (upvoteIndex > -1) {
            item.upvotes.splice(upvoteIndex, 1);
        } else {
            item.upvotes.push(userId);
            if (downvoteIndex > -1) item.downvotes.splice(downvoteIndex, 1);
        }
    } else {
        if (downvoteIndex > -1) {
            item.downvotes.splice(downvoteIndex, 1);
        } else {
            item.downvotes.push(userId);
            if (upvoteIndex > -1) item.upvotes.splice(upvoteIndex, 1);
        }
    }

    await item.save();
    return item;
};

// Public routes (no auth required)
router.get('/categories', forumController.getCategories);
router.get('/categories/:categoryId', forumController.getCategoryWithStats);
router.get('/threads/search', forumController.searchForum);
router.get('/stats', forumController.getForumStats);

// Protected routes (require authentication)
router.post('/categories', authenticateToken, ...categoryValidation, forumController.createCategory);

// Thread routes
router.post('/threads', authenticateToken, ...threadValidation, forumController.createThread);
router.get('/threads/:threadId', forumController.getThread);
router.get('/categories/:categoryId/threads', forumController.getThreadsByCategory);

// Post routes
router.post('/posts', authenticateToken, ...postValidation, forumController.createPost);
router.put('/posts/:postId', authenticateToken, ...postValidation, forumController.updatePost);
router.delete('/posts/:postId', authenticateToken, forumController.deletePost);

// Moderation routes
router.post('/threads/:threadId/moderate', authenticateToken, ...moderationValidation, forumController.moderateThread);

// Get all threads with optional filtering
router.get('/threads/all', async (req, res) => {
    try {
        const { subjectId, chapterId } = req.query;
        const filter = {};

        if (subjectId) filter.subject = subjectId;
        if (chapterId) filter.chapter = chapterId;

        const threads = await Thread.find(filter)
            .populate('author', '_id name')
            .populate('subject', '_id name')
            .populate('chapter', '_id name')
            .sort({ createdAt: -1 });

        res.json(threads);
    } catch (error) {
        console.error('Error fetching threads:', error);
        res.status(500).json({ message: 'Server error while fetching threads' });
    }
});

// Get a single thread by ID
router.get('/threads/:threadId/details', async (req, res) => {
    try {
        const { threadId } = req.params;

        const thread = await Thread.findById(threadId)
            .populate('author', '_id name')
            .populate('subject', '_id name')
            .populate('chapter', '_id name')
            .populate({
                path: 'replies',
                populate: {
                    path: 'author',
                    select: '_id name'
                },
                options: { sort: { createdAt: 1 } }
            });

        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        res.json(thread);
    } catch (error) {
        console.error('Error fetching thread:', error);
        res.status(500).json({ message: 'Server error while fetching thread' });
    }
});

// Delete a thread
router.delete('/threads/:threadId/delete', authenticateToken, async (req, res) => {
    try {
        const { threadId } = req.params;
        const thread = await Thread.findById(threadId);

        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        // Check if user is author or admin/moderator
        const isAuthor = thread.author.toString() === req.user._id.toString();
        const isAdminOrModerator = req.user.role === 'admin' || req.user.role === 'moderator';

        if (!isAuthor && !isAdminOrModerator) {
            return res.status(403).json({ message: 'Not authorized to delete this thread' });
        }

        // Delete all replies associated with this thread
        await Reply.deleteMany({ thread: threadId });

        // Delete the thread
        await Thread.findByIdAndDelete(threadId);

        res.json({ message: 'Thread deleted successfully' });
    } catch (error) {
        console.error('Error deleting thread:', error);
        res.status(500).json({ message: 'Server error while deleting thread' });
    }
});

// Vote on a thread
router.post('/threads/:threadId/vote/new', authenticateToken, validateVote, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { threadId } = req.params;
        const { voteType } = req.body;

        const thread = await handleVote(Thread, threadId, req.user._id, voteType);
        await thread.populate('author', '_id name');

        res.json(thread);
    } catch (error) {
        console.error('Error voting on thread:', error);
        res.status(500).json({ message: 'Server error while voting' });
    }
});

// Create a new reply
router.post('/threads/:threadId/replies/new', authenticateToken, validateReply, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { threadId } = req.params;
        const { content } = req.body;

        // Verify thread exists
        const thread = await Thread.findById(threadId);
        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        const reply = new Reply({
            content,
            author: req.user._id,
            thread: threadId
        });

        await reply.save();

        // Add reply to thread's replies array
        thread.replies.push(reply._id);
        await thread.save();

        await reply.populate('author', '_id name');

        res.status(201).json(reply);
    } catch (error) {
        console.error('Error creating reply:', error);
        res.status(500).json({ message: 'Server error while creating reply' });
    }
});

// Delete a reply
router.delete('/replies/:replyId/delete', authenticateToken, async (req, res) => {
    try {
        const { replyId } = req.params;
        const reply = await Reply.findById(replyId);

        if (!reply) {
            return res.status(404).json({ message: 'Reply not found' });
        }

        // Check if user is author or admin/moderator
        const isAuthor = reply.author.toString() === req.user._id.toString();
        const isAdminOrModerator = req.user.role === 'admin' || req.user.role === 'moderator';

        if (!isAuthor && !isAdminOrModerator) {
            return res.status(403).json({ message: 'Not authorized to delete this reply' });
        }

        // Remove reply from thread's replies array
        await Thread.findByIdAndUpdate(reply.thread, {
            $pull: { replies: replyId }
        });

        // Delete the reply
        await Reply.findByIdAndDelete(replyId);

        res.json({ message: 'Reply deleted successfully' });
    } catch (error) {
        console.error('Error deleting reply:', error);
        res.status(500).json({ message: 'Server error while deleting reply' });
    }
});

// Vote on a reply
router.post('/replies/:replyId/vote/new', authenticateToken, validateVote, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { replyId } = req.params;
        const { voteType } = req.body;

        const reply = await handleVote(Reply, replyId, req.user._id, voteType);
        await reply.populate('author', '_id name');

        res.json(reply);
    } catch (error) {
        console.error('Error voting on reply:', error);
        res.status(500).json({ message: 'Server error while voting' });
    }
});

// Mark a reply as correct answer
router.post('/replies/:replyId/mark-correct/new', authenticateToken, async (req, res) => {
    try {
        const { replyId } = req.params;

        const reply = await Reply.findById(replyId).populate('thread');
        if (!reply) {
            return res.status(404).json({ message: 'Reply not found' });
        }

        // Check if user is the thread author
        if (reply.thread.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the thread author can mark a correct answer' });
        }

        // Unmark any existing correct answer for this thread
        await Reply.updateMany(
            { thread: reply.thread._id, isCorrectAnswer: true },
            { isCorrectAnswer: false }
        );

        // Mark this reply as correct
        reply.isCorrectAnswer = true;
        await reply.save();

        await reply.populate('author', '_id name');

        res.json(reply);
    } catch (error) {
        console.error('Error marking reply as correct:', error);
        res.status(500).json({ message: 'Server error while marking correct answer' });
    }
});

module.exports = router;
