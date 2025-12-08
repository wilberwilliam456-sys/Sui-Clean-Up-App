import axios from 'axios';

// Use environment variable with proper fallback
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const checkReputation = async (packageId) => {
  try {
    const response = await apiClient.post('/check-reputation', { packageId });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to check reputation');
  }
};

export const submitVote = async (packageId, userAddress, voteType) => {
  try {
    const response = await apiClient.post('/votes', { 
      packageId, 
      userAddress, 
      voteType 
    });
    return response.data;
  } catch (error) {
    // Re-throw with response attached so component can check status code
    throw error;
  }
};

export const verifyPackage = async (packageId, source) => {
  try {
    const response = await apiClient.post('/verify', { packageId, source });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to verify package');
  }
};