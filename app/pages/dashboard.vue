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
            <button class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700">
              Select Subject
            </button>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
            <h3 class="font-bold text-xl text-gray-800">View Performance</h3>
            <p class="text-gray-600 mt-1">Track your progress and identify areas for improvement.</p>
            <button class="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-semibold hover:bg-gray-300">
              My Analytics
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/login')
  }
})
</script>
