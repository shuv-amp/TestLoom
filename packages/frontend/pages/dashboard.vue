<template>
  <div class="flex h-screen bg-gray-100 font-sans">
    <aside class="w-64 bg-white border-r border-gray-200 flex-shrink-0">
      <div class="p-6">
        <NuxtLink to="/" class="text-2xl font-bold text-gray-900">TestLoom</NuxtLink>
      </div>
      <nav class="mt-6 px-4">
        <NuxtLink to="/dashboard" class="flex items-center px-4 py-2 text-gray-700 bg-gray-200 rounded-md">
          <span class="mr-3">📊</span> Dashboard
        </NuxtLink>
        <NuxtLink to="/quiz-setup" class="mt-2 flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
          <span class="mr-3">📚</span> Subjects
        </NuxtLink>
      </nav>
      <div class="absolute bottom-0 w-64 p-4">
         <button @click="logout" class="mt-2 flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md w-full text-left">
          <span class="mr-3">🚪</span> Logout
        </button>
      </div>
    </aside>

    <main class="flex-1 p-8 overflow-y-auto">
      <div class="max-w-7xl mx-auto">
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Welcome back, Student!</h1>
            <p class="text-gray-600 mt-1">Let's get you ready for your exams.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
            <h3 class="font-bold text-xl text-gray-800">Start New Quiz</h3>
            <p class="text-gray-600 mt-1">Choose a subject and chapter to begin practicing.</p>
            <NuxtLink to="/quiz-setup" class="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700">
              Select Subject
            </NuxtLink>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
            <h3 class="font-bold text-xl text-gray-800">View Performance</h3>
            <p class="text-gray-600 mt-1">Track your progress and identify areas for improvement.</p>
            <button class="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-semibold hover:bg-gray-300">
              My Analytics
            </button>
          </div>
        </div>
        <!-- OCR Upload Section -->
        <div class="mt-10 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 class="font-bold text-xl text-gray-800 mb-2">Upload Question Paper for OCR</h3>
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/bmp,image/tiff"
            @change="onFileChange"
            style="display:none;"
          />
          <button
            @click="triggerFileInput"
            :disabled="loading"
            class="bg-green-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 mb-4"
          >
            {{ loading ? 'Uploading...' : 'Upload & Process' }}
          </button>
          <div class="mt-4">
            <div v-if="loading" class="text-blue-600 font-semibold">Uploading...</div>
            <div v-if="success" class="text-green-600 font-semibold">Upload successful! Redirecting...</div>
            <div v-if="error" class="text-red-600">{{ error }}</div>
            <div v-if="!loading && !success && !error" class="text-gray-500">Select an image and upload to see results here.</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import authManager from '~/utils/auth'
import { useUserStore } from '~/stores/user'

const router = useRouter()
const { user, fetchSession } = useUserStore()
const selectedFile = ref(null)
const error = ref('')
const loading = ref(false)
const success = ref(false)
const fileInput = ref(null)

const logout = async () => {
  try {
    await authManager.logout()
    await router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
    // Force redirect even if logout API fails
    await router.push('/login')
  }
}

const triggerFileInput = () => {
  console.log('Triggering file input')
  fileInput.value.click()
}

const onFileChange = (e) => {
  const file = e.target.files[0]
  selectedFile.value = file
  error.value = ''
  if (!file) {
    error.value = 'No file selected.'
    return
  }
  // Validate file type and size before upload
  const allowedTypes = ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff']
  if (!allowedTypes.includes(file.type)) {
    error.value = 'Invalid file type. Please upload JPEG, PNG, BMP, or TIFF images only.'
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    error.value = 'File size too large. Maximum size allowed is 10MB.'
    return
  }
  uploadSelectedFile()
}

const uploadSelectedFile = async () => {
  if (!selectedFile.value) {
    error.value = 'No file selected.'
    return
  }
  loading.value = true
  error.value = ''
  success.value = false
  const accessToken = authManager.getAccessToken ? authManager.getAccessToken() : authManager.accessToken
  console.log('Access token before upload:', accessToken)
  try {
    const formData = new FormData()
    formData.append('image', selectedFile.value)
    const response = await authManager.authenticatedFetch('/api/ocr/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })
    const data = await response.json()
    if (response.status === 401) {
      error.value = 'You must be logged in to upload. Please log in and try again.'
      return
    }
    if (response.status === 400 && data.message) {
      error.value = data.message
      return
    }
    if (data.success && data.data && data.data.questions) {
      success.value = true
      localStorage.setItem('ocrQuestions', JSON.stringify(data.data.questions))
      setTimeout(() => router.push('/verify-ocr'), 1200)
    } else {
      error.value = data.message || 'OCR failed.'
    }
  } catch (err) {
    error.value = 'Upload failed. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  // Check if user is authenticated using our secure method
  try {
    await fetchSession()
    if (!user) {
      router.push('/login')
    }
  } catch (error) {
    console.error('Session check error:', error)
    router.push('/login')
  }
})
</script>

<style>
/* Add any component-specific styles here */
</style>
