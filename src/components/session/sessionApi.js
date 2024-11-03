import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

console.log('API_BASE_URL:', API_BASE_URL, import.meta.env);

export const sessionApi = {
  create: async () => {
    const response = await axios.post(`${API_BASE_URL}/api/sessions`);
    return response.data;
  },

  join: async (sessionId) => {
    const response = await axios.get(`${API_BASE_URL}/api/sessions/${sessionId}`);
    return response.data;
  },

  start: async (sessionId) => {
    const response = await axios.post(`${API_BASE_URL}/api/sessions/${sessionId}/start`);
    return response.data;
  },

  reveal: async (sessionId) => {
    const response = await axios.post(`${API_BASE_URL}/api/sessions/${sessionId}/reveal`);
    return response.data;
  }
};