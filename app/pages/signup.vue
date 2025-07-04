<template>
  <div class="bg-gray-50 min-h-screen flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <NuxtLink to="/" class="text-3xl font-bold text-gray-900">TestLoom</NuxtLink>
        <h2 class="mt-2 text-2xl font-semibold text-gray-700">Create your TestLoom account</h2>
      </div>

      <div class="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <form @submit.prevent="handleSignup">
          <div class="mb-4">
            <label for="fullName" class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" id="fullName" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Niraj Ram" required>
          </div>
          <div class="mb-4">
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" id="email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@example.com" required>
          </div>
          <div class="mb-6">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" id="password" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••••" required>
          </div>
          <div>
            <button type="submit" class="w-full bg-blue-600 text-white py-2.5 rounded-md font-semibold hover:bg-blue-700 transition">
              Create Account
            </button>
          </div>
        </form>
      </div>

      <p class="text-center mt-6 text-sm text-gray-600">
        Already have an account? 
        <NuxtLink to="/login" class="font-medium text-blue-600 hover:underline">Log In</NuxtLink>
      </p>
    </div>
  </div>
</template>
