const jwt = require('jsonwebtoken');

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'rp-exotics-secret-key';

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

// Middleware to check if user has back office access
const requireBackOfficeAccess = (req, res, next) => {
  try {
    const user = TEAM_MEMBERS[req.user.email];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has back office access
    const hasBackOfficeAccess = user.role === 'admin' || user.role === 'finance';
    
    if (!hasBackOfficeAccess) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Back office access requires admin or finance role' 
      });
    }

    next();
  } catch (error) {
    console.error('Back office access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to check if user has admin access
const requireAdminAccess = (req, res, next) => {
  try {
    const user = TEAM_MEMBERS[req.user.email];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Admin access required' 
      });
    }

    next();
  } catch (error) {
    console.error('Admin access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to check if user has finance access
const requireFinanceAccess = (req, res, next) => {
  try {
    const user = TEAM_MEMBERS[req.user.email];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'finance' && user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Finance or admin access required' 
      });
    }

    next();
  } catch (error) {
    console.error('Finance access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  authenticateToken,
  requireBackOfficeAccess,
  requireAdminAccess,
  requireFinanceAccess
}; 