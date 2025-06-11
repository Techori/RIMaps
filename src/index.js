const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes and middleware
const routes = require('./routes');
const logger = require('./middlewares/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const authenticateApiKey = require('./middlewares/auth');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// MongoDB Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Public routes (no authentication required)
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to RiMaps API' });
});

// Protected routes (require API key)
app.use('/api', authenticateApiKey, routes);

// Handle 404 errors
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
}); 