<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center">
            <NuxtLink to="/dashboard" class="text-2xl font-bold text-gray-900">TestLoom</NuxtLink>
            <span class="ml-4 text-gray-500">/ Quiz Setup</span>
          </div>
          <NuxtLink to="/dashboard" class="text-gray-600 hover:text-gray-800">
            ← Back to Dashboard
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Start New Quiz</h1>
        <p class="text-gray-600 mt-2">Configure your quiz settings and begin practicing.</p>
      </div>

      <div class="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
            <select 
              v-model="quizConfig.subject" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a subject</option>
              <option v-for="subject in availableSubjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Chapter (Optional)</label>
            <select 
              v-model="quizConfig.chapter" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All chapters</option>
              <option v-for="chapter in availableChapters" :key="chapter" :value="chapter">
                {{ chapter }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
            <select 
              v-model="quizConfig.numberOfQuestions" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="5">5 Questions</option>
              <option value="10">10 Questions</option>
              <option value="15">15 Questions</option>
              <option value="20">20 Questions</option>
              <option value="25">25 Questions</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Quiz Mode</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input 
                  type="radio" 
                  v-model="quizConfig.mode" 
                  value="practice" 
                  class="text-blue-600 focus:ring-blue-500"
                />
                <span class="ml-2 text-gray-700">Practice Mode - Take your time</span>
              </label>
              <label class="flex items-center">
                <input 
                  type="radio" 
                  v-model="quizConfig.mode" 
                  value="timed" 
                  class="text-blue-600 focus:ring-blue-500"
                />
                <span class="ml-2 text-gray-700">Timed Mode - Simulate exam conditions</span>
              </label>
            </div>
          </div>

          <div v-if="quizConfig.mode === 'timed'">
            <label class="block text-sm font-medium text-gray-700 mb-2">Timer Duration</label>
            <select 
              v-model="quizConfig.timerMinutes" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="30">30 minutes</option>
            </select>
          </div>
        </div>

        <div class="mt-6 p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-800">
            <span class="font-medium">Available Questions:</span> 
            {{ availableQuestionCount }} question(s) found
            <span v-if="quizConfig.subject">for {{ quizConfig.subject }}</span>
            <span v-if="quizConfig.chapter">in {{ quizConfig.chapter }}</span>
          </p>
        </div>

        <div class="mt-8 flex justify-end space-x-4">
          <NuxtLink 
            to="/dashboard" 
            class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </NuxtLink>
          <button 
            @click="startQuiz"
            :disabled="!quizConfig.subject || availableQuestionCount === 0 || loading"
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Starting...' : 'Start Quiz' }}
          </button>
        </div>

        <div v-if="errorMessage" class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {{ errorMessage }}
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const quizConfig = ref({
  subject: '',
  chapter: '',
  numberOfQuestions: '10',
  mode: 'practice',
  timerMinutes: '15'
})

const availableSubjects = ref([])
const availableChapters = ref([])
const availableQuestionCount = ref(0)
const loading = ref(false)
const errorMessage = ref('')

const fetchAvailableSubjects = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('http://localhost:5000/api/questions?limit=1000', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    if (data.success && data.data.questions) {
      const subjects = [...new Set(data.data.questions.map(q => q.subject).filter(Boolean))]
      availableSubjects.value = subjects
    }
  } catch (error) {
    console.error('Error fetching subjects:', error)
  }
}

const fetchAvailableChapters = async () => {
  if (!quizConfig.value.subject) {
    availableChapters.value = []
    return
  }

  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`http://localhost:5000/api/questions?subject=${encodeURIComponent(quizConfig.value.subject)}&limit=1000`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    if (data.success && data.data.questions) {
      const chapters = [...new Set(data.data.questions.map(q => q.chapter).filter(Boolean))]
      availableChapters.value = chapters
    }
  } catch (error) {
    console.error('Error fetching chapters:', error)
  }
}

const updateQuestionCount = async () => {
  if (!quizConfig.value.subject) {
    availableQuestionCount.value = 0
    return
  }

  try {
    const token = localStorage.getItem('token')
    let url = `http://localhost:5000/api/questions?subject=${encodeURIComponent(quizConfig.value.subject)}&limit=1000`
    
    if (quizConfig.value.chapter) {
      url += `&chapter=${encodeURIComponent(quizConfig.value.chapter)}`
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    if (data.success && data.data.questions) {
      availableQuestionCount.value = data.data.questions.length
    }
  } catch (error) {
    console.error('Error fetching question count:', error)
    availableQuestionCount.value = 0
  }
}

const startQuiz = async () => {
  if (!quizConfig.value.subject) {
    errorMessage.value = 'Please select a subject'
    return
  }

  if (availableQuestionCount.value === 0) {
    errorMessage.value = 'No questions available for the selected criteria'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const token = localStorage.getItem('token')
    let url = `http://localhost:5000/api/questions?subject=${encodeURIComponent(quizConfig.value.subject)}&limit=${quizConfig.value.numberOfQuestions}`
    
    if (quizConfig.value.chapter) {
      url += `&chapter=${encodeURIComponent(quizConfig.value.chapter)}`
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    if (data.success && data.data.questions) {
      localStorage.setItem('quizConfig', JSON.stringify(quizConfig.value))
      localStorage.setItem('quizQuestions', JSON.stringify(data.data.questions))
      router.push('/quiz')
    } else {
      errorMessage.value = 'Failed to load questions'
    }

  } catch (error) {
    console.error('Error starting quiz:', error)
    errorMessage.value = 'Network error. Please try again.'
  } finally {
    loading.value = false
  }
}

// Watch for changes in subject to update chapters and question count
watch(() => quizConfig.value.subject, () => {
  quizConfig.value.chapter = '' 
  fetchAvailableChapters()
  updateQuestionCount()
})

// Watch for changes in chapter to update question count
watch(() => quizConfig.value.chapter, () => {
  updateQuestionCount()
})

onMounted(() => {
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/login')
    return
  }

  fetchAvailableSubjects()
})
</script>
