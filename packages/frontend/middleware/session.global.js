import { useNuxtApp } from '#app'
import { useUserStore } from '~/stores/user'

export default defineNuxtRouteMiddleware(async (to, from) => {
    // Skip middleware on server side
    if (process.server) return

    const nuxtApp = useNuxtApp()
    const userStore = useUserStore(nuxtApp.$pinia)

    // Always fetch session (this will initialize auth manager and check for existing sessions)
    if (!userStore.user && !userStore.loading) {
        await userStore.fetchSession()
    }

    // Check if route requires authentication
    const protectedRoutes = ['/dashboard', '/quiz', '/quiz-setup', '/verify-ocr', '/forum']
    const isProtectedRoute = protectedRoutes.some(route => to.path.startsWith(route))

    if (isProtectedRoute && !userStore.isAuthenticated) {
        return navigateTo('/login')
    }

    // Redirect authenticated users away from auth pages
    const authRoutes = ['/login', '/signup']
    if (authRoutes.includes(to.path) && userStore.isAuthenticated) {
        return navigateTo('/dashboard')
    }
})