const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const { CloudWatchLogsClient, GetLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');
const cors = require('cors');

const app = express();


// /root/ssl-certificates

// SSL configuration
const sslOptions = {
    key: fs.readFileSync('/root/ssl-certificates/private.key'),
    cert: fs.readFileSync('/root/ssl-certificates/certificate.pem')
};

// Enhanced CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Initialize CloudWatch client
const client = new CloudWatchLogsClient({
    region: 'us-east-1',
});

// Your existing routes
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Logs endpoint
app.get('/api/logs', async (req, res) => {
    console.log('Received request for logs at:', new Date().toISOString());

    try {
        const params = {
            logGroupName: 'test',
            logStreamName: 'test-stream',
            limit: 100,
            startFromHead: true
        };

        console.log('Fetching logs with params:', params);

        const command = new GetLogEventsCommand(params);
        const response = await client.send(command);

        console.log(`Successfully fetched ${response.events.length} logs`);

        // Add server timestamp to response
        const responseData = {
            timestamp: new Date().toISOString(),
            events: response.events,
            nextForwardToken: response.nextForwardToken,
            nextBackwardToken: response.nextBackwardToken
        };

        res.json(responseData);

    } catch (error) {
        console.error('Error fetching logs:', error);

        // Enhanced error response
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString(),
            details: {
                code: error.code,
                requestId: error.$metadata?.requestId,
                cfId: error.$metadata?.cfId
            }
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// Create HTTPS server

const HOST = '172.31.88.240';

const httpServer = http.createServer(app);
const httpsServer = https.createServer(sslOptions, app);

const HTTP_PORT = 3001;
const HTTPS_PORT = 443;

httpServer.listen(HTTP_PORT, HOST, () => {
    console.log(`HTTP server running on http://${HOST}:${HTTP_PORT}`);
});

httpsServer.listen(HTTPS_PORT, HOST, () => {
    console.log(`Server started at ${new Date().toISOString()}`);
    console.log(`Secure server running on https://${HOST}:${HTTPS_PORT}`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
