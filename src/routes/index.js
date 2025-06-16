const express = require('express');
const router = express.Router();
const authenticateApiKey = require('../middlewares/auth');

// Import route modules
const geocodeRoutes = require('./geocode');
const reverseGeocodeRoutes = require('./reverseGeocode');
const directionsRoutes = require('./directions');
const clientRoutes = require('./clients');
const mapLocationRoutes = require('./mapLocation');
const tilesRoutes = require('./tiles');

// Mount routes with authentication
router.use('/geocode', authenticateApiKey, geocodeRoutes);
router.use('/reverse-geocode', authenticateApiKey, reverseGeocodeRoutes);
router.use('/directions', authenticateApiKey, directionsRoutes);
router.use('/map', authenticateApiKey, mapLocationRoutes);
router.use('/tiles', tilesRoutes); // Remove authentication for tile routes
router.use('/clients', clientRoutes); // Client routes handle their own authentication

module.exports = router; 