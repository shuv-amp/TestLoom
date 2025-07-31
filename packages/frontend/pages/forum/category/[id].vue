<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-4">
          <nav class="flex" aria-label="Breadcrumb">
            <ol role="list" class="flex items-center space-x-4">
              <li>
                <div>
                  <NuxtLink to="/forum" class="text-gray-400 hover:text-gray-500">
                    <HomeIcon class="h-5 w-5 flex-shrink-0" />
                    <span class="sr-only">Forum</span>
                  </NuxtLink>
                </div>
              </li>
              <li>
                <div class="flex items-center">
                  <ChevronRightIcon class="h-5 w-5 text-gray-400" />
                  <span class="ml-4 text-sm font-medium text-gray-900">{{ category.name }}</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Category Header -->
      <div class="bg-white shadow rounded-lg mb-6">
        <div class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">{{ category.name }}</h1>
              <p class="mt-1 text-sm text-gray-600">{{ category.description }}</p>
            </div>
            <div class="flex items-center space-x-4">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ threadCount }}</span> threads
              </div>
              <button
                @click="showNewThreadModal = true"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon class="h-4 w-4 mr-2" />
                New Thread
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white shadow rounded-lg mb-6">
        <div class="p-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <!-- Search -->
            <div class="flex-1">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  v-model="searchQuery"
                  class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  :placeholder="`Search in ${category.name}...`"
                />
              </div>
            </div>

            <!-- Sort -->
            <div class="flex items-center space-x-2">
              <select
                v-model="sortBy"
                class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="mostReplies">Most Replies</option>
                <option value="mostViews">Most Views</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Thread List -->
      <div class="space-y-4">
        <div v-if="loading" class="text-center py-8">
          <div class="inline-flex items-center px-4 py-2 text-sm text-gray-700">
            <ArrowPathIcon class="animate-spin h-5 w-5 mr-3" />
            Loading threads...
          </div>
        </div>

        <div v-else-if="threads.length === 0" class="text-center py-8">
          <ChatBubbleLeftEllipsisIcon class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">No threads found</h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ searchQuery ? 'Try adjusting your search.' : 'Be the first to start a discussion in this category!' }}
          </p>
        </div>

        <div
          v-for="thread in threads"
          :key="thread._id"
          class="bg-white shadow rounded-lg hover:shadow-md transition-shadow"
        >
          <div class="p-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <h3 class="text-lg font-medium text-gray-900">
                    <NuxtLink :to="`/forum/thread/${thread._id}`" class="hover:text-blue-600">
                      {{ thread.title }}
                    </NuxtLink>
                  </h3>
                  <div v-if="thread.isPinned" class="flex items-center">
                    <BookmarkIcon class="h-4 w-4 text-yellow-500" />
                    <span class="ml-1 text-xs text-yellow-600">Pinned</span>
                  </div>
                  <div v-if="thread.isLocked" class="flex items-center">
                    <LockClosedIcon class="h-4 w-4 text-red-500" />
                    <span class="ml-1 text-xs text-red-600">Locked</span>
                  </div>
                </div>
                <p class="mt-1 text-sm text-gray-600 line-clamp-2">{{ thread.content }}</p>
                <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <div class="flex items-center">
                    <div class="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">
                      <img
                        v-if="thread.author.avatar"
                        :src="thread.author.avatar"
                        :alt="thread.author.username"
                        class="w-5 h-5 rounded-full"
                      />
                      <span v-else class="text-xs font-medium text-gray-600">
                        {{ thread.author.username?.charAt(0)?.toUpperCase() }}
                      </span>
                    </div>
                    <span class="ml-1">{{ thread.author.username }}</span>
                  </div>
                  <span>•</span>
                  <span>{{ formatDate(thread.createdAt) }}</span>
                  <span>•</span>
                  <span>{{ thread.replyCount }} replies</span>
                  <span>•</span>
                  <span>{{ thread.views }} views</span>
                </div>
                <div v-if="thread.tags.length > 0" class="mt-2 flex flex-wrap gap-1">
                  <span
                    v-for="tag in thread.tags"
                    :key="tag"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    #{{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-6 flex justify-center">
        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            <span class="sr-only">Previous</span>
            <ChevronLeftIcon class="h-5 w-5" />
          </button>
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="changePage(page)"
            :class="[
              'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
              page === currentPage
                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
            ]"
          >
            {{ page }}
          </button>
          <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            <span class="sr-only">Next</span>
            <ChevronRightIcon class="h-5 w-5" />
          </button>
        </nav>
      </div>
    </div>

    <!-- New Thread Modal -->
    <NewThreadModal
      :open="showNewThreadModal"
      :categories="modalCategories"
      :category-id="categoryId"
      @close="showNewThreadModal = false"
      @created="handleThreadCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { 
  HomeIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowPathIcon,
  BookmarkIcon,
  LockClosedIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline';
import NewThreadModal from '@/components/forum/NewThreadModal.vue';

// Route
const route = useRoute();
const categoryId = route.params.id;

// State
const category = ref({
  name: '',
  description: '',
  color: '#3B82F6',
  icon: 'ChatBubbleLeftEllipsisIcon'
});
const threads = ref([]);
const threadCount = ref(0);
const searchQuery = ref('');
const sortBy = ref('newest');
const currentPage = ref(1);
const totalPages = ref(1);
const loading = ref(false);
const showNewThreadModal = ref(false);

// Computed
const visiblePages = computed(() => {
  const pages = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, currentPage.value + 2);
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

const modalCategories = computed(() => {
  return category.value && category.value._id ? [category.value] : [];
});

// Methods
const loadCategory = async () => {
  try {
    const response = await $fetch(`/api/forums/categories/${categoryId}`);
    category.value = response.category;
  } catch (error) {
    console.error('Error loading category:', error);
  }
};

const loadThreads = async () => {
  loading.value = true;
  
  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: 20,
      sort: sortBy.value,
      category: categoryId,
      ...(searchQuery.value && { search: searchQuery.value })
    });
    
    const response = await $fetch(`/api/forums/threads?${params}`);
    threads.value = response.threads;
    threadCount.value = response.totalThreads;
    totalPages.value = response.totalPages;
  } catch (error) {
    console.error('Error loading threads:', error);
  } finally {
    loading.value = false;
  }
};

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    loadThreads();
  }
};

const handleThreadCreated = (thread) => {
  loadThreads();
};

const formatDate = (date) => {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24)),
    'day'
  );
};

// Watchers
watch([searchQuery, sortBy], () => {
  currentPage.value = 1;
  loadThreads();
});

// Lifecycle
onMounted(() => {
  loadCategory();
  loadThreads();
});
</script>
