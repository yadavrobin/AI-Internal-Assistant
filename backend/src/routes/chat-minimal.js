import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { generateResponse } from '../services/groqService.js';
import { searchSimilarDocuments } from '../config/qdrant.js';
import embeddingService from '../services/embeddingService.js';
import { pool } from '../config/database.js';

const router = express.Router();

// Simple test endpoints
router.get('/test', (req, res) => {
  res.json({ message: 'Minimal chat routes working!' });
});

// Send a message and get AI response with conversation persistence
router.post('/message', authenticateToken, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user.userId;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`🔄 Processing message from user ${userId}`);
    console.log(`📝 Message: "${message}"`);
    console.log(`💬 Conversation ID: ${conversationId || 'new'}`);

    // Step 1: Get or create conversation
    let currentConversationId = conversationId;
    
    if (!currentConversationId) {
      console.log('🆕 Creating new conversation...');
      const conversationResult = await pool.query(
        'INSERT INTO chat_sessions (user_id, title, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id',
        [userId, message.substring(0, 50) + (message.length > 50 ? '...' : '')]
      );
      currentConversationId = conversationResult.rows[0].id;
      console.log(`✅ Created conversation ${currentConversationId}`);
    }

    // Step 2: Generate embedding for the user's message
    const embedding = await embeddingService.generateEmbedding(message);

    // Step 3: Search for relevant documents
    const relevantDocs = await searchSimilarDocuments(embedding, 3);
    console.log(`📚 Found ${relevantDocs.length} relevant documents`);

    // Step 4: Build context from relevant documents
    let context = relevantDocs.length > 0 
      ? relevantDocs.map(doc => `**${doc.payload.title || 'Document'}:**\n${doc.payload.content}`).join('\n\n---\n\n')
      : '';

    console.log(`📄 Vector context length: ${context.length} characters`);

    // Step 4.5: Search unified knowledge base (includes both admin and confluence data)
    console.log('🔍 Searching unified knowledge base for admin and confluence data...');
    try {
      const knowledgeResult = await pool.query(`
        SELECT title, content, source, department, tags
        FROM knowledge_base
        WHERE to_tsvector('english', content || ' ' || title) @@ plainto_tsquery('english', $1)
        ORDER BY 
          CASE WHEN source = 'admin' THEN 1 ELSE 2 END, -- Prioritize admin knowledge
          ts_rank(to_tsvector('english', content || ' ' || title), plainto_tsquery('english', $1)) DESC
        LIMIT 5
      `, [message]);

      if (knowledgeResult.rows.length > 0) {
        console.log(`📋 Found ${knowledgeResult.rows.length} knowledge entries`);
        
        // Add knowledge to context
        const knowledgeContext = knowledgeResult.rows.map(row => 
          `**${row.source === 'admin' ? 'Company Policy' : 'Knowledge Document'} - ${row.title}**
Source: ${row.source === 'admin' ? 'Admin Knowledge' : 'Confluence'}
Department: ${row.department || 'General'}
Content: ${row.content}`
        ).join('\n\n');
        
        context = context ? context + '\n\n' + knowledgeContext : knowledgeContext;
        console.log(`📚 Updated context length: ${context.length} characters`);
      } else {
        console.log('📋 No knowledge entries found in unified knowledge base');
      }
    } catch (knowledgeSearchError) {
      console.warn('Knowledge base search failed:', knowledgeSearchError.message);
    }

    // Final context fallback
    if (!context || context.trim() === '') {
      context = 'No relevant documents found in the knowledge base.';
    }

    // Step 5: Get conversation history
    const historyResult = await pool.query(
      'SELECT message, response FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 5',
      [currentConversationId]
    );
    
    const conversationHistory = [];
    historyResult.rows.forEach(row => {
      conversationHistory.push({ role: 'user', content: row.message });
      if (row.response) {
        conversationHistory.push({ role: 'assistant', content: row.response });
      }
    });

    // Step 6: Generate AI response
    const aiResponse = await generateResponse(message, context, conversationHistory);

    // Step 7: Save message and response to database
    
    // Save user message and AI response in single row
    await pool.query(
      'INSERT INTO chat_messages (session_id, user_id, message, response, context_documents, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [currentConversationId, userId, message, aiResponse, JSON.stringify(relevantDocs.map(doc => ({ title: doc.payload.title, score: doc.score })))]
    );
    console.log('✅ Message saved successfully');

    // Step 8: Prepare response
    const sources = relevantDocs.map(doc => ({
      title: doc.payload.title || 'Untitled Document',
      score: doc.score,
      snippet: doc.payload.content.substring(0, 200) + (doc.payload.content.length > 200 ? '...' : '')
    }));

    const response = {
      message: aiResponse,
      conversationId: currentConversationId,
      sources: sources,
      timestamp: new Date().toISOString()
    };

    console.log('🎉 Chat response complete');
    res.json(response);

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: error.message
    });
  }
});

