const { body, query, param, validationResult } = require('express-validator');
const { ApiError } = require('../middlewares/errorHandler');

class Validators {
    // Validation middleware
    static validate = (validations) => {
        return async (req, res, next) => {
            // Run all validations
            await Promise.all(validations.map(validation => validation.run(req)));

            // Check for validation errors
            const errors = validationResult(req);
            if (errors.isEmpty()) {
                return next();
            }

            // Format validation errors
            const formattedErrors = errors.array().map(error => ({
                field: error.param,
                message: error.msg,
                value: error.value
            }));

            // Throw API error with validation details
            throw new ApiError(400, 'Validation failed', {
                errors: formattedErrors
            });
        };
    };

    // Geocoding validators
    static geocode = {
        // Validate geocoding request
        geocode: [
            query('address')
                .notEmpty()
                .withMessage('Address is required')
                .isString()
                .withMessage('Address must be a string')
                .trim()
                .escape(),
            query('provider')
                .optional()
                .isIn(['google', 'mapbox', 'osm'])
                .withMessage('Provider must be one of: google, mapbox, osm')
        ],

        // Validate reverse geocoding request
        reverseGeocode: [
            query('lat')
                .notEmpty()
                .withMessage('Latitude is required')
                .isFloat({ min: -90, max: 90 })
                .withMessage('Latitude must be between -90 and 90'),
            query('lng')
                .notEmpty()
                .withMessage('Longitude is required')
                .isFloat({ min: -180, max: 180 })
                .withMessage('Longitude must be between -180 and 180'),
            query('provider')
                .optional()
                .isIn(['google', 'mapbox', 'osm'])
                .withMessage('Provider must be one of: google, mapbox, osm')
        ]
    };

    // Directions validators
    static directions = {
        // Validate directions request
        getDirections: [
            query('origin')
                .notEmpty()
                .withMessage('Origin is required')
                .isString()
                .withMessage('Origin must be a string')
                .trim()
                .escape(),
            query('destination')
                .notEmpty()
                .withMessage('Destination is required')
                .isString()
                .withMessage('Destination must be a string')
                .trim()
                .escape(),
            query('mode')
                .optional()
                .isIn(['driving', 'walking', 'bicycling', 'transit', 'cycling'])
                .withMessage('Mode must be one of: driving, walking, bicycling, transit, cycling'),
            query('provider')
                .optional()
                .isIn(['google', 'mapbox', 'osm'])
                .withMessage('Provider must be one of: google, mapbox, osm')
        ],

        // Validate available modes request
        getAvailableModes: [
            query('provider')
                .optional()
                .isIn(['google', 'mapbox', 'osm'])
                .withMessage('Provider must be one of: google, mapbox, osm')
        ]
    };

    // Client validators
    static client = {
        // Validate client creation
        create: [
            body('name')
                .notEmpty()
                .withMessage('Name is required')
                .isString()
                .withMessage('Name must be a string')
                .trim()
                .escape(),
            body('email')
                .notEmpty()
                .withMessage('Email is required')
                .isEmail()
                .withMessage('Invalid email format')
                .normalizeEmail(),
            body('password')
                .notEmpty()
                .withMessage('Password is required')
                .isLength({ min: 6 })
                .withMessage('Password must be at least 6 characters long'),
            body('allowedProviders')
                .optional()
                .isArray()
                .withMessage('Allowed providers must be an array')
                .custom((value) => {
                    const validProviders = ['google', 'mapbox', 'osm'];
                    return value.every(provider => validProviders.includes(provider));
                })
                .withMessage('Invalid provider in allowed providers')
        ],

        // Validate client update
        update: [
            param('id')
                .isMongoId()
                .withMessage('Invalid client ID'),
            body('name')
                .optional()
                .isString()
                .withMessage('Name must be a string')
                .trim()
                .escape(),
            body('email')
                .optional()
                .isEmail()
                .withMessage('Invalid email format')
                .normalizeEmail(),
            body('allowedProviders')
                .optional()
                .isArray()
                .withMessage('Allowed providers must be an array')
                .custom((value) => {
                    const validProviders = ['google', 'mapbox', 'osm'];
                    return value.every(provider => validProviders.includes(provider));
                })
                .withMessage('Invalid provider in allowed providers')
        ],

        // Validate login
        login: [
            body('email')
                .notEmpty()
                .withMessage('Email is required')
                .isEmail()
                .withMessage('Invalid email format')
                .normalizeEmail(),
            body('password')
                .notEmpty()
                .withMessage('Password is required')
        ],

        // Validate client registration
        register: [
            body('name').notEmpty().withMessage('Name is required'),
            body('email').isEmail().withMessage('Invalid email format'),
            body('password').notEmpty().withMessage('Password is required'),
            body('allowedProviders').optional().isArray().withMessage('Allowed providers must be an array')
        ],

        // Validate client login
        login: [
            body('email').isEmail().withMessage('Invalid email format'),
            body('password').notEmpty().withMessage('Password is required')
        ],

        // Validate client generate key
        generateKey: [
            body('email').isEmail().withMessage('Invalid email format'),
            body('password').notEmpty().withMessage('Password is required')
        ],

        // Validate client update profile
        updateProfile: [
            body('name').optional().notEmpty().withMessage('Name cannot be empty'),
            body('email').optional().isEmail().withMessage('Invalid email format'),
            body('allowedProviders').optional().isArray().withMessage('Allowed providers must be an array')
        ]
    };

    // Location validators
    static location = {
        // Validate location request
        getLocation: [
            query('query')
                .notEmpty()
                .withMessage('Location query is required')
                .isString()
                .withMessage('Query must be a string')
                .trim()
                .escape(),
            query('provider')
                .optional()
                .isIn(['google', 'mapbox', 'osm'])
                .withMessage('Provider must be one of: google, mapbox, osm')
        ],

        // Validate select location request
        selectLocation: [
            body('lat')
                .notEmpty()
                .withMessage('Latitude is required')
                .isFloat({ min: -90, max: 90 })
                .withMessage('Latitude must be between -90 and 90'),
            body('lng')
                .notEmpty()
                .withMessage('Longitude is required')
                .isFloat({ min: -180, max: 180 })
                .withMessage('Longitude must be between -180 and 180'),
            body('provider')
                .optional()
                .isIn(['google', 'mapbox', 'osm'])
                .withMessage('Provider must be one of: google, mapbox, osm')
        ],

        // Validate nearby search request
        searchNearby: [
            query('lat')
                .notEmpty()
                .withMessage('Latitude is required')
                .isFloat({ min: -90, max: 90 })
                .withMessage('Latitude must be between -90 and 90'),
            query('lng')
                .notEmpty()
                .withMessage('Longitude is required')
                .isFloat({ min: -180, max: 180 })
                .withMessage('Longitude must be between -180 and 180'),
            query('radius')
                .optional()
                .isFloat({ min: 0, max: 50000 })
                .withMessage('Radius must be between 0 and 50000 meters'),
            query('type')
                .optional()
                .isString()
                .withMessage('Type must be a string')
                .trim()
                .escape(),
            query('provider')
                .optional()
                .isIn(['google', 'mapbox', 'osm'])
                .withMessage('Provider must be one of: google, mapbox, osm')
        ]
    };
}

module.exports = Validators; 