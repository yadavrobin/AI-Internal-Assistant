import express from 'express';
import { knowledgeController } from '../controllers/knowledgeController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

console.log('🔄 Loading knowledge routes from documents.js file');

router.get('/test', (req, res) => {
  console.log('🧪 Knowledge test route hit');
  res.json({ message: 'Knowledge routes working from DOCUMENTS.JS!', timestamp: new Date().toISOString() });
});

// Documents endpoint - now using real database data (no auth for testing)
router.get('/documents', knowledgeController.getDocuments);

// Real documents endpoint (with auth)
router.get('/documents-real', authenticateToken, knowledgeController.getDocuments);

// Other endpoints
router.post('/search', authenticateToken, knowledgeController.searchDocuments);
router.get('/sync-status', authenticateToken, knowledgeController.getSyncStatus);
router.post('/sync', authenticateToken, knowledgeController.triggerSync);
router.get('/documents/:id', authenticateToken, knowledgeController.getDocument);

export default router;
