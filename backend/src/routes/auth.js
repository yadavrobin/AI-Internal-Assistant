import express from 'express';
import passport from '../config/passport.js';
import { authController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Simple test endpoint to verify routes work
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working!', timestamp: new Date().toISOString() });
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  authController.handleGoogleCallback
);

// Authentication endpoints
router.post('/verify', authController.verifyToken);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/logout', authController.logout);
router.get('/check', authenticateToken, authController.checkAuth);

export default router;
