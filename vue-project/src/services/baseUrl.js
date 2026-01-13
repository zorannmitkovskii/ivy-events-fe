// Central place to get the backend base URL (host + port), configured via Vite env
// In docker-compose, VITE_API_BASE_URL is set to the host-exposed backend URL (http://localhost:8081)
const baseUrl = (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:8081').replace(/\/$/, '');

export { baseUrl };
export default baseUrl;
