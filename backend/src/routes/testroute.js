import express from 'express';

const router = express.Router();

router.get('/test', (req, res) => {
  console.log('🧪 Test route hit');
  res.json({ message: 'Test routes working!', timestamp: new Date().toISOString() });
});

router.get('/documents', (req, res) => {
  console.log('📋 Test documents route hit');
  res.json({
    message: 'Mock documents route working',
    documents: [
      { id: 1, title: 'Test Document 1', type: 'pdf', status: 'indexed' },
      { id: 2, title: 'Test Document 2', type: 'confluence', status: 'indexed' },
    ],
    total: 2,
    page: 1,
    totalPages: 1,
  });
});

export default router;
