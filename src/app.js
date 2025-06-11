const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimiter = require('./utils/RateLimiter');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Import routes
const geocodeRoutes = require('./routes/geocode');
const directionsRoutes = require('./routes/directions');

// Create Express app
const app = express();

// Apply global middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } })); // HTTP request logging

// Apply global rate limiting
const globalLimiter = rateLimiter.createLimiter('default');
app.use(globalLimiter);

// Serve Swagger API docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Apply routes
app.use('/api/geocode', geocodeRoutes);
app.use('/api/directions', directionsRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
        code: 404,
        timestamp: new Date().toISOString()
    });
});

module.exports = app; 