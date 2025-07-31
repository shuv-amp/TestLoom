<template>
  <div class="thread-view">
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-2 text-gray-600">Loading thread...</p>
    </div>

    <div v-else-if="!thread" class="text-center py-8">
      <p class="text-gray-600">Thread not found</p>
    </div>

    <div v-else class="max-w-4xl mx-auto">
      <!-- Thread Header -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="flex justify-between items-start mb-4">
          <h1 class="text-2xl font-bold">{{ thread.title }}</h1>
          <div class="flex items-center space-x-2">
            <button 
              @click="voteThread('upvote')" 
              class="p-2 hover:bg-gray-100 rounded"
              :class="{ 'text-blue-600': hasUpvoted(thread) }"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <span class="text-lg font-medium">{{ thread.score || 0 }}</span>
            <button 
              @click="voteThread('downvote')" 
              class="p-2 hover:bg-gray-100 rounded"
              :class="{ 'text-red-600': hasDownvoted(thread) }"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <div class="text-sm text-gray-600 mb-4">
          <span>Posted by {{ thread.author?.name || 'Unknown' }}</span>
          <span class="mx-2">•</span>
          <span>{{ formatDate(thread.createdAt) }}</span>
          <span class="mx-2">•</span>
          <span>{{ thread.replies?.length || 0 }} replies</span>
        </div>

        <div class="prose max-w-none" v-html="formatContent(thread.content)"></div>

        <!-- Delete Thread Button (for author or admin) -->
        <div v-if="canDeleteThread" class="mt-4">
          <button 
            @click="deleteThread" 
            class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            :disabled="deletingThread"
          >
            {{ deletingThread ? 'Deleting...' : 'Delete Thread' }}
          </button>
        </div>
      </div>

      <!-- Replies Section -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">
          {{ thread.replies?.length || 0 }} Replies
        </h2>

        <!-- Reply Form -->
        <div v-if="authStore.isLoggedIn" class="mb-6">
          <div class="flex space-x-3">
            <div class="flex-1">
              <textarea 
                v-model="newReply" 
                placeholder="Write a reply..." 
                class="w-full px-3 py-2 border rounded-md" 
                rows="3"
                @input="handleTyping"
              ></textarea>
            </div>
            <div>
              <button 
                @click="submitReply" 
                :disabled="!newReply.trim() || submittingReply" 
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {{ submittingReply ? 'Posting...' : 'Reply' }}
              </button>
            </div>
          </div>
          
          <div v-if="typingUsers.length > 0" class="text-sm text-gray-500 mt-2">
            {{ typingUsers.join(', ') }} {{ typingUsers.length === 1 ? 'is' : 'are' }} typing...
          </div>
        </div>

        <!-- Replies List -->
        <div v-if="replies.length === 0" class="text-center py-8 text-gray-500">
          No replies yet. Be the first to respond!
        </div>

        <div v-else class="space-y-4">
          <Reply 
            v-for="reply in replies" 
            :key="reply._id" 
            :reply="reply" 
            :thread-author-id="thread.author?._id"
            @vote="handleReplyVote"
            @mark-correct="handleMarkCorrect"
            @delete="handleReplyDelete"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForumStore } from '~/stores/forum';
import { useAuthStore } from '~/stores/auth';
import { useSocketStore } from '~/stores/socket';
import Reply from './Reply.vue';

const route = useRoute();
const router = useRouter();
const forumStore = useForumStore();
const authStore = useAuthStore();
const socketStore = useSocketStore();

// Props
const threadId = route.params.threadId;

// Reactive data
const thread = ref(null);
const replies = ref([]);
const newReply = ref('');
const loading = ref(true);
const submittingReply = ref(false);
const deletingThread = ref(false);
const typingUsers = ref([]);
const typingTimeout = ref(null);

// Computed properties
const canDeleteThread = computed(() => {
  if (!thread.value || !authStore.user) return false;
  const isAuthor = thread.value.author?._id === authStore.user._id;
  const isAdminOrModerator = authStore.user.role === 'admin' || authStore.user.role === 'moderator';
  return isAuthor || isAdminOrModerator;
});

// Socket event handlers
const handleNewReply = (reply) => {
  replies.value.push(reply);
};

const handleVoteUpdate = (updatedItem) => {
  if (updatedItem._id === thread.value._id) {
    thread.value = { ...thread.value, ...updatedItem };
  } else {
    const index = replies.value.findIndex(r => r._id === updatedItem._id);
    if (index !== -1) {
      replies.value[index] = { ...replies.value[index], ...updatedItem };
    }
  }
};

const handleAnswerMarkedCorrect = (updatedReply) => {
  const index = replies.value.findIndex(r => r._id === updatedReply._id);
  if (index !== -1) {
    // Reset all replies' isCorrectAnswer flag
    replies.value.forEach(reply => {
      reply.isCorrectAnswer = false;
    });
    // Set the correct answer
    replies.value[index] = { ...replies.value[index], ...updatedReply };
  }
};

