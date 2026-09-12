import { api } from "@/services/api";

export const tasksService = {
  list(eventId, status) {
    const params = {};
    if (eventId) params.eventId = eventId;
    if (status) params.status = status;
    return api.get("/tasks", { params });
  },

  /**
   * Every task across the events the caller can see, with the event named on
   * each row.
   *
   * <p>Not `list()` with the id left off: that endpoint requires an
   * `eventId` and is guarded per event, which is right for the per-event
   * board and makes the agency-wide question unaskable.
   */
  workspace() {
    return api.get("/tasks/workspace");
  },

  getById(taskId) {
    return api.get(`/tasks/${encodeURIComponent(taskId)}`);
  },

  create(payload) {
    return api.post("/tasks", payload);
  },

  update(taskId, payload) {
    return api.put(`/tasks/${encodeURIComponent(taskId)}`, payload);
  },

  remove(taskId) {
    return api.del(`/tasks/${encodeURIComponent(taskId)}`);
  },

  updateStatus(taskId, payload) {
    return api.put(`/tasks/${encodeURIComponent(taskId)}/status`, payload);
  },

  updatePriority(taskId, payload) {
    return api.put(`/tasks/${encodeURIComponent(taskId)}/priority`, payload);
  },

  getWeekCurrent(eventId) {
    return api.get("/tasks/week/current", { params: { eventId } });
  },

  getWeekNext(eventId) {
    return api.get("/tasks/week/next", { params: { eventId } });
  },

  getCompletionPercent(eventId) {
    return api.get("/tasks/completion-percent", { params: { eventId } });
  },

  getUpcoming(eventId) {
    return api.get("/tasks/upcoming", { params: { eventId } });
  }
};
