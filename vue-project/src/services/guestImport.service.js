import apiClient from "@/services/api";

/**
 * Guest import (IVY-302): preview, then confirm.
 *
 * <p>Two calls, never one. The preview writes nothing, so an organizer can see
 * what two hundred rows would do before agreeing to it. The same file is sent
 * twice — the backend re-parses on confirm rather than trusting a preview that
 * came back through the client.
 */
function upload(path, file, duplicateStrategy, config = {}) {
  const form = new FormData();
  form.append("file", file);
  return apiClient.post(path, form, {
    params: { duplicateStrategy },
    headers: { "Content-Type": "multipart/form-data" },
    ...config
  });
}

export const guestImportService = {
  preview(eventId, file, duplicateStrategy = "SKIP") {
    return upload(`/events/${encodeURIComponent(eventId)}/guests/import/preview`,
      file, duplicateStrategy).then(r => r.data?.data ?? r.data);
  },

  confirm(eventId, file, duplicateStrategy = "SKIP") {
    return upload(`/events/${encodeURIComponent(eventId)}/guests/import/confirm`,
      file, duplicateStrategy).then(r => r.data?.data ?? r.data);
  },

  /** The rejected rows as a spreadsheet — something to fix and re-upload,
   *  rather than a list to squint at on screen. */
  errorReport(eventId, file, duplicateStrategy = "SKIP") {
    return upload(`/events/${encodeURIComponent(eventId)}/guests/import/errors.xlsx`,
      file, duplicateStrategy, { responseType: "blob" }).then(r => r.data);
  }
};
