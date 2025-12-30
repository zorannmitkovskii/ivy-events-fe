import apiClient from './api';

/**
 * Fetch all events
 * @returns {Promise<AxiosResponse<any>>}
 */
function getEvents() {
  return apiClient.get('/events').then(response => response.data);
}

/**
 * Fetch a user by ID
 * @param {number} id
 * @returns {Promise<Event>}
 */
function getEvent(id) {
  return apiClient.get(`/events/${id}`).then(response => response.data);
}

/**
 * Create a new user
 * @param {CreateEventRequest} data
 * @returns {Promise<Event>}
 */
function createEvent(data) {
  return apiClient.post('/events', data).then(response => response.data);
}

export default {
  getEvents,
  getEvent,
  createEvent,
};
