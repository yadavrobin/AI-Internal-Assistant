import express from 'express';

// Simple test router to verify routing is working
const router = express.Router();

// Test endpoint (no auth required for testing)
router.get('/test', (req, res) => {
  res.json({ message: 'Chat routes working!', timestamp: new Date().toISOString() });
});

// Simple message endpoint for testing
router.post('/message', (req, res) => {
  console.log('📝 Message endpoint hit!');
  console.log('Request body:', req.body);
  res.json({ 
    success: true, 
    message: 'Message received!',
    received: req.body 
  });
});

export default router;
