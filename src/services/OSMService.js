const axios = require('axios');
const BaseService = require('./BaseService');
const { ApiError } = require('../middlewares/errorHandler');

class OSMService extends BaseService {
    constructor(config) {
        super(config);
        this.baseUrl = config.baseUrl || 'https://nominatim.openstreetmap.org';
        this.axios = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'User-Agent': 'RiMaps API Service (https://github.com/yourusername/rimaps)',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 10000 // 10 second timeout
        });

        // Add rate limiting
        this.requestQueue = [];
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000; // 1 second between requests
    }

    async makeRequest(endpoint, params) {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
            await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
        }

        try {
            const response = await this.axios.get(endpoint, { params });
            this.lastRequestTime = Date.now();
            return response;
        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                if (error.response.status === 429) {
                    throw new ApiError(429, 'Rate limit exceeded. Please try again later.');
                }
                throw new ApiError(error.response.status, error.response.data.message || 'OpenStreetMap service error');
            } else if (error.request) {
                // The request was made but no response was received
                throw new ApiError(503, 'OpenStreetMap service is currently unavailable');
            } else {
                // Something happened in setting up the request that triggered an Error
                throw new ApiError(500, 'Error making request to OpenStreetMap service');
            }
        }
    }

    async geocode(address) {
        try {
            const response = await this.makeRequest('/search', {
                q: address,
                format: 'json',
                addressdetails: 1,
                limit: 1
            });

            if (!response.data || response.data.length === 0) {
                throw new ApiError(404, 'No results found for the given address');
            }

            const result = response.data[0];
            return this.normalizeResponse({
                address: result.display_name,
                location: {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon)
                },
                placeId: result.place_id,
                types: result.type,
                addressDetails: result.address
            }, 'osm');
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Error geocoding address with OpenStreetMap');
        }
    }

    async reverseGeocode(lat, lng) {
        try {
            const response = await this.makeRequest('/reverse', {
                lat,
                lon: lng,
                format: 'json',
                addressdetails: 1
            });

            if (!response.data) {
                throw new ApiError(404, 'No results found for the given coordinates');
            }

            return this.normalizeResponse({
                address: response.data.display_name,
                location: {
                    lat: parseFloat(response.data.lat),
                    lng: parseFloat(response.data.lon)
                },
                placeId: response.data.place_id,
                types: response.data.type,
                addressDetails: response.data.address
            }, 'osm');
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Error reverse geocoding coordinates with OpenStreetMap');
        }
    }

    async getDirections(origin, destination, mode = 'driving') {
        try {
            // First, geocode the origin and destination
            const [originResult, destResult] = await Promise.all([
                this.geocode(origin),
                this.geocode(destination)
            ]);

            const response = await this.makeRequest(
                `https://router.project-osrm.org/route/v1/${mode}/${originResult.location.lng},${originResult.location.lat};${destResult.location.lng},${destResult.location.lat}`,
                {
                    overview: 'full',
                    steps: true
                }
            );

            if (!response.data.routes || response.data.routes.length === 0) {
                throw new ApiError(404, 'No route found between the given locations');
            }

            const route = response.data.routes[0];
            return this.normalizeResponse({
                distance: {
                    text: `${(route.distance / 1000).toFixed(1)} km`,
                    value: route.distance
                },
                duration: {
                    text: `${Math.round(route.duration / 60)} min`,
                    value: route.duration
                },
                steps: route.legs[0].steps.map(step => ({
                    instruction: step.maneuver.instruction,
                    distance: {
                        text: `${(step.distance / 1000).toFixed(1)} km`,
                        value: step.distance
                    },
                    duration: {
                        text: `${Math.round(step.duration / 60)} min`,
                        value: step.duration
                    },
                    polyline: step.geometry
                })),
                polyline: route.geometry
            }, 'osm');
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Error getting directions with OpenStreetMap');
        }
    }
}

module.exports = OSMService; 