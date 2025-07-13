const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dealerRoutes = require('./routes/dealers');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'rp_exotics_super_secret_key_2025_change_this_in_production';

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://rp-exotics-frontend.vercel.app',
  'https://rp-exotics-frontend.netlify.app',
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

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Get fresh user data
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId.toString()) },
      { projection: { passwordHash: 0, password: 0, passwordResetToken: 0 } }
    );
    
    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'User not found or inactive' });
    }
    
    req.user = user;
    next();
  });
};

// Optional authentication middleware (for endpoints that can work with or without auth)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
      next();
    });
  } else {
    next();
  }
};

// MongoDB connection
let db;
const client = new MongoClient(process.env.MONGODB_URI);

async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db('rp_exotics');
    console.log('✅ Connected to MongoDB Atlas');
    
    // Connect Mongoose
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB with Mongoose');
    
    // Create indexes for better performance
    await createIndexes();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    console.log('🔧 To fix this issue:');
    console.log('1. For local development: Install MongoDB locally');
    console.log('   - macOS: brew install mongodb-community');
    console.log('   - Then run: brew services start mongodb-community');
    console.log('2. For cloud development: Set up MongoDB Atlas');
    console.log('   - Create a free account at https://mongodb.com/atlas');
    console.log('   - Create a cluster and get your connection string');
    console.log('   - Add MONGODB_URI to your .env file');
    console.log('3. For Railway deployment: Set MONGODB_URI in Railway dashboard');
    console.log('⚠️  Server will continue running but database operations will fail');
  }
}

async function createIndexes() {
  try {
    // Dealers collection indexes
    await db.collection('dealers').createIndex({ "name": "text" });
    await db.collection('dealers').createIndex({ "contact.phone": 1 });
    
    // Deals collection indexes  
    await db.collection('deals').createIndex({ "vin": 1 });
    await db.collection('deals').createIndex({ "stockNumber": 1 });
    await db.collection('deals').createIndex({ "vehicle.make": 1, "vehicle.model": 1 });
    
    // Users collection indexes
    await db.collection('users').createIndex({ "email": 1 }, { unique: true });
    await db.collection('users').createIndex({ "username": 1 }, { unique: true });
    await db.collection('users').createIndex({ "role": 1 });
    
    console.log('✅ Database indexes created');
  } catch (error) {
    console.log('⚠️  Index creation warning:', error.message);
  }
}

// =================== ROUTES ===================

// Mount dealer routes
app.use('/api/dealers', dealerRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'RP Exotics API is running!', 
    timestamp: new Date().toISOString(),
    database: db ? 'Connected' : 'Disconnected'
  });
});

// =================== USER AUTHENTICATION ENDPOINTS ===================

// Get available roles (for frontend role selection)
app.get('/api/auth/roles', (req, res) => {
  const roles = [
    {
      value: 'sales',
      label: 'Sales Representative',
      description: 'Can create and manage deals, view reports',
      permissions: {
        deals: { create: true, read: true, update: true, delete: false, viewFinancials: false },
        dealers: { create: true, read: true, update: true, delete: false },
        backoffice: { access: false },
        reports: { access: true, viewFinancials: false },
        users: { manage: false },
        system: { configure: false }
      }
    },
    {
      value: 'finance',
      label: 'Finance Manager',
      description: 'Can view financial data and manage financial aspects',
      permissions: {
        deals: { create: false, read: true, update: false, delete: false, viewFinancials: true },
        dealers: { create: false, read: true, update: false, delete: false },
        backoffice: { access: false },
        reports: { access: true, viewFinancials: true },
        users: { manage: false },
        system: { configure: false }
      }
    },
    {
      value: 'admin',
      label: 'Administrator',
      description: 'Full system access and user management',
      permissions: {
        deals: { create: true, read: true, update: true, delete: true, viewFinancials: true },
        dealers: { create: true, read: true, update: true, delete: true },
        backoffice: { access: true },
        reports: { access: true, viewFinancials: true },
        users: { manage: true },
        system: { configure: true }
      }
    }
  ];
  
  res.json({ roles });
});

