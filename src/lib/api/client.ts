import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = 'https://api.cakravia.com/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 unauthorized - redirect to login
    if (error.response?.status === 401) {
      Cookies.remove('auth_token');
      Cookies.remove('user_data');

      // Check if this is a public endpoint that shouldn't trigger redirect
      const isPublicEndpoint =
        error.config?.url?.includes('/config');

      // Only redirect if we're not already on login/register pages and it's not a public endpoint
      if (typeof window !== 'undefined' &&
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register') &&
          !isPublicEndpoint) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;