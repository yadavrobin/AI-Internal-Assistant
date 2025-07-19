import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Import passport configuration after env vars are loaded (commented out for testing)
// import './config/passport.js';

// Import routes
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat-minimal.js';
import knowledgeRoutes from './routes/docs.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/user.js';

import { connectDB } from './config/database.js';
// import { initializeQdrant } from './config/qdrant.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
// import embeddingService from './services/embeddingService.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database connection
connectDB();

// Initialize Qdrant vector database
// initializeQdrant().catch(console.error);

// Initialize embedding service
// embeddingService.initialize().catch(console.error);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

// Logging
app.use(morgan('combined'));

// Rate limiting
app.use('/api/', rateLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database initialization
async function startServer() {
  console.log('🔍 DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('🔍 DATABASE_URL (first 50 chars):', process.env.DATABASE_URL?.substring(0, 50));
  console.log('🔍 GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
  
  try {
    await connectDB();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌍 Access at: http://localhost:${PORT}/api/health`);
  });
}

startServer();
