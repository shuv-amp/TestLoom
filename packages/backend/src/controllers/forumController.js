const { Category, Thread, Post, ModerationLog } = require('../models/forumModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const { getForumSocketManager } = require('../socket/forumSocket');

class ForumController {
    async createCategory(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, description, color, icon } = req.body;

            const existingCategory = await Category.findOne({ name });
            if (existingCategory) {
                return res.status(400).json({ message: 'Category already exists' });
            }

            const category = new Category({
                name,
                description,
                color,
                icon
            });

            await category.save();
            res.status(201).json({ message: 'Category created successfully', category });

            // Emit real-time update
            const socketManager = getForumSocketManager();
            if (socketManager) {
                socketManager.emitNewCategory(category);
            }
        } catch (error) {
            res.status(500).json({ message: 'Error creating category', error: error.message });
        }
    }

    async getCategories(req, res) {
        try {
            const categories = await Category.find({ isActive: true })
                .sort({ order: 1, name: 1 })
                .select('-__v');

            res.json(categories);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching categories', error: error.message });
        }
    }

    async getCategoryWithStats(req, res) {
        try {
            const { categoryId } = req.params;

            const category = await Category.findById(categoryId);
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }

            const threads = await Thread.find({
                category: categoryId,
                isDeleted: false
            })
                .populate('author', 'username avatar')
                .populate('lastReplyBy', 'username avatar')
                .sort({ isPinned: -1, lastReplyAt: -1 })
                .limit(20);

            res.json({ category, threads });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching category data', error: error.message });
        }
    }

    // Thread Management
    async createThread(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { title, content, categoryId, tags } = req.body;

            const category = await Category.findById(categoryId);
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }

            const thread = new Thread({
                title,
                content,
                category: categoryId,
                author: req.user.userId, 
                tags: tags || []
            });

            await thread.save();

            // Update category thread count
            await Category.findByIdAndUpdate(categoryId, { $inc: { threadCount: 1 } });

            const populatedThread = await Thread.findById(thread._id)
                .populate('author', 'username avatar')
                .populate('category', 'name color');

            res.status(201).json({ message: 'Thread created successfully', thread: populatedThread });

            const socketManager = getForumSocketManager();
            if (socketManager) {
                socketManager.emitNewThread(populatedThread);
            }
        } catch (error) {
            res.status(500).json({ message: 'Error creating thread', error: error.message });
        }
    }

    async getThread(req, res) {
        try {
            const { threadId } = req.params;

            const thread = await Thread.findById(threadId)
                .populate('author', 'username avatar reputation')
                .populate('category', 'name color')
                .populate('lastReplyBy', 'username avatar');

            if (!thread || thread.isDeleted) {
                return res.status(404).json({ message: 'Thread not found' });
            }

            // Increment view count
            await Thread.findByIdAndUpdate(threadId, { $inc: { views: 1 } });

            // Get posts with pagination
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;

            const posts = await Post.find({
                thread: threadId,
                isDeleted: false
            })
                .populate('author', 'username avatar reputation')
                .populate('parentPost', 'author content')
                .populate('mentions', 'username')
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limit);

            const totalPosts = await Post.countDocuments({
                thread: threadId,
                isDeleted: false
            });

            res.json({
                thread,
                posts,
                pagination: {
                    page,
                    limit,
                    totalPages: Math.ceil(totalPosts / limit),
                    totalPosts
                }
            });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching thread', error: error.message });
        }
    }

    async getThreadsByCategory(req, res) {
        try {
            const { categoryId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;
            const sortBy = req.query.sort || 'lastReplyAt';

            const category = await Category.findById(categoryId);
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }

            let sortOptions = {};
            switch (sortBy) {
                case 'popular':
                    sortOptions = { replyCount: -1, views: -1 };
                    break;
                case 'newest':
                    sortOptions = { createdAt: -1 };
                    break;
                case 'oldest':
                    sortOptions = { createdAt: 1 };
                    break;
                default:
                    sortOptions = { isPinned: -1, lastReplyAt: -1 };
            }

            const threads = await Thread.find({
                category: categoryId,
                isDeleted: false
            })
                .populate('author', 'username avatar')
                .populate('lastReplyBy', 'username avatar')
                .sort(sortOptions)
                .skip(skip)
                .limit(limit);

            const totalThreads = await Thread.countDocuments({
                category: categoryId,
                isDeleted: false
            });

            res.json({
                threads,
                category,
                pagination: {
                    page,
                    limit,
                    totalPages: Math.ceil(totalThreads / limit),
                    totalThreads
                }
            });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching threads', error: error.message });
        }
    }

    // Post Management
    async createPost(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { content, threadId, parentPostId } = req.body;

            const thread = await Thread.findById(threadId);
            if (!thread || thread.isDeleted || thread.isLocked) {
                return res.status(404).json({ message: 'Thread not found or locked' });
            }

            const post = new Post({
                content,
                thread: threadId,
                author: req.user.id,
                parentPost: parentPostId || null
            });

            await post.save();

            // Update thread stats
            await Thread.findByIdAndUpdate(threadId, {
                $inc: { replyCount: 1 },
                lastReplyAt: new Date(),
                lastReplyBy: req.user.id
            });

            // Update category post count
            await Category.findByIdAndUpdate(thread.category, { $inc: { postCount: 1 } });

            const populatedPost = await Post.findById(post._id)
                .populate('author', 'username avatar reputation')
                .populate('parentPost', 'author content');

            res.status(201).json({ message: 'Post created successfully', post: populatedPost });

            const socketManager = getForumSocketManager();
            if (socketManager) {
                socketManager.emitNewPost(populatedPost);
            }
        } catch (error) {
            res.status(500).json({ message: 'Error creating post', error: error.message });
        }
    }

    async updatePost(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { postId } = req.params;
            const { content } = req.body;

            const post = await Post.findById(postId);
            if (!post || post.isDeleted) {
                return res.status(404).json({ message: 'Post not found' });
            }

            if (post.author.toString() !== req.user.id && req.user.role !== 'moderator') {
                return res.status(403).json({ message: 'Not authorized to edit this post' });
            }

            post.content = content;
            await post.save();

            const updatedPost = await Post.findById(postId)
                .populate('author', 'username avatar reputation');

            res.json({ message: 'Post updated successfully', post: updatedPost });

            // Emit real-time update
            const socketManager = getForumSocketManager();
            if (socketManager) {
                socketManager.emitPostUpdated(updatedPost);
            }
        } catch (error) {
            res.status(500).json({ message: 'Error updating post', error: error.message });
        }
    }

    async deletePost(req, res) {
        try {
            const { postId } = req.params;

            const post = await Post.findById(postId);
            if (!post || post.isDeleted) {
                return res.status(404).json({ message: 'Post not found' });
            }

            if (post.author.toString() !== req.user.id && req.user.role !== 'moderator') {
                return res.status(403).json({ message: 'Not authorized to delete this post' });
            }

            post.isDeleted = true;
            await post.save();

            res.json({ message: 'Post deleted successfully' });

            // Emit real-time update
            const socketManager = getForumSocketManager();
            if (socketManager) {
                socketManager.emitPostDeleted(postId);
            }
        } catch (error) {
            res.status(500).json({ message: 'Error deleting post', error: error.message });
        }
    }

    // Moderation Actions
    async moderateThread(req, res) {
        try {
            const { threadId } = req.params;
            const { action, reason } = req.body;

            const thread = await Thread.findById(threadId);
            if (!thread) {
                return res.status(404).json({ message: 'Thread not found' });
            }

            let updateData = {};
            let logAction = '';

            switch (action) {
                case 'pin':
                    updateData = { isPinned: true };
                    logAction = 'pin';
                    break;
                case 'unpin':
                    updateData = { isPinned: false };
                    logAction = 'unpin';
                    break;
                case 'lock':
                    updateData = { isLocked: true };
                    logAction = 'lock';
                    break;
                case 'unlock':
                    updateData = { isLocked: false };
                    logAction = 'unlock';
                    break;
                case 'delete':
                    updateData = { isDeleted: true };
                    logAction = 'delete';
                    break;
                case 'restore':
                    updateData = { isDeleted: false };
                    logAction = 'restore';
                    break;
                default:
                    return res.status(400).json({ message: 'Invalid action' });
            }

            await Thread.findByIdAndUpdate(threadId, updateData);

            // Log moderation action
            const moderationLog = new ModerationLog({
                moderator: req.user.id,
                action: logAction,
                targetType: 'thread',
                targetId: threadId,
                reason
            });
            await moderationLog.save();

            res.json({ message: `Thread ${action}ed successfully` });

            const socketManager = getForumSocketManager();
            if (socketManager) {
                socketManager.emitThreadUpdated(threadId);
            }
        } catch (error) {
            res.status(500).json({ message: 'Error moderating thread', error: error.message });
        }
    }

    // Analytics and Search
    async searchForum(req, res) {
        try {
            const { q, category, author, tags, sort } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;

            let query = { isDeleted: false };

            if (q) {
                query.$or = [
                    { title: { $regex: q, $options: 'i' } },
                    { content: { $regex: q, $options: 'i' } }
                ];
            }

            if (category) query.category = category;
            if (author) query.author = author;
            if (tags) query.tags = { $in: tags.split(',') };

            let sortOptions = {};
            switch (sort) {
                case 'newest':
                    sortOptions = { createdAt: -1 };
                    break;
                case 'oldest':
                    sortOptions = { createdAt: 1 };
                    break;
                case 'popular':
                    sortOptions = { replyCount: -1, views: -1 };
                    break;
                default:
                    sortOptions = { lastReplyAt: -1 };
            }

            const threads = await Thread.find(query)
                .populate('author', 'username avatar')
                .populate('category', 'name color')
                .populate('lastReplyBy', 'username avatar')
                .sort(sortOptions)
                .skip(skip)
                .limit(limit);

            const totalThreads = await Thread.countDocuments(query);

            res.json({
                threads,
                pagination: {
                    page,
                    limit,
                    totalPages: Math.ceil(totalThreads / limit),
                    totalThreads
                }
            });
        } catch (error) {
            res.status(500).json({ message: 'Error searching forum', error: error.message });
        }
    }

    async getForumStats(req, res) {
        try {
            const stats = {
                totalThreads: await Thread.countDocuments({ isDeleted: false }),
                totalPosts: await Post.countDocuments({ isDeleted: false }),
                totalCategories: await Category.countDocuments({ isActive: true }),
                totalMembers: await User.countDocuments({ isActive: true }),
                popularThreads: await Thread.getPopularThreads(5)
            };

            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching forum stats', error: error.message });
        }
    }
}

module.exports = new ForumController();
