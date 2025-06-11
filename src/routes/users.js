const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { requireApiKey } = require('../middleware/auth');
const Validators = require('../utils/Validators');

// Initialize controller
const userController = new UserController();

// Register a new user (no API key required)
router.post('/register', Validators.validate(Validators.client.register), userController.register.bind(userController));

// Login (no API key required)
router.post('/login', Validators.validate(Validators.client.login), userController.login.bind(userController));

// Generate API key (no API key required)
router.post('/generate-key', Validators.validate(Validators.client.generateKey), userController.generateApiKey.bind(userController));

// Protected routes (require API key)
router.use(requireApiKey);

// Get user profile
router.get('/profile', userController.getProfile.bind(userController));

// Update user profile
router.put('/profile', Validators.validate(Validators.client.updateProfile), userController.updateProfile.bind(userController));

// Delete user profile
router.delete('/profile', userController.deleteProfile.bind(userController));

module.exports = router; 