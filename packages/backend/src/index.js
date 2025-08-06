const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const connectDB = require('./config/database');
const { validateEnv } = require('./config/env.validation');
const http = require('http');
const { initSocket } = require('./socket');

// Import security middleware
const {
  securityHeaders,
  generalRateLimit,
  authRateLimit,
  uploadRateLimit,
  requestLogger
} = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ocrRoutes = require('./routes/ocrRoutes');
const questionRoutes = require('./routes/questionRoutes');
const forumRoutes = require('./routes/forumRoutes');

// Validate environment variables
const env = validateEnv();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Connect to MongoDB
connectDB();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security headers
app.use(securityHeaders);

// Request logging
app.use(requestLogger);

// General rate limiting
app.use(generalRateLimit);

// CORS configuration
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Move /api/ocr/upload route registration to the very top for multer compatibility
app.use('/api/ocr', ocrRoutes);

// Health check for upload route
app.get('/api/ocr/upload/health', (req, res) => {
  res.json({ success: true, message: 'OCR upload route is reachable.' });
});

// Body parsing middleware (applies to all other routes)
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TestLoom API Server is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: env.NODE_ENV
  });
});

// Apply rate limiting to specific routes
app.use('/api/auth/login', authRateLimit);
app.use('/api/auth/register', authRateLimit);
app.use('/api/ocr/upload', uploadRateLimit);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/forums', forumRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
🚀 TestLoom Server running on port ${PORT}
📅 Started at: ${new Date().toISOString()}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Health check: http://localhost:${PORT}
  `);
});

module.exports = app;
