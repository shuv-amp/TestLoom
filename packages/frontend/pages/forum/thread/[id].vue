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
                  <NuxtLink
                    :to="`/forum/category/${thread.category._id}`"
                    class="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    {{ thread.category?.name }}
                  </NuxtLink>
                </div>
              </li>
              <li>
                <div class="flex items-center">
                  <ChevronRightIcon class="h-5 w-5 text-gray-400" />
                  <span class="ml-4 text-sm font-medium text-gray-900">{{ thread.title }}</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="lg:grid lg:grid-cols-12 lg:gap-8">
        <!-- Thread Content -->
        <div class="lg:col-span-8">
          <!-- Thread Header -->
          <div class="bg-white shadow rounded-lg mb-6">
            <div class="p-6">
              <div class="flex items-start justify-between">
                <div>
                  <h1 class="text-2xl font-bold text-gray-900">{{ thread.title }}</h1>
                  <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <div class="flex items-center">
                      <div class="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                        <img
                          v-if="thread.author.avatar"
                          :src="thread.author.avatar"
                          :alt="thread.author.username"
                          class="w-6 h-6 rounded-full"
                        />
                        <span v-else class="text-xs font-medium text-gray-600">
                          {{ thread.author.username?.charAt(0)?.toUpperCase() }}
                        </span>
                      </div>
                      <span class="ml-2">{{ thread.author.username }}</span>
                    </div>
                    <span>•</span>
                    <span>{{ formatDate(thread.createdAt) }}</span>
                    <span>•</span>
                    <span>{{ thread.views }} views</span>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <button
                    v-if="canModerate"
                    @click="togglePin"
                    class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <BookmarkIcon class="h-4 w-4 mr-1" />
                    {{ thread.isPinned ? 'Unpin' : 'Pin' }}
                  </button>
                  <button
                    v-if="canModerate"
                    @click="toggleLock"
                    class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <LockClosedIcon class="h-4 w-4 mr-1" />
                    {{ thread.isLocked ? 'Unlock' : 'Lock' }}
                  </button>
                </div>
              </div>

              <div class="mt-4 prose prose-sm max-w-none">
                <div v-html="renderMarkdown(thread.content)"></div>
              </div>

              <div v-if="thread.tags.length > 0" class="mt-4 flex flex-wrap gap-2">
                <span
                  v-for="tag in thread.tags"
                  :key="tag"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  #{{ tag }}
                </span>
              </div>
            </div>
          </div>

          <!-- Posts -->
          <div class="space-y-4">
            <div
              v-for="post in posts"
              :key="post._id"
              class="bg-white shadow rounded-lg"
              :class="{ 'border-l-4 border-blue-500': post.parentPost }"
            >
              <div class="p-6">
                <div class="flex items-start justify-between">
                  <div class="flex items-start space-x-3">
                    <div class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <img
                        v-if="post.author.avatar"
                        :src="post.author.avatar"
                        :alt="post.author.username"
                        class="w-10 h-10 rounded-full"
                      />
                      <span v-else class="text-lg font-medium text-gray-600">
                        {{ post.author.username?.charAt(0)?.toUpperCase() }}
                      </span>
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center space-x-2">
                        <span class="font-medium text-gray-900">{{ post.author.username }}</span>
                        <span class="text-sm text-gray-500">{{ formatDate(post.createdAt) }}</span>
                        <span v-if="post.isEdited" class="text-xs text-gray-400">(edited)</span>
                      </div>
                      <div class="mt-2 prose prose-sm max-w-none">
                        <div v-html="renderMarkdown(post.content)"></div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <button
                      @click="likePost(post._id)"
                      class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                      :class="{ 'text-blue-600': post.likes.some(like => like.user === currentUser?.id) }"
                    >
                      <HandThumbUpIcon class="h-4 w-4 mr-1" />
                      {{ post.likes.length }}
                    </button>
                    <button
                      @click="replyToPost(post._id)"
                      class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                    >
                      <ChatBubbleLeftEllipsisIcon class="h-4 w-4 mr-1" />
                      Reply
                    </button>
                    <button
                      v-if="canEditPost(post)"
                      @click="editPost(post)"
                      class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                    >
                      <PencilIcon class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Reply Form -->
          <div v-if="!thread.isLocked" class="mt-6 bg-white shadow rounded-lg">
            <div class="p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                {{ replyingTo ? 'Reply to @' + getPostAuthor(replyingTo) : 'Reply to Thread' }}
              </h3>
              <div class="space-y-4">
                <div>
                  <label for="reply-content" class="sr-only">Your reply</label>
                  <textarea
                    id="reply-content"
                    v-model="replyContent"
                    rows="4"
                    class="shadow-sm block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                    :placeholder="replyingTo ? 'Write your reply...' : 'Share your thoughts...'"
                  ></textarea>
                </div>
                <div class="flex items-center justify-between">
                  <div class="text-sm text-gray-500">
                    <span v-if="replyingTo">
                      Replying to <span class="font-medium">@{{ getPostAuthor(replyingTo) }}</span>
                    </span>
                  </div>
                  <div class="flex items-center space-x-3">
                    <button
                      v-if="replyingTo"
                      @click="cancelReply"
                      class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      @click="submitReply"
                      :disabled="!replyContent.trim()"
                      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Post Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Locked Thread Message -->
          <div v-if="thread.isLocked" class="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <LockClosedIcon class="h-5 w-5 text-yellow-400" />
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800">Thread Locked</h3>
                <p class="mt-1 text-sm text-yellow-700">This thread has been locked and no new replies can be posted.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-4">
          <!-- Thread Stats -->
          <div class="bg-white shadow rounded-lg mb-6">
            <div class="p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Thread Stats</h3>
              <dl class="space-y-3">
                <div class="flex justify-between">
                  <dt class="text-sm text-gray-500">Views</dt>
                  <dd class="text-sm font-medium text-gray-900">{{ thread.views }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-sm text-gray-500">Replies</dt>
                  <dd class="text-sm font-medium text-gray-900">{{ thread.replyCount }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-sm text-gray-500">Last reply</dt>
                  <dd class="text-sm font-medium text-gray-900">{{ formatDate(thread.lastReplyAt) }}</dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Similar Threads -->
          <div class="bg-white shadow rounded-lg">
            <div class="p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Similar Threads</h3>
              <div class="space-y-3">
                <div
                  v-for="similarThread in similarThreads"
                  :key="similarThread._id"
                  class="text-sm"
                >
                  <NuxtLink
                    :to="`/forum/thread/${similarThread._id}`"
                    class="font-medium text-blue-600 hover:text-blue-500"
                  >
                    {{ similarThread.title }}
                  </NuxtLink>
                  <p class="text-xs text-gray-500 mt-1">{{ similarThread.replyCount }} replies</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { HomeIcon, ChevronRightIcon, BookmarkIcon, LockClosedIcon, HandThumbUpIcon, ChatBubbleLeftEllipsisIcon, PencilIcon } from '@heroicons/vue/24/outline';
import { marked } from 'marked';

// Route
const route = useRoute();
const threadId = route.params.id;

// State
const thread = ref({
  title: '',
  content: '',
  author: {},
  category: {},
  tags: [],
  views: 0,
  replyCount: 0,
  lastReplyAt: new Date(),
  isPinned: false,
  isLocked: false
});
const posts = ref([]);
const replyContent = ref('');
const replyingTo = ref(null);
const currentUser = ref(null);
const similarThreads = ref([]);

// Computed
const canModerate = computed(() => {
  return currentUser.value?.role === 'moderator' || currentUser.value?.role === 'admin';
});

// Methods
const loadThread = async () => {
  try {
    const response = await $fetch(`/api/forums/threads/${threadId}`);
    thread.value = response.thread;
    posts.value = response.posts;
  } catch (error) {
    console.error('Error loading thread:', error);
  }
};

const loadCurrentUser = async () => {
  try {
    const response = await $fetch('/api/auth/me');
    currentUser.value = response.user;
  } catch (error) {
    console.error('Error loading current user:', error);
  }
};

const renderMarkdown = (content) => {
  return marked(content || '');
};

const formatDate = (date) => {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24)),
    'day'
  );
};

