//This file is the mock AI server. Keep it separate as provided. The frontend will not directly rely on its current mock implementation after the changes, but it's there if you want to integrate real AI later.
// ai-server.js - Enhanced version (as provided by user)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
})); // Adds various HTTP headers for security
app.use(express.json({ limit: '10kb' })); // Limit payload size

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Input validation middleware
const validateQuery = [
  body('query').isObject().withMessage('Query must be an object'),
  body('query.origin').isString().notEmpty().withMessage('Origin is required'),
  body('query.destination').isString().notEmpty().withMessage('Destination is required'),
  body('programs').isArray().withMessage('Programs must be an array')
];

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
};

// AI reasoning endpoint
app.post('/api/get-ai-reasoning', validateQuery, async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { query, programs } = req.body;

    // Log request (sanitized)
    console.log("AI Server received query:", {
      origin: query.origin,
      destination: query.destination
    });
    console.log("AI Server received programs count:", programs.length);

    // --- Mock Logic & Response ---
    // This mock endpoint generates sample data.
    // In a real AI integration, this would call a real AI model
    // to analyze the search query and user programs to suggest redemptions.

    const aiResponse = {
      summary: "Calculation complete. Review the best and alternative redemption options below.",
      // Frontend will generate redemptions based on searchParams and programs
    };

    res.json(aiResponse);

  } catch (error) {
    next(error);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Apply error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`AI server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});