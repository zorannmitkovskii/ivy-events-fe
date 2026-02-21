import { ref } from "vue";
import { invitationPhotosApi } from "@/services/invitationPhotos.service";

export function useCollagePhotos() {
  const photos = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function loadPhotos(eventId) {
    loading.value = true;
    error.value = null;
    try {
      const data = await invitationPhotosApi.list(eventId);
      photos.value = Array.isArray(data) ? data : [];
    } catch (e) {
      error.value = e?.message || "Failed to load photos";
    } finally {
      loading.value = false;
    }
  }

  async function uploadPhotos(eventId, files) {
    try {
      const result = await invitationPhotosApi.upload(eventId, files);
      if (Array.isArray(result)) {
        photos.value.push(...result);
      } else if (result) {
        photos.value.push(result);
      }
      return result;
    } catch (e) {
      error.value = e?.message || "Upload failed";
      throw e;
    }
  }

  async function deletePhoto(eventId, url) {
    try {
      await invitationPhotosApi.remove(eventId, url);
      photos.value = photos.value.filter((p) => p.url !== url);
    } catch (e) {
      error.value = e?.message || "Delete failed";
      throw e;
    }
  }

  return { photos, loading, error, loadPhotos, uploadPhotos, deletePhoto };
}
