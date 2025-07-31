import { useUserStore } from '~/stores/user'

export default defineNuxtPlugin(async (nuxtApp) => {
    const userStore = useUserStore(nuxtApp.$pinia)
    if (!userStore.user && !userStore.loading) {
        await userStore.fetchSession()
    }
})