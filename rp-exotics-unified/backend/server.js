const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration to allow frontend to connect
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
  'https://rp-exotics-frontend.vercel.app',
  'https://rp-exotics-frontend.railway.app',
  process.env.FRONTEND_URL
].filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Allow all Vercel preview URLs
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true;
  return false;
}

app.use(cors({
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
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

// Connect to MongoDB with better error handling
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/rp-exotics';

console.log('🔗 Attempting to connect to MongoDB...');
console.log('📍 Connection string:', mongoUri.includes('mongodb+srv') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB');

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('📊 Database:', mongoose.connection.name);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('\n🔧 To fix this issue:');
  console.log('1. For local development: Install MongoDB locally');
  console.log('   - macOS: brew install mongodb-community');
  console.log('   - Then run: brew services start mongodb-community');
  console.log('');
  console.log('2. For cloud development: Set up MongoDB Atlas');
  console.log('   - Create a free account at https://mongodb.com/atlas');
  console.log('   - Create a cluster and get your connection string');
  console.log('   - Add MONGODB_URI to your .env file');
  console.log('');
  console.log('3. For Railway deployment: Set MONGODB_URI in Railway dashboard');
  console.log('');
  console.log('⚠️  Server will continue running but database operations will fail');
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dealers', require('./routes/dealers'));  // Dealer management
app.use('/api', require('./routes/deals'));  // This includes VIN decode and dealer search
app.use('/api/back-office', require('./routes/backOffice'));  // Back office deal tracking
app.use('/api/sales', require('./routes/salesTracker'));  // Sales deal tracking
app.use('/api/documents', require('./routes/documents'));  // Document generation and vehicle records

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'OK',
    message: 'RP Exotics Backend is running',
    database: dbStatus,
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