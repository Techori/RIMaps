const express = require('express');
const router = express.Router();
const axios = require('axios');
const { ApiError } = require('../middlewares/errorHandler');

// Tile configuration
const TILE_SIZE = 256;
const MAX_ZOOM = 18;
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// Validate tile coordinates
function validateTileCoords(z, x, y) {
    if (z < 0 || z > MAX_ZOOM) {
        throw new ApiError(400, 'Invalid zoom level');
    }
    const maxTile = Math.pow(2, z) - 1;
    if (x < 0 || x > maxTile || y < 0 || y > maxTile) {
        throw new ApiError(400, 'Invalid tile coordinates');
    }
}

/**
 * @route   GET /tiles/:z/:x/:y
 * @desc    Get map tile
 * @access  Private
 */
router.get('/:z/:x/:y', async (req, res, next) => {
    try {
        const { z, x, y } = req.params;
        console.log('Tile request:', { z, x, y });
        
        validateTileCoords(parseInt(z), parseInt(x), parseInt(y));

        // Get tile from OpenStreetMap
        const tileUrl = OSM_TILE_URL
            .replace('{s}', 'a') // Use subdomain 'a'
            .replace('{z}', z)
            .replace('{x}', x)
            .replace('{y}', y);

        console.log('Fetching tile from:', tileUrl);

        try {
            const response = await axios.get(tileUrl, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'RiMaps API Service'
                }
            });

            console.log('Tile received, size:', response.data.length);

            // Set appropriate headers
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
            res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'x-api-key');
            
            // Send the tile
            res.send(response.data);
        } catch (error) {
            console.error('Error fetching tile:', error.message);
            // Return a transparent tile if the tile is not found
            res.status(404).send();
        }
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /tiles/metadata
 * @desc    Get tile metadata
 * @access  Private
 */
router.get('/metadata', (req, res) => {
    res.json({
        status: 'success',
        data: {
            tileSize: TILE_SIZE,
            maxZoom: MAX_ZOOM,
            minZoom: 0,
            attribution: '© OpenStreetMap contributors',
            bounds: [-180, -85.051129, 180, 85.051129] // World bounds
        }
    });
});

module.exports = router; 