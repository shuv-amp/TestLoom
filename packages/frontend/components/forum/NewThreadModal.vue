<template>
  <TransitionRoot as="template" :show="open">
    <Dialog as="div" class="relative z-50" @close="handleClose">
      <!-- Backdrop -->
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      </TransitionChild>

      <!-- Dialog Container -->
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel class="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
              
              <!-- Header -->
              <div class="text-center mb-6">
                <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                  Create New Thread
                </DialogTitle>
              </div>

              <!-- Form -->
              <form @submit.prevent="submitThread" class="space-y-6">
                
                <!-- Title Field -->
                <div>
                  <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
                    Thread Title *
                  </label>
                  <input
                    id="title"
                    v-model="form.title"
                    type="text"
                    required
                    :disabled="loading"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="What's your question or topic?"
                    maxlength="200"
                  />
                  <div v-if="errors.title" class="mt-1 text-sm text-red-600">{{ errors.title }}</div>
                </div>

                <!-- Category Field -->
                <div>
                  <label for="category" class="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    id="category"
                    v-model="form.categoryId"
                    required
                    :disabled="loading || categoryLoading"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="">Select a category</option>
                    <option
                      v-for="category in availableCategories"
                      :key="category._id"
                      :value="category._id"
                    >
                      {{ category.name }}
                    </option>
                  </select>
                  
                  <!-- Loading/Error States -->
                  <div v-if="categoryLoading" class="mt-1 text-xs text-gray-500 flex items-center">
                    <svg class="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading categories...
                  </div>
                  <div v-if="categoryError" class="mt-1 text-xs text-red-600">{{ categoryError }}</div>
                  <div v-if="errors.categoryId" class="mt-1 text-sm text-red-600">{{ errors.categoryId }}</div>
                </div>

                <!-- Tags Field -->
                <div>
                  <label for="tags" class="block text-sm font-medium text-gray-700 mb-1">
                    Tags (optional)
                  </label>
                  <input
                    id="tags"
                    v-model="tagInput"
                    type="text"
                    :disabled="loading"
                    @keydown.enter.prevent="addTag"
                    @keydown.space.prevent="addTag"
                    @blur="addTag"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Add tags separated by commas or spaces"
                  />
                  
                  <!-- Tag Display -->
                  <div v-if="form.tags.length > 0" class="mt-2 flex flex-wrap gap-2">
                    <span
                      v-for="tag in form.tags"
                      :key="tag"
                      class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800"
                    >
                      {{ tag }}
                      <button
                        type="button"
                        :disabled="loading"
                        @click="removeTag(tag)"
                        class="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <span class="sr-only">Remove {{ tag }}</span>
                        <svg class="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                          <path stroke-linecap="round" stroke-width="1.5" d="M1 1l6 6m0-6L1 7" />
                        </svg>
                      </button>
                    </span>
                  </div>
                </div>

                <!-- Content Field -->
                <div>
                  <label for="content" class="block text-sm font-medium text-gray-700 mb-1">
                    Content *
                  </label>
                  <div class="rounded-md border border-gray-300 overflow-hidden">
                    
                    <!-- Formatting Toolbar -->
                    <div class="border-b border-gray-200 px-3 py-2 bg-gray-50">
                      <div class="flex items-center space-x-1">
                        <button
                          type="button"
                          :disabled="loading"
                          @click="formatText('bold')"
                          class="inline-flex items-center p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                          title="Bold"
                        >
                          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6 4a1 1 0 00-1 1v10a1 1 0 001 1h5.5a3.5 3.5 0 001.852-6.49A3.5 3.5 0 0011.5 4H6zm1.5 1.5h4a2 2 0 110 4H7.5V5.5zm0 5.5h5.5a2 2 0 110 4H7.5v-4z" />
                          </svg>
                        </button>
                        
                        <button
                          type="button"
                          :disabled="loading"
                          @click="formatText('italic')"
                          class="inline-flex items-center p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                          title="Italic"
                        >
                          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 5h4l-2 10H6l2-10z" />
                          </svg>
                        </button>
                        
                        <button
                          type="button"
                          :disabled="loading"
                          @click="formatText('code')"
                          class="inline-flex items-center p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                          title="Code"
                        >
                          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                          </svg>
                        </button>
                        
                        <button
                          type="button"
                          :disabled="loading"
                          @click="formatText('quote')"
                          class="inline-flex items-center p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                          title="Quote"
                        >
                          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <!-- Text Area -->
                    <textarea
                      id="content"
                      ref="contentTextarea"
                      v-model="form.content"
                      rows="8"
                      required
                      :disabled="loading"
                      class="block w-full border-0 p-3 focus:ring-0 sm:text-sm resize-none disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Describe your question or share your thoughts..."
                    ></textarea>
                  </div>
                  <div v-if="errors.content" class="mt-1 text-sm text-red-600">{{ errors.content }}</div>
                </div>

                <!-- Form Actions -->
                <div class="pt-4 sm:flex sm:flex-row-reverse sm:gap-3">
                  <button
                    type="submit"
                    :disabled="loading || categoryLoading || !isFormValid"
                    class="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:text-sm"
                  >
                    <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ loading ? 'Creating...' : 'Create Thread' }}
                  </button>
                  
                  <button
                    type="button"
                    :disabled="loading"
                    @click="handleClose"
                    class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <!-- General Error Display -->
              <div v-if="generalError" class="mt-4 rounded-md bg-red-50 p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">Error</h3>
                    <div class="mt-2 text-sm text-red-700">{{ generalError }}</div>
                  </div>
                </div>
              </div>

            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'

