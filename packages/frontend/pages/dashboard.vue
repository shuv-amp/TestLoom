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
        <NuxtLink to="#" class="mt-2 flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
          <span class="mr-3">📚</span> Subjects
        </NuxtLink>
        <NuxtLink to="#" class="mt-2 flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
          <span class="mr-3">⬆</span> Upload Questions
        </NuxtLink>
      </nav>
      <div class="absolute bottom-0 w-64 p-4">
         <NuxtLink to="/login" class="mt-2 flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
          <span class="mr-3">🚪</span> Logout
        </NuxtLink>
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
            accept="image/*"
            @change="onFileChange"
            class="hidden"
          />
          <button
            @click="triggerFileInput"
            :disabled="loading"
            class="bg-green-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 mb-4"
          >
            {{ loading ? 'Uploading...' : 'Upload & Process' }}
          </button>
          <div v-if="ocrResult" class="mt-4">
            <h4 class="font-semibold text-gray-700">OCR Result:</h4>
            <pre class="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap">{{ ocrResult }}</pre>
          </div>
          <div v-if="error" class="mt-4 text-red-600">{{ error }}</div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const selectedFile = ref(null)
const ocrResult = ref('')
const error = ref('')
const loading = ref(false)
const fileInput = ref(null)

const triggerFileInput = () => {
  fileInput.value.click()
}

const onFileChange = async (e) => {
  selectedFile.value = e.target.files[0]
  error.value = ''
  ocrResult.value = ''
  if (selectedFile.value) {
    await uploadSelectedFile()
  }
}

const uploadSelectedFile = async () => {
  if (!selectedFile.value) return
  loading.value = true
  error.value = ''
  ocrResult.value = ''
  try {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('image', selectedFile.value)
    const res = await fetch('http://localhost:5000/api/ocr/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    })
    const data = await res.json()
    if (data.success && data.data && data.data.questions) {
      localStorage.setItem('ocrQuestions', JSON.stringify(data.data.questions))
      router.push('/verify-ocr')
    } else {
      error.value = data.message || 'OCR failed.'
    }
  } catch (err) {
    error.value = 'Upload failed. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/login')
  }
})
</script>

<style>
/* Add any component-specific styles here */
</style>