const handleReplyDeleted = ({ replyId }) => {
  const index = replies.value.findIndex(r => r._id === replyId);
  if (index !== -1) {
    replies.value.splice(index, 1);
  }
};

const handleThreadDeleted = ({ threadId }) => {
  router.push('/forum');
};

const handleUserTyping = ({ userId, isTyping }) => {
  const userName = authStore.user?._id === userId ? 'You' : 'Someone';
  
  if (isTyping) {
    if (!typingUsers.value.includes(userName)) {
      typingUsers.value.push(userName);
    }
  } else {
    typingUsers.value = typingUsers.value.filter(user => user !== userName);
  }
};

// Methods
const fetchThread = async () => {
  try {
    loading.value = true;
    const data = await forumStore.fetchThread(threadId);
    thread.value = data;
    replies.value = data.replies || [];
  } catch (error) {
    console.error('Error fetching thread:', error);
  } finally {
    loading.value = false;
  }
};

const submitReply = async () => {
  if (!newReply.value.trim()) return;
  
  try {
    submittingReply.value = true;
    const reply = await forumStore.createReply(threadId, newReply.value);
    replies.value.push(reply);
    newReply.value = '';
  } catch (error) {
    console.error('Error creating reply:', error);
  } finally {
    submittingReply.value = false;
  }
};

const deleteThread = async () => {
  if (!confirm('Are you sure you want to delete this thread?')) return;
  
  try {
    deletingThread.value = true;
    await forumStore.deleteThread(threadId);
    router.push('/forum');
  } catch (error) {
    console.error('Error deleting thread:', error);
  } finally {
    deletingThread.value = false;
  }
};

const handleReplyVote = async ({ replyId, voteType }) => {
  try {
    const updatedReply = await forumStore.voteReply(replyId, voteType);
    const index = replies.value.findIndex(r => r._id === replyId);
    if (index !== -1) {
      replies.value[index] = updatedReply;
    }
  } catch (error) {
    console.error('Error voting on reply:', error);
  }
};

const handleMarkCorrect = async (replyId) => {
  try {
    const updatedReply = await forumStore.markReplyCorrect(replyId);
    const index = replies.value.findIndex(r => r._id === replyId);
    if (index !== -1) {
      // Reset all replies
      replies.value.forEach(reply => {
        reply.isCorrectAnswer = false;
      });
      // Set the correct one
      replies.value[index] = updatedReply;
    }
  } catch (error) {
    console.error('Error marking reply as correct:', error);
  }
};

const handleReplyDelete = async (replyId) => {
  try {
    await forumStore.deleteReply(replyId);
    const index = replies.value.findIndex(r => r._id === replyId);
    if (index !== -1) {
      replies.value.splice(index, 1);
    }
  } catch (error) {
    console.error('Error deleting reply:', error);
  }
};

const handleTyping = () => {
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value);
  }
  
  socketStore.emit('typing', { 
    threadId, 
    userId: authStore.user?._id, 
    isTyping: true 
  });
  
  typingTimeout.value = setTimeout(() => {
    socketStore.emit('typing', { 
      threadId, 
      userId: authStore.user?._id, 
      isTyping: false 
    });
  }, 1000);
};

const formatContent = (content) => {
  // Simple markdown-like formatting
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Lifecycle
onMounted(async () => {
  await fetchThread();
  
  // Setup socket listeners
  socketStore.on('new_reply', handleNewReply);
  socketStore.on('vote_updated', handleVoteUpdate);
  socketStore.on('answer_marked_correct', handleAnswerMarkedCorrect);
  socketStore.on('reply_deleted', handleReplyDeleted);
  socketStore.on('thread_deleted', handleThreadDeleted);
  socketStore.on('user_typing', handleUserTyping);
  
  // Join thread room
  socketStore.emit('join_thread', threadId);
});

onUnmounted(() => {
  // Leave thread room
  socketStore.emit('leave_thread', threadId);
  
  // Remove socket listeners
  socketStore.off('new_reply', handleNewReply);
  socketStore.off('vote_updated', handleVoteUpdate);
  socketStore.off('answer_marked_correct', handleAnswerMarkedCorrect);
  socketStore.off('reply_deleted', handleReplyDeleted);
  socketStore.off('thread_deleted', handleThreadDeleted);
  socketStore.off('user_typing', handleUserTyping);
});
</script>

<style scoped>
.thread-view {
  min-height: 100vh;
  background-color: #f9fafb;
}

.prose {
  max-width: none;
}

.prose :deep(p) {
  margin-bottom: 1em;
}

.prose :deep(strong) {
  font-weight: 600;
}

.prose :deep(em) {
  font-style: italic;
}
</style>
