import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production');
    
    // Get user from database
    const client = await pool.connect();
    const user = await client.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    client.release();

    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = { ...user.rows[0], userId: user.rows[0].id };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

export {
  authenticateToken,
  requireAdmin,
  requireAuth,
};
