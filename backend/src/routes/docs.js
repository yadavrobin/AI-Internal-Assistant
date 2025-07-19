import express from 'express';
import { knowledgeController } from '../controllers/knowledgeController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/test', (req, res) => {
  console.log('🧪 Docs test route hit');
  res.json({ message: 'Docs routes working!', timestamp: new Date().toISOString() });
});

// Documents endpoint (with auth)
router.get('/documents', authenticateToken, knowledgeController.getDocuments);

// Other endpoints
router.post('/search', authenticateToken, knowledgeController.searchDocuments);
router.get('/sync-status', authenticateToken, knowledgeController.getSyncStatus);
router.post('/sync', authenticateToken, knowledgeController.triggerSync);
router.get('/documents/:id', authenticateToken, knowledgeController.getDocument);

export default router;
