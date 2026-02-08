// IMPORTANT: Authentication middleware for JWT token validation
// REQUIREMENT #5: Before each request except registration/login, check if user exists and isn't blocked
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// NOTE: Middleware to verify JWT token and check user status
// IMPORTANT: This redirects to login if user is blocked or deleted
async function authenticateToken(req, res, next) {
  try {
    // NOTA BENE: Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // NOTE: Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // IMPORTANT: Check if user still exists and is not blocked (REQUIREMENT #5)
    const result = await db.query(
      'SELECT id, email, name, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      // User was deleted - redirect to login
      return res.status(401).json({ 
        error: 'User account not found. Please login again.',
        redirectToLogin: true 
      });
    }

    const user = result.rows[0];

    // NOTA BENE: Check if user is blocked
    if (user.status === 'blocked') {
      return res.status(403).json({ 
        error: 'Your account has been blocked. Please contact support.',
        redirectToLogin: true 
      });
    }

    // NOTE: Attach user information to request object
    req.user = {
      userId: user.id,
      email: user.email,
      name: user.name,
      status: user.status
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.', redirectToLogin: true });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.', redirectToLogin: true });
    }
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed.' });
  }
}

// IMPORTANT: Helper function to generate JWT token
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
}

module.exports = {
  authenticateToken,
  generateToken,
  JWT_SECRET
};