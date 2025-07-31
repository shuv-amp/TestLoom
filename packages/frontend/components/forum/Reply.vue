<template>
  <div 
    :class="[
      'reply p-4 rounded-lg border',
      reply.isCorrectAnswer ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
    ]"
  >
    <!-- Correct Answer Badge -->
    <div v-if="reply.isCorrectAnswer" class="mb-2">
      <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        Correct Answer
      </span>
    </div>

    <div class="flex justify-between items-start">
      <div class="flex-1">
        <div class="flex items-center mb-2">
          <span class="font-medium text-sm">{{ reply.author?.name || 'Unknown' }}</span>
          <span class="text-gray-500 text-sm mx-2">•</span>
          <span class="text-gray-500 text-sm">{{ formatDate(reply.createdAt) }}</span>
        </div>
        
        <div class="prose max-w-none text-sm" v-html="formatContent(reply.content)"></div>
      </div>

      <div class="flex items-center space-x-2 ml-4">
        <button 
          @click="vote('upvote')" 
          class="p-1 hover:bg-gray-100 rounded"
          :class="{ 'text-blue-600': hasUpvoted }"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </button>
        
        <span class="text-sm font-medium">{{ reply.score || 0 }}</span>
        
        <button 
          @click="vote('downvote')" 
          class="p-1 hover:bg-gray-100 rounded"
          :class="{ 'text-red-600': hasDownvoted }"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center space-x-2 mt-3">
      <!-- Mark as Correct Button -->
      <button 
        v-if="canMarkAsCorrect" 
        @click="markAsCorrect" 
        class="text-sm px-3 py-1 border rounded hover:bg-gray-50"
        :class="{ 
          'bg-green-100 text-green-700 border-green-300': reply.isCorrectAnswer,
          'text-gray-600 border-gray-300': !reply.isCorrectAnswer
        }"
      >
        {{ reply.isCorrectAnswer ? 'Unmark' : 'Mark as Correct' }}
      </button>

      <!-- Delete Button -->
      <button 
        v-if="canDelete" 
        @click="deleteReply" 
        class="text-sm px-3 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50"
        :disabled="deleting"
      >
        {{ deleting ? 'Deleting...' : 'Delete' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';

const props = defineProps({
  reply: {
    type: Object,
    required: true
  },
  threadAuthorId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['vote', 'mark-correct', 'delete']);

const authStore = useAuthStore();
const deleting = ref(false);

// Computed properties
const hasUpvoted = computed(() => {
  return props.reply.upvotes?.includes(authStore.user?._id);
});

const hasDownvoted = computed(() => {
  return props.reply.downvotes?.includes(authStore.user?._id);
});

const canMarkAsCorrect = computed(() => {
  if (!authStore.user || !props.threadAuthorId) return false;
  return authStore.user._id === props.threadAuthorId;
});

const canDelete = computed(() => {
  if (!authStore.user) return false;
  
  const isAuthor = props.reply.author?._id === authStore.user._id;
  const isAdminOrModerator = authStore.user.role === 'admin' || authStore.user.role === 'moderator';
  
  return isAuthor || isAdminOrModerator;
});

// Methods
const vote = (voteType) => {
  emit('vote', { replyId: props.reply._id, voteType });
};

const markAsCorrect = () => {
  emit('mark-correct', props.reply._id);
};

const deleteReply = async () => {
  if (!confirm('Are you sure you want to delete this reply?')) return;
  
  deleting.value = true;
  try {
    emit('delete', props.reply._id);
  } finally {
    deleting.value = false;
  }
};

const formatContent = (content) => {
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
</script>

<style scoped>
.reply {
  transition: all 0.2s ease;
}

.reply:hover {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.prose :deep(p) {
  margin-bottom: 0.5em;
}

.prose :deep(strong) {
  font-weight: 600;
}

.prose :deep(em) {
  font-style: italic;
}
</style>
