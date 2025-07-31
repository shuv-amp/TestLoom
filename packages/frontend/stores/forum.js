import { defineStore } from 'pinia';
import { useApi } from '~/composables/useApi';

export const useForumStore = defineStore('forum', {
    state: () => ({
        threads: [],
        currentThread: null,
        subjects: [],
        chapters: [],
        loading: false,
        error: null,
    }),

    getters: {
        getThreadById: (state) => (id) => {
            return state.threads.find(thread => thread._id === id);
        },

        getRepliesForThread: (state) => (threadId) => {
            const thread = state.threads.find(t => t._id === threadId);
            return thread?.replies || [];
        },

        isLoading: (state) => state.loading,

        hasError: (state) => state.error !== null,
    },

    actions: {
        async fetchThreads(params = {}) {
            this.loading = true;
            this.error = null;

            try {
                const { data } = await useApi().get('/api/threads/all', { params });
                this.threads = data;
                return data;
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to fetch threads';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async fetchThread(threadId) {
            this.loading = true;
            this.error = null;

            try {
                const { data } = await useApi().get(`/api/threads/${threadId}/details`);
                this.currentThread = data;
                return data;
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to fetch thread';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async createThread(threadData) {
            this.loading = true;
            this.error = null;

            try {
                const { data } = await useApi().post('/api/threads/new', threadData);
                this.threads.unshift(data);
                return data;
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to create thread';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async deleteThread(threadId) {
            this.loading = true;
            this.error = null;

            try {
                await useApi().delete(`/api/threads/${threadId}/delete`);
                this.threads = this.threads.filter(t => t._id !== threadId);

                if (this.currentThread?._id === threadId) {
                    this.currentThread = null;
                }
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to delete thread';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async voteThread(threadId, voteType) {
            this.loading = true;
            this.error = null;

            try {
                const { data } = await useApi().post(`/api/threads/${threadId}/vote/new`, { voteType });

                // Update local state
                const index = this.threads.findIndex(t => t._id === threadId);
                if (index !== -1) {
                    this.threads[index] = data;
                }

                if (this.currentThread?._id === threadId) {
                    this.currentThread = data;
                }

                return data;
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to vote on thread';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async createReply(threadId, content) {
            this.loading = true;
            this.error = null;

            try {
                const { data } = await useApi().post(`/api/threads/${threadId}/replies/new`, { content });

                // Update local state
                if (this.currentThread?._id === threadId) {
                    this.currentThread.replies.push(data);
                }

                return data;
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to create reply';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async deleteReply(replyId) {
            this.loading = true;
            this.error = null;

            try {
                await useApi().delete(`/api/replies/${replyId}/delete`);

                // Update local state
                if (this.currentThread) {
                    this.currentThread.replies = this.currentThread.replies.filter(r => r._id !== replyId);
                }
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to delete reply';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async voteReply(replyId, voteType) {
            this.loading = true;
            this.error = null;

            try {
                const { data } = await useApi().post(`/api/replies/${replyId}/vote/new`, { voteType });

                // Update local state
                if (this.currentThread) {
                    const index = this.currentThread.replies.findIndex(r => r._id === replyId);
                    if (index !== -1) {
                        this.currentThread.replies[index] = data;
                    }
                }

                return data;
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to vote on reply';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async markReplyCorrect(replyId) {
            this.loading = true;
            this.error = null;

            try {
                const { data } = await useApi().post(`/api/replies/${replyId}/mark-correct/new`);

                // Update local state
                if (this.currentThread) {
                    // Reset all replies
                    this.currentThread.replies.forEach(reply => {
                        reply.isCorrectAnswer = false;
                    });

                    // Mark the correct one
                    const index = this.currentThread.replies.findIndex(r => r._id === replyId);
                    if (index !== -1) {
                        this.currentThread.replies[index] = data;
                    }
                }

                return data;
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to mark reply as correct';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async fetchSubjects() {
            this.loading = true;
            this.error = null;

            try {
                const { data } = await useApi().get('/api/subjects');
                this.subjects = data;
                return data;
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to fetch subjects';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async fetchChapters() {
            this.loading = true;
            this.error = null;

            try {
                const { data } = await useApi().get('/api/chapters');
                this.chapters = data;
                return data;
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to fetch chapters';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        clearError() {
            this.error = null;
        },

        clearCurrentThread() {
            this.currentThread = null;
        },
    },
});
