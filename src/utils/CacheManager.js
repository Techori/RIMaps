const NodeCache = require('node-cache');

class CacheManager {
    constructor() {
        // Initialize cache with default TTL of 1 hour
        this.cache = new NodeCache({
            stdTTL: 3600, // 1 hour in seconds
            checkperiod: 600, // Check for expired keys every 10 minutes
            useClones: false // Store references instead of cloning objects
        });

        // Different TTLs for different types of data
        this.ttl = {
            geocode: 86400, // 24 hours
            reverseGeocode: 86400, // 24 hours
            directions: 3600, // 1 hour
            modes: 86400 // 24 hours
        };
    }

    // Generate cache key based on request parameters
    generateKey(type, params) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc, key) => {
                acc[key] = params[key];
                return acc;
            }, {});

        return `${type}:${JSON.stringify(sortedParams)}`;
    }

    // Get cached data
    get(type, params) {
        const key = this.generateKey(type, params);
        return this.cache.get(key);
    }

    // Set data in cache
    set(type, params, data) {
        const key = this.generateKey(type, params);
        const ttl = this.ttl[type] || this.cache.options.stdTTL;
        return this.cache.set(key, data, ttl);
    }

    // Delete cached data
    del(type, params) {
        const key = this.generateKey(type, params);
        return this.cache.del(key);
    }

    // Clear all cached data
    clear() {
        return this.cache.flushAll();
    }

    // Get cache statistics
    getStats() {
        return this.cache.getStats();
    }

    // Check if cache is enabled
    isEnabled() {
        return process.env.ENABLE_CACHE === 'true';
    }
}

// Export singleton instance
module.exports = new CacheManager(); 