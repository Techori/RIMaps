const mongoose = require('mongoose');

const quotaUsageSchema = new mongoose.Schema({
    clientId: {
        type: String,
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    endpoint: {
        type: String,
        required: true
    },
    provider: {
        type: String,
        enum: ['google', 'mapbox', 'osm', 'mapple', 'aggregated']
    },
    count: {
        type: Number,
        default: 0
    },
    successCount: {
        type: Number,
        default: 0
    },
    errorCount: {
        type: Number,
        default: 0
    },
    averageResponseTime: {
        type: Number,
        default: 0
    },
    totalResponseTime: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Compound index for querying usage by client and date
quotaUsageSchema.index({ clientId: 1, date: 1 });

// Method to update usage statistics
quotaUsageSchema.methods.updateStats = function(responseTime, isSuccess) {
    this.count += 1;
    if (isSuccess) {
        this.successCount += 1;
    } else {
        this.errorCount += 1;
    }
    
    // Update average response time
    this.totalResponseTime += responseTime;
    this.averageResponseTime = this.totalResponseTime / this.count;
};

const QuotaUsage = mongoose.model('QuotaUsage', quotaUsageSchema);

module.exports = QuotaUsage; 