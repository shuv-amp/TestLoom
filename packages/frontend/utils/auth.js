/**
 * Secure Authentication Utility
 * Handles token management, automatic refresh, and secure HTTP requests
 */

class AuthManager {
    constructor() {
        this.accessToken = null;
        this.refreshTimer = null;
        this.isRefreshing = false;
        this.failedQueue = [];
        this.initialized = false;
    }

    /**
     * Initialize the auth manager and check for existing session
     */
    async init() {
        if (this.initialized) return;

        // Try to refresh token to check if user has a valid session
        try {
            await this.checkExistingSession();
        } catch (error) {
            console.log('No existing session found');
        }

        this.initialized = true;
    }

    /**
     * Check for existing session by attempting token refresh
     */
    async checkExistingSession() {
        try {
            const response = await fetch('/api/auth/refresh-token', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.setAccessToken(data.data.accessToken, data.data.expiresIn);
                return true;
            }
        } catch (error) {
            console.log('Session check failed:', error);
        }
        return false;
    }    /**
     * Set access token and start refresh timer
     */
    setAccessToken(token, expiresIn = '15m') {
        this.accessToken = token;
        this.startTokenRefreshTimer(expiresIn);
    }

    /**
     * Get current access token
     */
    getAccessToken() {
        return this.accessToken;
    }

    /**
     * Clear access token and stop refresh timer
     */
    clearTokens() {
        this.accessToken = null;
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.accessToken;
    }

    /**
     * Parse expiry time from token expiration string
     */
    parseExpiryTime(expiresIn) {
        const match = expiresIn.match(/(\d+)([smhd])/);
        if (!match) return 15 * 60 * 1000; // Default 15 minutes

        const [, num, unit] = match;
        const multipliers = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000
        };

        return parseInt(num) * (multipliers[unit] || multipliers.m);
    }

    /**
     * Start automatic token refresh timer
     */
    startTokenRefreshTimer(expiresIn = '15m') {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        const expiryMs = this.parseExpiryTime(expiresIn);
        // Refresh 2 minutes before expiry, or at 80% of lifetime, whichever is shorter
        const refreshTime = Math.min(expiryMs - 2 * 60 * 1000, expiryMs * 0.8);

        this.refreshTimer = setTimeout(async () => {
            await this.refreshAccessToken();
        }, refreshTime);
    }

    /**
     * Refresh access token using the refresh token stored in secure cookie
     */
    async refreshAccessToken() {
        if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject });
            });
        }

        this.isRefreshing = true;

        try {
            const response = await fetch('/api/auth/refresh-token', {
                method: 'POST',
                credentials: 'include', // Include secure cookies
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.setAccessToken(data.data.accessToken, data.data.expiresIn);
                this.processQueue(null, data.data.accessToken);
                return data.data.accessToken;
            } else {
                throw new Error(data.message || 'Token refresh failed');
            }
        } catch (error) {
            this.clearTokens();
            this.processQueue(error, null);

            // Redirect to login page
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
            throw error;
        } finally {
            this.isRefreshing = false;
        }
    }

    /**
     * Process queued requests after token refresh
     */
    processQueue(error, token) {
        this.failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error);
            } else {
                resolve(token);
            }
        });

        this.failedQueue = [];
    }

    /**
     * Make authenticated HTTP request with automatic token refresh
     */
    async authenticatedFetch(url, options = {}) {
        const makeRequest = async (token) => {
            let headers = { ...options.headers };
            // Only set Content-Type for JSON requests
            if (!(options.body instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
            }
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
            return fetch(url, {
                ...options,
                headers,
                credentials: 'include'
            });
        };

        let response = await makeRequest(this.accessToken);

        // If token expired, try to refresh and retry
        if (response.status === 401) {
            const responseData = await response.json();

            if (responseData.code === 'TOKEN_EXPIRED') {
                try {
                    const newToken = await this.refreshAccessToken();
                    response = await makeRequest(newToken);
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    throw refreshError;
                }
            }
        }

        return response;
    }

    /**
     * Login user
     */
    async login(email, password, rememberMe = false) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password, rememberMe })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            this.setAccessToken(data.data.accessToken, data.data.expiresIn);
            return data;
        } else {
            throw new Error(data.message || 'Login failed');
        }
    }

    /**
     * Register user
     */
    async register(name, email, password, role = 'student') {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ name, email, password, role })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            this.setAccessToken(data.data.accessToken, data.data.expiresIn);
            return data;
        } else {
            throw new Error(data.message || 'Registration failed');
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            await this.authenticatedFetch('/api/auth/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout request failed:', error);
        } finally {
            this.clearTokens();

            // Redirect to login
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
    }

    /**
     * Logout from all sessions
     */
    async logoutAllSessions() {
        try {
            await this.authenticatedFetch('/api/auth/logout-all', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout all sessions request failed:', error);
        } finally {
            this.clearTokens();

            // Redirect to login
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
    }

    /**
     * Get current user information
     */
    async getCurrentUser() {
        const response = await this.authenticatedFetch('/api/auth/me');
        const data = await response.json();

        if (response.ok && data.success) {
            return data.data.user;
        } else {
            throw new Error(data.message || 'Failed to get user information');
        }
    }
}

// Create singleton instance
const authManager = new AuthManager();

export default authManager;

// Legacy support function for existing code
export function authFetch(url, options = {}) {
    return authManager.authenticatedFetch(url, options);
}
