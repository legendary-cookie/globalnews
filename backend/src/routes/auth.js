const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';

// In-memory user store (replace with database in production)
const users = [];
const refreshTokens = new Set();

// Generate tokens
function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  refreshTokens.add(refreshToken);
  
  return { accessToken, refreshToken };
}

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('username').trim().isLength({ min: 3 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password, username } = req.body;
    
    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = {
      id: `user-${Date.now()}`,
      email,
      username,
      password: hashedPassword,
      avatarUrl: null,
      subscriptionTier: 'free',
      preferences: {
        theme: 'dark',
        language: 'en',
        region: 'world',
        notifications: {
          breakingNews: true,
          emailDigest: true,
          pushNotifications: true,
          favoriteSources: true,
          watchlistUpdates: true,
        },
        defaultView: 'grid',
        autoPlayVideos: false,
      },
      createdAt: new Date().toISOString(),
    };
    
    users.push(user);
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatarUrl: user.avatarUrl,
          subscriptionTier: user.subscriptionTier,
          preferences: user.preferences,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatarUrl: user.avatarUrl,
          subscriptionTier: user.subscriptionTier,
          preferences: user.preferences,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    if (!refreshTokens.has(refreshToken)) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    // Remove old refresh token
    refreshTokens.delete(refreshToken);
    
    // Generate new tokens
    const tokens = generateTokens(decoded.userId);
    
    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    next(error);
  }
});

// Logout
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      refreshTokens.delete(refreshToken);
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = users.find(u => u.id === decoded.userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatarUrl: user.avatarUrl,
          subscriptionTier: user.subscriptionTier,
          preferences: user.preferences,
        },
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(403).json({ error: 'Invalid access token' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(403).json({ error: 'Token expired' });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
