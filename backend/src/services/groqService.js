import Groq from 'groq-sdk';

// Initialize Groq client with error handling
let groq;
try {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
} catch (error) {
  console.warn('⚠️ Groq client initialization failed:', error.message);
  groq = null;
}

const MODEL_NAME = 'llama3-8b-8192';

const generateResponse = async (prompt, context = '', conversationHistory = [], systemPrompt = '') => {
  try {
    if (!groq) {
      throw new Error('Groq client not initialized - check GROQ_API_KEY');
    }

    const messages = [
      {
        role: 'system',
        content: systemPrompt || 'You are a helpful enterprise knowledge assistant. Answer questions based on the provided context and company policies. If you cannot find relevant information in the context, say so clearly.',
      },
    ];

    if (context && context.trim() !== 'No relevant documents found in the knowledge base.') {
      messages.push({
        role: 'system',
        content: `Context information:\n${context}`,
      });
    }

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: MODEL_NAME,
      temperature: 0.3,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    return {
      response: chatCompletion.choices[0]?.message?.content || '',
      usage: chatCompletion.usage,
    };
  } catch (error) {
    console.error('❌ Error generating response with Groq:', error.message);
    throw new Error('Failed to generate AI response');
  }
};

const generateStreamResponse = async function* (prompt, context = '', systemPrompt = '') {
  try {
    if (!groq) {
      throw new Error('Groq client not initialized - check GROQ_API_KEY');
    }

    const messages = [
      {
        role: 'system',
        content: systemPrompt || 'You are a helpful enterprise knowledge assistant. Answer questions based on the provided context and company policies.',
      },
    ];

    if (context) {
      messages.push({
        role: 'system',
        content: `Context information:\n${context}`,
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    const stream = await groq.chat.completions.create({
      messages,
      model: MODEL_NAME,
      temperature: 0.3,
      max_tokens: 1024,
      top_p: 1,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error('❌ Error generating stream response with Groq:', error.message);
    throw new Error('Failed to generate AI stream response');
  }
};

const summarizeText = async (text, maxLength = 500) => {
  try {
    const prompt = `Please summarize the following text in approximately ${maxLength} characters:\n\n${text}`;
    
    const result = await generateResponse(prompt, '', 'You are a text summarization assistant. Create concise, accurate summaries.');
    return result.response;
  } catch (error) {
    console.error('❌ Error summarizing text:', error.message);
    throw new Error('Failed to summarize text');
  }
};

export {
  generateResponse,
  generateStreamResponse,
  summarizeText,
  MODEL_NAME,
};
