import express from 'express';
import { userController } from '../controllers/userController.js';
import { knowledgeController } from '../controllers/knowledgeController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'User routes working!' });
});

// Protected user routes
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.get('/activity', authenticateToken, userController.getActivity);
router.post('/update-login', authenticateToken, userController.updateLastLogin);
router.delete('/account', authenticateToken, userController.deleteAccount);

export default router;
