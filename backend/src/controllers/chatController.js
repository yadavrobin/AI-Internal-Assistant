import { pool } from '../config/database.js';
import { generateResponse } from '../services/groqService.js';
import { searchSimilarDocuments } from '../config/qdrant.js';
import embeddingService from '../services/embeddingService.js';

export const chatController = {
  // Send a message and get AI response
  sendMessage: async (req, res) => {
    try {
      const { message, conversationId } = req.body;
      const userId = req.user.id;

      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }

      console.log('📝 Processing message for user:', req.user?.email);
      console.log('🔍 Message:', message);

      let sessionId = conversationId;

      // Create new conversation if none exists
      if (!sessionId) {
        const sessionResult = await pool.query(
          'INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING id',
          [userId, message.substring(0, 50) + (message.length > 50 ? '...' : '')]
        );
        sessionId = sessionResult.rows[0].id;
        console.log('💬 Created new conversation:', sessionId);
      }

      // Search for relevant documents
      let context = '';
      let sources = [];
      try {
        console.log('🔍 Searching knowledge base...');
        // Generate embedding for the user's message
        const queryEmbedding = await embeddingService.generateEmbedding(message);
        console.log('✅ Generated embedding, length:', queryEmbedding.length);
        
        // Search for similar documents
        const searchResults = await searchSimilarDocuments(queryEmbedding, {}, 3, 0.1);
        console.log('🔍 Search results:', searchResults?.length || 0);
        
        if (searchResults && searchResults.length > 0) {
          console.log('🔍 First result score:', searchResults[0].score);
          console.log('🔍 First result title:', searchResults[0].payload.title);
          
          context = searchResults.map(result => result.payload.content).join('\n\n');
          sources = searchResults.map(result => ({
            title: result.payload.title,
            score: result.score,
          }));
          console.log(`📚 Found ${sources.length} relevant documents`);
        } else {
          console.log('📚 No relevant documents found');
        }

        // Also search admin knowledge base
        console.log('🔍 Searching admin knowledge base...');
        const adminKnowledgeResult = await pool.query(`
          SELECT title, content, department, tags
          FROM admin_knowledge
          WHERE to_tsvector('english', content || ' ' || title) @@ plainto_tsquery('english', $1)
          ORDER BY ts_rank(to_tsvector('english', content || ' ' || title), plainto_tsquery('english', $1)) DESC
          LIMIT 3
        `, [message]);

        if (adminKnowledgeResult.rows.length > 0) {
          console.log(`📋 Found ${adminKnowledgeResult.rows.length} admin knowledge entries`);
          
          // Add admin knowledge to context
          const adminContext = adminKnowledgeResult.rows.map(row => 
            `Title: ${row.title}\nDepartment: ${row.department}\nContent: ${row.content}`
          ).join('\n\n');
          
          context = context ? context + '\n\n' + adminContext : adminContext;
          
          // Add admin sources
          const adminSources = adminKnowledgeResult.rows.map(row => ({
            title: row.title,
            department: row.department,
            type: 'admin_knowledge'
          }));
          
          sources = [...sources, ...adminSources];
        }

      } catch (searchError) {
        console.warn('Document search failed:', searchError.message);
      }

      // Create system prompt with context
      const systemPrompt = `You are an Enterprise Knowledge Assistant. Use the following context from company documents to answer questions accurately. If the context doesn't contain relevant information, say so and provide general guidance.

Context:
${context}

Instructions:
- Provide helpful, accurate information based on the context
- If information is not in the context, clearly state this
- Be professional and concise
- Cite sources when possible`;

      // Generate AI response
      console.log('🤖 Generating AI response...');
      const aiResponse = await generateResponse(message, systemPrompt);

      // Save the conversation message with both user message and AI response
      await pool.query(
        'INSERT INTO chat_messages (session_id, user_id, message, response, context_documents) VALUES ($1, $2, $3, $4, $5)',
        [sessionId, userId, message, aiResponse.response, JSON.stringify(sources)]
      );

      // Update session timestamp
      await pool.query(
        'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [sessionId]
      );

      res.json({
        message: aiResponse.response,
        sources,
        conversationId: sessionId,
        usage: aiResponse.usage
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to process message' });
    }
  },

  // Get user's conversations
  getConversations: async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const result = await pool.query(
        `SELECT id, title, created_at, updated_at,
         (SELECT COUNT(*) FROM chat_messages WHERE session_id = chat_sessions.id) as message_count
         FROM chat_sessions 
         WHERE user_id = $1 
         ORDER BY updated_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM chat_sessions WHERE user_id = $1',
        [userId]
      );

      res.json({
        conversations: result.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      });
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  },

  // Get messages for a specific conversation
  getConversation: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify user owns this conversation
      const sessionResult = await pool.query(
        'SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Get messages
      const messagesResult = await pool.query(
        'SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
        [id]
      );

      // Format messages for chat display
      const messages = [];
      messagesResult.rows.forEach(msg => {
        // Add user message
        messages.push({
          id: `${msg.id}-user`,
          content: msg.message,
          sender: 'user',
          timestamp: msg.created_at,
        });
        
        // Add assistant response
        if (msg.response) {
          messages.push({
            id: `${msg.id}-assistant`,
            content: msg.response,
            sender: 'assistant',
            timestamp: msg.created_at,
            sources: msg.context_documents ? JSON.parse(msg.context_documents) : [],
          });
        }
      });

      res.json({
        conversation: sessionResult.rows[0],
        messages,
      });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  },

  // Delete a conversation
  deleteConversation: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify user owns this conversation
      const sessionResult = await pool.query(
        'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Delete messages first (due to foreign key constraint)
      await pool.query('DELETE FROM chat_messages WHERE session_id = $1', [id]);
      
      // Delete conversation
      await pool.query('DELETE FROM chat_sessions WHERE id = $1', [id]);

      res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
      console.error('Delete conversation error:', error);
      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  },
};
