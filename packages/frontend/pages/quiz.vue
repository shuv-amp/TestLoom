<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-900">TestLoom Quiz</h1>
            <span class="ml-4 text-gray-500">{{ quizConfig.subject }}</span>
            <span v-if="quizConfig.chapter" class="ml-2 text-gray-500">- {{ quizConfig.chapter }}</span>
          </div>
          <div class="flex items-center space-x-4">
            <div v-if="quizConfig.mode === 'timed'" class="text-lg font-semibold" :class="timeRemaining <= 60 ? 'text-red-600' : 'text-gray-700'">
              ⏱️ {{ formatTime(timeRemaining) }}
            </div>
            <div class="text-sm text-gray-600">
              Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="w-full bg-gray-200 h-2">
      <div 
        class="bg-blue-600 h-2 transition-all duration-300"
        :style="{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }"
      ></div>
    </div>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="!quizCompleted" class="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <!-- Current Question -->
        <div class="mb-8">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">
            {{ currentQuestion.questionText }}
          </h2>

          <div v-if="currentQuestion.options && currentQuestion.options.length > 0" class="space-y-3">
            <label 
              v-for="option in currentQuestion.options" 
              :key="option.label"
              class="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              :class="userAnswers[currentQuestionIndex] === option.label ? 'border-blue-500 bg-blue-50' : 'border-gray-300'"
            >
              <input 
                type="radio" 
                :name="`question_${currentQuestionIndex}`"
                :value="option.label"
                v-model="userAnswers[currentQuestionIndex]"
                class="text-blue-600 focus:ring-blue-500"
              />
              <span class="ml-3 text-gray-700">
                <strong>{{ option.label }})</strong> {{ option.text }}
              </span>
            </label>
          </div>

          <div v-else class="p-4 bg-gray-50 rounded-lg">
            <p class="text-gray-600">This question type is not yet supported in the quiz interface.</p>
          </div>
        </div>

        <div class="flex justify-between">
          <button 
            @click="previousQuestion"
            :disabled="currentQuestionIndex === 0"
            class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div class="space-x-4">
            <button 
              v-if="currentQuestionIndex < questions.length - 1"
              @click="nextQuestion"
              class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next
            </button>
            <button 
              v-else
              @click="finishQuiz"
              class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Finish Quiz
            </button>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t border-gray-200">
          <p class="text-sm text-gray-600 mb-3">Jump to question:</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(_, index) in questions"
              :key="index"
              @click="goToQuestion(index)"
              class="w-8 h-8 text-sm rounded-full border"
              :class="getQuestionButtonClass(index)"
            >
              {{ index + 1 }}
            </button>
          </div>
        </div>
      </div>

      <div v-else class="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-800 mb-2">Quiz Completed!</h2>
          <div class="text-6xl mb-4">
            {{ getScoreEmoji() }}
          </div>
          <p class="text-xl text-gray-600">
            Your Score: <span class="font-bold text-blue-600">{{ score }}/{{ questions.length }}</span>
            ({{ Math.round((score / questions.length) * 100) }}%)
          </p>
        </div>

        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-800">Question Review:</h3>
          
          <div 
            v-for="(question, index) in questions" 
            :key="question._id"
            class="p-4 border rounded-lg"
            :class="getQuestionResultClass(index)"
          >
            <div class="flex justify-between items-start mb-2">
              <h4 class="font-medium text-gray-800">Question {{ index + 1 }}</h4>
              <span class="text-sm px-2 py-1 rounded" :class="getResultBadgeClass(index)">
                {{ isCorrect(index) ? 'Correct' : 'Incorrect' }}
              </span>
            </div>
            
            <p class="text-gray-700 mb-3">{{ question.questionText }}</p>
            
            <div class="text-sm space-y-1">
              <p>
                <strong>Your Answer:</strong> 
                <span :class="isCorrect(index) ? 'text-green-600' : 'text-red-600'">
                  {{ getUserAnswerText(index) }}
                </span>
              </p>
              <p>
                <strong>Correct Answer:</strong> 
                <span class="text-green-600">{{ getCorrectAnswerText(index) }}</span>
              </p>
            </div>
          </div>
        </div>

        <div class="mt-8 flex justify-center space-x-4">
          <NuxtLink 
            to="/quiz-setup" 
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Take Another Quiz
          </NuxtLink>
          <NuxtLink 
            to="/dashboard" 
            class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Dashboard
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const quizConfig = ref({})
const questions = ref([])
const currentQuestionIndex = ref(0)
const userAnswers = ref({})
const quizCompleted = ref(false)
const timeRemaining = ref(0)
const timer = ref(null)

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] || {})
const score = computed(() => {
  let correctAnswers = 0
  questions.value.forEach((question, index) => {
    if (isCorrect(index)) {
      correctAnswers++
    }
  })
  return correctAnswers
})

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
  }
}

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

const goToQuestion = (index) => {
  currentQuestionIndex.value = index
}

const getQuestionButtonClass = (index) => {
  if (index === currentQuestionIndex.value) {
    return 'bg-blue-600 text-white border-blue-600'
  } else if (userAnswers.value[index]) {
    return 'bg-green-100 text-green-800 border-green-300'
  } else {
    return 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
  }
}

const finishQuiz = () => {
  if (timer.value) {
    clearInterval(timer.value)
  }
  quizCompleted.value = true
}

const isCorrect = (questionIndex) => {
  const question = questions.value[questionIndex]
  const userAnswer = userAnswers.value[questionIndex]
  
  if (!question || !userAnswer) return false
  
  const correctOption = question.options?.find(opt => opt.isCorrect)
  return correctOption && correctOption.label === userAnswer
}

const getUserAnswerText = (questionIndex) => {
  const userAnswer = userAnswers.value[questionIndex]
  if (!userAnswer) return 'Not answered'
  
  const question = questions.value[questionIndex]
  const option = question.options?.find(opt => opt.label === userAnswer)
  return option ? `${userAnswer}) ${option.text}` : userAnswer
}

const getCorrectAnswerText = (questionIndex) => {
  const question = questions.value[questionIndex]
  const correctOption = question.options?.find(opt => opt.isCorrect)
  return correctOption ? `${correctOption.label}) ${correctOption.text}` : 'N/A'
}

const getQuestionResultClass = (index) => {
  return isCorrect(index) ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
}

const getResultBadgeClass = (index) => {
  return isCorrect(index) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
}

const getScoreEmoji = () => {
  const percentage = (score.value / questions.value.length) * 100
  if (percentage >= 90) return '🎉'
  if (percentage >= 80) return '😊'
  if (percentage >= 70) return '🙂'
  if (percentage >= 60) return '😐'
  return '😔'
}

const startTimer = () => {
  if (quizConfig.value.mode === 'timed') {
    timeRemaining.value = parseInt(quizConfig.value.timerMinutes) * 60
    timer.value = setInterval(() => {
      timeRemaining.value--
      if (timeRemaining.value <= 0) {
        finishQuiz()
      }
    }, 1000)
  }
}

onMounted(() => {
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/login')
    return
  }
  const configData = localStorage.getItem('quizConfig')
  const questionsData = localStorage.getItem('quizQuestions')
  if (!configData || !questionsData) {
    router.push('/quiz-setup')
    return
  }

  try {
    quizConfig.value = JSON.parse(configData)
    questions.value = JSON.parse(questionsData)
    userAnswers.value = {}
    startTimer()
  } catch (error) {
    console.error('Error loading quiz data:', error)
    router.push('/quiz-setup')
  }
})

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})
</script>
