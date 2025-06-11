const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes and middleware
const routes = require('./routes');
const logger = require('./middlewares/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// MongoDB Connection
const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        return false;
    }
};

// Public routes (no authentication required)
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to RiMaps API' });
});

// Apply routes
app.use('/api', routes);

// Handle 404 errors
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

// Connect to MongoDB and start server
const startServer = async () => {
    const connected = await connectDB();
    if (connected) {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } else {
        console.error('Failed to connect to MongoDB. Server not started.');
        process.exit(1);
    }
};

startServer(); 