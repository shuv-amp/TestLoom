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
            <input v-model="email" id="email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@student.ku.edu.np" required>
          </div>
          <div class="mb-6">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input v-model="password" type="password" id="password" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••••••" required>
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

const email = ref('')
const password = ref('')
const loading = ref(false)

const router = useRouter()

async function handleLogin() {
  if (!email.value.endsWith('@student.ku.edu.np')) {
    alert('Please use a @student.ku.edu.np email address')
    return
  }
  loading.value = true
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    })
    const data = await res.json()
    if (res.ok && data.data && data.data.token) {
      localStorage.setItem('token', data.data.token)
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