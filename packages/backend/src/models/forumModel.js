const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        unique: true,
        maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    description: {
        type: String,
        required: [true, 'Category description is required'],
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    color: {
        type: String,
        default: '#3B82F6',
        match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
    },
    icon: {
        type: String,
        default: 'ChatBubbleLeftEllipsisIcon'
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    threadCount: {
        type: Number,
        default: 0
    },
    postCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const threadSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Thread title is required'],
        trim: true,
        minlength: [5, 'Thread title must be at least 5 characters'],
        maxlength: [200, 'Thread title cannot exceed 200 characters']
    },
    content: {
        type: String,
        required: [true, 'Thread content is required'],
        minlength: [10, 'Thread content must be at least 10 characters'],
        maxlength: [10000, 'Thread content cannot exceed 10000 characters']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [20, 'Tag cannot exceed 20 characters']
    }],
    views: {
        type: Number,
        default: 0
    },
    replyCount: {
        type: Number,
        default: 0
    },
    lastReplyAt: {
        type: Date,
        default: Date.now
    },
    lastReplyBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        lastReadAt: Date
    }]
}, {
    timestamps: true
});

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Post content is required'],
        minlength: [2, 'Post content must be at least 2 characters'],
        maxlength: [5000, 'Post content cannot exceed 5000 characters']
    },
    thread: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thread',
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parentPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    likes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    dislikes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    attachments: [{
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: Date,
    editHistory: [{
        content: String,
        editedAt: {
            type: Date,
            default: Date.now
        }
    }],
    isDeleted: {
        type: Boolean,
        default: false
    },
    reports: [{
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: {
            type: String,
            enum: ['spam', 'harassment', 'inappropriate', 'off-topic', 'other'],
            required: true
        },
        description: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

const replySchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Reply content is required'],
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    thread: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thread',
        required: true
    },
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: []
    }],
    downvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: []
    }],
    isCorrectAnswer: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const moderationLogSchema = new mongoose.Schema({
    moderator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        enum: ['pin', 'unpin', 'lock', 'unlock', 'delete', 'restore', 'warn', 'ban'],
        required: true
    },
    targetType: {
        type: String,
        enum: ['thread', 'post', 'user'],
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    reason: String,
    details: mongoose.Schema.Types.Mixed,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for performance
threadSchema.index({ category: 1, createdAt: -1 });
threadSchema.index({ author: 1, createdAt: -1 });
threadSchema.index({ lastReplyAt: -1 });
threadSchema.index({ isPinned: -1, lastReplyAt: -1 });
threadSchema.index({ tags: 1 });

postSchema.index({ thread: 1, createdAt: 1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ parentPost: 1 });

replySchema.index({ thread: 1, createdAt: 1 });
replySchema.index({ author: 1 });

// Virtuals
threadSchema.virtual('url').get(function () {
    return `/forum/${this.category.slug}/${this._id}`;
});

replySchema.virtual('upvoteCount').get(function () {
    return this.upvotes.length;
});

replySchema.virtual('downvoteCount').get(function () {
    return this.downvotes.length;
});

replySchema.virtual('score').get(function () {
    return this.upvotes.length - this.downvotes.length;
});

// Pre-save middleware
threadSchema.pre('save', function (next) {
    if (this.isModified('content')) {
        // Extract mentions from content
        const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
        this.mentions = Array.from(this.content.matchAll(mentionRegex)).map(match => match[1]);
    }
    next();
});

postSchema.pre('save', function (next) {
    if (this.isModified('content') && !this.isNew) {
        this.isEdited = true;
        this.editedAt = new Date();
        if (!this.editHistory) this.editHistory = [];
        this.editHistory.push({
            content: this.content,
            editedAt: new Date()
        });
    }
    next();
});

// Static methods for analytics
threadSchema.statics.getPopularThreads = function (limit = 10) {
    return this.find({ isDeleted: false })
        .sort({ replyCount: -1, views: -1 })
        .limit(limit)
        .populate('author', 'username avatar')
        .populate('lastReplyBy', 'username avatar')
        .populate('category', 'name color');
};

// Ensure virtual fields are serialized
replySchema.set('toJSON', { virtuals: true });

module.exports = {
    Category: mongoose.model('Category', categorySchema),
    Thread: mongoose.model('Thread', threadSchema),
    Post: mongoose.model('Post', postSchema),
    Reply: mongoose.model('Reply', replySchema),
    ModerationLog: mongoose.model('ModerationLog', moderationLogSchema)
};
