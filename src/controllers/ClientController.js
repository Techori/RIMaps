const crypto = require('crypto');
const Client = require('../models/Client');
const { ApiError } = require('../middlewares/errorHandler');

class ClientController {
    async register(req, res) {
        try {
            const { name, email, password, allowedProviders } = req.body;

            // Validate required fields
            if (!name || !email || !password) {
                throw new ApiError(400, 'Name, email, and password are required');
            }

            // Check if client already exists
            const existingClient = await Client.findOne({ email });
            if (existingClient) {
                throw new ApiError(400, 'Client already exists');
            }

            // Validate allowed providers
            const validProviders = ['google', 'mapbox', 'osm'];
            if (allowedProviders) {
                if (!Array.isArray(allowedProviders)) {
                    throw new ApiError(400, 'Allowed providers must be an array');
                }
                if (!allowedProviders.every(provider => validProviders.includes(provider))) {
                    throw new ApiError(400, `Invalid provider in allowed providers. Must be one of: ${validProviders.join(', ')}`);
                }
            }

            // Generate API key
            const apiKey = crypto.randomBytes(32).toString('hex');

            // Create new client
            const client = new Client({
                name,
                email,
                password, // Note: In a real app, hash the password
                apiKey,
                allowedProviders: allowedProviders || ['google']
            });

            await client.save();

            res.status(201).json({
                status: 'success',
                message: 'Client registered successfully',
                data: {
                    name: client.name,
                    email: client.email,
                    apiKey: client.apiKey,
                    allowedProviders: client.allowedProviders
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Registration error:', error);
            if (error instanceof ApiError) {
                throw error;
            }
            if (error.name === 'ValidationError') {
                throw new ApiError(400, error.message);
            }
            if (error.code === 11000) {
                throw new ApiError(400, 'Email already exists');
            }
            throw new ApiError(500, 'Error registering client: ' + error.message);
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Find client by email
            const client = await Client.findOne({ email });
            if (!client) {
                throw new ApiError(401, 'Invalid credentials');
            }

            // Check password (Note: In a real app, compare hashed passwords)
            if (client.password !== password) {
                throw new ApiError(401, 'Invalid credentials');
            }

            res.json({
                status: 'success',
                message: 'Login successful',
                data: {
                    name: client.name,
                    email: client.email,
                    apiKey: client.apiKey
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Error logging in');
        }
    }

    async generateApiKey(req, res) {
        try {
            const { email, password } = req.body;

            // Find client by email
            const client = await Client.findOne({ email });
            if (!client) {
                throw new ApiError(401, 'Invalid credentials');
            }

            // Check password (Note: In a real app, compare hashed passwords)
            if (client.password !== password) {
                throw new ApiError(401, 'Invalid credentials');
            }

            // Generate new API key
            client.apiKey = crypto.randomBytes(32).toString('hex');
            await client.save();

            res.json({
                status: 'success',
                message: 'API key generated successfully',
                data: {
                    apiKey: client.apiKey
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Error generating API key');
        }
    }

    async getProfile(req, res) {
        try {
            const apiKey = req.headers['x-api-key'];
            const client = await Client.findOne({ apiKey });
            if (!client) {
                throw new ApiError(401, 'Invalid API key');
            }

            res.json({
                status: 'success',
                data: {
                    name: client.name,
                    email: client.email,
                    plan: client.plan,
                    quota: client.quota,
                    usage: client.usage,
                    allowedProviders: client.allowedProviders
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Error getting client profile');
        }
    }

    async updateProfile(req, res) {
        try {
            const apiKey = req.headers['x-api-key'];
            const client = await Client.findOne({ apiKey });
            if (!client) {
                throw new ApiError(401, 'Invalid API key');
            }

            const { name, email, allowedProviders } = req.body;

            // Validate allowed providers if provided
            if (allowedProviders) {
                const validProviders = ['google', 'mapbox', 'osm'];
                if (!Array.isArray(allowedProviders)) {
                    throw new ApiError(400, 'Allowed providers must be an array');
                }
                if (!allowedProviders.every(provider => validProviders.includes(provider))) {
                    throw new ApiError(400, `Invalid provider in allowed providers. Must be one of: ${validProviders.join(', ')}`);
                }
                if (allowedProviders.length === 0) {
                    throw new ApiError(400, 'At least one provider must be allowed');
                }
            }

            // Update client fields
            if (name) client.name = name;
            if (email) client.email = email;
            if (allowedProviders) client.allowedProviders = allowedProviders;

            await client.save();

            res.json({
                status: 'success',
                message: 'Profile updated successfully',
                data: {
                    name: client.name,
                    email: client.email,
                    allowedProviders: client.allowedProviders
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Error updating client profile');
        }
    }

    async deleteProfile(req, res) {
        try {
            const apiKey = req.headers['x-api-key'];
            const client = await Client.findOne({ apiKey });
            if (!client) {
                throw new ApiError(401, 'Invalid API key');
            }

            await client.deleteOne();

            res.json({
                status: 'success',
                message: 'Profile deleted successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Error deleting client profile');
        }
    }
}

module.exports = ClientController; 