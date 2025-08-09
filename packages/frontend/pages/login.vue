<template>
  <div class="page-container">
    <div class="form-wrapper">
      <div class="form-header">
        <NuxtLink to="/" class="brand" aria-label="TestLoom home">
          <span class="brand-mark" aria-hidden="true">
            <svg class="tl" width="48" height="48" viewBox="0 0 64 64" fill="none" role="img" aria-label="TL monogram">
              <defs>
                <linearGradient id="gTL" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#7c5cff" offset="0"/>
                  <stop stop-color="#22d3ee" offset="1"/>
                </linearGradient>
              </defs>
              <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#gTL)" opacity=".18"/>
              <rect x="4.5" y="4.5" width="55" height="55" rx="15.5" stroke="url(#gTL)" opacity=".35"/>
              <path d="M10 16H54V24H38V52H26V24H10V16Z" fill="url(#gTL)"/>
              <path d="M38 52V24H46V44H54V52H38Z" fill="url(#gTL)" opacity=".8"/>
            </svg>
          </span>
        </NuxtLink>
        <h1 class="h2">Welcome Back</h1>
        <p class="lead">Log in to continue your exam preparation.</p>
      </div>

      <form @submit.prevent="handleLogin" class="form-body">
        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>

        <div class="input-group">
          <label for="email">University Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-input"
            placeholder="you@student.ku.edu.np"
            required
            :disabled="loading"
          >
        </div>
        
        <div class="input-group">
          <label for="password">Password</label>
          <div class="password-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="••••••••••"
              required
              :disabled="loading"
            >
            <button
              type="button"
              class="password-toggle"
              @click="togglePassword"
              :disabled="loading"
              aria-label="Toggle password visibility"
            >
              <svg v-if="!showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between extra-options">
            <div class="flex items-center">
                <input
                    id="remember-me"
                    v-model="rememberMe"
                    type="checkbox"
                    class="custom-checkbox"
                    :disabled="loading"
                >
                <label for="remember-me" class="ml-2 text-sm">
                    Remember me
                </label>
            </div>
            </div>
        
        <button
          type="submit"
          :disabled="loading || !email || !password"
          class="btn btn-primary w-full"
        >
          <span v-if="loading" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing In...
          </span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <p class="form-footer">
        Don't have an account?
        <NuxtLink to="/signup" class="link">Sign Up</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'

// Page meta
definePageMeta({
  layout: false,
  auth: false
})
useHead({
  title: 'Log In - TestLoom',
  meta: [
    { name: 'description', content: 'Log in to your TestLoom account.' }
  ],
})

const router = useRouter()
const userStore = useUserStore()

// Form data
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const loading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

function togglePassword() {
  showPassword.value = !showPassword.value
}

async function handleLogin() {
  if (!email.value || !password.value) {
      errorMessage.value = 'Please enter both email and password.';
      return;
  }
  loading.value = true
  errorMessage.value = ''
  try {
    await userStore.login(email.value, password.value, rememberMe.value)
    await router.push('/dashboard')
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = error.message || 'Login failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}

// Check if user is already logged in
onMounted(async () => {
  try {
    await userStore.fetchSession()
    if (userStore.user) {
      await router.push('/dashboard')
    }
  } catch (error) {
    console.log('User not authenticated, staying on login page')
  }
})

// Clear error when user starts typing
watch([email, password], () => {
  if (errorMessage.value) {
    errorMessage.value = ''
  }
})
</script>

<style scoped>
/* These styles assume your global CSS file (/assets/css/main.css) provides the --variable definitions */
.page-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem 1rem;
  background: radial-gradient(circle at 50% 0%, var(--bg-light), var(--bg-dark) 50%);
}
.form-wrapper {
  width: 100%;
  max-width: 420px;
  background: var(--surface);
  border: 1px solid var(--edge);
  border-radius: var(--radius-m);
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, .35);
}
.form-header {
  text-align: center;
  margin-bottom: 2rem;
}
.brand {
  display: inline-flex;
  margin-bottom: 1.5rem;
  transition: transform 0.2s ease-in-out;
}
.brand:hover {
  transform: scale(1.05);
}
.brand-mark {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: #0c1018;
  border: 1px solid var(--edge);
  position: relative;
  overflow: hidden;
}
.h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 0.5rem;
}
.lead {
  color: var(--muted);
  font-size: 1rem;
  margin: 0;
}
.form-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.input-group {
  display: flex;
  flex-direction: column;
}
.input-group label {
  color: var(--muted);
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}
.form-input {
  width: 100%;
  height: 44px;
  background-color: var(--bg-dark);
  border: 1px solid var(--edge);
  border-radius: 12px;
  padding: 0 1rem;
  color: var(--text);
  font-size: 1rem;
  transition: all 0.25s ease-in-out;
}
.form-input::placeholder {
  color: #5b667a;
}
.form-input:focus {
  outline: none;
  border-color: var(--brand-1);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--brand-1) 30%, transparent);
}
.password-wrapper {
  position: relative;
}
.password-toggle {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding-right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted);
}
.password-toggle:hover {
  color: var(--text);
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 1.25rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.25s ease-in-out;
  cursor: pointer;
  border: 1px solid transparent;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  filter: none;
}
.btn-primary {
  color: #f0f3f8;
  background: linear-gradient(135deg, var(--brand-1), var(--brand-2));
  box-shadow: 0 4px 15px rgba(34, 211, 238, .2);
}
.btn-primary:hover:not(:disabled) {
  filter: brightness(1.1);
  box-shadow: 0 6px 20px rgba(34, 211, 238, .3);
  transform: translateY(-2px);
}
.btn-primary:active:not(:disabled) {
  transform: translateY(-1px) scale(0.99);
}
.form-footer {
  text-align: center;
  margin-top: 1.5rem;
  color: var(--muted);
}
.link {
  color: var(--brand-2);
  font-weight: 600;
  text-decoration: none;
}
.link:hover {
  text-decoration: underline;
}
.extra-options {
    color: var(--muted);
}
/* Custom Checkbox */
.custom-checkbox {
    appearance: none;
    -webkit-appearance: none;
    height: 18px;
    width: 18px;
    background-color: var(--bg-dark);
    border: 1px solid var(--edge);
    border-radius: 6px;
    cursor: pointer;
    display: inline-block;
    position: relative;
    transition: all 0.2s ease-in-out;
}
.custom-checkbox:checked {
    background-color: var(--brand-1);
    border-color: var(--brand-1);
}
.custom-checkbox:checked::after {
    content: '';
    position: absolute;
    left: 5px;
    top: 2px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
}
/* Error Banner */
.error-banner {
    background-color: color-mix(in oklab, #ff4d4d 20%, transparent);
    border: 1px solid #ff4d4d;
    color: #ffc9c9;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 500;
    text-align: center;
}
</style>