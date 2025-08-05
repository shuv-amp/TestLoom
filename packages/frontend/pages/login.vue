<template>
  <div class="bg-gray-50 min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <NuxtLink to="/" class="text-3xl font-bold text-gray-900">TestLoom</NuxtLink>
        <h2 class="mt-2 text-2xl font-semibold text-gray-700">Log in to your account</h2>
      </div>

      <div class="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <form @submit.prevent="handleLogin">
          <div class="mb-4">
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input id="email" v-model="email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@student.ku.edu.np" required>
          </div>
          <div class="mb-6 relative">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••••••" required>
            <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center mt-6" @click="togglePassword">
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
          <div>
            <button type="submit" :disabled="loading" class="block w-full text-center bg-blue-600 text-white py-2.5 rounded-md font-semibold hover:bg-blue-700 transition">
              <span v-if="loading" class="animate-spin">⏳</span>
              <span v-else>Log In</span>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'

const email = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)

const router = useRouter()
const userStore = useUserStore()

function togglePassword() {
  showPassword.value = !showPassword.value
}

async function handleLogin() {
  if (!email.value.endsWith('@student.ku.edu.np')) {
    alert('Please use a @student.ku.edu.np email address')
    return
  }
  loading.value = true
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
      credentials: 'include'
    })
    const data = await res.json()
    if (res.ok && data.success) {
      localStorage.setItem('token', data.data.accessToken); // Store new token
      await userStore.fetchSession()
      router.push('/dashboard')
    } else {
      alert(data.message || 'Login failed')
    }
  } catch (e) {
    alert('Network error. Please try again.')
  } finally {
    loading.value = false
  }
}
</script>