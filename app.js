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

// User registration (for new users, not team members)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role = 'user' } = req.body;

    // Validation
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
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

    // Create user with new schema
    const user = {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash: passwordHash,
      role,
      permissions: {
        deals: { create: true, read: true, update: true, delete: false, viewFinancials: false },
        dealers: { create: true, read: true, update: true, delete: false },
        backoffice: { access: false },
        reports: { access: true, viewFinancials: false },
        users: { manage: false },
        system: { configure: false }
      },
      profile: {
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`.trim(),
        department: 'General',
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
    res.json({
      status: 'OK',
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const updateData = { updatedAt: new Date() };

    if (firstName) updateData['profile.firstName'] = firstName;
    if (lastName) updateData['profile.lastName'] = lastName;
    if (phone) updateData['profile.phone'] = phone;
    
    // Update display name if first or last name changed
    if (firstName || lastName) {
      const newFirstName = firstName || req.user.profile.firstName;
      const newLastName = lastName || req.user.profile.lastName;
      updateData['profile.displayName'] = `${newFirstName} ${newLastName}`.trim();
    }

    const result = await db.collection('users').updateOne(
      { _id: req.user._id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get user with password hash
    const user = await db.collection('users').findOne({ _id: req.user._id });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password (handle both old and new schema)
    const passwordField = user.passwordHash || user.password;
    const isValidPassword = await bcrypt.compare(currentPassword, passwordField);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password (migrate to new schema)
    const updateData = { 
      passwordHash: passwordHash,
      updatedAt: new Date()
    };
    
    // Remove old password field if it exists
    if (user.password) {
      updateData.password = undefined;
    }

    await db.collection('users').updateOne(
      { _id: req.user._id },
      { $set: updateData, $unset: { password: 1 } }
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =================== USER MANAGEMENT ENDPOINTS (ADMIN ONLY) ===================

// Get all users (admin only)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await db.collection('users')
      .find({}, { projection: { passwordHash: 0, password: 0, passwordResetToken: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user (admin only)
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const user = await db.collection('users')
      .findOne(
        { _id: new ObjectId(req.params.id) },
        { projection: { passwordHash: 0, password: 0, passwordResetToken: 0 } }
      );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user (admin only)
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { role, isActive, preferences } = req.body;
    const updateData = { updatedAt: new Date() };

    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (preferences) updateData.preferences = { ...preferences };

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Prevent admin from deleting themselves
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await db.collection('users').deleteOne(
      { _id: new ObjectId(req.params.id) }
    );

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =================== DEALERS ENDPOINTS ===================

// Search dealers (autocomplete)
app.get('/api/dealers/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    
    if (query.length < 2) {
      return res.json([]);
    }
    
    const dealers = await db.collection('dealers')
      .find({ 
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { 'contact.primaryContact': { $regex: query, $options: 'i' } },
          { 'contact.phone': { $regex: query, $options: 'i' } }
        ]
      })
      .limit(10)
      .sort({ 'metrics.lastDealDate': -1 })
      .toArray();
    
    res.json(dealers);
  } catch (error) {
    console.error('Dealer search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all dealers
app.get('/api/dealers', async (req, res) => {
  try {
    const dealers = await db.collection('dealers')
      .find({})
      .sort({ name: 1 })
      .toArray();
    res.json(dealers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single dealer
app.get('/api/dealers/:id', async (req, res) => {
  try {
    const dealer = await db.collection('dealers')
      .findOne({ _id: new ObjectId(req.params.id) });
    
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }
    
    res.json(dealer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new dealer
app.post('/api/dealers', async (req, res) => {
  try {
    // Transform the request body to match the new schema structure
    const dealerData = {
      name: req.body.name,
      company: req.body.company || req.body.name,
      type: req.body.type || 'dealer',
      contact: {
        phone: req.body.phone || req.body.contactPerson || '',
        email: req.body.email ? req.body.email.toLowerCase() : '',
        address: {
          street: req.body.address?.street || '',
          city: req.body.address?.city || req.body.location?.city || '',
          state: req.body.address?.state || req.body.location?.state || '',
          zip: req.body.address?.zip || ''
        }
      },
      notes: req.body.notes || 'Uploaded via API',
      isActive: req.body.isActive !== false,
      metrics: {
        totalDeals: 0,
        totalPurchaseVolume: 0,
        totalSaleVolume: 0,
        lastDealDate: null,
        ...req.body.metrics
      },
      dealHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('dealers').insertOne(dealerData);
    res.json({ 
      id: result.insertedId, 
      message: 'Dealer created successfully',
      dealer: { ...dealerData, _id: result.insertedId }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =================== DEALS ENDPOINTS ===================

// Get all deals
app.get('/api/deals', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const deals = await db.collection('deals')
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
      
    const total = await db.collection('deals').countDocuments();
    
    res.json({
      deals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single deal
app.get('/api/deals/:id', async (req, res) => {
  try {
    const deal = await db.collection('deals')
      .findOne({ _id: new ObjectId(req.params.id) });
    
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search deals by VIN or stock number
app.get('/api/deals/search', async (req, res) => {
  try {
    const { vin, stockNumber, make, model } = req.query;
    let query = {};
    
    if (vin) query.vin = { $regex: vin, $options: 'i' };
    if (stockNumber) query.stockNumber = { $regex: stockNumber, $options: 'i' };
    if (make) query['vehicle.make'] = { $regex: make, $options: 'i' };
    if (model) query['vehicle.model'] = { $regex: model, $options: 'i' };
    
    const deals = await db.collection('deals')
      .find(query)
      .limit(20)
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search dealers
app.get('/api/dealers/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ dealers: [] });
    }
    
    const dealers = await db.collection('dealers')
      .find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { 'contact.person': { $regex: q, $options: 'i' } },
          { 'contact.email': { $regex: q, $options: 'i' } },
          { 'contact.phone': { $regex: q, $options: 'i' } }
        ]
      })
      .limit(10)
      .sort({ name: 1 })
      .toArray();
    
    // Transform dealers to match frontend expectations
    const transformedDealers = dealers.map(dealer => ({
      id: dealer._id.toString(),
      name: dealer.name,
      company: dealer.name, // Use name as company for now
      location: dealer.location?.city && dealer.location?.state 
        ? `${dealer.location.city}, ${dealer.location.state}`
        : dealer.location?.city || dealer.location?.state || '',
      phone: dealer.contact?.phone || '',
      email: dealer.contact?.email || ''
    }));
    
    res.json({ dealers: transformedDealers });
  } catch (error) {
    console.error('Dealer search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new deal
app.post('/api/deals', async (req, res) => {
  try {
    // Generate stock number if not provided
    let stockNumber = req.body.stockNumber;
    if (!stockNumber) {
      const year = new Date().getFullYear();
      const count = await db.collection('deals').countDocuments() + 1;
      stockNumber = `RP${year}${count.toString().padStart(3, '0')}`;
    }
    
    const deal = {
      ...req.body,
      stockNumber,
      status: req.body.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('deals').insertOne(deal);
    
    // Update dealer history if applicable
    if (deal.parties?.purchasedFrom?.name && !isRetailDeal(deal)) {
      await updateDealerHistory(deal.parties.purchasedFrom.name, result.insertedId, deal);
    }
    
    res.json({ 
      id: result.insertedId, 
      stockNumber,
      message: 'Deal created successfully',
      deal: { ...deal, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Deal creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update deal
app.put('/api/deals/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const result = await db.collection('deals').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    res.json({ message: 'Deal updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =================== BACK OFFICE DEALS ENDPOINTS ===================

// Get back office deals (with filtering and pagination)
app.get('/api/deals/backoffice', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Build query based on filters
    let query = {};
    
    if (req.query.stage) {
      query.currentStage = req.query.stage;
    }
    
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.search) {
      query.$or = [
        { vin: { $regex: req.query.search, $options: 'i' } },
        { rpStockNumber: { $regex: req.query.search, $options: 'i' } },
        { 'seller.name': { $regex: req.query.search, $options: 'i' } },
        { 'seller.company': { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Role-based filtering
    if (req.user.role === 'sales') {
      // Sales users can only see their own deals or deals they have access to
      query.$or = [
        { createdBy: req.user._id },
        { assignedTo: req.user._id },
        { 'seller.name': { $exists: true } } // Allow viewing deals with sellers
      ];
    }
    
    const deals = await db.collection('deals')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
      
    const total = await db.collection('deals').countDocuments(query);
    
    // Transform deals to match frontend expectations
    const transformedDeals = deals.map(deal => ({
      id: deal._id.toString(),
      vin: deal.vin,
      stockNumber: deal.rpStockNumber,
      vehicle: `${deal.year || ''} ${deal.make || ''} ${deal.model || ''}`.trim(),
      seller: deal.seller,
      buyer: deal.buyer,
      currentStage: deal.currentStage,
      priority: deal.priority,
      status: deal.status,
      purchasePrice: deal.financial?.purchasePrice,
      salePrice: deal.financial?.salePrice,
      purchaseDate: deal.purchaseDate,
      saleDate: deal.saleDate,
      documentation: deal.documentation,
      compliance: deal.compliance,
      titleInfo: deal.titleInfo,
      notes: deal.generalNotes,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
      completionPercentage: deal.completionPercentage || 0,
      pendingDocumentsCount: deal.pendingDocumentsCount || 0,
      overdueDocuments: deal.overdueDocuments || []
    }));
    
    res.json({
      success: true,
      data: transformedDeals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Back office deals error:', error);
    res.status(500).json({ error: 'Failed to retrieve deals' });
  }
});

// Get single back office deal
app.get('/api/deals/backoffice/:id', authenticateToken, async (req, res) => {
  try {
    const deal = await db.collection('deals')
      .findOne({ _id: new ObjectId(req.params.id) });
    
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    // Role-based access control
    if (req.user.role === 'sales' && deal.createdBy !== req.user._id && deal.assignedTo !== req.user._id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve deal' });
  }
});

// Update deal stage
app.put('/api/deals/:id/stage', authenticateToken, async (req, res) => {
  try {
    const { stage, notes } = req.body;
    
    if (!stage) {
      return res.status(400).json({ error: 'Stage is required' });
    }
    
    const updateData = {
      currentStage: stage,
      updatedAt: new Date()
    };
    
    // Add to workflow history
    const historyEntry = {
      stage: stage,
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes: notes || ''
    };
    
    const result = await db.collection('deals').updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: updateData,
        $push: { workflowHistory: historyEntry }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    res.json({ message: 'Deal stage updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve document
app.put('/api/deals/:id/documents/:documentType/approve', authenticateToken, async (req, res) => {
  try {
    const { documentType } = req.params;
    const { approved, notes } = req.body;
    
    const updateData = {
      [`documentation.${documentType}Present`]: approved,
      updatedAt: new Date()
    };
    
    // Add to activity log
    const activityEntry = {
      action: approved ? 'document_approved' : 'document_rejected',
      documentType: documentType,
      timestamp: new Date(),
      performedBy: req.user._id,
      notes: notes || ''
    };
    
    const result = await db.collection('deals').updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: updateData,
        $push: { activityLog: activityEntry }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    res.json({ message: 'Document status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =================== SALES DEALS ENDPOINTS ===================

// Get sales deals (for sales representatives)
app.get('/api/deals/sales', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Build query based on filters
    let query = {};
    
    if (req.query.stage) {
      query.currentStage = req.query.stage;
    }
    
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    
    if (req.query.search) {
      query.$or = [
        { vin: { $regex: req.query.search, $options: 'i' } },
        { rpStockNumber: { $regex: req.query.search, $options: 'i' } },
        { 'seller.name': { $regex: req.query.search, $options: 'i' } },
        { 'seller.company': { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Sales users can see all deals but with limited financial info
    const deals = await db.collection('deals')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
      
    const total = await db.collection('deals').countDocuments(query);
    
    // Transform deals for sales view (hide sensitive financial data for non-admin users)
    const transformedDeals = deals.map(deal => {
      const transformedDeal = {
        id: deal._id.toString(),
        vin: deal.vin,
        stockNumber: deal.rpStockNumber,
        vehicle: `${deal.year || ''} ${deal.make || ''} ${deal.model || ''}`.trim(),
        seller: deal.seller,
        buyer: deal.buyer,
        currentStage: deal.currentStage,
        priority: deal.priority,
        status: deal.status,
        purchaseDate: deal.purchaseDate,
        saleDate: deal.saleDate,
        notes: deal.generalNotes,
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt,
        completionPercentage: deal.completionPercentage || 0,
        pendingDocumentsCount: deal.pendingDocumentsCount || 0
      };
      
      // Only show financial data to admin and finance users
      if (req.user.role === 'admin' || req.user.role === 'finance') {
        transformedDeal.purchasePrice = deal.financial?.purchasePrice;
        transformedDeal.salePrice = deal.financial?.salePrice;
      }
      
      return transformedDeal;
    });
    
    res.json({
      success: true,
      data: transformedDeals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Sales deals error:', error);
    res.status(500).json({ error: 'Failed to retrieve deals' });
  }
});

// Get sales statistics
app.get('/api/deals/sales/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await db.collection('deals').aggregate([
      {
        $group: {
          _id: null,
          totalDeals: { $sum: 1 },
          activeDeals: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          },
          completedDeals: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          totalVolume: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                { $add: ['$financial.purchasePrice', '$financial.salePrice'] },
                0
              ]
            }
          }
        }
      }
    ]).toArray();
    
    const result = stats[0] || {
      totalDeals: 0,
      activeDeals: 0,
      completedDeals: 0,
      totalVolume: 0
    };
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

// =================== UTILITY FUNCTIONS ===================

function isRetailDeal(deal) {
  const dealType = deal.dealTypes?.primary?.toLowerCase();
  return dealType && dealType.includes('retail');
}

async function updateDealerHistory(dealerName, dealId, dealData) {
  try {
    const existingDealer = await db.collection('dealers').findOne({ 
      name: { $regex: `^${dealerName}$`, $options: 'i' } 
    });
    
    const historyEntry = {
      dealId: dealId,
      date: new Date(),
      type: dealData.dealTypes?.secondary === 'buy' ? 'purchase' : 'sale',
      amount: dealData.financials?.purchasePrice || dealData.financials?.salePrice || 0,
      vehicle: `${dealData.vehicle?.year || ''} ${dealData.vehicle?.make || ''} ${dealData.vehicle?.model || ''}`.trim()
    };
    
    if (existingDealer) {
      // Update existing dealer
      await db.collection('dealers').updateOne(
        { _id: existingDealer._id },
        {
          $push: { dealHistory: historyEntry },
          $inc: {
            'metrics.totalDeals': 1,
            'metrics.totalPurchaseVolume': historyEntry.type === 'purchase' ? historyEntry.amount : 0,
            'metrics.totalSaleVolume': historyEntry.type === 'sale' ? historyEntry.amount : 0
          },
          $set: {
            'metrics.lastDealDate': new Date(),
            updatedAt: new Date()
          }
        }
      );
    } else {
      // Create new dealer
      const newDealer = {
        name: dealerName,
        type: 'individual',
        status: 'active',
        contact: dealData.parties?.purchasedFrom?.contact || {},
        metrics: {
          totalDeals: 1,
          totalPurchaseVolume: historyEntry.type === 'purchase' ? historyEntry.amount : 0,
          totalSaleVolume: historyEntry.type === 'sale' ? historyEntry.amount : 0,
          lastDealDate: new Date()
        },
        dealHistory: [historyEntry],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('dealers').insertOne(newDealer);
    }
  } catch (error) {
    console.error('Error updating dealer history:', error);
  }
}

// =================== SERVER STARTUP ===================

async function startServer() {
  try {
    await connectToDatabase();
  } catch (error) {
    console.log('⚠️  Continuing without database connection...');
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 RP Exotics API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await client.close();
  process.exit(0);
}); 