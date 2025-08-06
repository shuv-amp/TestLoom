/**
 * Security middleware for enhanced security headers and CSRF protection
 */
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Configure security headers using Helmet
 */
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false, // Disable for compatibility
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    }
});

/**
 * Rate limiting configuration
 */
const createRateLimit = (windowMs, max, message) => rateLimit({
    windowMs,
    max,
    message: {
        success: false,
        message: message || 'Too many requests, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: message || 'Too many requests, please try again later.',
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }
});

/**
 * General rate limit - 100 requests per 15 minutes
 */
const generalRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100,
    'Too many requests from this IP, please try again later.'
);

/**
 * Auth rate limit - 5 login attempts per 15 minutes
 */
const authRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5,
    'Too many authentication attempts, please try again after 15 minutes.'
);

/**
 * Password reset rate limit - 3 attempts per hour
 */
const passwordResetRateLimit = createRateLimit(
    60 * 60 * 1000, // 1 hour
    3,
    'Too many password reset attempts, please try again after 1 hour.'
);

/**
 * File upload rate limit - 10 uploads per hour
 */
const uploadRateLimit = createRateLimit(
    60 * 60 * 1000, // 1 hour
    10,
    'Too many file uploads, please try again after 1 hour.'
);

/**
 * Simple CSRF protection middleware
 * Uses double submit cookie pattern
 */
const csrfProtection = (req, res, next) => {
    // Skip CSRF for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Skip CSRF for API endpoints that use JWT (stateless)
    if (req.path.startsWith('/api/')) {
        return next();
    }

    const token = req.headers['x-csrf-token'];
    const cookie = req.cookies['csrf-token'];

    if (!token || !cookie || token !== cookie) {
        return res.status(403).json({
            success: false,
            message: 'Invalid CSRF token',
            code: 'CSRF_TOKEN_INVALID'
        });
    }

    next();
};

/**
 * IP whitelist middleware (for admin endpoints)
 */
const ipWhitelist = (allowedIPs = []) => {
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress;

        // Allow localhost in development
        if (process.env.NODE_ENV === 'development' &&
            (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1')) {
            return next();
        }

        if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied from this IP address',
                code: 'IP_NOT_ALLOWED'
            });
        }

        next();
    };
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        };

        // Log suspicious activity
        if (res.statusCode >= 400) {
            console.warn('HTTP Error:', logData);
        } else if (process.env.NODE_ENV === 'development') {
            console.log('HTTP Request:', logData);
        }
    });

    next();
};

module.exports = {
    securityHeaders,
    generalRateLimit,
    authRateLimit,
    passwordResetRateLimit,
    uploadRateLimit,
    csrfProtection,
    ipWhitelist,
    requestLogger
};
