import axios from 'axios';

// Accept either a Render backend URL or the local proxy path.
const rawApiUrl = import.meta.env.VITE_API_URL || '/api';
const trimmedApiUrl = rawApiUrl.replace(/\/$/, '');
const API_BASE_URL = trimmedApiUrl.endsWith('/api')
  ? trimmedApiUrl
  : `${trimmedApiUrl}/api`;

if (!import.meta.env.VITE_API_URL) {
  console.warn('⚠️ VITE_API_URL is not defined, falling back to /api');
  console.warn('👉 Set VITE_API_URL to your backend host or /api if using the frontend proxy.');
}

console.log('🚀 RAW VITE_API_URL:', rawApiUrl);
console.log('🚀 API_BASE_URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT Interceptor - Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't override Content-Type for FormData
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If token expired (401) and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Refresh token - Ensure we use the full URL here too
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/token/refresh/`,
          { refresh: refreshToken }
        );

        // Update tokens
        localStorage.setItem('access_token', refreshResponse.data.access);
        localStorage.setItem('refresh_token', refreshResponse.data.refresh);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/auth/login/', {
      username,
      password,
    });
    return response;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await api.post('/aputh/logout/', { refresh: refreshToken });
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/auth/token/refresh/', {
      refresh: refreshToken,
    });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    return response;
  },

  changePassword: async (oldPassword, newPassword, newPassword2) => {
    const response = await api.put('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password2: newPassword2,
    });
    return response;
  },
};

// User API
const userAPI = {
  getAll: async () => {
    const response = await api.get('/api/auth/user-list/');
    return response;
  },

  getById: async (id) => {
    const response = await api.get(`/api/auth/user-list/${id}/`);
    return response;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/auth/user-list/${id}/`, userData);
    return response;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/auth/user-list/${id}/`);
    return response;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/api/auth/profile/', userData);
    return response;
  },

  deleteAccount: async () => {
    const response = await api.delete('/api/auth/profile/');
    return response;
  },
};

// Inventory API
const inventoryAPI = {
  getAll: async (filters = {}) => {
    if (typeof filters === 'string') {
      return api.get(`/api/records/item_list/?${filters}`);
    }
    return api.get('/api/records/item_list/', { params: filters });
  },

  getById: async (id) => {
    const response = await api.get(`/records/item_detail/${id}/`);
    return response;
  },

  createItem: async (itemData) => {
    const response = await api.post('/records/item_list/', itemData);
    return response;
  },

  updateItem: async (id, itemData) => {
    const response = await api.put(`/api/records/item_detail/${id}/`, itemData);
    return response;
  },

  getCategories: async () => {
    const response = await api.get('/records/category_list/');
    return response;
  },

  deleteItem: async (id) => {
    const response = await api.delete(`/records/item_detail/${id}/`);
    return response;
  },
  importExcel: (formData) => api.post('/records/inventory_bulk_update/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// --- New Budget API (Budget & Todo) ---
const budgetAPI = {
  // Budget Endpoints
  getBudgets: async () => {
    const response = await api.get('/api/budgets/budget_list/');
    return response.data;
  },

  createBudget: async (budgetData) => {
    const response = await api.post('/budgets/budget_create/', budgetData);
    return response.data;
  },

  updateBudget: async (id, budgetData) => {
    const response = await api.put(`/budgets/budget_detail/${id}/`, budgetData);
    return response.data;
  },

  deleteBudget: async (id) => {
    const response = await api.delete(`/budgets/budget_detail/${id}/`);
    return response.data;
  },

  // Todo Endpoints
  getTodos: async () => {
    const response = await api.get('/to_dos/get_todo/');
    return response.data;
  },

  createTodo: async (todoData) => {
    const response = await api.post('/to_dos/todo_create/', todoData);
    return response.data;
  },

  updateTodo: async (id, todoData) => {
    const response = await api.put(`/to_dos/todo_detail/${id}/`, todoData);
    return response.data;
  },

  deleteTodo: async (id) => {
    const response = await api.delete(`/to_dos/delete_todo/${id}/`);
    return response.data;
  },
};

// Export at the end
export {
  authAPI,
  userAPI,
  inventoryAPI,
  budgetAPI,
  API_BASE_URL as BASE_URL, // Export the actual URL for logging/debugging if needed
};