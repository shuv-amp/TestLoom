<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Navigation Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center">
            <NuxtLink to="/dashboard" class="text-2xl font-bold text-gray-900">TestLoom</NuxtLink>
            <span class="ml-4 text-gray-500">/ Verify OCR Questions</span>
          </div>
          <NuxtLink to="/dashboard" class="text-gray-600 hover:text-gray-800">
            ← Back to Dashboard
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Verify OCR Questions</h1>
        <p class="text-gray-600 mt-2">Review and edit the questions parsed from your image before saving them to the database.</p>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Question Metadata</h2>
        
        <!-- Summary Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{{ questions.length }}</div>
            <div class="text-sm text-gray-600">Questions Found</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{{ questionsWithAnswers }}</div>
            <div class="text-sm text-gray-600">Answers Detected</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">{{ averageConfidence }}%</div>
            <div class="text-sm text-gray-600">Avg Confidence</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-indigo-600">{{ mcqCount }}</div>
            <div class="text-sm text-gray-600">MCQ Questions</div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input 
              v-model="metadata.subject" 
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Computer Science"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select 
              v-model="metadata.difficulty" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div 
          v-for="(question, index) in questions" 
          :key="question.id"
          class="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-semibold text-gray-800">Question {{ index + 1 }}</h3>
            <button 
              @click="removeQuestion(index)"
              class="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
            <textarea 
              v-model="question.questionText"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="Enter the question text..."
            ></textarea>
          </div>

          <div v-if="question.options && question.options.length > 0" class="mb-4">
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">Options</label>
              <div v-if="question.correctAnswer" class="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                AI detected answer: {{ question.correctAnswer.toUpperCase() }}
              </div>
            </div>
            <div class="space-y-2">
              <div 
                v-for="(option, optIndex) in question.options" 
                :key="optIndex"
                class="flex items-center space-x-3"
              >
                <input 
                  :id="`q${index}_opt${optIndex}`"
                  type="radio" 
                  :name="`correct_${index}`"
                  :value="option.label"
                  v-model="question.correctAnswer"
                  class="text-blue-600 focus:ring-blue-500"
                />
                <label :for="`q${index}_opt${optIndex}`" class="text-sm font-medium text-gray-900 w-8">
                  {{ option.label }})
                </label>
                <input 
                  v-model="option.text"
                  type="text"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="Option text..."
                />
              </div>
            </div>
            
            <div class="mt-2 text-xs text-gray-500">
              <span v-if="question.correctAnswer">
                Selected Answer: <span class="font-medium text-blue-600">{{ question.correctAnswer.toUpperCase() }}</span>
              </span>
              <span v-else class="text-orange-600">No answer selected</span>
            </div>
          </div>

          <div class="text-sm text-gray-500 space-y-1">
            <div>Type: {{ question.questionType || 'MCQ' }}</div>
            <div v-if="question.confidence">
              Confidence: <span class="font-medium" :class="{
                'text-green-600': question.confidence > 0.8,
                'text-yellow-600': question.confidence > 0.6 && question.confidence <= 0.8,
                'text-red-600': question.confidence <= 0.6
              }">{{ Math.round(question.confidence * 100) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8 flex justify-end space-x-4">
        <NuxtLink 
          to="/dashboard" 
          class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </NuxtLink>
        <button 
          @click="saveQuestions"
          :disabled="saving || !metadata.subject || questions.length === 0"
          class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ saving ? 'Saving...' : `Save ${questions.length} Question(s)` }}
        </button>
      </div>

      <div v-if="successMessage" class="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        {{ errorMessage }}
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import authManager from '~/utils/auth'

const router = useRouter()
const route = useRoute()

const questions = ref([])
const metadata = ref({
  subject: '',
  difficulty: 'medium'
})
const saving = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Computed properties for statistics
const questionsWithAnswers = computed(() => {
  return questions.value.filter(q => q.correctAnswer).length
})

const averageConfidence = computed(() => {
  if (questions.value.length === 0) return 0
  const totalConfidence = questions.value.reduce((sum, q) => sum + (q.confidence || 0), 0)
  return Math.round((totalConfidence / questions.value.length) * 100)
})

const mcqCount = computed(() => {
  return questions.value.filter(q => q.questionType === 'MCQ' || !q.questionType).length
})

const removeQuestion = (index) => {
  questions.value.splice(index, 1)
}

const saveQuestions = async () => {
  if (!metadata.value.subject) {
    errorMessage.value = 'Subject is required'
    return
  }

  if (questions.value.length === 0) {
    errorMessage.value = 'At least one question is required'
    return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const processedQuestions = questions.value.map(q => ({
      questionText: q.questionText,
      questionType: q.questionType || 'MCQ',
      options: q.options ? q.options.map(opt => ({
        label: opt.label,
        text: opt.text,
        isCorrect: opt.label === q.correctAnswer
      })) : undefined,
      correctAnswer: q.correctAnswer,
      confidence: q.confidence || 0.8
    }))

    const response = await authManager.authenticatedFetch('http://localhost:5000/api/questions/finalize', {
      method: 'POST',
      body: JSON.stringify({
        questions: processedQuestions,
        metadata: {
          subject: metadata.value.subject,
          difficulty: metadata.value.difficulty,
          originalFileName: route.query.fileName || 'unknown'
        }
      })
    })

    const data = await response.json()
    
    if (response.ok && data.success) {
      successMessage.value = `Successfully saved ${data.data.savedQuestions} question(s)!`
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } else {
      errorMessage.value = data.message || 'Failed to save questions'
    }

  } catch (error) {
    console.error('Save error:', error)
    errorMessage.value = 'Network error. Please try again.'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (!authManager.isAuthenticated()) {
    router.push('/login')
    return
  }

  const ocrQuestions = localStorage.getItem('ocrQuestions')
  if (ocrQuestions) {
    try {
      questions.value = JSON.parse(ocrQuestions)
      localStorage.removeItem('ocrQuestions') // Clean up
    } catch (error) {
      console.error('Error parsing OCR questions:', error)
      router.push('/dashboard')
    }
  } else {
    router.push('/dashboard')
  }
})
</script>
