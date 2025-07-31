import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
    state: () => ({
        user: null,
        loading: false,
        error: null
    }),
    actions: {
        async fetchSession() {
            this.loading = true
            this.error = null
            try {
                const response = await $fetch('/api/auth/me', {
                    credentials: 'include'
                })
                this.user = response.data.user
            } catch (error) {
                this.user = null
                this.error = error.data?.message || error.message || 'Session check failed'
            } finally {
                this.loading = false
            }
        },
        setUser(user) {
            this.user = user
        },
        clearUser() {
            this.user = null
        }
    }
})
