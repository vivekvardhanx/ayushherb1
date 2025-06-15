import axios from 'axios';

const headers = {
  EnvironmentID: import.meta.env.VITE_ENVIRONMENT_ID,
  ProjectID: import.meta.env.VITE_PROJECT_ID,
  "Content-Type": "application/json",
};

// API Base URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers,
  timeout: 8000, // 8 second timeout
});

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - please check your connection');
    }
    if (error.response?.status >= 500) {
      throw new Error('Server error - please try again later');
    }
    if (error.response?.status === 404) {
      throw new Error('API endpoint not found');
    }
    throw error;
  }
);

// Fetch all herbs with optimized parameters
export const fetchHerbs = async (limit = 50, offset = 0) => {
  try {
    const response = await apiClient.get('/', {
      params: { limit, offset },
    });
    
    // Validate response structure
    if (!response.data || !response.data.data) {
      throw new Error('Invalid response format from server');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching herbs:', error.message);
    throw new Error(error.message || 'Failed to fetch herbs');
  }
};

// Create a new herb
export const createHerb = async (herbData) => {
  try {
    const response = await apiClient.post('/', herbData);
    return response.data;
  } catch (error) {
    console.error('Error creating herb:', error.message);
    throw new Error('Failed to create herb');
  }
};

// Update an existing herb
export const updateHerb = async (id, herbData) => {
  try {
    const response = await apiClient.patch(`/herbs/${id}`, herbData);
    return response.data;
  } catch (error) {
    console.error('Error updating herb:', error.message);
    throw new Error('Failed to update herb');
  }
};

// Delete an herb
export const deleteHerb = async (id) => {
  try {
    const response = await apiClient.delete(`/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting herb:', error.message);
    console.error('Error details:', error.response ? error.response.data : error);
    throw new Error('Failed to delete herb');
  }
};