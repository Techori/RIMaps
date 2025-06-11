const BaseService = require('./BaseService');

class GoogleService extends BaseService {
    constructor(config) {
        super(config);
        this.baseUrl = 'https://maps.googleapis.com/maps/api';
        this.apiKey = config.apiKey;
    }

    async geocode(address) {
        try {
            const response = await this.axios.get(`${this.baseUrl}/geocode/json`, {
                params: {
                    address,
                    key: this.apiKey
                }
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Geocoding failed: ${response.data.status}`);
            }

            const result = response.data.results[0];
            return this.normalizeResponse({
                address: result.formatted_address,
                location: {
                    lat: result.geometry.location.lat,
                    lng: result.geometry.location.lng
                },
                placeId: result.place_id,
                types: result.types
            }, 'google');
        } catch (error) {
            this.handleError(error);
        }
    }

    async reverseGeocode(lat, lng) {
        try {
            const response = await this.axios.get(`${this.baseUrl}/geocode/json`, {
                params: {
                    latlng: `${lat},${lng}`,
                    key: this.apiKey
                }
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Reverse geocoding failed: ${response.data.status}`);
            }

            const result = response.data.results[0];
            return this.normalizeResponse({
                address: result.formatted_address,
                location: {
                    lat: result.geometry.location.lat,
                    lng: result.geometry.location.lng
                },
                placeId: result.place_id,
                types: result.types
            }, 'google');
        } catch (error) {
            this.handleError(error);
        }
    }

    async getDirections(origin, destination, mode = 'driving') {
        try {
            const response = await this.axios.get(`${this.baseUrl}/directions/json`, {
                params: {
                    origin,
                    destination,
                    mode,
                    key: this.apiKey
                }
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Directions failed: ${response.data.status}`);
            }

            const route = response.data.routes[0];
            const leg = route.legs[0];

            return this.normalizeResponse({
                distance: {
                    text: leg.distance.text,
                    value: leg.distance.value
                },
                duration: {
                    text: leg.duration.text,
                    value: leg.duration.value
                },
                steps: leg.steps.map(step => ({
                    instruction: step.html_instructions,
                    distance: step.distance,
                    duration: step.duration,
                    polyline: step.polyline.points
                })),
                polyline: route.overview_polyline.points
            }, 'google');
        } catch (error) {
            this.handleError(error);
        }
    }
}

module.exports = GoogleService; 