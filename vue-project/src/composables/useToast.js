import { reactive } from "vue";
import { ApiError } from "@/services/apiError";

const toasts = reactive([]);
let nextId = 0;

const DURATIONS = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
};

/**
 * Global toast notification store.
 *
 * Usage:
 *   import { useToast } from "@/composables/useToast";
 *   const toast = useToast();
 *   toast.success("Saved!");
 *   toast.error("Something went wrong");
 *   toast.apiError(err);   // accepts ApiError or plain Error
 */
export function useToast() {
  function show({ message, type = "error", duration, detail, validationErrors }) {
    const id = ++nextId;
    const effectiveDuration = duration ?? DURATIONS[type] ?? 5000;

    const toast = reactive({
      id,
      message,
      type,
      detail: detail || null,
      validationErrors: validationErrors || null,
      visible: true,
    });

    toasts.push(toast);

    if (effectiveDuration > 0) {
      setTimeout(() => dismiss(id), effectiveDuration);
    }

    return id;
  }

  function success(message) {
    return show({ message, type: "success" });
  }

  function error(message, detail) {
    return show({ message, type: "error", detail });
  }

  function warning(message) {
    return show({ message, type: "warning" });
  }

  function info(message) {
    return show({ message, type: "info" });
  }

  /**
   * Show a toast from an API error (ApiError or plain Error).
   * Extracts the most useful message for the user.
   */
  function apiError(err) {
    if (err instanceof ApiError) {
      const message = err.detail || err.message;

      // For validation errors, list them
      if (err.errorCode === "VAL_REQUEST_BODY_INVALID" && err.validationErrors) {
        const fields = Object.entries(err.validationErrors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(", ");

        return show({
          message,
          type: "error",
          detail: fields,
          validationErrors: err.validationErrors,
          duration: 8000,
        });
      }

      return show({ message, type: "error" });
    }

    // Plain error fallback
    return show({ message: err?.message || "Unknown error", type: "error" });
  }

  function dismiss(id) {
    const idx = toasts.findIndex((t) => t.id === id);
    if (idx !== -1) {
      toasts.splice(idx, 1);
    }
  }

  function clear() {
    toasts.splice(0, toasts.length);
  }

  return { toasts, show, success, error, warning, info, apiError, dismiss, clear };
}
