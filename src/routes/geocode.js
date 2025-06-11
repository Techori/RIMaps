const express = require('express');
const router = express.Router();
const GeocodeController = require('../controllers/GeocodeController');
const rateLimiter = require('../utils/RateLimiter');
const Validators = require('../utils/Validators');

// Initialize controller with configuration
const geocodeController = new GeocodeController({
    google: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY
    },
    mapbox: {
        accessToken: process.env.MAPBOX_ACCESS_TOKEN
    },
    osm: {
        // OpenStreetMap doesn't require an API key
    }
});

// Apply rate limiting middleware
const geocodeLimiter = rateLimiter.createLimiter('geocode');

/**
 * @route   GET /geocode
 * @desc    Convert address to coordinates
 * @access  Public
 */
router.get('/', 
    geocodeLimiter,
    Validators.validate(Validators.geocode.geocode),
    geocodeController.geocode.bind(geocodeController)
);

router.get('/reverse',
    geocodeLimiter,
    Validators.validate(Validators.geocode.reverseGeocode),
    geocodeController.reverseGeocode.bind(geocodeController)
);

module.exports = router; 