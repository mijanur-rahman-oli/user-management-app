// IMPORTANT: API service utilities for making authenticated requests
import axios from 'axios';

const API_BASE_URL = '/api';

// NOTE: Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// IMPORTANT: Add JWT token to requests if available
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

// NOTA BENE: Handle authentication errors and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // REQUIREMENT #5: Redirect to login if user is blocked or deleted
    if (error.response?.data?.redirectToLogin) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// NOTE: Authentication API calls
export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  getCurrentUser: () => api.get('/users/me'),
};

// NOTE: User management API calls
export const userAPI = {
  getAllUsers: () => api.get('/users'),
  blockUsers: (userIds) => api.post('/users/block', { userIds }),
  unblockUsers: (userIds) => api.post('/users/unblock', { userIds }),
  deleteUsers: (userIds) => api.delete('/users/delete', { data: { userIds } }),
  deleteUnverified: () => api.delete('/users/delete-unverified'),
};

export default api;