import axios from 'axios';
import { baseUrl } from './baseUrl';

// Axios client using runtime baseUrl from window.__ENV__
const apiClient = axios.create({
  baseURL: `${baseUrl}/v1/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
