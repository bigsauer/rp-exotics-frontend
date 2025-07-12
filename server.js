const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration to allow frontend to connect
const allowedOrigins = [
  'http://localhost:3000',  // React development server
  'http://localhost:3001',  // Alternative React port
  'http://localhost:5000',  // Your existing backend
  'https://rp-exotics-frontend.vercel.app',  // Vercel frontend
  'https://rp-exotics-frontend.railway.app', // Railway frontend
  process.env.FRONTEND_URL // Environment variable for frontend URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/rp-exotics';
mongoose.connect(mongoUri)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/deals'));  // This includes VIN decode and dealer search

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'RP Exotics Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to verify frontend can connect
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Frontend successfully connected to backend!',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
}); 