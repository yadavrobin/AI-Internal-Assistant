# AI Internal Assistant

A comprehensive enterprise knowledge management and AI chat system built with React, Node.js, PostgreSQL, and Qdrant vector database. This application allows organizations to manage internal knowledge, policies, and provide AI-powered assistance to employees.

## 🚀 Features

### 🤖 AI-Powered Chat
- **Intelligent Responses**: AI assistant powered by Groq API with context-aware responses
- **Multi-Source Knowledge**: Searches both admin-created policies and Confluence documentation
- **Conversation Management**: Persistent chat sessions with full conversation history
- **Source Attribution**: Shows which documents were used to generate responses

### 📚 Knowledge Management
- **Admin Knowledge Base**: Add, edit, and manage company policies and information
- **Confluence Integration**: Import and search through Confluence documentation
- **Vector Search**: Advanced semantic search using Qdrant vector database
- **PostgreSQL Search**: Full-text search for immediate knowledge retrieval

### 👥 User Management
- **Google OAuth Authentication**: Secure login with Google accounts
- **Role-Based Access**: Admin and user roles with different permissions
- **User Profiles**: Manage user information and department assignments

### 🎯 Admin Features
- **Knowledge Entry Management**: Create, edit, and delete knowledge entries
- **User Administration**: Manage user roles and permissions
- **System Analytics**: Monitor usage and system performance
- **Data Import**: Bulk import from various sources

## 🏗️ Architecture

```
AI Internal Assistant/
├── frontend/           # React.js frontend application
├── backend/           # Node.js Express backend API
├── .gitignore        # Main project gitignore
└── README.md         # This file
```

### Technology Stack

**Frontend:**
- React.js with Material-UI components
- Context API for state management
- Axios for API communication
- Google OAuth integration

**Backend:**
- Node.js with Express.js framework
- PostgreSQL for relational data storage
- Qdrant vector database for semantic search
- Groq API for AI responses
- Passport.js for authentication

**External Services:**
- Google OAuth 2.0
- Groq AI API
- Qdrant Cloud/Self-hosted
- Neon PostgreSQL (or any PostgreSQL provider)

## 🛠️ Setup and Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database (Neon recommended)
- Qdrant vector database instance
- Google OAuth 2.0 credentials
- Groq API key

### 1. Clone the Repository

```bash
git clone https://github.com/yadavrobin/AI-Internal-Assistant.git
cd AI-Internal-Assistant
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Groq AI API
GROQ_API_KEY=your_groq_api_key

# Qdrant Configuration
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key

# JWT Configuration
JWT_SECRET=your_jwt_secret

# Server Configuration
PORT=5000
NODE_ENV=development
```

Start the backend server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the frontend development server:

```bash
npm start
```

### 4. Database Setup

The application will automatically create the required tables on first run. The database schema includes:

- **users**: User profiles and authentication data
- **knowledge_base**: Unified knowledge storage (admin + Confluence)
- **chat_sessions**: Conversation management
- **chat_messages**: Individual messages and responses

### 5. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000` (development)
   - Your production domain

### 6. Groq API Setup

