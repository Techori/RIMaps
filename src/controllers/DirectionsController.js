const BaseController = require('./BaseController');
const { ApiError } = require('../middlewares/errorHandler');
const ResponseNormalizer = require('../utils/ResponseNormalizer');

class DirectionsController extends BaseController {
    async getDirections(req, res, next) {
        try {
            const { origin, destination, mode, provider } = req.query;

            // Validate required parameters
            if (!origin || !destination) {
                throw new ApiError(400, 'Origin and destination are required');
            }

            // Validate travel mode
            const validModes = ['driving', 'walking', 'bicycling', 'transit'];
            const travelMode = mode?.toLowerCase() || 'driving';
            
            if (!validModes.includes(travelMode)) {
                throw new ApiError(400, `Invalid travel mode. Must be one of: ${validModes.join(', ')}`);
            }

            // Validate and get provider
            const validatedProvider = this.validateProvider(provider, req.client);

            // Check cache first
            const cacheParams = { origin, destination, mode: travelMode, provider: validatedProvider };
            const isCached = await this.handleCachedResponse(req, res, 'directions', cacheParams, validatedProvider);
            if (isCached) {
                return;
            }

            // Get directions result
            const result = await this.serviceFactory.getDirections(
                origin,
                destination,
                travelMode,
                validatedProvider
            );

            // Normalize the response
            const normalizedResult = ResponseNormalizer.normalizeDirectionsResponse(result, validatedProvider);

            // Cache the result
            await this.setCachedData('directions', cacheParams, normalizedResult);

            // Log the request
            await this.logRequest(req, normalizedResult, validatedProvider);

            // Send normalized response
            this.sendResponse(res, normalizedResult, validatedProvider);
        } catch (error) {
            this.handleServiceError(error);
            this.sendErrorResponse(res, error, req.query.provider);
        }
    }

    async getAvailableModes(req, res, next) {
        try {
            const { provider } = req.query;
            const validatedProvider = this.validateProvider(provider, req.client);

            // Check cache first
            const cacheParams = { provider: validatedProvider };
            const isCached = await this.handleCachedResponse(req, res, 'modes', cacheParams, validatedProvider);
            if (isCached) {
                return;
            }

            // Different providers support different modes
            const modes = {
                google: ['driving', 'walking', 'bicycling', 'transit'],
                mapbox: ['driving', 'walking', 'cycling'],
                osm: ['driving', 'walking', 'cycling']
            };

            const data = {
                provider: validatedProvider,
                modes: modes[validatedProvider] || modes.google
            };

            // Cache the result
            await this.setCachedData('modes', cacheParams, data);

            this.sendResponse(res, data, validatedProvider);
        } catch (error) {
            this.handleServiceError(error);
            this.sendErrorResponse(res, error, req.query.provider);
        }
    }
}

module.exports = DirectionsController; 