const express = require('express');
const router = express.Router();
const DirectionsController = require('../controllers/DirectionsController');
const rateLimiter = require('../utils/RateLimiter');
const Validators = require('../utils/Validators');

// Initialize controller with configuration
const directionsController = new DirectionsController({
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
const directionsLimiter = rateLimiter.createLimiter('directions');

/**
 * @route   GET /directions
 * @desc    Get directions between two points
 * @access  Public
 */
router.get('/',
    directionsLimiter,
    Validators.validate(Validators.directions.getDirections),
    directionsController.getDirections.bind(directionsController)
);

router.get('/modes',
    directionsLimiter,
    Validators.validate(Validators.directions.getAvailableModes),
    directionsController.getAvailableModes.bind(directionsController)
);

module.exports = router; 