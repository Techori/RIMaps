const axios = require('axios');
const { ApiError } = require('../middlewares/errorHandler');

class BaseService {
    constructor(config) {
        this.config = config;
        this.axios = axios.create({
            timeout: 10000, // 10 seconds timeout
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }

    // Common error handler
    handleError(error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            throw new ApiError(
                error.response.status,
                `Provider API error: ${error.response.data.message || error.message}`
            );
        } else if (error.request) {
            // The request was made but no response was received
            throw new ApiError(503, 'Provider API is not responding');
        } else {
            // Something happened in setting up the request that triggered an Error
            throw new ApiError(500, `Provider API error: ${error.message}`);
        }
    }

    // Common response normalizer
    normalizeResponse(data, provider) {
        return {
            ...data,
            source: provider
        };
    }

    // Common geocoding method to be implemented by each provider
    async geocode(address) {
        throw new Error('Method not implemented');
    }

    // Common reverse geocoding method to be implemented by each provider
    async reverseGeocode(lat, lng) {
        throw new Error('Method not implemented');
    }

    // Common directions method to be implemented by each provider
    async getDirections(origin, destination, mode = 'driving') {
        throw new Error('Method not implemented');
    }
}

module.exports = BaseService; 