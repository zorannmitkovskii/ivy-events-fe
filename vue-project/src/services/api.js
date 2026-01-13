import axios from 'axios';

// Determine API base URL from Vite env (set via docker-compose) with sensible fallback
const base = (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:8081').replace(/\/$/, '');

const apiClient = axios.create({
  baseURL: `${base}/v1/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
