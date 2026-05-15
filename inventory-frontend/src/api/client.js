{/*
import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // http://localhost:8000/api
})

// Auto attach token
export const setAuthToken = (token) => {
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete client.defaults.headers.common['Authorization']
  }
}

// Global error handler
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, force logout
      localStorage.removeItem('authTokens')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API with proper data handling
export const authAPI = {
  // JSON POST - default for register/login
  register: (userData) => {
    return client.post('/auth/register/', userData, {
      headers: { 'Content-Type': 'application/json' }
    })
  },
  
  login: (credentials) => {
    return client.post('/auth/login/', credentials, {
      headers: { 'Content-Type': 'application/json' }
    })
  },

  // If you ever need multipart/form-data for file uploads
  registerWithAvatar: (formData) => {
    return client.post('/auth/register/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  refresh: (refresh) => client.post('/auth/token/refresh/', { refresh }),
  me: () => client.get('/auth/me/'),
}

export const inventoryAPI = {
  getItems: (params) => client.get('/items/', { params }),
  createItem: (data) => client.post('/items/', data),
  updateItem: (id, data) => client.put(`/items/${id}/`, data),
  deleteItem: (id) => client.delete(`/items/${id}/`),
  getCategories: () => client.get('/categories/'),
}

export default client */}