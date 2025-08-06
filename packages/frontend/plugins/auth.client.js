import { useUserStore } from '~/stores/user'
import authManager from '~/utils/auth'

export default defineNuxtPlugin(async () => {
    // Initialize auth manager on client side
    if (process.client) {
        // Initialize auth manager and check for existing session
        await authManager.init()

        // If we have a token, initialize the user store
        if (authManager.isAuthenticated()) {
            const userStore = useUserStore()
            if (!userStore.user) {
                try {
                    await userStore.fetchSession()
                } catch (error) {
                    console.error('Failed to initialize user session:', error)
                }
            }
        }
    }
})