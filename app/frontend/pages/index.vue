<template>
  <div class="bg-gray-50 min-h-screen text-gray-800">
    <header class="bg-white/80 backdrop-blur-md fixed top-0 left-0 right-0 z-10 border-b border-gray-200">
      <div class="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">TestLoom</h1>
        <nav class="space-x-4">
          <NuxtLink to="/login" class="text-gray-600 hover:text-blue-600">Log In</NuxtLink>
          <NuxtLink to="/signup" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">Get Started</NuxtLink>
        </nav>
      </div>
    </header>

    <main class="pt-32 pb-20">
      <section class="text-center container mx-auto px-6">
        <h2 class="text-5xl font-extrabold text-gray-900 leading-tight">
          Ace Your Exams. All Your Practice Questions in One Place.
        </h2>
        <p class="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
         TestLoom provides a centralized platform for university students to access, practice, and discuss exam questions in a structured and interactive manner.
        </p>
        <div class="mt-8">
          <NuxtLink to="/signup" class="bg-blue-600 text-white px-8 py-3 rounded-md text-lg font-semibold hover:bg-blue-700 transition">
            Start Studying for Free
          </NuxtLink>
        </div>
      </section>
    </main>

    <footer class="border-t border-gray-200 mt-20 py-8">
        <div class="container mx-auto px-6 text-center text-gray-500">
            <p>&copy; 2025 TestLoom. All rights reserved.</p>
        </div>
    </footer>
  </div>
</template>
