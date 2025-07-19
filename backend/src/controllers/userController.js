import { pool } from '../config/database.js';

export const userController = {
  // Get current user profile
  getProfile: async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, google_id, email, name, avatar_url, is_admin, is_active, created_at, last_login FROM users WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user: result.rows[0] });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { name } = req.body;
      const userId = req.user.id;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const result = await pool.query(
        'UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, avatar_url, is_admin',
        [name.trim(), userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user: result.rows[0] });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },

  // Get user's activity/statistics
  getActivity: async (req, res) => {
    try {
      const userId = req.user.id;

      // Get chat statistics
      const chatStats = await pool.query(`
        SELECT 
          COUNT(DISTINCT cs.id) as total_conversations,
          COUNT(m.id) as total_messages,
          MAX(cs.updated_at) as last_chat
        FROM chat_sessions cs
        LEFT JOIN messages m ON cs.id = m.session_id
        WHERE cs.user_id = $1
      `, [userId]);

      // Get recent conversations
      const recentChats = await pool.query(`
        SELECT id, title, updated_at,
               (SELECT COUNT(*) FROM messages WHERE session_id = chat_sessions.id) as message_count
        FROM chat_sessions 
        WHERE user_id = $1 
        ORDER BY updated_at DESC 
        LIMIT 5
      `, [userId]);

      res.json({
        stats: chatStats.rows[0],
        recentConversations: recentChats.rows,
      });
    } catch (error) {
      console.error('Get activity error:', error);
      res.status(500).json({ error: 'Failed to fetch activity' });
    }
  },

  // Update last login timestamp
  updateLastLogin: async (req, res) => {
    try {
      const userId = req.user.id;

      await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );

      res.json({ message: 'Last login updated' });
    } catch (error) {
      console.error('Update last login error:', error);
      res.status(500).json({ error: 'Failed to update last login' });
    }
  },

  // Delete user account (soft delete)
  deleteAccount: async (req, res) => {
    try {
      const userId = req.user.id;

      // Soft delete by deactivating account
      const result = await pool.query(
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'Account deactivated successfully' });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  },
};