// Props
const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  categories: {
    type: Array,
    default: () => []
  },
  categoryId: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['close', 'created'])

// Refs
const contentTextarea = ref(null)

// Reactive State
const form = ref({
  title: '',
  content: '',
  categoryId: '',
  tags: []
})

const tagInput = ref('')
const allCategories = ref([])
const loading = ref(false)
const categoryLoading = ref(false)
const categoryError = ref('')
const generalError = ref('')

const errors = ref({
  title: '',
  content: '',
  categoryId: ''
})

// Computed Properties
const availableCategories = computed(() => {
  if (props.categories && props.categories.length > 0) {
    return props.categories
  }
  return allCategories.value
})

const isFormValid = computed(() => {
  return (
    form.value.title.trim().length > 0 &&
    form.value.content.trim().length > 0 &&
    form.value.categoryId.length > 0 &&
    !loading.value &&
    !categoryLoading.value
  )
})

// Methods
const validateForm = () => {
  errors.value = {
    title: '',
    content: '',
    categoryId: ''
  }

  let isValid = true

  if (!form.value.title.trim()) {
    errors.value.title = 'Title is required'
    isValid = false
  } else if (form.value.title.trim().length < 5) {
    errors.value.title = 'Title must be at least 5 characters'
    isValid = false
  }

  if (!form.value.content.trim()) {
    errors.value.content = 'Content is required'
    isValid = false
  } else if (form.value.content.trim().length < 10) {
    errors.value.content = 'Content must be at least 10 characters'
    isValid = false
  }

  // MongoDB ObjectId: 24 hex chars
  const mongoIdRegex = /^[a-f\d]{24}$/i
  if (!form.value.categoryId) {
    errors.value.categoryId = 'Please select a category'
    isValid = false
  } else if (!mongoIdRegex.test(form.value.categoryId)) {
    errors.value.categoryId = 'Invalid category ID'
    isValid = false
  }

  // Tags: array of non-empty strings, each ≤ 20 chars
  if (form.value.tags && Array.isArray(form.value.tags)) {
    form.value.tags = form.value.tags.filter(tag => tag && tag.length <= 20)
  } else {
    form.value.tags = []
  }

  return isValid
}

