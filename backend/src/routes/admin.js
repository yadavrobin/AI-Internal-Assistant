import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { knowledgeController } from '../controllers/knowledgeController.js';
import { authenticateToken } from '../middleware/auth.js';
import { Pool } from 'pg';

const router = express.Router();

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware to check admin access
const requireAdmin = (req, res, next) => {
  if (!req.user || (!req.user.is_admin && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.get('/test', (req, res) => {
  res.json({ message: 'Admin routes working!' });
});

// Test knowledge controller via admin route (temporary)
router.get('/test-knowledge', knowledgeController.getDocuments);

// Move knowledge routes here temporarily due to module loading issues
router.get('/knowledge-docs', knowledgeController.getDocuments);
router.post('/knowledge-search', authenticateToken, knowledgeController.searchDocuments);

// New Admin Panel Routes
// Get all user queries/messages
router.get('/queries', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get user messages with user info
    const result = await pool.query(`
      SELECT 
        cm.id,
        cm.message as content,
        cm.created_at,
        'user' as sender,
        u.name as user_name,
        u.email as user_email,
        EXISTS(
          SELECT 1 FROM chat_messages cm2 
          WHERE cm2.session_id = cm.session_id 
          AND cm2.response IS NOT NULL 
          AND cm2.created_at >= cm.created_at
        ) as has_response
      FROM chat_messages cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.message IS NOT NULL
      ORDER BY cm.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*) 
      FROM chat_messages 
      WHERE message IS NOT NULL
    `);

    res.json({
      queries: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Failed to get queries:', error);
    res.status(500).json({ error: 'Failed to fetch user queries' });
  }
});

// Get knowledge entries
router.get('/knowledge', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title, content, source, department, tags, created_at, updated_at
      FROM knowledge_base
      ORDER BY 
        CASE WHEN source = 'admin' THEN 1 ELSE 2 END,
        created_at DESC
    `);

    res.json({
      entries: result.rows
    });
  } catch (error) {
    console.error('Failed to get knowledge entries:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge entries' });
  }
});

// Add new knowledge entry
router.post('/knowledge', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, content, department, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await pool.query(`
      INSERT INTO knowledge_base (title, content, source, department, tags, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [title, content, 'admin', department || '', JSON.stringify(tags || []), req.user.id]);

    res.json({
      success: true,
      entry: result.rows[0]
    });
  } catch (error) {
    console.error('Failed to add knowledge entry:', error);
    res.status(500).json({ error: 'Failed to add knowledge entry' });
  }
});

// Update knowledge entry
router.put('/knowledge/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, department, tags } = req.body;

    const result = await pool.query(`
      UPDATE knowledge_base 
      SET title = $1, content = $2, department = $3, tags = $4, updated_at = NOW()
      WHERE id = $5 AND source = 'admin'
      RETURNING *
    `, [title, content, department || '', JSON.stringify(tags || []), id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin knowledge entry not found' });
    }

    res.json({
      success: true,
      entry: result.rows[0]
    });
  } catch (error) {
    console.error('Failed to update knowledge entry:', error);
    res.status(500).json({ error: 'Failed to update knowledge entry' });
  }
});

// Delete knowledge entry
router.delete('/knowledge/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      DELETE FROM knowledge_base 
      WHERE id = $1 AND source = 'admin'
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin knowledge entry not found' });
    }

    res.json({
      success: true,
      message: 'Knowledge entry deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete knowledge entry:', error);
    res.status(500).json({ error: 'Failed to delete knowledge entry' });
  }
});

// Protected admin routes (existing)
router.get('/users', authenticateToken, adminController.getUsers);
router.post('/users', authenticateToken, adminController.createUser);
router.put('/users/:id', authenticateToken, adminController.updateUser);
router.delete('/users/:id', authenticateToken, adminController.deleteUser);
router.get('/stats', authenticateToken, adminController.getStats);
router.get('/settings', authenticateToken, adminController.getSettings);
router.put('/settings', authenticateToken, adminController.updateSettings);
router.get('/documents', authenticateToken, adminController.getDocuments);
router.post('/sync-documents', authenticateToken, adminController.syncDocuments);

export default router;
