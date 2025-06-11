const GoogleService = require('./GoogleService');
const MapboxService = require('./MapboxService');
const OSMService = require('./OSMService');

class ServiceFactory {
    constructor(config) {
        this.config = config;
        this.services = new Map();
        this.initializeServices();
    }

    initializeServices() {
        // Initialize Google Maps service
        if (this.config.google?.apiKey) {
            this.services.set('google', new GoogleService({
                apiKey: this.config.google.apiKey
            }));
        }

        // Initialize Mapbox service
        if (this.config.mapbox?.accessToken) {
            this.services.set('mapbox', new MapboxService({
                accessToken: this.config.mapbox.accessToken
            }));
        }

        // Initialize OSM service
        this.services.set('osm', new OSMService({
            baseUrl: this.config.osm?.baseUrl
        }));
    }

    getService(provider) {
        const service = this.services.get(provider);
        if (!service) {
            throw new Error(`Provider '${provider}' is not available`);
        }
        return service;
    }

    getAvailableProviders() {
        return Array.from(this.services.keys());
    }

    async geocode(address, provider = 'google') {
        return this.getService(provider).geocode(address);
    }

    async reverseGeocode(lat, lng, provider = 'google') {
        return this.getService(provider).reverseGeocode(lat, lng);
    }

    async getDirections(origin, destination, mode = 'driving', provider = 'google') {
        return this.getService(provider).getDirections(origin, destination, mode);
    }
}

module.exports = ServiceFactory; 