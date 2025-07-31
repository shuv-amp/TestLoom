<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Discussion Forum</h1>
              <p class="mt-1 text-sm text-gray-600">Connect with fellow students and discuss academic topics</p>
            </div>
            <button
              @click="showNewThreadModal = true"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon class="-ml-1 mr-2 h-5 w-5" />
              New Thread
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <ChatBubbleLeftEllipsisIcon class="h-6 w-6 text-gray-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total Threads</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ forumStats.totalThreads || 0 }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <ChatBubbleLeftRightIcon class="h-6 w-6 text-gray-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total Posts</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ forumStats.totalPosts || 0 }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <FolderIcon class="h-6 w-6 text-gray-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Categories</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ forumStats.totalCategories || 0 }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <UsersIcon class="h-6 w-6 text-gray-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Members</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ forumStats.totalMembers || 0 }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Categories Sidebar -->
        <div class="lg:col-span-1">
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Categories</h3>
              <div class="space-y-3">
                <div
                  v-for="category in categories"
                  :key="category._id"
                  class="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  :class="{ 'bg-blue-50 border-blue-200': selectedCategory === category._id }"
                  @click="selectCategory(category._id)"
                >
                  <div
                    class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    :style="{ backgroundColor: category.color + '20', color: category.color }"
                  >
                    <component :is="category.icon || 'ChatBubbleLeftEllipsisIcon'" class="h-4 w-4" />
                  </div>
                  <div class="ml-3 flex-1">
                    <p class="text-sm font-medium text-gray-900">{{ category.name }}</p>
                    <p class="text-xs text-gray-500">{{ category.description }}</p>
                  </div>
                  <div class="ml-2 flex-shrink-0">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {{ category.threadCount || 0 }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Popular Tags -->
          <div class="mt-6 bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Popular Tags</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in popularTags"
                  :key="tag"
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors"
                  @click="searchByTag(tag)"
                >
                  #{{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Forum Area -->
        <div class="lg:col-span-2">
          <!-- Search and Filter -->
          <div class="bg-white shadow rounded-lg mb-6">
            <div class="p-4">
              <div class="flex items-center space-x-4">
                <div class="flex-1">
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      v-model="searchQuery"
                      type="text"
                      placeholder="Search threads..."
                      class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      @keyup.enter="performSearch"
                    />
                  </div>
                </div>
                <select
                  v-model="sortBy"
                  class="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  @change="loadThreads"
                >
                  <option value="lastReplyAt">Latest</option>
                  <option value="newest">Newest</option>
                  <option value="popular">Popular</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Threads List -->
          <div class="space-y-4">
            <div
              v-for="thread in threads"
              :key="thread._id"
              class="bg-white shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div class="p-6">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center">
                      <div
                        class="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"
                      >
                        <img
                          v-if="thread.author.avatar"
                          :src="thread.author.avatar"
                          :alt="thread.author.username"
                          class="w-10 h-10 rounded-full"
                        />
                        <span v-else class="text-lg font-medium text-gray-600">
                          {{ thread.author.username?.charAt(0)?.toUpperCase() }}
                        </span>
                      </div>
                      <div class="ml-3">
                        <p class="text-sm font-medium text-gray-900">{{ thread.author.username }}</p>
                        <p class="text-xs text-gray-500">{{ formatDate(thread.createdAt) }}</p>
                      </div>
                    </div>
                    <h3 class="mt-2 text-lg font-medium text-gray-900">
                      <NuxtLink
                        :to="`/forum/thread/${thread._id}`"
                        class="hover:text-blue-600 transition-colors"
                      >
                        {{ thread.title }}
                      </NuxtLink>
                    </h3>
                    <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span class="flex items-center">
                        <ChatBubbleLeftEllipsisIcon class="h-4 w-4 mr-1" />
                        {{ thread.replyCount }} replies
                      </span>
                      <span class="flex items-center">
                        <EyeIcon class="h-4 w-4 mr-1" />
                        {{ thread.views }} views
                      </span>
                      <span v-if="thread.isPinned" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pinned
                      </span>
                    </div>
                    <div v-if="thread.tags.length > 0" class="mt-2 flex flex-wrap gap-1">
                      <span
                        v-for="tag in thread.tags"
                        :key="tag"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        #{{ tag }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="threads.length === 0" class="text-center py-12">
              <ChatBubbleLeftEllipsisIcon class="mx-auto h-12 w-12 text-gray-400" />
              <h3 class="mt-2 text-sm font-medium text-gray-900">No threads found</h3>
              <p class="mt-1 text-sm text-gray-500">Get started by creating a new thread!</p>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="mt-6 flex justify-center">
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                v-for="page in totalPages"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  page === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium'
                ]"
              >
                {{ page }}
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- New Thread Modal -->
    <NewThreadModal
      v-if="showNewThreadModal"
      :open="showNewThreadModal"
      :categories="categories"
      @close="showNewThreadModal = false"
      @thread-created="onThreadCreated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ChatBubbleLeftEllipsisIcon, ChatBubbleLeftRightIcon, FolderIcon, UsersIcon, MagnifyingGlassIcon, PlusIcon, EyeIcon } from '@heroicons/vue/24/outline';

// State
const categories = ref([]);
const threads = ref([]);
const forumStats = ref({});
const searchQuery = ref('');
const sortBy = ref('lastReplyAt');
const selectedCategory = ref(null);
const currentPage = ref(1);
const totalPages = ref(1);
const showNewThreadModal = ref(false);
const popularTags = ref(['exam-prep', 'study-tips', 'question-help', 'general']);

// Methods
const loadCategories = async () => {
  try {
    const response = await $fetch('/api/forums/categories');
    categories.value = response;
  } catch (error) {
    console.error('Error loading categories:', error);
  }
};

const loadThreads = async () => {
  try {
    let url = '/api/forums/threads/search';
    const params = new URLSearchParams();
    
    if (selectedCategory.value) {
      params.append('category', selectedCategory.value);
    }
    if (searchQuery.value) {
      params.append('q', searchQuery.value);
    }
    if (sortBy.value) {
      params.append('sort', sortBy.value);
    }
    if (currentPage.value > 1) {
      params.append('page', currentPage.value);
    }

    const response = await $fetch(`${url}?${params}`);
    threads.value = response.threads || [];
    totalPages.value = response.pagination?.totalPages || 1;
  } catch (error) {
    console.error('Error loading threads:', error);
  }
};

const loadForumStats = async () => {
  try {
    const response = await $fetch('/api/forums/stats');
    forumStats.value = response;
  } catch (error) {
    console.error('Error loading forum stats:', error);
  }
};

const selectCategory = (categoryId) => {
  selectedCategory.value = selectedCategory.value === categoryId ? null : categoryId;
  currentPage.value = 1;
  loadThreads();
};

const performSearch = () => {
  currentPage.value = 1;
  loadThreads();
};

const searchByTag = (tag) => {
  searchQuery.value = tag;
  performSearch();
};

const goToPage = (page) => {
  currentPage.value = page;
  loadThreads();
};

const formatDate = (date) => {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24)),
    'day'
  );
};

const onThreadCreated = (newThread) => {
  threads.value.unshift(newThread);
  showNewThreadModal.value = false;
};

// Lifecycle
onMounted(() => {
  loadCategories();
  loadThreads();
  loadForumStats();
});

// Watch for changes
watch([searchQuery, sortBy], () => {
  performSearch();
});
</script>
