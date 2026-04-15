import { api } from "@/services/api";
import backendApi from "@/services/backendApi";
import { withRetry, runInBackgroundWithRetry } from "@/utils/retry";

function buildOurStoryFormData(files) {
  const fd = new FormData();
  for (const file of files) fd.append("files", file);
  return fd;
}

function postOurStoryImages(eventId, files) {
  return api.post(
    `/invitation-images/our-story/${encodeURIComponent(eventId)}`,
    buildOurStoryFormData(files),
    { headers: { "Content-Type": undefined } }
  );
}

function postHeroImage(eventId, file) {
  const fd = new FormData();
  fd.append("file", file);
  return api.post(
    `/invitation-images/hero/${encodeURIComponent(eventId)}`,
    fd,
    { headers: { "Content-Type": undefined } }
  );
}

export const invitationImagesService = {
  uploadOurStoryImages(eventId, files) {
    return withRetry(() => postOurStoryImages(eventId, files));
  },

  uploadOurStoryImagesInBackground(eventId, files, { onSuccess, onError } = {}) {
    runInBackgroundWithRetry(() => postOurStoryImages(eventId, files), {
      onSuccess,
      onError,
    });
  },

  uploadHeroImage(eventId, file) {
    return withRetry(() => postHeroImage(eventId, file));
  },

  uploadHeroImageInBackground(eventId, file, { onSuccess, onError } = {}) {
    runInBackgroundWithRetry(() => postHeroImage(eventId, file), {
      onSuccess,
      onError,
    });
  },

  deleteOurStoryImage(eventId, url) {
    return backendApi.delete("/public/media", { params: { path: url } });
  },

  deleteHeroImage(eventId) {
    return backendApi.delete("/public/media", { params: { eventId } });
  },
};
