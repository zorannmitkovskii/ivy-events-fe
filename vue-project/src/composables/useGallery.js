import { ref } from 'vue'

export default function useGallery() {
  const items = ref([])
  const uploading = ref(false)

  async function fetchGallery() { items.value = [] }
  async function upload(file) { void file; uploading.value = true; try { /* TODO */ } finally { uploading.value = false } }

  return { items, uploading, fetchGallery, upload }
}