1. Sign up at [Groq](https://groq.com/)
2. Generate an API key
3. Add it to your backend `.env` file

### 7. Qdrant Setup

Option A - Qdrant Cloud:
1. Sign up at [Qdrant Cloud](https://cloud.qdrant.io/)
2. Create a cluster
3. Get your URL and API key

Option B - Self-hosted:
```bash
docker run -p 6333:6333 qdrant/qdrant
```

## 📖 User Guide

### For End Users

#### 1. Getting Started
1. **Login**: Click "Login with Google" on the homepage
2. **Start Chatting**: Type your question in the chat input
3. **View Sources**: See which documents were used for responses
4. **Manage Conversations**: Create new conversations or continue existing ones

#### 2. Chat Features
- **Ask Questions**: Type any question about company policies or procedures
- **Get Sources**: See which documents informed the AI's response
- **Conversation History**: Access previous conversations from the sidebar
- **Search Conversations**: Find specific past conversations

#### 3. Navigation
- **Chat Interface**: Main area for conversations
- **Sidebar**: Conversation history and search
- **Profile Menu**: Access settings and logout
- **New Conversation**: Plus button to start fresh

### For Administrators

#### 1. Admin Panel Access
- Admin users can access the admin panel from the navigation menu
- Manage knowledge entries, users, and system settings

#### 2. Knowledge Management
- **Add Knowledge**: Create new policy documents and information
- **Edit Entries**: Update existing knowledge base entries
- **Categorize**: Assign departments and tags for better organization
- **Import Data**: Bulk import from CSV or other sources

#### 3. User Management
- **View Users**: See all registered users
- **Manage Roles**: Assign admin privileges
- **Monitor Usage**: Track user activity and system usage

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL=postgresql://...           # PostgreSQL connection string
GOOGLE_CLIENT_ID=...                   # Google OAuth client ID
GOOGLE_CLIENT_SECRET=...               # Google OAuth client secret
GROQ_API_KEY=...                       # Groq AI API key
QDRANT_URL=...                         # Qdrant database URL
QDRANT_API_KEY=...                     # Qdrant API key (if required)
JWT_SECRET=...                         # JWT signing secret
PORT=5000                              # Server port
NODE_ENV=development                   # Environment mode
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:5000      # Backend API URL
REACT_APP_GOOGLE_CLIENT_ID=...               # Google OAuth client ID
```

### Database Configuration

The application uses PostgreSQL with the following key tables:

- **users**: Stores user profiles and authentication data
- **knowledge_base**: Unified storage for all knowledge (admin + Confluence)
- **chat_sessions**: Manages conversation sessions
- **chat_messages**: Stores individual messages and AI responses

### AI Configuration

- **Model**: Uses Groq's Llama models for fast inference
- **Context Window**: Optimized for enterprise knowledge queries
- **Search Strategy**: Combines vector similarity and full-text search

## 🚀 Deployment

### Production Deployment

1. **Backend Deployment** (e.g., Railway, Heroku, DigitalOcean):
   ```bash
   npm run build
   npm start
   ```

2. **Frontend Deployment** (e.g., Vercel, Netlify):
   ```bash
   npm run build
   # Deploy the 'build' folder
   ```

3. **Database**: Use managed PostgreSQL (Neon, AWS RDS, etc.)

4. **Environment Setup**: Update all environment variables for production

### Docker Deployment

Backend Dockerfile:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

Frontend Dockerfile:
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔍 API Documentation

### Authentication Endpoints

- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Chat Endpoints

- `POST /api/chat/message` - Send message and get AI response
- `GET /api/chat/conversations` - Get user's conversations
- `GET /api/chat/conversations/:id` - Get specific conversation
- `DELETE /api/chat/conversations/:id` - Delete conversation

### Admin Endpoints

- `GET /api/admin/users` - Get all users (admin only)
- `POST /api/admin/knowledge` - Add knowledge entry (admin only)
- `PUT /api/admin/knowledge/:id` - Update knowledge entry (admin only)
- `DELETE /api/admin/knowledge/:id` - Delete knowledge entry (admin only)

### Knowledge Endpoints

- `GET /api/knowledge` - Search knowledge base
- `POST /api/knowledge/import` - Import knowledge from external sources

## 🛡️ Security Features

- **Authentication**: Secure Google OAuth 2.0 integration
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Environment variable protection for sensitive data
- **SQL Injection Protection**: Parameterized queries
- **CORS**: Configured for secure cross-origin requests
- **Rate Limiting**: API rate limiting to prevent abuse

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Verify DATABASE_URL format
   - Check network connectivity
   - Ensure database exists

2. **Google OAuth Errors**:
   - Verify redirect URIs in Google Console
   - Check client ID and secret
   - Ensure correct domain configuration

3. **AI Response Issues**:
   - Verify Groq API key
   - Check API rate limits
   - Monitor Groq service status

4. **Vector Search Not Working**:
   - Verify Qdrant connection
   - Check collection setup
   - Ensure embeddings are generated

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## 📈 Performance Optimization

- **Database Indexing**: Optimized indexes for fast search
- **Vector Search**: Efficient similarity search with Qdrant
- **Caching**: Response caching for common queries
- **Connection Pooling**: Database connection optimization
- **Code Splitting**: Frontend code splitting for faster loads

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

### Development Guidelines

- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **Issues**: Create an issue on GitHub
- **Documentation**: Check this README and inline code comments
- **Email**: Contact the development team

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Google OAuth authentication
- AI-powered chat with knowledge base
- Admin panel for knowledge management
- Vector and full-text search integration
- Conversation management
- Multi-source knowledge integration

---

**Built with ❤️ for enterprise knowledge management**
