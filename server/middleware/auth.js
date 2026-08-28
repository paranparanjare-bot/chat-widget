const jwt = require('jsonwebtoken');
const database = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

const authMiddleware = {
  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  },

  // Verify JWT token
  verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token.' 
      });
    }
  },

  // Login handler
  login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      const user = database.verifyAdmin(username, password);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      const token = authMiddleware.generateToken(user);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Verify token endpoint
  verify(req, res) {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  },

  // Change password
  changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const { username } = req.user;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters'
        });
      }

      // Verify current password
      const user = database.verifyAdmin(username, currentPassword);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      const success = database.updateAdminPassword(username, newPassword);

      if (success) {
        res.json({
          success: true,
          message: 'Password changed successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to change password'
        });
      }
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Logout (client-side only, but we can add token blacklist here if needed)
  logout(req, res) {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  }
};

module.exports = authMiddleware;
