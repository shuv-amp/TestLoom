import { io } from 'socket.io-client';
import { onMounted, onUnmounted, ref } from 'vue';
import { useAuth } from './useAuth';

export function useForumSocket() {
    const { user, token } = useAuth();

    const socket = ref(null);
    const isConnected = ref(false);
    const isAuthenticated = ref(false);
    const typingUsers = ref([]);
    const notifications = ref([]);

    // Initialize socket connection
    const connect = () => {
        if (!socket.value && token.value) {
            const socketUrl = process.env.NUXT_PUBLIC_API_URL || 'http://localhost:5000';
            socket.value = io(socketUrl, {
                auth: {
                    token: token.value
                },
                transports: ['websocket', 'polling']
            });

            socket.value.on('connect', () => {
                console.log('Connected to forum socket');
                isConnected.value = true;

                // Authenticate with server
                socket.value.emit('authenticate', token.value);
            });

            socket.value.on('disconnect', () => {
                console.log('Disconnected from forum socket');
                isConnected.value = false;
                isAuthenticated.value = false;
            });

            socket.value.on('auth_error', (error) => {
                console.error('Authentication error:', error);
                isAuthenticated.value = false;
            });

            // Listen for authentication success
            socket.value.on('authenticated', () => {
                isAuthenticated.value = true;
            });

            // Listen for typing indicators
            socket.value.on('user_typing', (data) => {
                const existingUser = typingUsers.value.find(u => u.userId === data.userId);
                if (!existingUser) {
                    typingUsers.value.push(data);
                }
            });

            socket.value.on('user_stopped_typing', (data) => {
                typingUsers.value = typingUsers.value.filter(u => u.userId !== data.userId);
            });

            // Listen for notifications
            socket.value.on('new_thread_notification', (notification) => {
                notifications.value.push({
                    type: 'new_thread',
                    ...notification,
                    timestamp: new Date()
                });
            });

            socket.value.on('new_reply_notification', (notification) => {
                notifications.value.push({
                    type: 'new_reply',
                    ...notification,
                    timestamp: new Date()
                });
            });

            // Listen for forum events
            socket.value.on('thread_created', (data) => {
                console.log('New thread created:', data.thread);
            });

            socket.value.on('post_created', (data) => {
                console.log('New post created:', data.post);
            });

            socket.value.on('post_likes_updated', (data) => {
                console.log('Post likes updated:', data);
            });

            socket.value.on('thread_moderated', (data) => {
                console.log('Thread moderated:', data);
            });
        }
    };

    // Join thread room
    const joinThread = (threadId) => {
        if (socket.value && isAuthenticated.value) {
            socket.value.emit('join_thread', threadId);
        }
    };

    // Leave thread room
    const leaveThread = (threadId) => {
        if (socket.value) {
            socket.value.emit('leave_thread', threadId);
        }
    };

    // Join category room
    const joinCategory = (categoryId) => {
        if (socket.value && isAuthenticated.value) {
            socket.value.emit('join_category', categoryId);
        }
    };

    // Leave category room
    const leaveCategory = (categoryId) => {
        if (socket.value) {
            socket.value.emit('leave_category', categoryId);
        }
    };

    // Create new thread
    const createThread = (threadData) => {
        if (socket.value && isAuthenticated.value) {
            socket.value.emit('new_thread', threadData);
        }
    };

    // Create new post/reply
    const createPost = (postData) => {
        if (socket.value && isAuthenticated.value) {
            socket.value.emit('new_post', postData);
        }
    };

    // Toggle like/unlike
    const toggleLike = (postId, action) => {
        if (socket.value && isAuthenticated.value) {
            socket.value.emit('toggle_like', { postId, action });
        }
    };

    // Moderate thread
    const moderateThread = (moderationData) => {
        if (socket.value && isAuthenticated.value) {
            socket.value.emit('moderate_thread', moderationData);
        }
    };

    // Typing indicators
    const startTyping = (threadId) => {
        if (socket.value && isAuthenticated.value) {
            socket.value.emit('typing_start', { threadId });
        }
    };

    const stopTyping = (threadId) => {
        if (socket.value && isAuthenticated.value) {
            socket.value.emit('typing_stop', { threadId });
        }
    };

    // Event listeners
    const onPostCreated = (callback) => {
        socket.value?.on('post_created', callback);
    };

    const onPostLikesUpdated = (callback) => {
        socket.value?.on('post_likes_updated', callback);
    };

    const onThreadModerated = (callback) => {
        socket.value?.on('thread_moderated', callback);
    };

    const onThreadCreated = (callback) => {
        socket.value?.on('thread_created', callback);
    };

    // Remove event listeners
    const offPostCreated = (callback) => {
        socket.value?.off('post_created', callback);
    };

    const offPostLikesUpdated = (callback) => {
        socket.value?.off('post_likes_updated', callback);
    };

    const offThreadModerated = (callback) => {
        socket.value?.off('thread_moderated', callback);
    };

    const offThreadCreated = (callback) => {
        socket.value?.off('thread_created', callback);
    };

    // Disconnect
    const disconnect = () => {
        if (socket.value) {
            socket.value.disconnect();
            socket.value = null;
            isConnected.value = false;
            isAuthenticated.value = false;
            typingUsers.value = [];
        }
    };

    // Initialize on mount
    onMounted(() => {
        if (token.value) {
            connect();
        }
    });

    // Cleanup on unmount
    onUnmounted(() => {
        disconnect();
    });

    return {
        socket,
        isConnected,
        isAuthenticated,
        typingUsers,
        notifications,
        joinThread,
        leaveThread,
        joinCategory,
        leaveCategory,
        createThread,
        createPost,
        toggleLike,
        moderateThread,
        startTyping,
        stopTyping,
        onPostCreated,
        onPostLikesUpdated,
        onThreadModerated,
        onThreadCreated,
        offPostCreated,
        offPostLikesUpdated,
        offThreadModerated,
        offThreadCreated,
        connect,
        disconnect
    };
}
