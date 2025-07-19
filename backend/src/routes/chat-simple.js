import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { generateResponse } from '../services/groqService.js';
import { searchSimilarDocuments } from '../config/qdrant.js';
import embeddingService from '../services/embeddingService.js';

const router = express.Router();

// Test endpoint (no auth required for testing)
router.get('/test', (req, res) => {
  res.json({ message: 'Chat routes working!', timestamp: new Date().toISOString() });
});

// Message endpoint with AI integration and knowledge search
router.post('/message', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('📝 Processing message for user:', req.user?.email);

    // Search for relevant documents
    let context = '';
    let sources = [];
    try {
      // Generate embedding for the user's message
      console.log('🔍 Searching knowledge base...');
      console.log('🔍 Message:', message);
      
      console.log('🔧 Initializing embedding service...');
      const queryEmbedding = await embeddingService.generateEmbedding(message);
      console.log('✅ Generated embedding, length:', queryEmbedding.length);
      
      // Search for similar documents
      console.log('🔍 Searching Qdrant...');
      const searchResults = await searchSimilarDocuments(queryEmbedding, {}, 3, 0.1);
      console.log('🔍 Search results:', searchResults?.length || 0);
      if (searchResults?.length > 0) {
        console.log('🔍 First result score:', searchResults[0].score);
        console.log('🔍 First result title:', searchResults[0].payload.title);
      }
      
      if (searchResults && searchResults.length > 0) {
        context = searchResults.map(result => result.payload.content).join('\n\n');
        sources = searchResults.map(result => ({
          title: result.payload.title,
          score: result.score,
        }));
        console.log(`📚 Found ${sources.length} relevant documents`);
      } else {
        console.log('📚 No relevant documents found');
      }
    } catch (searchError) {
      console.warn('🚨 Document search failed:', searchError.message);
      console.warn('🚨 Stack:', searchError.stack);
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

    res.json({
      message: aiResponse.response,
      sources,
      usage: aiResponse.usage,
      conversationId: null // Will add this later
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

export default router;
