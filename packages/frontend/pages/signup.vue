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
        <h1 class="h2">Create your Account</h1>
        <p class="lead">Join a community of students preparing for success.</p>
      </div>

      <form @submit.prevent="handleSignup" class="form-body">
        <div class="input-group">
          <label for="fullName">Full Name</label>
          <input id="fullName" v-model="name" type="text" class="form-input" placeholder="Enter your full name" required>
        </div>
        <div class="input-group">
          <label for="email">University Email</label>
          <input id="email" v-model="email" type="email" class="form-input" placeholder="you@student.ku.edu.np" required>
        </div>
        <div class="input-group">
          <label for="password">Password</label>
          <div class="password-wrapper">
            <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" class="form-input" placeholder="••••••••••" required>
            <button type="button" class="password-toggle" @click="togglePassword" aria-label="Toggle password visibility">
              <svg v-if="!showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
            </button>
          </div>
        </div>
        <div class="input-group">
          <label for="cpassword">Confirm Password</label>
          <div class="password-wrapper">
            <input id="cpassword" v-model="cpassword" :type="showConfirmPassword ? 'text' : 'password'" class="form-input" placeholder="••••••••••" required>
             <button type="button" class="password-toggle" @click="toggleConfirmPassword" aria-label="Toggle password visibility">
              <svg v-if="!showConfirmPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
            </button>
          </div>
        </div>
        
        <button type="submit" class="btn btn-primary w-full">
          Create Account
        </button>
      </form>

      <p class="form-footer">
        Already have an account?
        <NuxtLink to="/login" class="link">Log In</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup>
// The script block remains the same as before.
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'

useHead({
  title: 'Sign Up - TestLoom',
  meta: [
    { name: 'description', content: 'Create a TestLoom account to start practicing for exams.' }
  ],
})

const name = ref('')
const email = ref('')
const password = ref('')
const cpassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const router = useRouter()
const userStore = useUserStore()

function togglePassword() {
  showPassword.value = !showPassword.value
}
function toggleConfirmPassword() {
  showConfirmPassword.value = !showConfirmPassword.value
}

async function handleSignup() {
  if (password.value !== cpassword.value) {
    alert('Passwords do not match. Please try again.')
    return
  }
  if (!email.value.endsWith('@student.ku.edu.np')) {
    alert('Please use your official @student.ku.edu.np email address to sign up.')
    return
  }
  
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.value, email: email.value, password: password.value }),
      credentials: 'include'
    })
    const data = await res.json()
    if (res.ok && data.success) {
      await userStore.fetchSession()
      router.push('/dashboard')
    } else {
      alert(data.message || 'Signup failed. The email might already be in use.')
    }
  } catch (e) {
    console.error("Signup Error:", e)
    alert('A network error occurred. Please check your connection and try again.')
  }
}
</script>

<style scoped>
/*
  IMPORTANT: The :root variables are intentionally removed from here.
  They should be defined in a single, global CSS file (e.g., /assets/css/main.css)
  and included in your nuxt.config file. This ensures all components share the
  same design tokens without CSS duplication or conflicts.
*/

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

/* Enhanced logo container style */
.brand-mark {
  display: grid;
  place-items: center;
  /* Increased size for better presence */
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

.btn-primary {
  color: #f0f3f8;
  background: linear-gradient(135deg, var(--brand-1), var(--brand-2));
  box-shadow: 0 4px 15px rgba(34, 211, 238, .2);
}

.btn-primary:hover {
  filter: brightness(1.1);
  box-shadow: 0 6px 20px rgba(34, 211, 238, .3);
  transform: translateY(-2px);
}
.btn-primary:active {
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
</style>