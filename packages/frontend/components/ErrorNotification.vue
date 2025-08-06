<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="isVisible && error"
        :class="[
          'fixed top-4 right-4 z-50 max-w-md w-full mx-auto',
          'p-4 rounded-lg shadow-lg border',
          'flex items-start space-x-3',
          getNotificationClasses()
        ]"
        role="alert"
      >
        <!-- Icon -->
        <div class="flex-shrink-0">
          <svg
            v-if="type === 'error'"
            class="w-5 h-5 text-red-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <svg
            v-else-if="type === 'warning'"
            class="w-5 h-5 text-yellow-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
          <svg
            v-else-if="type === 'success'"
            class="w-5 h-5 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <svg
            v-else
            class="w-5 h-5 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <h3 v-if="title" :class="getTitleClasses()">
            {{ title }}
          </h3>
          <p :class="getMessageClasses()">
            {{ error.message }}
          </p>
          
          <!-- Action buttons for critical errors -->
          <div v-if="showActions" class="mt-3 flex space-x-2">
            <button
              v-if="error.code === 'TOKEN_EXPIRED'"
              @click="handleLogin"
              class="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Login Again
            </button>
            <button
              v-if="error.code === 'NETWORK_ERROR'"
              @click="handleRetry"
              class="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        </div>

        <!-- Close button -->
        <button
          @click="handleClose"
          :class="getCloseButtonClasses()"
          class="flex-shrink-0 p-1 rounded-md hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          <span class="sr-only">Close</span>
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  error: {
    type: Object,
    default: null
  },
  isVisible: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['error', 'warning', 'success', 'info'].includes(value)
  },
  title: {
    type: String,
    default: null
  },
  onClose: {
    type: Function,
    default: () => {}
  },
  onRetry: {
    type: Function,
    default: null
  }
})

const showActions = computed(() => {
  return props.error && ['TOKEN_EXPIRED', 'NETWORK_ERROR'].includes(props.error.code)
})

const getNotificationClasses = () => {
  const baseClasses = 'bg-white'
  
  switch (props.type) {
    case 'error':
      return `${baseClasses} border-red-300`
    case 'warning':
      return `${baseClasses} border-yellow-300`
    case 'success':
      return `${baseClasses} border-green-300`
    default:
      return `${baseClasses} border-blue-300`
  }
}

const getTitleClasses = () => {
  switch (props.type) {
    case 'error':
      return 'text-red-800 font-medium text-sm'
    case 'warning':
      return 'text-yellow-800 font-medium text-sm'
    case 'success':
      return 'text-green-800 font-medium text-sm'
    default:
      return 'text-blue-800 font-medium text-sm'
  }
}

const getMessageClasses = () => {
  switch (props.type) {
    case 'error':
      return 'text-red-700 text-sm mt-1'
    case 'warning':
      return 'text-yellow-700 text-sm mt-1'
    case 'success':
      return 'text-green-700 text-sm mt-1'
    default:
      return 'text-blue-700 text-sm mt-1'
  }
}

const getCloseButtonClasses = () => {
  switch (props.type) {
    case 'error':
      return 'text-red-400 hover:text-red-600 focus:ring-red-500'
    case 'warning':
      return 'text-yellow-400 hover:text-yellow-600 focus:ring-yellow-500'
    case 'success':
      return 'text-green-400 hover:text-green-600 focus:ring-green-500'
    default:
      return 'text-blue-400 hover:text-blue-600 focus:ring-blue-500'
  }
}

const handleClose = () => {
  props.onClose()
}

const handleLogin = () => {
  router.push('/login')
  props.onClose()
}

const handleRetry = () => {
  if (props.onRetry) {
    props.onRetry()
  }
  props.onClose()
}
</script>