// User registration (for new users, not team members)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role = 'sales' } = req.body;

    // Validation
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Validate role
    const validRoles = ['sales', 'finance', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be one of: sales, finance, admin' });
    }

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Define permissions based on role
    const rolePermissions = {
      sales: {
        deals: { create: true, read: true, update: true, delete: false, viewFinancials: false },
        dealers: { create: true, read: true, update: true, delete: false },
        backoffice: { access: false },
        reports: { access: true, viewFinancials: false },
        users: { manage: false },
        system: { configure: false }
      },
      finance: {
        deals: { create: false, read: true, update: false, delete: false, viewFinancials: true },
        dealers: { create: false, read: true, update: false, delete: false },
        backoffice: { access: false },
        reports: { access: true, viewFinancials: true },
        users: { manage: false },
        system: { configure: false }
      },
      admin: {
        deals: { create: true, read: true, update: true, delete: true, viewFinancials: true },
        dealers: { create: true, read: true, update: true, delete: true },
        backoffice: { access: true },
        reports: { access: true, viewFinancials: true },
        users: { manage: true },
        system: { configure: true }
      }
    };

    // Create user with new schema
    const user = {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash: passwordHash,
      role,
      permissions: rolePermissions[role],
      profile: {
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`.trim(),
        department: role === 'sales' ? 'Sales' : role === 'finance' ? 'Finance' : 'Administration',
        phone: '',
        avatar: null
      },
      isActive: true,
      emailVerified: true,
      mustChangePassword: false,
      lastLogin: null,
      loginCount: 0,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'registration',
      passwordResetToken: null,
      passwordResetExpires: null
    };

    const result = await db.collection('users').insertOne(user);
    
    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      message: 'User registered successfully',
      user: { ...userWithoutPassword, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await db.collection('users').findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      return res.status(423).json({ 
        error: 'Account is temporarily locked due to too many failed login attempts',
        lockoutUntil: user.lockoutUntil
      });
    }

    // Verify password (handle both old and new schema)
    const passwordField = user.passwordHash || user.password;
    const isValidPassword = await bcrypt.compare(password, passwordField);
    
    if (!isValidPassword) {
      // Increment failed login attempts
      const failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      const updateData = { failedLoginAttempts };
      
      // Lock account after 5 failed attempts for 15 minutes
      if (failedLoginAttempts >= 5) {
        updateData.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }
      
      await db.collection('users').updateOne(
        { _id: user._id },
        { 
          $set: updateData,
          $set: { updatedAt: new Date() }
        }
      );
      
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Reset failed login attempts on successful login
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          lastLogin: new Date(),
          failedLoginAttempts: 0,
          lockoutUntil: null,
          updatedAt: new Date()
        },
        $inc: { loginCount: 1 }
      }
    );

    // Generate JWT token
    const tokenExpiration = rememberMe ? '30d' : '24h';
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        permissions: user.permissions
      },
      JWT_SECRET,
      { expiresIn: tokenExpiration }
    );

    // Remove password hash from response
    const { passwordHash, password: _, passwordResetToken, ...userResponse } = user;

    res.json({
      message: 'Login successful',
      token: token,
      expiresIn: tokenExpiration,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    // req.user already contains the full user object from middleware
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user (alias for /api/auth/profile)
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    // req.user already contains the full user object from middleware
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User logout
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    // In a stateless JWT system, the client is responsible for removing the token
    // We can log the logout event for audit purposes
    await db.collection('users').updateOne(
      { _id: req.user._id },
      { 
        $set: { 
          lastLogout: new Date(),
          updatedAt: new Date()
        }
      }
    );
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Check session endpoint for frontend compatibility
app.get('/api/auth/check-session', authenticateToken, async (req, res) => {
  try {
    // req.user is set by authenticateToken middleware
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    // Return the structure expected by the frontend
    return res.json({
      success: true,
      profile: {
        ...req.user.profile,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ... rest of the file unchanged ... 