const { ApiError } = require('./errorHandler');
const Client = require('../models/Client');
const QuotaUsage = require('../models/QuotaUsage');

const authenticateApiKey = async (req, res, next) => {
    try {
        // Get API key from header
        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) {
            throw new ApiError(401, 'API key is required');
        }

        // Find client by API key
        const client = await Client.findOne({ apiKey, isActive: true });
        
        if (!client) {
            throw new ApiError(401, 'Invalid API key');
        }

        // Check if client has exceeded quota
        if (client.hasExceededQuota()) {
            throw new ApiError(429, 'Quota exceeded. Please upgrade your plan or try again later.');
        }

        // Check if client has access to the requested provider
        const provider = req.query.provider;
        if (provider && client.allowedProviders.length > 0 && !client.allowedProviders.includes(provider)) {
            throw new ApiError(403, `Provider '${provider}' is not allowed for your plan`);
        }

        // Attach client to request object
        req.client = client;

        // Start timing the request
        req.startTime = Date.now();

        // Handle response to track usage
        res.on('finish', async () => {
            try {
                // Calculate response time
                const responseTime = Date.now() - req.startTime;

                // Update client usage
                await client.incrementUsage();

                // Update quota usage statistics
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let quotaUsage = await QuotaUsage.findOne({
                    clientId: client._id,
                    date: today,
                    endpoint: req.path,
                    provider: provider || 'aggregated'
                });

                if (!quotaUsage) {
                    quotaUsage = new QuotaUsage({
                        clientId: client._id,
                        date: today,
                        endpoint: req.path,
                        provider: provider || 'aggregated'
                    });
                }

                // Update statistics
                quotaUsage.updateStats(responseTime, res.statusCode < 400);
                await quotaUsage.save();
            } catch (error) {
                console.error('Error updating usage statistics:', error);
            }
        });

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = authenticateApiKey; 