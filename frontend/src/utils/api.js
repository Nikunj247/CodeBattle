import axios from 'axios';

// Create a centralized Axios instance
const api = axios.create({
  // This automatically switches between localhost and your live production URL
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// INTERCEPTOR: Automatically attach the JWT token before any request leaves the frontend
api.interceptors.request.use(
  (config) => {
    // Assuming you store your user data/token in localStorage upon login
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// INTERCEPTOR: Globally handle network errors (like token expiration or server crashes)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If the token is expired/invalid, automatically wipe it and force a re-login
      console.error('Session expired. Please log in again.');
      localStorage.removeItem('user');
      window.location.href = '/auth'; 
    }
    return Promise.reject(error);
  }
);

export default api;