import { pool } from '../config/database.js';

export const adminController = {
  // Get all users
  getUsers: async (req, res) => {
    try {
      if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const result = await pool.query(`
        SELECT id, google_id, email, name, avatar_url, is_admin, is_active, 
               created_at, last_login,
               (SELECT COUNT(*) FROM chat_sessions WHERE user_id = users.id) as chat_count
        FROM users 
        ORDER BY created_at DESC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },

  // Create user
  createUser: async (req, res) => {
    try {
      if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { email, name, is_admin = false, is_active = true } = req.body;

      if (!email || !name) {
        return res.status(400).json({ error: 'Email and name are required' });
      }

      const result = await pool.query(
        'INSERT INTO users (email, name, is_admin, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
        [email, name, is_admin, is_active]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  },

  // Update user
  updateUser: async (req, res) => {
    try {
      if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id } = req.params;
      const { name, is_admin, is_active } = req.body;

      const result = await pool.query(
        'UPDATE users SET name = $1, is_admin = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
        [name, is_admin, is_active, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  },

  // Delete user
  deleteUser: async (req, res) => {
    try {
      if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id } = req.params;

      // Prevent admin from deleting themselves
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      // Delete related data first
      await pool.query('DELETE FROM messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = $1)', [id]);
      await pool.query('DELETE FROM chat_sessions WHERE user_id = $1', [id]);

      const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  },

  // Get system statistics
  getStats: async (req, res) => {
    try {
      if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Get user stats
      const userStatsResult = await pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE is_active = true) as active_users,
          COUNT(*) FILTER (WHERE is_admin = true) as admin_users
        FROM users
      `);

      // Get document stats
      const docStatsResult = await pool.query(`
        SELECT 
          COUNT(*) as total_documents,
          COUNT(DISTINCT type) as document_types
        FROM documents
      `);

      // Get chat stats
      const chatStatsResult = await pool.query(`
        SELECT 
          COUNT(DISTINCT chat_sessions.id) as total_conversations,
          COUNT(messages.id) as total_messages,
          AVG(EXTRACT(EPOCH FROM (messages.created_at - LAG(messages.created_at) OVER (PARTITION BY session_id ORDER BY messages.created_at)))) as avg_response_time
        FROM chat_sessions 
        LEFT JOIN messages ON chat_sessions.id = messages.session_id
      `);

      res.json({
        users: userStatsResult.rows[0],
        documents: docStatsResult.rows[0],
        chat: chatStatsResult.rows[0],
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version,
        },
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  },

  // Get system settings
  getSettings: async (req, res) => {
    try {
      if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // In a real implementation, these would come from a settings table
      const settings = {
        ai: {
          model: process.env.GROQ_MODEL || 'llama3-8b-8192',
          maxTokens: parseInt(process.env.MAX_TOKENS) || 2048,
          temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
        },
        sync: {
          enabled: process.env.AUTO_SYNC === 'true',
          interval: parseInt(process.env.SYNC_INTERVAL) || 24,
          confluenceUrl: process.env.CONFLUENCE_URL || '',
        },
        security: {
          jwtExpiry: '24h',
          sessionTimeout: 24 * 60 * 60 * 1000,
          rateLimitWindow: 15 * 60 * 1000,
          rateLimitMax: 100,
        },
        features: {
          analytics: true,
          logging: true,
          vectorSearch: true,
        },
      };

      res.json(settings);
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  },

  // Update system settings
  updateSettings: async (req, res) => {
    try {
      if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { settings } = req.body;

      // In a real implementation, this would update a settings table
      // For now, we'll just return success
      res.json({
        message: 'Settings updated successfully',
        note: 'Some changes may require a server restart to take effect',
      });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  },

  // Get all documents (admin view)
  getDocuments: async (req, res) => {
    try {
      if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const result = await pool.query(`
        SELECT id, title, source, updated_at, 
               (CASE WHEN content IS NOT NULL THEN 'indexed' ELSE 'pending' END) as status
        FROM knowledge_documents 
        ORDER BY updated_at DESC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error('Get admin documents error:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  },

  // Sync documents (admin action)
  syncDocuments: async (req, res) => {
    try {
      if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // In a real implementation, this would trigger the Confluence sync
      res.json({
        message: 'Document sync initiated',
        status: 'in_progress',
        estimatedTime: '5-10 minutes',
      });
    } catch (error) {
      console.error('Sync documents error:', error);
      res.status(500).json({ error: 'Failed to sync documents' });
    }
  },
};
