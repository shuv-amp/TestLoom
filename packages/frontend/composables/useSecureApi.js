import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import authManager from '~/utils/auth'

/**
 * Composable for handling secure API requests with automatic error handling
 */
export const useSecureApi = () => {
    const router = useRouter()
    const userStore = useUserStore()
    const loading = ref(false)
    const error = ref(null)

    /**
     * Make a secure API request with automatic token refresh and error handling
     */
    const secureRequest = async (url, options = {}) => {
        loading.value = true
        error.value = null

        try {
            const response = await authManager.authenticatedFetch(url, options)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`)
            }

            return data

        } catch (err) {
            console.error('API Error:', err)
            error.value = err.message

            // Handle different types of errors
            if (err.message.includes('TOKEN_EXPIRED') || err.message.includes('401')) {
                // Token refresh should be handled automatically by authManager
                // If we reach here, refresh failed
                userStore.clearUser()
                router.push('/login')
            } else if (err.message.includes('403')) {
                // Forbidden - user doesn't have permission
                router.push('/dashboard')
            }

            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * GET request
     */
    const get = async (url, params = {}) => {
        const queryString = Object.keys(params).length
            ? '?' + new URLSearchParams(params).toString()
            : ''

        return secureRequest(`${url}${queryString}`, {
            method: 'GET'
        })
    }

    /**
     * POST request
     */
    const post = async (url, data = {}) => {
        return secureRequest(url, {
            method: 'POST',
            body: JSON.stringify(data)
        })
    }

    /**
     * PUT request
     */
    const put = async (url, data = {}) => {
        return secureRequest(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    }

    /**
     * DELETE request
     */
    const del = async (url) => {
        return secureRequest(url, {
            method: 'DELETE'
        })
    }

    /**
     * Upload file
     */
    const upload = async (url, formData) => {
        return authManager.authenticatedFetch(url, {
            method: 'POST',
            body: formData
            // Don't set Content-Type for FormData, let browser set it with boundary
        })
    }

    /**
     * Clear error
     */
    const clearError = () => {
        error.value = null
    }

    return {
        loading: readonly(loading),
        error: readonly(error),
        secureRequest,
        get,
        post,
        put,
        delete: del,
        upload,
        clearError
    }
}
