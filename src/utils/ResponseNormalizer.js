class ResponseNormalizer {
    static normalizeGeocodeResponse(data, provider) {
        const normalized = {
            address: '',
            location: {
                lat: 0,
                lng: 0
            },
            placeId: '',
            types: [],
            source: provider,
            raw: data // Keep original data for reference
        };

        switch (provider) {
            case 'google':
                normalized.address = data.formatted_address;
                normalized.location = {
                    lat: data.geometry.location.lat,
                    lng: data.geometry.location.lng
                };
                normalized.placeId = data.place_id;
                normalized.types = data.types;
                break;

            case 'mapbox':
                normalized.address = data.place_name;
                normalized.location = {
                    lat: data.center[1],
                    lng: data.center[0]
                };
                normalized.placeId = data.id;
                normalized.types = data.place_type;
                break;

            case 'osm':
                normalized.address = data.display_name;
                normalized.location = {
                    lat: data.lat,
                    lng: data.lon
                };
                normalized.placeId = data.place_id;
                normalized.types = [data.type];
                break;

            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }

        return normalized;
    }

    static normalizeDirectionsResponse(data, provider) {
        const normalized = {
            distance: {
                text: '',
                value: 0
            },
            duration: {
                text: '',
                value: 0
            },
            steps: [],
            polyline: '',
            source: provider,
            raw: data // Keep original data for reference
        };

        switch (provider) {
            case 'google':
                normalized.distance = {
                    text: data.distance.text,
                    value: data.distance.value
                };
                normalized.duration = {
                    text: data.duration.text,
                    value: data.duration.value
                };
                normalized.steps = data.steps.map(step => ({
                    instruction: step.instruction,
                    distance: {
                        text: step.distance.text,
                        value: step.distance.value
                    },
                    duration: {
                        text: step.duration.text,
                        value: step.duration.value
                    },
                    polyline: step.polyline
                }));
                normalized.polyline = data.polyline;
                break;

            case 'mapbox':
            case 'osm':
                normalized.distance = {
                    text: data.distance.text,
                    value: data.distance.value
                };
                normalized.duration = {
                    text: data.duration.text,
                    value: data.duration.value
                };
                normalized.steps = data.steps.map(step => ({
                    instruction: step.instruction,
                    distance: {
                        text: step.distance.text,
                        value: step.distance.value
                    },
                    duration: {
                        text: step.duration.text,
                        value: step.duration.value
                    },
                    polyline: step.polyline
                }));
                normalized.polyline = data.polyline;
                break;

            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }

        return normalized;
    }

    static normalizeErrorResponse(error, provider) {
        return {
            status: 'error',
            message: error.message,
            provider,
            code: error.code || 500,
            details: error.details || null
        };
    }

    static normalizeSuccessResponse(data, provider) {
        return {
            status: 'success',
            data,
            provider,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = ResponseNormalizer; 