import apiClient from './api';

/**
 * Fetch all users
 * @returns {Promise<User[]>}
 */
function getUsers() {
  return apiClient.get('/users').then(response => response.data);
}

/**
 * Fetch a user by ID
 * @param {number} id
 * @returns {Promise<User>}
 */
function getUser(id) {
  return apiClient.get(`/users/${id}`).then(response => response.data);
}

/**
 * Create a new user
 * @param {CreateUserRequest} data
 * @returns {Promise<User>}
 */
function createUser(data) {
  return apiClient.post('/users', data).then(response => response.data);
}

/**
 * Create a new user
 * @param {CreateUserRequest} data
 * @returns {Promise<User>}
 */
function deleteUser(data) {
  return apiClient.post('/users', data).then(response => response.data);
}

export default {
  getUsers,
  getUser,
  createUser,
  deleteUser
};
