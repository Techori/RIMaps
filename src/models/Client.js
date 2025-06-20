const mongoose = require('mongoose');
const crypto = require('crypto');

const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    apiKey: {
        type: String,
        required: true,
        unique: true
    },
    plan: {
        type: String,
        enum: ['free', 'basic', 'premium', 'enterprise'],
        default: 'free'
    },
    quota: {
        daily: {
            type: Number,
            default: 1000
        },
        monthly: {
            type: Number,
            default: 30000
        }
    },
    usage: {
        daily: {
            type: Number,
            default: 0
        },
        monthly: {
            type: Number,
            default: 0
        },
        lastReset: {
            type: Date,
            default: Date.now
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    allowedProviders: {
        type: [String],
        required: true,
        default: ['google'],
        validate: {
            validator: function(providers) {
                const validProviders = ['google', 'mapbox', 'osm'];
                return providers.every(provider => validProviders.includes(provider));
            },
            message: 'Invalid provider in allowed providers. Must be one of: google, mapbox, osm'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Method to check if client has exceeded quota
clientSchema.methods.hasExceededQuota = function() {
    const now = new Date();
    const lastReset = new Date(this.usage.lastReset);
    
    // Reset daily usage if it's a new day
    if (now.getDate() !== lastReset.getDate()) {
        this.usage.daily = 0;
        this.usage.lastReset = now;
    }
    
    // Reset monthly usage if it's a new month
    if (now.getMonth() !== lastReset.getMonth()) {
        this.usage.monthly = 0;
    }
    
    return this.usage.daily >= this.quota.daily || 
           this.usage.monthly >= this.quota.monthly;
};

// Method to increment usage
clientSchema.methods.incrementUsage = async function() {
    this.usage.daily += 1;
    this.usage.monthly += 1;
    await this.save();
};

// Update the updatedAt timestamp before saving
clientSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Ensure at least one provider is always set
clientSchema.pre('save', function(next) {
    if (!this.allowedProviders || this.allowedProviders.length === 0) {
        this.allowedProviders = ['google'];
    }
    next();
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client; 