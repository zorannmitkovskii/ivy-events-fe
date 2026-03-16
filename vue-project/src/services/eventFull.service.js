import { api } from "@/services/api";

export const eventFullService = {
  createFull(payload, files = {}) {
    const fd = new FormData();
    fd.append(
      "data",
      new Blob([JSON.stringify(payload)], { type: "application/json" })
    );

    if (files.heroImage) {
      fd.append("heroImage", files.heroImage);
    }

    if (files.collageImages?.length) {
      files.collageImages.forEach((f) => fd.append("collageImages", f));
    }

    if (files.ourStoryImages?.length) {
      files.ourStoryImages.forEach((f) => fd.append("ourStoryImages", f));
    }

    return api.post("/events/full", fd, {
      headers: { "Content-Type": undefined },
    });
  },

  updateFull(eventId, payload, files = {}) {
    const fd = new FormData();
    fd.append(
      "data",
      new Blob([JSON.stringify(payload)], { type: "application/json" })
    );

    if (files.heroImage) {
      fd.append("heroImage", files.heroImage);
    }

    if (files.collageImages?.length) {
      files.collageImages.forEach((f) => fd.append("collageImages", f));
    }

    if (files.ourStoryImages?.length) {
      files.ourStoryImages.forEach((f) => fd.append("ourStoryImages", f));
    }

    return api.put(`/events/full/${encodeURIComponent(eventId)}`, fd, {
      headers: { "Content-Type": undefined },
    });
  },
};
