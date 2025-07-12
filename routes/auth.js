const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Team member credentials (in production, these would be in a database)
const TEAM_MEMBERS = {
  'parker@rpexotics.com': { password: '1234', role: 'sales', displayName: 'Parker' },
  'brennan@rpexotics.com': { password: '1026', role: 'sales', displayName: 'Brennan' },
  'dan@rpexotics.com': { password: 'Ilikemen', role: 'sales', displayName: 'Dan' },
  'adiana@rpexotics.com': { password: 'PalicARP', role: 'sales', displayName: 'Adiana' },
  'brett@rpexotics.com': { password: 'coop123!', role: 'sales', displayName: 'Brett' },
  'chris@rpexotics.com': { password: 'Matti11!', role: 'admin', displayName: 'Chris' },
  'tammie@rpexotics.com': { password: 'Twood1125!', role: 'admin', displayName: 'Tammie' },
  'lynn@rpexotics.com': { password: 'titles123', role: 'finance', displayName: 'Lynn' }
};

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'rp-exotics-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Login endpoint with Remember Me functionality
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const user = TEAM_MEMBERS[email];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password (in production, use bcrypt.compare)
    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create user profile
    const profile = {
      displayName: user.displayName,
      email: email,
      role: user.role,
      department: user.role === 'admin' ? 'Administration' : 
                  user.role === 'finance' ? 'Finance' : 'Sales'
    };

    // Set token expiration based on rememberMe
    // If rememberMe is true: 12 hours, otherwise: 24 hours
    const tokenExpiration = rememberMe ? '12h' : '24h';

    // Generate JWT token
    const token = jwt.sign(
      { 
        email: email, 
        role: user.role,
        displayName: user.displayName,
        rememberMe: rememberMe,
        loginTime: new Date().toISOString()
      }, 
      JWT_SECRET, 
      { expiresIn: tokenExpiration }
    );

    res.json({
      success: true,
      token: token,
      expiresIn: tokenExpiration,
      rememberMe: rememberMe,
      user: {
        profile: profile,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if user is still logged in (within 12 hours if rememberMe was used)
router.get('/check-session', authenticateToken, (req, res) => {
  try {
    const user = TEAM_MEMBERS[req.user.email];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if this was a "remember me" session and if it's still within 12 hours
    const loginTime = new Date(req.user.loginTime);
    const currentTime = new Date();
    const hoursSinceLogin = (currentTime - loginTime) / (1000 * 60 * 60);

    // If rememberMe was used and it's been more than 12 hours, require re-login
    if (req.user.rememberMe && hoursSinceLogin > 12) {
      return res.status(401).json({ 
        error: 'Session expired', 
        message: 'Please log in again',
        expired: true
      });
    }

    const profile = {
      displayName: user.displayName,
      email: req.user.email,
      role: user.role,
      department: user.role === 'admin' ? 'Administration' : 
                  user.role === 'finance' ? 'Finance' : 'Sales'
    };

    // Define permissions based on role
    const permissions = {
      sales: ['view_deals', 'create_deals', 'edit_deals'],
      admin: ['view_deals', 'create_deals', 'edit_deals', 'delete_deals', 'manage_users', 'view_reports'],
      finance: ['view_deals', 'view_reports', 'manage_finances']
    };

    res.json({
      success: true,
      profile: profile,
      permissions: permissions[user.role] || [],
      rememberMe: req.user.rememberMe,
      loginTime: req.user.loginTime,
      hoursSinceLogin: Math.round(hoursSinceLogin * 100) / 100
    });

  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, (req, res) => {
  // In a real app, you might blacklist the token
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const user = TEAM_MEMBERS[req.user.email];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = {
      displayName: user.displayName,
      email: req.user.email,
      role: user.role,
      department: user.role === 'admin' ? 'Administration' : 
                  user.role === 'finance' ? 'Finance' : 'Sales'
    };

    // Define permissions based on role
    const permissions = {
      sales: ['view_deals', 'create_deals', 'edit_deals'],
      admin: ['view_deals', 'create_deals', 'edit_deals', 'delete_deals', 'manage_users', 'view_reports'],
      finance: ['view_deals', 'view_reports', 'manage_finances']
    };

    res.json({
      success: true,
      profile: profile,
      permissions: permissions[user.role] || []
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Authentication service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 