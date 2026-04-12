/**
 * API Service
 * Axios-based HTTP client with authentication
 */

import axios from 'axios';

// Using absolute URL with IP for maximum reliability across Windows environments
const API_BASE_URL = 'http://127.0.0.1:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTHENTICATION ====================

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (oldPassword, newPassword) => api.put('/auth/password', { oldPassword, newPassword })
};

// ==================== DOCUMENTS ====================

export const documentsAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  list: () => api.get('/documents'),
  get: (id) => api.get(`/documents/${id}`),
  delete: (id) => api.delete(`/documents/${id}`)
};

// ==================== RAG ====================

export const ragAPI = {
  search: (query, topK) => api.post('/rag/search', { query, topK }),
  getAnalytics: () => api.get('/rag/analytics'),
  getHistory: (limit) => api.get('/rag/history', { params: { limit } })
};

// ==================== SYSTEM ====================

export const systemAPI = {
  health: () => api.get('/health'),
  stats: () => api.get('/stats')
};

export default api;
