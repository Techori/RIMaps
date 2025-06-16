const BaseController = require('./BaseController');
const { ApiError } = require('../middlewares/errorHandler');
const ResponseNormalizer = require('../utils/ResponseNormalizer');

class MapLocationController extends BaseController {
    constructor(config) {
        super(config);
    }

    async getLocation(req, res, next) {
        try {
            const { query, provider = 'osm' } = req.query;
            const validatedProvider = this.validateProvider(provider, req.client);

            // Check cache first
            const cacheParams = { query, provider: validatedProvider };
            const isCached = await this.handleCachedResponse(req, res, 'location', cacheParams, validatedProvider);
            if (isCached) {
                return;
            }

            const service = this.serviceFactory.getService(validatedProvider);
            const result = await service.geocode(query);

            // Cache the result
            await this.setCachedData('location', cacheParams, result);

            this.sendResponse(res, result, validatedProvider);
        } catch (error) {
            this.handleServiceError(error);
            this.sendErrorResponse(res, error, req.query.provider);
        }
    }

    async selectLocation(req, res, next) {
        try {
            const { lat, lng, provider = 'osm' } = req.body;
            const validatedProvider = this.validateProvider(provider, req.client);

            // Check cache first
            const cacheParams = { lat, lng, provider: validatedProvider };
            const isCached = await this.handleCachedResponse(req, res, 'select-location', cacheParams, validatedProvider);
            if (isCached) {
                return;
            }

            const service = this.serviceFactory.getService(validatedProvider);
            const result = await service.reverseGeocode(lat, lng);

            // Cache the result
            await this.setCachedData('select-location', cacheParams, result);

            this.sendResponse(res, result, validatedProvider);
        } catch (error) {
            this.handleServiceError(error);
            this.sendErrorResponse(res, error, req.body.provider);
        }
    }

    async searchNearby(req, res, next) {
        try {
            const { lat, lng, radius, type, provider } = req.query;

            if (!lat || !lng) {
                throw new ApiError(400, 'Latitude and longitude are required');
            }

            // Validate coordinates
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            const searchRadius = parseFloat(radius) || 1000; // Default 1km radius

            if (isNaN(latitude) || isNaN(longitude)) {
                throw new ApiError(400, 'Invalid coordinates');
            }

            if (latitude < -90 || latitude > 90) {
                throw new ApiError(400, 'Latitude must be between -90 and 90');
            }

            if (longitude < -180 || longitude > 180) {
                throw new ApiError(400, 'Longitude must be between -180 and 180');
            }

            // Validate and get provider
            const validatedProvider = this.validateProvider(provider, req.client);

            // Check cache first
            const cacheParams = { 
                lat: latitude, 
                lng: longitude, 
                radius: searchRadius, 
                type, 
                provider: validatedProvider 
            };
            const isCached = await this.handleCachedResponse(req, res, 'nearby', cacheParams, validatedProvider);
            if (isCached) {
                return;
            }

            // Get nearby places result
            const result = await this.serviceFactory.searchNearby(
                latitude,
                longitude,
                searchRadius,
                type,
                validatedProvider
            );

            // Normalize the response
            const normalizedResult = ResponseNormalizer.normalizeNearbyResponse(result, validatedProvider);

            // Cache the result
            await this.setCachedData('nearby', cacheParams, normalizedResult);

            // Log the request
            await this.logRequest(req, normalizedResult, validatedProvider);

            // Send normalized response
            this.sendResponse(res, normalizedResult, validatedProvider);
        } catch (error) {
            this.handleServiceError(error);
            this.sendErrorResponse(res, error, req.query.provider);
        }
    }
}

module.exports = MapLocationController; 