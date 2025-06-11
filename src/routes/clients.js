const express = require('express');
const router = express.Router();
const ClientController = require('../controllers/ClientController');
const authenticateApiKey = require('../middlewares/auth');
const Validators = require('../utils/Validators');

// Initialize controller
const clientController = new ClientController();

// Register a new client (no API key required)
router.post('/register', 
    Validators.validate(Validators.client.register), 
    (req, res, next) => clientController.register(req, res, next)
);

// Login (no API key required)
router.post('/login', 
    Validators.validate(Validators.client.login), 
    (req, res, next) => clientController.login(req, res, next)
);

// Generate API key (no API key required)
router.post('/generate-key', 
    Validators.validate(Validators.client.generateKey), 
    (req, res, next) => clientController.generateApiKey(req, res, next)
);

// Protected routes (require API key)
router.use(authenticateApiKey);

// Get client profile
router.get('/profile', 
    (req, res, next) => clientController.getProfile(req, res, next)
);

// Update client profile
router.put('/profile', 
    Validators.validate(Validators.client.updateProfile), 
    (req, res, next) => clientController.updateProfile(req, res, next)
);

// Delete client profile
router.delete('/profile', 
    (req, res, next) => clientController.deleteProfile(req, res, next)
);

module.exports = router; 