const morgan = require('morgan');

// Custom token for request body
morgan.token('body', (req) => JSON.stringify(req.body));

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req, res) => {
    if (!res._header || !req._startAt) return '';
    const diff = process.hrtime(req._startAt);
    const ms = diff[0] * 1e3 + diff[1] * 1e-6;
    return ms.toFixed(2);
});

// Custom format for logging
const logFormat = ':remote-addr - :method :url :status :response-time-ms ms - :body';

// Create the logger middleware
const logger = morgan(logFormat, {
    skip: (req, res) => res.statusCode >= 400, // Skip logging for error responses
    stream: {
        write: (message) => {
            console.log(message.trim());
        }
    }
});

module.exports = logger; 