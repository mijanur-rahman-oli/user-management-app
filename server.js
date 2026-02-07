// IMPORTANT: Express server with API routes for user management
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const db = require('./database/db');
const { authenticateToken, generateToken } = require('./middleware/auth');
const { sendVerificationEmail, verifyEmailToken } = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // NOTE: Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length === 0) {
      return res.status(400).json({ error: 'Password cannot be empty' });
    }

    // NOTE: Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, status) 
       VALUES ($1, $2, $3, 'unverified') 
       RETURNING id, name, email, status, registration_time`,
      [name, email, passwordHash]
    );

    const user = result.rows[0];
    const userId = db.getUniqIdValue(result);

    // IMPORTANT: Send verification email asynchronously (doesn't block response)
    sendVerificationEmail(userId, email, name);

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // NOTA BENE: Handle unique constraint violation from database
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// NOTE: User login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // NOTE: Find user by email
    const result = await db.query(
      'SELECT id, name, email, password_hash, status FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // IMPORTANT: Blocked users cannot login
    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Your account has been blocked' });
    }

    // NOTE: Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // IMPORTANT: Update last login time
    await db.query(
      'UPDATE users SET last_login_time = NOW() WHERE id = $1',
      [user.id]
    );

    // NOTE: Generate JWT token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// NOTE: Email verification endpoint
app.get('/api/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send('<h1>Invalid verification link</h1>');
    }

    const result = await verifyEmailToken(token);

    if (result.success) {
      res.send(`
        <html>
          <head><title>Email Verified</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #28a745;">✓ Email Verified Successfully!</h1>
            <p>Your account is now active. You can close this window and login.</p>
          </body>
        </html>
      `);
    } else {
      res.status(400).send(`
        <html>
          <head><title>Verification Failed</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc3545;">✗ Verification Failed</h1>
            <p>${result.message}</p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).send('<h1>Verification failed</h1>');
  }
});

// NOTE: Get all users (sorted by last_login_time - REQUIREMENT #3)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // IMPORTANT: Sort by last_login_time DESC (most recent first) - REQUIREMENT #3
    const result = await db.query(
      `SELECT id, name, email, status, last_login_time, registration_time, created_at
       FROM users 
       ORDER BY last_login_time DESC NULLS LAST, registration_time DESC`
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// NOTE: Block selected users
app.post('/api/users/block', authenticateToken, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    // IMPORTANT: Block users (including self-blocking allowed)
    await db.query(
      'UPDATE users SET status = $1 WHERE id = ANY($2)',
      ['blocked', userIds]
    );

    res.json({ 
      message: `${userIds.length} user(s) blocked successfully`,
      count: userIds.length 
    });
  } catch (error) {
    console.error('Error blocking users:', error);
    res.status(500).json({ error: 'Failed to block users' });
  }
});

// NOTE: Unblock selected users
app.post('/api/users/unblock', authenticateToken, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    // IMPORTANT: Unblock users - set to 'active' if currently blocked
    await db.query(
      `UPDATE users 
       SET status = CASE 
         WHEN status = 'blocked' THEN 'active'
         ELSE status
       END
       WHERE id = ANY($1)`,
      [userIds]
    );

    res.json({ 
      message: `${userIds.length} user(s) unblocked successfully`,
      count: userIds.length 
    });
  } catch (error) {
    console.error('Error unblocking users:', error);
    res.status(500).json({ error: 'Failed to unblock users' });
  }
});

app.delete('/api/users/delete', authenticateToken, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    // IMPORTANT: Actually delete users from database (not soft delete)
    const result = await db.query(
      'DELETE FROM users WHERE id = ANY($1) RETURNING id',
      [userIds]
    );

    res.json({ 
      message: `${result.rows.length} user(s) deleted successfully`,
      count: result.rows.length 
    });
  } catch (error) {
    console.error('Error deleting users:', error);
    res.status(500).json({ error: 'Failed to delete users' });
  }
});

// NOTE: Delete unverified users
app.delete('/api/users/delete-unverified', authenticateToken, async (req, res) => {
  try {
    // IMPORTANT: Delete all unverified users
    const result = await db.query(
      `DELETE FROM users WHERE status = 'unverified' RETURNING id`
    );

    res.json({ 
      message: `${result.rows.length} unverified user(s) deleted successfully`,
      count: result.rows.length 
    });
  } catch (error) {
    console.error('Error deleting unverified users:', error);
    res.status(500).json({ error: 'Failed to delete unverified users' });
  }
});

// NOTE: Get current user info
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, status, last_login_time, registration_time FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});