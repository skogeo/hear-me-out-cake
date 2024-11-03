import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

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