// Get recent conversations (quick access for dashboards)
router.get('/conversations/recent', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await pool.query(`
      SELECT 
        cs.id,
        cs.title,
        COUNT(cm.id) as "messageCount",
        cs.created_at as "createdAt",
        cs.updated_at as "updatedAt",
        cm_latest.message as "lastMessage",
        cm_latest.created_at as "lastMessageAt"
      FROM chat_sessions cs
      LEFT JOIN chat_messages cm ON cs.id = cm.session_id
      LEFT JOIN LATERAL (
        SELECT message, created_at
        FROM chat_messages 
        WHERE session_id = cs.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) cm_latest ON true
      WHERE cs.user_id = $1
      GROUP BY cs.id, cs.title, cs.created_at, cs.updated_at, cm_latest.message, cm_latest.created_at
      ORDER BY GREATEST(cs.updated_at, COALESCE(cm_latest.created_at, cs.created_at)) DESC
      LIMIT $2
    `, [req.user.userId, limit]);

    res.json({ 
      recentConversations: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching recent conversations:', error);
    res.status(500).json({ error: 'Failed to fetch recent conversations' });
  }
});

// Get conversation analytics/stats
router.get('/conversations/analytics', authenticateToken, async (req, res) => {
  try {
    // Get various analytics about user's conversations
    const result = await pool.query(`
      WITH conversation_stats AS (
        SELECT 
          cs.id,
          cs.created_at,
          COUNT(cm.id) as message_count
        FROM chat_sessions cs
        LEFT JOIN chat_messages cm ON cs.id = cm.session_id
        WHERE cs.user_id = $1
        GROUP BY cs.id, cs.created_at
      ),
      daily_usage AS (
        SELECT 
          DATE(cs.created_at) as date,
          COUNT(*) as conversations_created
        FROM chat_sessions cs
        WHERE cs.user_id = $1 
        AND cs.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(cs.created_at)
        ORDER BY date DESC
        LIMIT 30
      )
      SELECT 
        (SELECT COUNT(*) FROM chat_sessions WHERE user_id = $1) as total_conversations,
        (SELECT COUNT(*) FROM chat_messages WHERE user_id = $1) as total_messages,
        (SELECT ROUND(AVG(message_count), 2) FROM conversation_stats) as avg_messages_per_conversation,
        (SELECT COUNT(*) FROM conversation_stats WHERE message_count = 0) as empty_conversations,
        (SELECT COUNT(*) FROM chat_sessions WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days') as conversations_this_week,
        (SELECT COUNT(*) FROM chat_messages WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days') as messages_this_week,
        (SELECT json_agg(json_build_object('date', date, 'count', conversations_created) ORDER BY date DESC) FROM daily_usage) as daily_usage_last_30_days
    `, [req.user.userId]);

    const analytics = result.rows[0];
    
    // Calculate engagement metrics
    const engagementRate = analytics.total_conversations > 0 
      ? ((analytics.total_conversations - analytics.empty_conversations) / analytics.total_conversations * 100).toFixed(2)
      : 0;

    res.json({
      totalConversations: parseInt(analytics.total_conversations) || 0,
      totalMessages: parseInt(analytics.total_messages) || 0,
      averageMessagesPerConversation: parseFloat(analytics.avg_messages_per_conversation) || 0,
      emptyConversations: parseInt(analytics.empty_conversations) || 0,
      engagementRate: parseFloat(engagementRate),
      thisWeek: {
        conversations: parseInt(analytics.conversations_this_week) || 0,
        messages: parseInt(analytics.messages_this_week) || 0
      },
      dailyUsage: analytics.daily_usage_last_30_days || []
    });
  } catch (error) {
    console.error('Error fetching conversation analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Search conversations
router.get('/conversations/search', authenticateToken, async (req, res) => {
  try {
    const { q: query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchTerm = `%${query.trim()}%`;

    // Get total count for search results
    const countResult = await pool.query(`
      SELECT COUNT(DISTINCT cs.id) 
      FROM chat_sessions cs
      LEFT JOIN chat_messages cm ON cs.id = cm.session_id
      WHERE cs.user_id = $1 AND (
        cs.title ILIKE $2 OR 
        cm.message ILIKE $2 OR 
        cm.response ILIKE $2
      )
    `, [req.user.userId, searchTerm]);
    const totalCount = parseInt(countResult.rows[0].count);

    // Search conversations and messages
    const result = await pool.query(`
      SELECT DISTINCT
        cs.id,
        cs.title,
        COUNT(cm.id) as "messageCount",
        cs.created_at as "createdAt",
        cs.updated_at as "updatedAt",
        CASE 
          WHEN cs.title ILIKE $2 THEN 'title'
          WHEN cm.message ILIKE $2 THEN 'message'
          WHEN cm.response ILIKE $2 THEN 'response'
          ELSE 'unknown'
        END as "matchType"
      FROM chat_sessions cs
      LEFT JOIN chat_messages cm ON cs.id = cm.session_id
      WHERE cs.user_id = $1 AND (
        cs.title ILIKE $2 OR 
        cm.message ILIKE $2 OR 
        cm.response ILIKE $2
      )
      GROUP BY cs.id, cs.title, cs.created_at, cs.updated_at, "matchType"
      ORDER BY cs.updated_at DESC
      LIMIT $3 OFFSET $4
    `, [req.user.userId, searchTerm, limit, offset]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({ 
      conversations: result.rows,
      searchQuery: query,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error searching conversations:', error);
    res.status(500).json({ error: 'Failed to search conversations' });
  }
});

// Get all conversations for user with pagination
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM chat_sessions WHERE user_id = $1',
      [req.user.userId]
    );
    const totalCount = parseInt(countResult.rows[0].count);

    // Get conversations with pagination
    const result = await pool.query(`
      SELECT 
        cs.id,
        cs.title,
        COUNT(cm.id) as "messageCount",
        cs.created_at as "createdAt",
        cs.updated_at as "updatedAt"
      FROM chat_sessions cs
      LEFT JOIN chat_messages cm ON cs.id = cm.session_id
      WHERE cs.user_id = $1
      GROUP BY cs.id, cs.title, cs.created_at, cs.updated_at
      ORDER BY cs.updated_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.userId, limit, offset]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({ 
      conversations: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific conversation
router.get('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify the conversation belongs to the user
    const conversationResult = await pool.query(
      'SELECT id, title, created_at FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (conversationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get all messages for this conversation
    const messagesResult = await pool.query(
      'SELECT message, response, created_at FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [id]
    );

    const conversation = {
      ...conversationResult.rows[0],
      messages: messagesResult.rows.map(row => ({
        user: { role: 'user', content: row.message },
        assistant: { role: 'assistant', content: row.response },
        timestamp: row.created_at
      }))
    };

    res.json({ conversation });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Update conversation title
router.put('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (title.length > 200) {
      return res.status(400).json({ error: 'Title too long (max 200 characters)' });
    }

    // Verify conversation belongs to user and update
    const result = await pool.query(
      'UPDATE chat_sessions SET title = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING id, title, updated_at',
      [title.trim(), id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ 
      message: 'Conversation title updated successfully',
      conversation: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

// Delete conversation
router.delete('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify the conversation belongs to the user
    const conversationResult = await pool.query(
      'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (conversationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Delete messages first (due to foreign key constraint)
    await pool.query('DELETE FROM chat_messages WHERE session_id = $1', [id]);
    
    // Delete the conversation
    await pool.query('DELETE FROM chat_sessions WHERE id = $1', [id]);

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;
