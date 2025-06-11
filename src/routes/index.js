const express = require('express');
const router = express.Router();

// Import route modules
const geocodeRoutes = require('./geocode');
const reverseGeocodeRoutes = require('./reverseGeocode');
const directionsRoutes = require('./directions');
const clientRoutes = require('./clients');

// Mount routes
router.use('/geocode', geocodeRoutes);
router.use('/reverse-geocode', reverseGeocodeRoutes);
router.use('/directions', directionsRoutes);
router.use('/clients', clientRoutes);

module.exports = router; 