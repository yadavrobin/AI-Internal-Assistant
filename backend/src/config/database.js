import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Neon connection string
  ssl: { rejectUnauthorized: false }, // Neon requires SSL
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    client.release();
    
    // Create tables if they don't exist
    await createTables();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
    throw error; // Re-throw instead of process.exit
  }
};

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        google_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        department VARCHAR(100),
        role VARCHAR(50) DEFAULT 'user',
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Unified knowledge base table (combines admin knowledge and confluence data)
    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        source VARCHAR(100) NOT NULL, -- 'admin' or 'confluence'
        source_url TEXT,
        department VARCHAR(100),
        tags JSONB DEFAULT '[]'::jsonb,
        metadata JSONB DEFAULT '{}'::jsonb,
        confluence_page_id VARCHAR(255),
        qdrant_point_id UUID,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Fix created_by column if it exists as INTEGER
    try {
      await client.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'knowledge_base' 
            AND column_name = 'created_by' 
            AND data_type = 'integer'
          ) THEN
            ALTER TABLE knowledge_base DROP COLUMN created_by;
            ALTER TABLE knowledge_base ADD COLUMN created_by UUID REFERENCES users(id);
          END IF;
        END $$;
      `);
    } catch (err) {
      // Column migration already completed or not needed
    }

    // Chat sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Chat messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        response TEXT,
        context_documents JSONB,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Query history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS query_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        query TEXT NOT NULL,
        response TEXT,
        confidence_score FLOAT,
        documents_used JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_knowledge_base_search ON knowledge_base USING gin(to_tsvector('english', title || ' ' || content));
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_knowledge_base_source ON knowledge_base(source);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_knowledge_base_department ON knowledge_base(department);
    `);

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  } finally {
    client.release();
  }
};

export { pool, connectDB };
