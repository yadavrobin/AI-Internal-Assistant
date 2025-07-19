import { QdrantClient } from '@qdrant/js-client-rest';
import embeddingService from '../services/embeddingService.js';

const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL, // Qdrant cloud URL
  apiKey: process.env.QDRANT_API_KEY, // Qdrant cloud API key
});

const COLLECTION_NAME = 'company-docs';
const VECTOR_SIZE = 384; // Xenova all-MiniLM-L6-v2 embedding size

const initializeQdrant = async () => {
  try {
    // Check if collection exists
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(
      collection => collection.name === COLLECTION_NAME
    );

    if (!collectionExists) {
      // Create collection
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        replication_factor: 1,
      });
      console.log(`✅ Qdrant collection '${COLLECTION_NAME}' created successfully`);
    } else {
      console.log(`✅ Qdrant collection '${COLLECTION_NAME}' already exists`);
    }

    // Create payload index for filtering
    await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'department',
      field_schema: 'keyword',
    });

    await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'source',
      field_schema: 'keyword',
    });

    await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'tags',
      field_schema: 'keyword',
    });

    console.log('✅ Qdrant payload indexes created successfully');
  } catch (error) {
    console.error('❌ Error initializing Qdrant:', error.message);
    throw error;
  }
};

const searchSimilarDocuments = async (queryVector, filter = {}, limit = 5, scoreThreshold = 0.7) => {
  try {
    const searchParams = {
      vector: queryVector,
      limit: limit,
      score_threshold: 0.1  // Lower threshold for better results
    };

    if (Object.keys(filter).length > 0) {
      searchParams.filter = filter;
    }

    const searchResult = await qdrantClient.search(COLLECTION_NAME, searchParams);
    console.log(`🔍 Qdrant returned: ${searchResult.length} results`);
    
    return searchResult;
  } catch (error) {
    console.error('❌ Error searching Qdrant:', error.message);
    throw error;
  }
};

const upsertDocument = async (pointId, vector, payload) => {
  try {
    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points: [
        {
          id: pointId,
          vector,
          payload,
        },
      ],
    });
    return pointId;
  } catch (error) {
    console.error('❌ Error upserting document to Qdrant:', error.message);
    throw error;
  }
};

const deleteDocument = async (pointId) => {
  try {
    await qdrantClient.delete(COLLECTION_NAME, {
      wait: true,
      points: [pointId],
    });
    return true;
  } catch (error) {
    console.error('❌ Error deleting document from Qdrant:', error.message);
    throw error;
  }
};

export {
  qdrantClient,
  initializeQdrant,
  searchSimilarDocuments,
  upsertDocument,
  deleteDocument,
  COLLECTION_NAME,
  VECTOR_SIZE,
};
