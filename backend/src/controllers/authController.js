import { pool } from '../config/database.js';
import jwt from 'jsonwebtoken';

export const authController = {
  // Google OAuth callback handler
  handleGoogleCallback: async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: req.user.id, 
          email: req.user.email,
          is_admin: req.user.is_admin 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=server_error`);
    }
  },

  // Get current user
  getCurrentUser: async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, google_id, email, name, avatar_url, is_admin, role, is_active, created_at, last_login FROM users WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user: result.rows[0] });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Logout
  logout: (req, res) => {
    try {
      res.clearCookie('token');
      req.logout((err) => {
        if (err) {
          console.error('Logout error:', err);
          return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logged out successfully' });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Check authentication status
  checkAuth: (req, res) => {
    res.json({ 
      authenticated: true, 
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        avatar_url: req.user.avatar_url,
        is_admin: req.user.is_admin,
      }
    });
  },

  // Verify token
  verifyToken: async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ success: false, error: 'Token is required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production');
      
      // Get user from database
      const result = await pool.query(
        'SELECT id, google_id, email, name, avatar_url, is_admin FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      res.json({ 
        success: true, 
        user: result.rows[0],
        token 
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
  },
};
