import { pipeline } from '@xenova/transformers';

class EmbeddingService {
  constructor() {
    this.embedder = null;
    this.modelName = 'Xenova/all-MiniLM-L6-v2'; // Good balance of performance and size
    this.vectorSize = 384; // Vector size for all-MiniLM-L6-v2
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🔧 Initializing embedding model...');
      this.embedder = await pipeline('feature-extraction', this.modelName, {
        quantized: false,
      });
      this.isInitialized = true;
      console.log('✅ Embedding model initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing embedding model:', error.message);
      throw new Error('Failed to initialize embedding service');
    }
  }

  async generateEmbedding(text) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Clean and preprocess text
      const cleanText = this.preprocessText(text);
      
      // Generate embedding
      const output = await this.embedder(cleanText, {
        pooling: 'mean',
        normalize: true,
      });

      // Convert to regular array
      const embedding = Array.from(output.data);
      
      return embedding;
    } catch (error) {
      console.error('❌ Error generating embedding:', error.message);
      throw new Error('Failed to generate embedding');
    }
  }

  async generateEmbeddings(texts) {
    if (!Array.isArray(texts)) {
      throw new Error('Input must be an array of texts');
    }

    const embeddings = [];
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  preprocessText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Basic text cleaning
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\.\,\!\?\-]/g, '') // Remove special characters except basic punctuation
      .substring(0, 512); // Limit length to avoid memory issues
  }

  getVectorSize() {
    return this.vectorSize;
  }

  getModelName() {
    return this.modelName;
  }

  async generateDocumentEmbedding(document) {
    // For longer documents, we might want to chunk them
    const { title, content } = document;
    
    // Combine title and content with higher weight on title
    const combinedText = title ? `${title}. ${content}` : content;
    
    return await this.generateEmbedding(combinedText);
  }

  chunkText(text, maxChunkSize = 300, overlap = 50) {
    const words = text.split(' ');
    const chunks = [];
    
    for (let i = 0; i < words.length; i += maxChunkSize - overlap) {
      const chunk = words.slice(i, i + maxChunkSize).join(' ');
      chunks.push(chunk);
      
      if (i + maxChunkSize >= words.length) break;
    }
    
    return chunks;
  }

  async generateChunkedEmbeddings(text, maxChunkSize = 300, overlap = 50) {
    const chunks = this.chunkText(text, maxChunkSize, overlap);
    const embeddings = [];
    
    for (const chunk of chunks) {
      const embedding = await this.generateEmbedding(chunk);
      embeddings.push({
        text: chunk,
        embedding,
      });
    }
    
    return embeddings;
  }
}

// Create singleton instance
const embeddingService = new EmbeddingService();

export default embeddingService;
export { EmbeddingService };
