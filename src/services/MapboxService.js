const BaseService = require('./BaseService');

class MapboxService extends BaseService {
    constructor(config) {
        super(config);
        this.baseUrl = 'https://api.mapbox.com';
        this.accessToken = config.accessToken;
    }

    async geocode(address) {
        try {
            const response = await this.axios.get(`${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`, {
                params: {
                    access_token: this.accessToken,
                    types: 'address,place,locality,neighborhood,postcode'
                }
            });

            if (!response.data.features || response.data.features.length === 0) {
                throw new Error('No results found');
            }

            const result = response.data.features[0];
            return this.normalizeResponse({
                address: result.place_name,
                location: {
                    lat: result.center[1],
                    lng: result.center[0]
                },
                placeId: result.id,
                types: result.place_type,
                relevance: result.relevance
            }, 'mapbox');
        } catch (error) {
            this.handleError(error);
        }
    }

    async reverseGeocode(lat, lng) {
        try {
            const response = await this.axios.get(`${this.baseUrl}/geocoding/v5/mapbox.places/${lng},${lat}.json`, {
                params: {
                    access_token: this.accessToken,
                    types: 'address,place,locality,neighborhood,postcode'
                }
            });

            if (!response.data.features || response.data.features.length === 0) {
                throw new Error('No results found');
            }

            const result = response.data.features[0];
            return this.normalizeResponse({
                address: result.place_name,
                location: {
                    lat: result.center[1],
                    lng: result.center[0]
                },
                placeId: result.id,
                types: result.place_type,
                relevance: result.relevance
            }, 'mapbox');
        } catch (error) {
            this.handleError(error);
        }
    }

    async getDirections(origin, destination, mode = 'driving') {
        try {
            // First, geocode the origin and destination
            const [originResult, destResult] = await Promise.all([
                this.geocode(origin),
                this.geocode(destination)
            ]);

            const response = await this.axios.get(
                `${this.baseUrl}/directions/v5/mapbox/${mode}/${originResult.location.lng},${originResult.location.lat};${destResult.location.lng},${destResult.location.lat}`,
                {
                    params: {
                        access_token: this.accessToken,
                        geometries: 'polyline',
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
            }, 'mapbox');
        } catch (error) {
            this.handleError(error);
        }
    }
}

module.exports = MapboxService; 