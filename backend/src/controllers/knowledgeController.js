import { pool } from '../config/database.js';
import { searchSimilarDocuments } from '../config/qdrant.js';

export const knowledgeController = {
  // Get documents with search and filtering
  getDocuments: async (req, res) => {
    console.log('🔍 getDocuments called with query:', req.query);
    try {
      const { page = 1, limit = 20, type, search } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = `
        SELECT id, title, source, content, updated_at, department, tags, source_url
        FROM knowledge_documents 
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      // Add type filter
      if (type && type !== 'all') {
        paramCount++;
        query += ` AND type = $${paramCount}`;
        params.push(type);
      }

      // Add search filter
      if (search) {
        paramCount++;
        query += ` AND (title ILIKE $${paramCount} OR content ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      // Add pagination
      query += ` ORDER BY updated_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(parseInt(limit), offset);

      console.log('🔍 Executing query:', query);
      console.log('🔍 With params:', params);

      const result = await pool.query(query, params);
      console.log('🔍 Query result count:', result.rows.length);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) FROM knowledge_documents WHERE 1=1';
      const countParams = [];
      let countParamCount = 0;

      if (type && type !== 'all') {
        countParamCount++;
        countQuery += ` AND type = $${countParamCount}`;
        countParams.push(type);
      }

      if (search) {
        countParamCount++;
        countQuery += ` AND (title ILIKE $${countParamCount} OR content ILIKE $${countParamCount})`;
        countParams.push(`%${search}%`);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);
      console.log('🔍 Total count:', total);

      const response = {
        documents: result.rows,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      };
      
      console.log('🔍 Sending response:', JSON.stringify(response, null, 2));
      res.json(response);
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  },

  // Search documents using vector similarity
  searchDocuments: async (req, res) => {
    try {
      const { query, limit = 10 } = req.body;

      if (!query || !query.trim()) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const results = await searchSimilarDocuments(query.trim(), parseInt(limit));

      res.json({
        results: results.map(result => ({
          id: result.id,
          title: result.payload.title,
          content: result.payload.content,
          document: result.payload.document,
          score: result.score,
          metadata: result.payload.metadata || {},
        })),
      });
    } catch (error) {
      console.error('Search documents error:', error);
      res.status(500).json({ error: 'Failed to search documents' });
    }
  },

  // Get sync status
  getSyncStatus: async (req, res) => {
    try {
      // Get document counts
      const docCountResult = await pool.query('SELECT COUNT(*) FROM knowledge_documents');
      const documentCount = parseInt(docCountResult.rows[0].count);

      // Get last sync info (this would come from a sync log table in real implementation)
      const lastSyncResult = await pool.query(
        'SELECT MAX(updated_at) as last_sync FROM knowledge_documents'
      );

      // Get collection info from Qdrant
      let vectorCount = 0;
      try {
        // TODO: Implement getCollectionInfo or get from qdrant client directly
        vectorCount = 0; // Placeholder
      } catch (error) {
        console.warn('Failed to get vector count:', error.message);
      }

      res.json({
        status: 'ready',
        documentCount,
        vectorCount,
        lastSync: lastSyncResult.rows[0].last_sync,
        health: {
          database: 'connected',
          vectorDB: vectorCount > 0 ? 'connected' : 'empty',
        },
      });
    } catch (error) {
      console.error('Get sync status error:', error);
      res.status(500).json({ error: 'Failed to get sync status' });
    }
  },

  // Trigger document sync (placeholder for Confluence integration)
  triggerSync: async (req, res) => {
    try {
      // In a real implementation, this would:
      // 1. Connect to Confluence API
      // 2. Fetch new/updated documents
      // 3. Process and embed them
      // 4. Store in database and vector DB

      // For now, return a success message
      res.json({
        message: 'Sync initiated',
        status: 'in_progress',
        estimatedTime: '5-10 minutes',
      });
    } catch (error) {
      console.error('Trigger sync error:', error);
      res.status(500).json({ error: 'Failed to trigger sync' });
    }
  },

  // Get document by ID
  getDocument: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'SELECT * FROM knowledge_documents WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json({ document: result.rows[0] });
    } catch (error) {
      console.error('Get document error:', error);
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  },
};
