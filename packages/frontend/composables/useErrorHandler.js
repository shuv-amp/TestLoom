import { ref } from 'vue'

/**
 * Composable for handling different types of errors with user-friendly messages
 */
export const useErrorHandler = () => {
    const error = ref(null)
    const isVisible = ref(false)

    const errorMessages = {
        // Authentication errors
        'TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
        'INVALID_TOKEN': 'Invalid authentication token. Please log in again.',
        'USER_NOT_FOUND': 'User account not found. Please contact support.',
        'USER_DEACTIVATED': 'Your account has been deactivated. Please contact support.',
        'NO_TOKEN': 'Authentication required. Please log in.',

        // Login/Registration errors
        'INVALID_CREDENTIALS': 'Invalid email or password. Please try again.',
        'USER_EXISTS': 'An account with this email already exists.',
        'VALIDATION_ERROR': 'Please check your input and try again.',
        'WEAK_PASSWORD': 'Password must be at least 6 characters long.',

        // Rate limiting errors
        'RATE_LIMIT_EXCEEDED': 'Too many attempts. Please try again later.',
        'TOO_MANY_REQUESTS': 'Too many requests. Please slow down.',

        // Network errors
        'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
        'SERVER_ERROR': 'Server error occurred. Please try again later.',
        'TIMEOUT_ERROR': 'Request timed out. Please try again.',

        // File upload errors
        'FILE_TOO_LARGE': 'File is too large. Maximum size is 10MB.',
        'INVALID_FILE_TYPE': 'Invalid file type. Please upload a supported format.',
        'UPLOAD_FAILED': 'File upload failed. Please try again.',

        // Generic errors
        'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.',
        'PERMISSION_DENIED': 'You do not have permission to perform this action.',
        'RESOURCE_NOT_FOUND': 'The requested resource was not found.',
    }

    /**
     * Set an error with automatic message mapping
     */
    const setError = (errorMessage, autoHide = true) => {
        // Extract error code if it exists
        const errorCode = extractErrorCode(errorMessage)

        error.value = {
            code: errorCode,
            message: errorMessages[errorCode] || errorMessage || errorMessages.UNKNOWN_ERROR,
            originalMessage: errorMessage
        }

        isVisible.value = true

        // Auto-hide after 5 seconds unless it's a critical error
        if (autoHide && !isCriticalError(errorCode)) {
            setTimeout(clearError, 5000)
        }
    }

    /**
     * Extract error code from various error formats
     */
    const extractErrorCode = (errorMessage) => {
        if (typeof errorMessage === 'object' && errorMessage?.code) {
            return errorMessage.code
        }

        if (typeof errorMessage === 'string') {
            // Check for HTTP status codes
            if (errorMessage.includes('401')) return 'TOKEN_EXPIRED'
            if (errorMessage.includes('403')) return 'PERMISSION_DENIED'
            if (errorMessage.includes('404')) return 'RESOURCE_NOT_FOUND'
            if (errorMessage.includes('429')) return 'RATE_LIMIT_EXCEEDED'
            if (errorMessage.includes('500')) return 'SERVER_ERROR'

            // Check for specific error messages
            if (errorMessage.toLowerCase().includes('token expired')) return 'TOKEN_EXPIRED'
            if (errorMessage.toLowerCase().includes('invalid token')) return 'INVALID_TOKEN'
            if (errorMessage.toLowerCase().includes('network')) return 'NETWORK_ERROR'
            if (errorMessage.toLowerCase().includes('timeout')) return 'TIMEOUT_ERROR'
            if (errorMessage.toLowerCase().includes('rate limit')) return 'RATE_LIMIT_EXCEEDED'
            if (errorMessage.toLowerCase().includes('password')) return 'WEAK_PASSWORD'
            if (errorMessage.toLowerCase().includes('email')) return 'VALIDATION_ERROR'

            return 'UNKNOWN_ERROR'
        }

        return 'UNKNOWN_ERROR'
    }

    /**
     * Check if error is critical (shouldn't auto-hide)
     */
    const isCriticalError = (errorCode) => {
        const criticalErrors = [
            'TOKEN_EXPIRED',
            'USER_DEACTIVATED',
            'USER_NOT_FOUND',
            'PERMISSION_DENIED',
            'SERVER_ERROR'
        ]
        return criticalErrors.includes(errorCode)
    }

    /**
     * Clear the current error
     */
    const clearError = () => {
        error.value = null
        isVisible.value = false
    }

    /**
     * Handle API errors with context
     */
    const handleApiError = (err, context = '') => {
        console.error(`API Error${context ? ` (${context})` : ''}:`, err)

        let errorMessage = 'UNKNOWN_ERROR'

        if (err.response) {
            // HTTP error response
            const data = err.response.data
            errorMessage = data?.code || data?.message || `HTTP ${err.response.status}`
        } else if (err.request) {
            // Network error
            errorMessage = 'NETWORK_ERROR'
        } else if (err.message) {
            // JavaScript error
            errorMessage = err.message
        }

        setError(errorMessage)
    }

    /**
     * Handle validation errors
     */
    const handleValidationErrors = (errors) => {
        if (Array.isArray(errors) && errors.length > 0) {
            setError(errors[0]) // Show first validation error
        } else {
            setError('VALIDATION_ERROR')
        }
    }

    /**
     * Get error type for styling
     */
    const getErrorType = () => {
        if (!error.value) return 'info'

        const errorCode = error.value.code

        if (['TOKEN_EXPIRED', 'USER_DEACTIVATED', 'PERMISSION_DENIED'].includes(errorCode)) {
            return 'error'
        }

        if (['RATE_LIMIT_EXCEEDED', 'VALIDATION_ERROR'].includes(errorCode)) {
            return 'warning'
        }

        if (['NETWORK_ERROR', 'SERVER_ERROR'].includes(errorCode)) {
            return 'error'
        }

        return 'info'
    }

    return {
        error: readonly(error),
        isVisible: readonly(isVisible),
        setError,
        clearError,
        handleApiError,
        handleValidationErrors,
        getErrorType
    }
}
