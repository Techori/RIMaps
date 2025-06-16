const express = require('express');
const router = express.Router();
const MapLocationController = require('../controllers/MapLocationController');
const rateLimiter = require('../utils/RateLimiter');
const Validators = require('../utils/Validators');

// Initialize controller with configuration
const mapLocationController = new MapLocationController({
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
const locationLimiter = rateLimiter.createLimiter('location');

/**
 * @route   GET /location
 * @desc    Get location details for a query
 * @access  Private
 */
router.get('/location',
    locationLimiter,
    Validators.validate(Validators.location.getLocation),
    (req, res, next) => mapLocationController.getLocation(req, res, next)
);

/**
 * @route   POST /select-location
 * @desc    Select a location from map coordinates
 * @access  Private
 */
router.post('/select-location',
    locationLimiter,
    Validators.validate(Validators.location.selectLocation),
    (req, res, next) => mapLocationController.selectLocation(req, res, next)
);

/**
 * @route   GET /nearby
 * @desc    Search for places near a location
 * @access  Private
 */
router.get('/nearby',
    locationLimiter,
    Validators.validate(Validators.location.searchNearby),
    (req, res, next) => mapLocationController.searchNearby(req, res, next)
);

module.exports = router; 