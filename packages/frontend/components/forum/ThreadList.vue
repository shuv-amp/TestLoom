<template>
  <div class="thread-list">
    <div class="thread-list-header">
      <h2 class="text-2xl font-bold mb-4">Discussion Threads</h2>
      <div class="flex justify-between items-center mb-4">
        <div class="flex gap-2">
          <select 
            v-model="selectedSubject" 
            class="px-3 py-2 border rounded-md"
            @change="fetchThreads"
          >
            <option value="">All Subjects</option>
            <option v-for="subject in subjects" :key="subject._id" :value="subject._id">
              {{ subject.name }}
            </option>
          </select>
          
          <select 
            v-model="selectedChapter" 
            class="px-3 py-2 border rounded-md"
            @change="fetchThreads"
            :disabled="!selectedSubject"
          >
            <option value="">All Chapters</option>
            <option v-for="chapter in filteredChapters" :key="chapter._id" :value="chapter._id">
              {{ chapter.name }}
            </option>
          </select>
        </div>
        
        <button 
          @click="showCreateModal = true" 
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create New Thread
        </button>
      </div>
    </div>

    <!-- Thread List -->
    <div v-if="threads.length === 0" class="text-center py-8 text-gray-500">
      No threads found. Be the first to start a discussion!
    </div>
    
    <div v-else class="space-y-4">
      <div 
        v-for="thread in threads" 
        :key="thread._id" 
        class="thread-card bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="text-lg font-semibold mb-2">
              <NuxtLink :to="`/forum/thread/${thread._id}`" class="hover:text-blue-600">
                {{ thread.title }}
              </NuxtLink>
            </h3>
            
            <p class="text-gray-600 mb-2 line-clamp-2">
              {{ thread.content }}
            </p>
            
            <div class="flex items-center text-sm text-gray-500 space-x-4">
              <span>By {{ thread.author?.name || 'Unknown' }}</span>
              <span>•</span>
              <span>{{ formatDate(thread.createdAt) }}</span>
              <span>•</span>
              <span>{{ thread.replies?.length || 0 }} replies</span>
              <span>•</span>
              <span>{{ thread.score || 0 }} points</span>
            </div>
          </div>
          
          <div class="flex items-center space-x-2 ml-4">
            <button 
              @click="voteThread(thread._id, 'upvote')" 
              class="p-1 hover:bg-gray-100 rounded"
              :class="{ 'text-blue-600': hasUpvoted(thread) }"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            
            <span class="text-sm font-medium">{{ thread.score || 0 }}</span>
            
            <button 
              @click="voteThread(thread._id, 'downvote')" 
              class="p-1 hover:bg-gray-100 rounded"
              :class="{ 'text-red-600': hasDownvoted(thread) }"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Thread Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <h3 class="text-xl font-bold mb-4">Create New Thread</h3>
        
        <form @submit.prevent="createThread">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Subject</label>
            <select v-model="newThread.subject" class="w-full px-3 py-2 border rounded-md" required>
              <option value="">Select a subject</option>
              <option v-for="subject in subjects" :key="subject._id" :value="subject._id">
                {{ subject.name }}
              </option>
            </select>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Chapter</label>
            <select v-model="newThread.chapter" class="w-full px-3 py-2 border rounded-md" required :disabled="!newThread.subject">
              <option value="">Select a chapter</option>
              <option v-for="chapter in availableChapters" :key="chapter._id" :value="chapter._id">
                {{ chapter.name }}
              </option>
            </select>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Title</label>
            <input 
              v-model="newThread.title" 
              type="text" 
              class="w-full px-3 py-2 border rounded-md" 
              required
              maxlength="200"
            />
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Content</label>
            <textarea 
              v-model="newThread.content" 
              class="w-full px-3 py-2 border rounded-md" 
              rows="6"
              required
            ></textarea>
          </div>
          
          <div class="flex justify-end space-x-2">
            <button 
              type="button" 
              @click="showCreateModal = false" 
              class="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              :disabled="creating" 
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {{ creating ? 'Creating...' : 'Create Thread' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useForumStore } from '~/stores/forum';
import { useAuthStore } from '~/stores/auth';

const forumStore = useForumStore();
const authStore = useAuthStore();

// Reactive data
const threads = ref([]);
const subjects = ref([]);
const chapters = ref([]);
const selectedSubject = ref('');
const selectedChapter = ref('');
const showCreateModal = ref(false);
const creating = ref(false);

const newThread = ref({
  title: '',
  content: '',
  subject: '',
  chapter: ''
});

// Computed properties
const filteredChapters = computed(() => {
  if (!selectedSubject.value) return [];
  return chapters.value.filter(ch => ch.subject === selectedSubject.value);
});

const availableChapters = computed(() => {
  if (!newThread.value.subject) return [];
  return chapters.value.filter(ch => ch.subject === newThread.value.subject);
});

// Methods
const fetchThreads = async () => {
  try {
    const params = {};
    if (selectedSubject.value) params.subjectId = selectedSubject.value;
    if (selectedChapter.value) params.chapterId = selectedChapter.value;
    
    threads.value = await forumStore.fetchThreads(params);
  } catch (error) {
    console.error('Error fetching threads:', error);
  }
};

const fetchSubjects = async () => {
  try {
    subjects.value = await forumStore.fetchSubjects();
  } catch (error) {
    console.error('Error fetching subjects:', error);
  }
};

const fetchChapters = async () => {
  try {
    chapters.value = await forumStore.fetchChapters();
  } catch (error) {
    console.error('Error fetching chapters:', error);
  }
};

const createThread = async () => {
  try {
    creating.value = true;
    const thread = await forumStore.createThread(newThread.value);
    threads.value.unshift(thread);
    showCreateModal.value = false;
    newThread.value = { title: '', content: '', subject: '', chapter: '' };
  } catch (error) {
    console.error('Error creating thread:', error);
  } finally {
    creating.value = false;
  }
};

const voteThread = async (threadId, voteType) => {
  try {
    const updatedThread = await forumStore.voteThread(threadId, voteType);
    const index = threads.value.findIndex(t => t._id === threadId);
    if (index !== -1) {
      threads.value[index] = updatedThread;
    }
  } catch (error) {
    console.error('Error voting on thread:', error);
  }
};

const hasUpvoted = (thread) => {
  return thread.upvotes?.includes(authStore.user?._id);
};

const hasDownvoted = (thread) => {
  return thread.downvotes?.includes(authStore.user?._id);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

// Watchers
watch(selectedSubject, () => {
  selectedChapter.value = '';
  fetchThreads();
});

watch(selectedChapter, () => {
  fetchThreads();
});

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchSubjects(),
    fetchChapters(),
    fetchThreads()
  ]);
});
</script>

<style scoped>
.thread-card {
  transition: all 0.2s ease;
}

.thread-card:hover {
  transform: translateY(-1px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
