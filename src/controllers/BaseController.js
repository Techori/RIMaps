const { ApiError } = require('../middlewares/errorHandler');
const ServiceFactory = require('../services/ServiceFactory');
const ResponseNormalizer = require('../utils/ResponseNormalizer');
const cacheManager = require('../utils/CacheManager');

class BaseController {
    constructor(config) {
        this.serviceFactory = new ServiceFactory(config);
    }

    // Helper method to validate provider
    validateProvider(provider, client) {
        // If no provider specified, default to google
        const selectedProvider = provider || 'google';

        // If client exists and has allowed providers, validate against them
        if (client && client.allowedProviders && client.allowedProviders.length > 0) {
            if (!client.allowedProviders.includes(selectedProvider)) {
                throw new ApiError(403, `Provider '${selectedProvider}' is not allowed for your plan`);
            }
        }
        return selectedProvider;
    }

    // Helper method to handle service errors
    handleServiceError(error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, `Service error: ${error.message}`);
    }

    // Helper method to log request
    async logRequest(req, response, provider) {
        try {
            const RequestLog = require('../models/RequestLog');
            await RequestLog.create({
                clientId: req.client._id,
                endpoint: req.path,
                method: req.method,
                statusCode: response.status || 200,
                responseTime: Date.now() - req.startTime,
                requestBody: req.body,
                responseBody: response,
                provider,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });
        } catch (error) {
            console.error('Error logging request:', error);
        }
    }

    // Helper method to send normalized response
    sendResponse(res, data, provider) {
        res.json(ResponseNormalizer.normalizeSuccessResponse(data, provider));
    }

    // Helper method to send normalized error response
    sendErrorResponse(res, error, provider) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json(
            ResponseNormalizer.normalizeErrorResponse(error, provider)
        );
    }

    // Helper method to get cached data
    async getCachedData(type, params) {
        if (!cacheManager.isEnabled()) {
            return null;
        }
        return cacheManager.get(type, params);
    }

    // Helper method to set cached data
    async setCachedData(type, params, data) {
        if (!cacheManager.isEnabled()) {
            return;
        }
        cacheManager.set(type, params, data);
    }

    // Helper method to handle cached response
    async handleCachedResponse(req, res, type, params, provider) {
        const cachedData = await this.getCachedData(type, params);
        if (cachedData) {
            // Add cache hit header
            res.set('X-Cache', 'HIT');
            this.sendResponse(res, cachedData, provider);
            return true;
        }
        // Add cache miss header
        res.set('X-Cache', 'MISS');
        return false;
    }
}

module.exports = BaseController; 