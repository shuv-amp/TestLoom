import { defineStore } from 'pinia'
import authManager from '~/utils/auth'

export const useUserStore = defineStore('user', {
    state: () => ({
        user: null,
        loading: false,
        error: null
    }),

    getters: {
        isAuthenticated: (state) => !!state.user && authManager.isAuthenticated(),
        userRole: (state) => state.user?.role || null,
        isAdmin: (state) => state.user?.role === 'admin',
        isModerator: (state) => ['admin', 'moderator'].includes(state.user?.role)
    },

    actions: {
        async fetchSession() {
            this.loading = true
            this.error = null

            try {
                // Initialize auth manager and check for existing session
                await authManager.init()

                // If auth manager found a valid session, fetch user data
                if (authManager.isAuthenticated()) {
                    const user = await authManager.getCurrentUser()
                    this.user = user
                } else {
                    this.user = null
                }
            } catch (error) {
                this.user = null
                this.error = error.message || 'Session check failed'
                console.error('Session fetch failed:', error)

                // If session is invalid, clear everything
                authManager.clearTokens()
            } finally {
                this.loading = false
            }
        },

        async login(email, password, rememberMe = false) {
            this.loading = true
            this.error = null

            try {
                const response = await authManager.login(email, password, rememberMe)
                this.user = response.data.user
                return response
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        async register(name, email, password, role = 'student') {
            this.loading = true
            this.error = null

            try {
                const response = await authManager.register(name, email, password, role)
                this.user = response.data.user
                return response
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        async logout() {
            try {
                await authManager.logout()
            } catch (error) {
                console.error('Logout error:', error)
            } finally {
                this.user = null
                this.error = null
            }
        },

        async logoutAllSessions() {
            try {
                await authManager.logoutAllSessions()
            } catch (error) {
                console.error('Logout all sessions error:', error)
            } finally {
                this.user = null
                this.error = null
            }
        },

        setUser(user) {
            this.user = user
        },

        clearUser() {
            this.user = null
            this.error = null
            authManager.clearTokens()
        },

        clearError() {
            this.error = null
        }
    }
})
