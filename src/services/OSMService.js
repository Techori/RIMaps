const axios = require('axios');
const BaseService = require('./BaseService');

class OSMService extends BaseService {
    constructor(config) {
        super(config);
        this.baseUrl = config.baseUrl || 'https://nominatim.openstreetmap.org';
        this.axios = axios.create({
            ...this.axios.defaults,
            headers: {
                ...this.axios.defaults.headers,
                'User-Agent': 'RiMaps API Service' // Required by Nominatim
            }
        });
    }

    async geocode(address) {
        try {
            const response = await this.axios.get(`${this.baseUrl}/search`, {
                params: {
                    q: address,
                    format: 'json',
                    addressdetails: 1,
                    limit: 1
                }
            });

            if (!response.data || response.data.length === 0) {
                throw new Error('No results found');
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
            this.handleError(error);
        }
    }

    async reverseGeocode(lat, lng) {
        try {
            const response = await this.axios.get(`${this.baseUrl}/reverse`, {
                params: {
                    lat,
                    lon: lng,
                    format: 'json',
                    addressdetails: 1
                }
            });

            if (!response.data) {
                throw new Error('No results found');
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
            this.handleError(error);
        }
    }

    async getDirections(origin, destination, mode = 'driving') {
        // Note: OSM Nominatim doesn't provide directions
        // We'll use OSRM (Open Source Routing Machine) for this
        try {
            // First, geocode the origin and destination
            const [originResult, destResult] = await Promise.all([
                this.geocode(origin),
                this.geocode(destination)
            ]);

            const response = await this.axios.get(
                `https://router.project-osrm.org/route/v1/${mode}/${originResult.location.lng},${originResult.location.lat};${destResult.location.lng},${destResult.location.lat}`,
                {
                    params: {
                        overview: 'full',
                        steps: true
                    }
                }
            );

            if (!response.data.routes || response.data.routes.length === 0) {
                throw new Error('No route found');
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
            this.handleError(error);
        }
    }
}

module.exports = OSMService; 