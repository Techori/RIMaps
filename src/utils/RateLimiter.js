const rateLimit = require('express-rate-limit');
const { ApiError } = require('../middlewares/errorHandler');

class RateLimiter {
    constructor() {
        this.limits = {
            default: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100, // Limit each IP to 100 requests per windowMs
                message: 'Too many requests from this IP, please try again later.'
            },
            geocode: {
                windowMs: 60 * 60 * 1000, // 1 hour
                max: 1000, // Limit each IP to 1000 requests per windowMs
                message: 'Geocoding rate limit exceeded. Please try again later.'
            },
            directions: {
                windowMs: 60 * 60 * 1000, // 1 hour
                max: 500, // Limit each IP to 500 requests per windowMs
                message: 'Directions rate limit exceeded. Please try again later.'
            },
            strict: {
                windowMs: 60 * 60 * 1000, // 1 hour
                max: 50, // Limit each IP to 50 requests per windowMs
                message: 'Rate limit exceeded. Please try again later.'
            }
        };
    }

    // Create a rate limiter with custom options
    createLimiter(type = 'default', options = {}) {
        const baseLimit = this.limits[type] || this.limits.default;
        const limitOptions = {
            ...baseLimit,
            ...options,
            handler: (req, res) => {
                const error = new ApiError(429, baseLimit.message);
                res.status(429).json({
                    status: 'error',
                    message: error.message,
                    code: error.code,
                    timestamp: new Date().toISOString()
                });
            },
            standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
            legacyHeaders: false, // Disable the `X-RateLimit-*` headers
            keyGenerator: (req) => {
                // Use client ID if available, otherwise use IP
                return req.client ? req.client._id.toString() : req.ip;
            }
        };

        return rateLimit(limitOptions);
    }

    // Get rate limit for a specific type
    getLimit(type = 'default') {
        return this.limits[type] || this.limits.default;
    }

    // Update rate limit for a specific type
    updateLimit(type, options) {
        if (this.limits[type]) {
            this.limits[type] = {
                ...this.limits[type],
                ...options
            };
        }
    }

    // Add a new rate limit type
    addLimitType(type, options) {
        this.limits[type] = {
            ...this.limits.default,
            ...options
        };
    }
}

// Export a singleton instance
module.exports = new RateLimiter(); 