const { Thread, Reply } = require('../models/forumModel');

class ForumSocketManager {
  constructor(io) {
    this.io = io;
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Join thread room for real-time updates
      socket.on('join_thread', (threadId) => {
        const roomName = `thread_${threadId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room: ${roomName}`);
      });

      // Leave thread room
      socket.on('leave_thread', (threadId) => {
        const roomName = `thread_${threadId}`;
        socket.leave(roomName);
        console.log(`Socket ${socket.id} left room: ${roomName}`);
      });

      // Handle typing indicators
      socket.on('typing', ({ threadId, userId, isTyping }) => {
        const roomName = `thread_${threadId}`;
        socket.to(roomName).emit('user_typing', { userId, isTyping });
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });
  }

  // Emit events to specific thread rooms
  emitToThread(threadId, event, data) {
    const roomName = `thread_${threadId}`;
    this.io.to(roomName).emit(event, data);
  }

  // Emit new reply event
  async emitNewReply(threadId, reply) {
    try {
      const populatedReply = await Reply.findById(reply._id)
        .populate('author', '_id name');

      this.emitToThread(threadId, 'new_reply', populatedReply);
    } catch (error) {
      console.error('Error emitting new reply:', error);
    }
  }

  // Emit vote update event
  async emitVoteUpdate(threadId, item) {
    try {
      let populatedItem;

      if (item.constructor.modelName === 'Thread') {
        populatedItem = await Thread.findById(item._id)
          .populate('author', '_id name');
      } else if (item.constructor.modelName === 'Reply') {
        populatedItem = await Reply.findById(item._id)
          .populate('author', '_id name');
      }

      if (populatedItem) {
        this.emitToThread(threadId, 'vote_updated', populatedItem);
      }
    } catch (error) {
      console.error('Error emitting vote update:', error);
    }
  }

  // Emit correct answer marked event
  async emitAnswerMarkedCorrect(threadId, reply) {
    try {
      const populatedReply = await Reply.findById(reply._id)
        .populate('author', '_id name');

      this.emitToThread(threadId, 'answer_marked_correct', populatedReply);
    } catch (error) {
      console.error('Error emitting answer marked correct:', error);
    }
  }

  // Emit reply deleted event
  emitReplyDeleted(threadId, replyId) {
    this.emitToThread(threadId, 'reply_deleted', { replyId });
  }

  // Emit thread deleted event
  emitThreadDeleted(threadId) {
    this.emitToThread(threadId, 'thread_deleted', { threadId });
  }
}

// Export singleton instance
let forumSocketManager;

const initializeForumSocket = (io) => {
  if (!forumSocketManager) {
    forumSocketManager = new ForumSocketManager(io);
  }
  return forumSocketManager;
};

const getForumSocketManager = () => {
  return forumSocketManager;
};

module.exports = {
  initializeForumSocket,
  getForumSocketManager
};