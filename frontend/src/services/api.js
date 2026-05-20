import axios from 'axios';

// Get base URL. Note: import.meta.env.VITE_API_BASE_URL is resolved by Vite.
// When running in docker, we override VITE_API_BASE_URL to point to the backend container.
// On the client browser, it needs to hit the backend port exposed on localhost.
// So we fall back to http://localhost:8080/api if VITE_API_BASE_URL isn't reachable or is relative.
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && !envUrl.includes('backend:8080')) {
    return envUrl;
  }
  // Safe default fallback for browser client accessing backend on localhost:8080
  return 'http://localhost:8080/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT authorization token into headers dynamically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Inject userId header if available in local storage
    const userId = localStorage.getItem('userId');
    if (userId) {
      config.headers['userId'] = userId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
