import { defineStore } from 'pinia';
import { io } from 'socket.io-client';

export const useSocketStore = defineStore('socket', {
    state: () => ({
        socket: null,
        connected: false,
        currentThreadId: null,
        typingUsers: [],
        notifications: [],
    }),

    getters: {
        isConnected: (state) => state.connected,

        isTyping: (state) => (userId) => {
            return state.typingUsers.includes(userId);
        },

        typingUsersList: (state) => {
            return state.typingUsers;
        },
    },

    actions: {
        initializeSocket() {
            if (this.socket) return;

            this.socket = io(process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3000', {
                transports: ['websocket'],
                upgrade: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            this.socket.on('connect', () => {
                console.log('Socket connected');
                this.connected = true;
            });

            this.socket.on('disconnect', () => {
                console.log('Socket disconnected');
                this.connected = false;
            });

            this.socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                this.connected = false;
            });

            // Forum events
            this.socket.on('new_reply', (data) => {
                this.handleNewReply(data);
            });

            this.socket.on('reply_voted', (data) => {
                this.handleReplyVoted(data);
            });

            this.socket.on('reply_marked_correct', (data) => {
                this.handleReplyMarkedCorrect(data);
            });

            this.socket.on('reply_deleted', (data) => {
                this.handleReplyDeleted(data);
            });

            this.socket.on('thread_deleted', (data) => {
                this.handleThreadDeleted(data);
            });

            this.socket.on('thread_voted', (data) => {
                this.handleThreadVoted(data);
            });

            this.socket.on('user_typing', (data) => {
                this.handleUserTyping(data);
            });

            this.socket.on('user_stopped_typing', (data) => {
                this.handleUserStoppedTyping(data);
            });
        },

        disconnectSocket() {
            if (this.socket) {
                this.socket.disconnect();
                this.socket = null;
                this.connected = false;
                this.currentThreadId = null;
                this.typingUsers = [];
            }
        },

        joinThread(threadId) {
            if (!this.socket || !this.connected) return;

            if (this.currentThreadId) {
                this.leaveThread();
            }

            this.currentThreadId = threadId;
            this.socket.emit('join_thread', threadId);
        },

        leaveThread() {
            if (!this.socket || !this.currentThreadId) return;

            this.socket.emit('leave_thread', this.currentThreadId);
            this.currentThreadId = null;
            this.typingUsers = [];
        },

        emitTyping() {
            if (!this.socket || !this.currentThreadId) return;
            this.socket.emit('typing', { threadId: this.currentThreadId });
        },

        emitStoppedTyping() {
            if (!this.socket || !this.currentThreadId) return;
            this.socket.emit('stopped_typing', { threadId: this.currentThreadId });
        },

        handleNewReply(data) {
            const { reply, threadId } = data;

            if (this.currentThreadId === threadId) {
                this.emit('new-reply', reply);
            }
        },

        handleReplyVoted(data) {
            const { reply, threadId } = data;

            if (this.currentThreadId === threadId) {
                this.emit('reply-voted', reply);
            }
        },

        handleReplyMarkedCorrect(data) {
            const { reply, threadId } = data;

            if (this.currentThreadId === threadId) {
                this.emit('reply-marked-correct', reply);
            }
        },

        handleReplyDeleted(data) {
            const { replyId, threadId } = data;

            if (this.currentThreadId === threadId) {
                this.emit('reply-deleted', replyId);
            }
        },

        handleThreadDeleted(data) {
            const { threadId } = data;
            this.emit('thread-deleted', threadId);
        },

        handleThreadVoted(data) {
            const { thread } = data;
            this.emit('thread-voted', thread);
        },

        handleUserTyping(data) {
            const { userId, threadId } = data;

            if (this.currentThreadId === threadId && !this.typingUsers.includes(userId)) {
                this.typingUsers.push(userId);
            }
        },

        handleUserStoppedTyping(data) {
            const { userId, threadId } = data;

            if (this.currentThreadId === threadId) {
                this.typingUsers = this.typingUsers.filter(id => id !== userId);
            }
        },

        emit(event, data) {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent(`socket:${event}`, { detail: data }));
            }
        },

        on(event, callback) {
            if (typeof window !== 'undefined') {
                window.addEventListener(`socket:${event}`, callback);
            }
        },

        off(event, callback) {
            if (typeof window !== 'undefined') {
                window.removeEventListener(`socket:${event}`, callback);
            }
        },
    },
});
