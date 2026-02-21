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

  async function uploadPhoto(eventId, file) {
    try {
      const result = await invitationPhotosApi.upload(eventId, file, photos.value.length);
      photos.value.push(result);
      return result;
    } catch (e) {
      error.value = e?.message || "Upload failed";
      throw e;
    }
  }

  async function deletePhoto(eventId, photoId) {
    try {
      await invitationPhotosApi.remove(eventId, photoId);
      photos.value = photos.value.filter((p) => p.id !== photoId);
    } catch (e) {
      error.value = e?.message || "Delete failed";
      throw e;
    }
  }

  return { photos, loading, error, loadPhotos, uploadPhoto, deletePhoto };
}