const canEditPost = (post) => {
  return currentUser.value && (
    post.author._id === currentUser.value.id ||
    currentUser.value.role === 'moderator' ||
    currentUser.value.role === 'admin'
  );
};

const getPostAuthor = (postId) => {
  const post = posts.value.find(p => p._id === postId);
  return post?.author.username || 'Unknown';
};

const likePost = async (postId) => {
  // Implementation for liking posts
  console.log('Liking post:', postId);
};

const replyToPost = (postId) => {
  replyingTo.value = postId;
  const post = posts.value.find(p => p._id === postId);
  if (post) {
    replyContent.value = `@${post.author.username} `;
  }
};

const cancelReply = () => {
  replyingTo.value = null;
  replyContent.value = '';
};

const submitReply = async () => {
  if (!replyContent.value.trim()) return;

  try {
    const response = await $fetch('/api/forums/posts', {
      method: 'POST',
      body: {
        content: replyContent.value,
        threadId: threadId,
        parentPostId: replyingTo.value
      }
    });

    // Add new post to the list
    posts.value.push(response.post);
    
    // Reset form
    replyContent.value = '';
    replyingTo.value = null;
    
    // Update thread stats
    thread.value.replyCount += 1;
    thread.value.lastReplyAt = new Date();
  } catch (error) {
    console.error('Error submitting reply:', error);
  }
};

const togglePin = async () => {
  try {
    await $fetch(`/api/forums/threads/${threadId}/moderate`, {
      method: 'POST',
      body: {
        action: thread.value.isPinned ? 'unpin' : 'pin',
        reason: 'Moderator action'
      }
    });
    thread.value.isPinned = !thread.value.isPinned;
  } catch (error) {
    console.error('Error toggling pin:', error);
  }
};

const toggleLock = async () => {
  try {
    await $fetch(`/api/forums/threads/${threadId}/moderate`, {
      method: 'POST',
      body: {
        action: thread.value.isLocked ? 'unlock' : 'lock',
        reason: 'Moderator action'
      }
    });
    thread.value.isLocked = !thread.value.isLocked;
  } catch (error) {
    console.error('Error toggling lock:', error);
  }
};

const editPost = (post) => {
  // Implementation for editing posts
  console.log('Editing post:', post);
};

// Lifecycle
onMounted(() => {
  loadThread();
  loadCurrentUser();
});
</script>
