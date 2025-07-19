# Copilot Instructions for Enterprise Knowledge Assistant

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is an Enterprise Knowledge Assistant project with the following architecture:
- **Backend**: Node.js with Express.js, JavaScript (no TypeScript)
- **Frontend**: React with JavaScript (no TypeScript)
- **Database**: PostgreSQL for user management and query history
- **Vector Database**: For knowledge embeddings and RAG implementation
- **AI Integration**: Groq API with llama3-8b-8192 model
- **Authentication**: Google OAuth only (no Microsoft)
- **Knowledge Integration**: Confluence API only (no SharePoint)

## Key Technologies & Constraints
- Use JavaScript throughout (backend and frontend)
- PostgreSQL for relational data
- Vector database for embeddings (consider pgvector extension)
- JWT tokens for session management
- Express.js for backend API
- React for frontend (functional components with hooks)
- Groq API for AI responses
- Google OAuth for authentication
- Confluence API for knowledge base integration

## Code Style Guidelines
- Use modern JavaScript (ES6+) features
- Prefer async/await over promises
- Use functional React components with hooks
- Follow RESTful API conventions
- Implement proper error handling and logging
- Use environment variables for configuration
- Implement proper security practices (CORS, input validation, etc.)

## Project Structure
- `/backend` - Node.js Express server
- `/frontend` - React application
- Focus on RAG implementation for knowledge retrieval
- Policy-aware response generation
- Admin panel for content management
