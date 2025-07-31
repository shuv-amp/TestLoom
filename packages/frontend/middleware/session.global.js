import { useNuxtApp } from '#app'
import { useUserStore } from '~/stores/user'

export default defineNuxtRouteMiddleware(async (to, from) => {
    const nuxtApp = useNuxtApp()
    const userStore = useUserStore(nuxtApp.$pinia)
    if (!userStore.user && !userStore.loading) {
        await userStore.fetchSession()
    }
})