const loadCategories = async () => {
  if (categoryLoading.value) return

  categoryLoading.value = true
  categoryError.value = ''
  
  try {
    // Replace with your actual API endpoint
    const response = await $fetch('/api/forums/categories', {
      credentials: 'include'
    })
    
    if (Array.isArray(response)) {
      allCategories.value = response
      if (response.length === 0) {
        categoryError.value = 'No categories available'
      }
    } else {
      throw new Error('Invalid response format')
    }
  } catch (error) {
    console.error('Failed to load categories:', error)
    categoryError.value = 'Failed to load categories. Please try again.'
    allCategories.value = []
  } finally {
    categoryLoading.value = false
  }
}

const submitThread = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true
  generalError.value = ''

  try {
    const payload = {
      title: form.value.title.trim(),
      content: form.value.content.trim(),
      categoryId: form.value.categoryId,
      tags: form.value.tags
    }

    // Replace with your actual API endpoint

    // Use authManager to send authenticated request
    const res = await import('~/utils/auth')
    const authManager = res.default
    const response = await authManager.authenticatedFetch('/api/forums/threads', {
      method: 'POST',
      body: JSON.stringify(payload),
      credentials: 'include'
    })
    const data = await response.json()
    emit('created', data.thread || data)

    emit('created', response.thread || response)
    resetForm()
    emit('close')
  } catch (error) {
    console.error('Failed to create thread:', error)
    generalError.value = error.data?.message || error.message || 'Failed to create thread. Please try again.'
  } finally {
    loading.value = false
  }
}

const addTag = () => {
  if (!tagInput.value.trim()) return

  const newTags = tagInput.value
    .split(/[,\s]+/)
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0 && !form.value.tags.includes(tag))

  form.value.tags.push(...newTags)
  tagInput.value = ''

  // Limit to 10 tags
  if (form.value.tags.length > 10) {
    form.value.tags = form.value.tags.slice(0, 10)
  }
}

const removeTag = (tagToRemove) => {
  const index = form.value.tags.indexOf(tagToRemove)
  if (index > -1) {
    form.value.tags.splice(index, 1)
  }
}

const formatText = (format) => {
  if (!contentTextarea.value) return

  const textarea = contentTextarea.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = form.value.content.substring(start, end)

  let replacement = ''
  let newCursorPos = start

  switch (format) {
    case 'bold':
      replacement = `**${selectedText}**`
      newCursorPos = selectedText ? start + replacement.length : start + 2
      break
    case 'italic':
      replacement = `*${selectedText}*`
      newCursorPos = selectedText ? start + replacement.length : start + 1
      break
    case 'code':
      replacement = `\`${selectedText}\``
      newCursorPos = selectedText ? start + replacement.length : start + 1
      break
    case 'quote':
      replacement = `> ${selectedText}`
      newCursorPos = start + replacement.length
      break
    default:
      return
  }

  form.value.content = 
    form.value.content.substring(0, start) + 
    replacement + 
    form.value.content.substring(end)

  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(newCursorPos, newCursorPos)
  })
}

const resetForm = () => {
  form.value = {
    title: '',
    content: '',
    categoryId: props.categoryId || '',
    tags: []
  }
  tagInput.value = ''
  errors.value = {
    title: '',
    content: '',
    categoryId: ''
  }
  generalError.value = ''
}

const handleClose = () => {
  if (!loading.value) {
    emit('close')
  }
}

// Watchers
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    // Load categories if not provided and not already loading
    if (availableCategories.value.length === 0 && !categoryLoading.value) {
      loadCategories()
    }
    
    // Set category ID from props
    if (props.categoryId && form.value.categoryId !== props.categoryId) {
      form.value.categoryId = props.categoryId
    }
    
    // Clear any previous errors
    generalError.value = ''
    errors.value = {
      title: '',
      content: '',
      categoryId: ''
    }
  } else {
    // Reset form when modal closes
    resetForm()
  }
})

watch(() => props.categoryId, (newCategoryId) => {
  if (newCategoryId && form.value.categoryId !== newCategoryId) {
    form.value.categoryId = newCategoryId
  }
})

// Lifecycle
onMounted(() => {
  if (props.open && availableCategories.value.length === 0) {
    loadCategories()
  }
})
</script>