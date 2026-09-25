import { api } from "@/services/api";

/**
 * The task board: where a card sits, and whose it is.
 *
 * <p>Separate from the task CRUD service because what a board does is not
 * create and edit. A reorder is a whole column at once — a drop moves
 * everything below the card too, and sending one index would leave the server
 * guessing about its neighbours.
 */
export const taskBoardService = {
  /** Rewrites one column, top to bottom, after a drop. */
  reorder(eventId, status, taskIds) {
    return api.put(
      `/events/${encodeURIComponent(eventId)}/task-board/columns/${status}`,
      { taskIds },
    );
  },

  /**
   * Moves a card to another column and to its place in it.
   *
   * <p>One call, because a drop is one gesture. Two would leave the card at
   * the bottom of the new column for as long as the second request takes.
   */
  move(eventId, taskId, status, taskIds) {
    return api.put(
      `/events/${encodeURIComponent(eventId)}/task-board/tasks/${encodeURIComponent(taskId)}/move`,
      { status, taskIds },
    );
  },

  /** `assigneeUserId: null` takes the task back. */
  assign(eventId, taskId, assigneeUserId) {
    return api.put(
      `/events/${encodeURIComponent(eventId)}/task-board/tasks/${encodeURIComponent(taskId)}/assignee`,
      { assigneeUserId },
    );
  },

  assignable(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/task-board/assignable`);
  },
};
