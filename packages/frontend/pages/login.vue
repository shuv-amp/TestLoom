<template>
  <div class="bg-gray-50 min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <NuxtLink to="/" class="text-3xl font-bold text-gray-900">TestLoom</NuxtLink>
        <h2 class="mt-2 text-2xl font-semibold text-gray-700">Log in to your account</h2>
      </div>

      <div class="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <!-- Display error message -->
        <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="handleLogin">
          <div class="mb-4">
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              id="email" 
              v-model="email" 
              type="email"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="you@student.ku.edu.np" 
              required
              :disabled="loading"
            >
          </div>
          
          <div class="mb-4 relative">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              id="password" 
              v-model="password" 
              :type="showPassword ? 'text' : 'password'" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="••••••••••••" 
              required
              :disabled="loading"
            >
            <button 
              type="button" 
              class="absolute inset-y-0 right-0 pr-3 flex items-center mt-6" 
              @click="togglePassword"
              :disabled="loading"
            >
              <span class="text-gray-500 hover:text-gray-700">
                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              </span>
            </button>
          </div>

          <div class="mb-4 flex items-center">
            <input 
              id="remember-me" 
              v-model="rememberMe" 
              type="checkbox" 
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              :disabled="loading"
            >
            <label for="remember-me" class="ml-2 block text-sm text-gray-700">
              Keep me signed in for 7 days
            </label>
          </div>
          
          <div>
            <button 
              type="submit" 
              :disabled="loading || !email || !password" 
              class="block w-full text-center bg-blue-600 text-white py-2.5 rounded-md font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loading" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
              <span v-else>Sign In</span>
            </button>
          </div>
        </form>
      </div>
      
      <p class="text-center mt-6 text-sm text-gray-600">
        Don't have an account? 
        <NuxtLink to="/signup" class="font-medium text-blue-600 hover:underline">Sign Up</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'

// Page meta
definePageMeta({
  layout: false,
  auth: false
})

const router = useRouter()
const userStore = useUserStore()

// Form data
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const loading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

function togglePassword() {
  showPassword.value = !showPassword.value
}

async function handleLogin() {
  console.log('Login button clicked', email.value, password.value)
  // Basic validation
  if (!email.value.endsWith('@student.ku.edu.np')) {
    errorMessage.value = 'Please use a @student.ku.edu.np email address'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters long'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await userStore.login(email.value, password.value, rememberMe.value)
    
    // Success - redirect to dashboard
    await router.push('/dashboard')
    
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = error.message || 'Login failed. Please check your credentials and try again.'
  } finally {
    loading.value = false
  }
}

// Check if user is already logged in
onMounted(async () => {
  try {
    await userStore.fetchSession()
    if (userStore.user) {
      // User is already logged in, redirect to dashboard
      await router.push('/dashboard')
    }
  } catch (error) {
    // User is not logged in, stay on login page
    console.log('User not authenticated, staying on login page')
  }
})

// Clear error when user starts typing
watch([email, password], () => {
  if (errorMessage.value) {
    errorMessage.value = ''
  }
})
</script>