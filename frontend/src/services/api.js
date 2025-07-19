import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  // Initiate Google OAuth
  googleLogin: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },

  // Verify JWT token
  verifyToken: async (token) => {
    const response = await api.post('/auth/verify', { token });
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  // Send chat message
  sendMessage: async (message, sessionId) => {
    const response = await api.post('/chat', { message, sessionId });
    return response.data;
  },

  // Get chat sessions
  getSessions: async () => {
    const response = await api.get('/chat/sessions');
    return response.data;
  },

  // Get specific chat session
  getSession: async (sessionId) => {
    const response = await api.get(`/chat/sessions/${sessionId}`);
    return response.data;
  },
};

// Knowledge API
export const knowledgeAPI = {
  // Search knowledge base
  search: async (query, filters = {}) => {
    const params = new URLSearchParams({ query, ...filters });
    const response = await api.get(`/knowledge/search?${params}`);
    return response.data;
  },

  // Get documents
  getDocuments: async (page = 1, limit = 20, filters = {}) => {
    const params = new URLSearchParams({ page, limit, ...filters });
    const response = await api.get(`/knowledge/documents?${params}`);
    return response.data;
  },

  // Get specific document
  getDocument: async (id) => {
    const response = await api.get(`/knowledge/documents/${id}`);
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  // Get admin stats
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Get all users
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  // Sync documents from Confluence
  syncDocuments: async () => {
    const response = await api.post('/admin/documents/sync');
    return response.data;
  },

  // Delete document
  deleteDocument: async (id) => {
    const response = await api.delete(`/admin/documents/${id}`);
    return response.data;
  },
};

// User API
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data) => {
    const response = await api.put('/user/profile', data);
    return response.data;
  },

  // Get query history
  getHistory: async (page = 1, limit = 20) => {
    const params = new URLSearchParams({ page, limit });
    const response = await api.get(`/user/history?${params}`);
    return response.data;
  },
};

export default api;
