const BaseController = require('./BaseController');
const { ApiError } = require('../middlewares/errorHandler');
const ResponseNormalizer = require('../utils/ResponseNormalizer');

class GeocodeController extends BaseController {
    async geocode(req, res, next) {
        try {
            const { address, provider } = req.query;

            if (!address) {
                throw new ApiError(400, 'Address is required');
            }

            // Validate and get provider
            const validatedProvider = this.validateProvider(provider, req.client);

            // Check cache first
            const cacheParams = { address, provider: validatedProvider };
            const isCached = await this.handleCachedResponse(req, res, 'geocode', cacheParams, validatedProvider);
            if (isCached) {
                return;
            }

            // Get geocoding result
            const result = await this.serviceFactory.geocode(address, validatedProvider);

            // Normalize the response
            const normalizedResult = ResponseNormalizer.normalizeGeocodeResponse(result, validatedProvider);

            // Cache the result
            await this.setCachedData('geocode', cacheParams, normalizedResult);

            // Log the request
            await this.logRequest(req, normalizedResult, validatedProvider);

            // Send normalized response
            this.sendResponse(res, normalizedResult, validatedProvider);
        } catch (error) {
            this.handleServiceError(error);
            this.sendErrorResponse(res, error, req.query.provider);
        }
    }

    async reverseGeocode(req, res, next) {
        try {
            const { lat, lng, provider } = req.query;

            if (!lat || !lng) {
                throw new ApiError(400, 'Latitude and longitude are required');
            }

            // Validate coordinates
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);

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
            const cacheParams = { lat: latitude, lng: longitude, provider: validatedProvider };
            const isCached = await this.handleCachedResponse(req, res, 'reverseGeocode', cacheParams, validatedProvider);
            if (isCached) {
                return;
            }

            // Get reverse geocoding result
            const result = await this.serviceFactory.reverseGeocode(latitude, longitude, validatedProvider);

            // Normalize the response
            const normalizedResult = ResponseNormalizer.normalizeGeocodeResponse(result, validatedProvider);

            // Cache the result
            await this.setCachedData('reverseGeocode', cacheParams, normalizedResult);

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

module.exports = GeocodeController; 