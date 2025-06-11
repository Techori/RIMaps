const crypto = require('crypto');
const User = require('../models/User');

class UserController {
    async register(req, res) {
        try {
            const { name, email, password, allowedProviders } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    status: 'error',
                    message: 'User already exists',
                    code: 400,
                    timestamp: new Date().toISOString()
                });
            }

            // Generate API key
            const apiKey = crypto.randomBytes(32).toString('hex');

            // Create new user
            const user = new User({
                name,
                email,
                password, // Note: In a real app, hash the password
                apiKey,
                allowedProviders: allowedProviders || ['google', 'mapbox', 'osm']
            });

            await user.save();

            res.status(201).json({
                status: 'success',
                message: 'User registered successfully',
                data: {
                    name: user.name,
                    email: user.email,
                    apiKey: user.apiKey
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message,
                code: 500,
                timestamp: new Date().toISOString()
            });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Find user by email
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials',
                    code: 401,
                    timestamp: new Date().toISOString()
                });
            }

            // Check password (Note: In a real app, compare hashed passwords)
            if (user.password !== password) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials',
                    code: 401,
                    timestamp: new Date().toISOString()
                });
            }

            res.json({
                status: 'success',
                message: 'Login successful',
                data: {
                    name: user.name,
                    email: user.email,
                    apiKey: user.apiKey
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message,
                code: 500,
                timestamp: new Date().toISOString()
            });
        }
    }

    async generateApiKey(req, res) {
        try {
            const { email, password } = req.body;

            // Find user by email
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials',
                    code: 401,
                    timestamp: new Date().toISOString()
                });
            }

            // Check password (Note: In a real app, compare hashed passwords)
            if (user.password !== password) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials',
                    code: 401,
                    timestamp: new Date().toISOString()
                });
            }

            // Generate new API key
            const apiKey = crypto.randomBytes(32).toString('hex');
            user.apiKey = apiKey;
            await user.save();

            res.json({
                status: 'success',
                message: 'API key generated successfully',
                data: {
                    apiKey: user.apiKey
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message,
                code: 500,
                timestamp: new Date().toISOString()
            });
        }
    }

    async getProfile(req, res) {
        try {
            const apiKey = req.headers['x-api-key'];
            const user = await User.findOne({ apiKey });
            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid API key',
                    code: 401,
                    timestamp: new Date().toISOString()
                });
            }

            res.json({
                status: 'success',
                data: {
                    name: user.name,
                    email: user.email,
                    allowedProviders: user.allowedProviders
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message,
                code: 500,
                timestamp: new Date().toISOString()
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const apiKey = req.headers['x-api-key'];
            const user = await User.findOne({ apiKey });
            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid API key',
                    code: 401,
                    timestamp: new Date().toISOString()
                });
            }

            const { name, email, allowedProviders } = req.body;
            if (name) user.name = name;
            if (email) user.email = email;
            if (allowedProviders) user.allowedProviders = allowedProviders;

            await user.save();

            res.json({
                status: 'success',
                message: 'Profile updated successfully',
                data: {
                    name: user.name,
                    email: user.email,
                    allowedProviders: user.allowedProviders
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message,
                code: 500,
                timestamp: new Date().toISOString()
            });
        }
    }

    async deleteProfile(req, res) {
        try {
            const apiKey = req.headers['x-api-key'];
            const user = await User.findOne({ apiKey });
            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid API key',
                    code: 401,
                    timestamp: new Date().toISOString()
                });
            }

            await user.remove();

            res.json({
                status: 'success',
                message: 'Profile deleted successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message,
                code: 500,
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = UserController; 