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

// Our-story uploads append, so retry only when the request never reached the app (502/503).
// A timeout or 504 may already have saved the images, and a retry would add them twice.
function isSafeToRetryOurStoryUpload(err) {
  const status = err?.response?.status ?? err?.status;
  return status === 502 || status === 503;
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
    return withRetry(() => postOurStoryImages(eventId, files), {
      shouldRetry: isSafeToRetryOurStoryUpload,
    });
  },

  uploadOurStoryImagesInBackground(eventId, files, { onSuccess, onError } = {}) {
    runInBackgroundWithRetry(() => postOurStoryImages(eventId, files), {
      onSuccess,
      onError,
      shouldRetry: isSafeToRetryOurStoryUpload,
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

  // The invitation endpoint removes the image from the invitation as well as from storage;
  // /public/media only deleted the file and left a broken image in the invitation.
  deleteOurStoryImage(eventId, url) {
    return api.del(`/invitation-images/our-story/${encodeURIComponent(eventId)}`, {
      params: { url },
    });
  },

};
