import { reactive } from "vue";

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const authStore = reactive({
  user: null,
  isAuthenticated: false
});

/**
 * Initialize auth state from localStorage on app start
 */
export function initAuth() {
  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem(USER_KEY);

  if (token && userStr) {
    try {
      authStore.user = JSON.parse(userStr);
      authStore.isAuthenticated = true;
    } catch (e) {
      console.error('Failed to parse user data:', e);
      clearAuth();
    }
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  return authStore.isAuthenticated && !!localStorage.getItem(TOKEN_KEY);
}

/**
 * Get the current auth token
 * @returns {string|null}
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store authentication token
 * @param {string} token
 */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Get current user data
 * @returns {object|null}
 */
export function getUser() {
  return authStore.user;
}

/**
 * Store user data
 * @param {object} user
 */
export function setUser(user) {
  authStore.user = user;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Clear all authentication data (logout)
 */
export function clearAuth() {
  authStore.user = null;
  authStore.isAuthenticated = false;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Login helper - store token and user data
 * @param {string} token - JWT or auth token
 * @param {object} user - User data object
 */
export function login(token, user) {
  setToken(token);
  setUser(user);
  authStore.isAuthenticated = true;
}

/**
 * Logout helper
 */
export function logout() {
  clearAuth();
  // Optionally redirect to login page
  // window.location.href = '/mk/auth/login';
}

// Initialize on module load
initAuth();
