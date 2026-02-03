import { ref } from 'vue'

export default function useNotifications() {
  const templates = ref([])
  const sending = ref(false)

  async function fetchTemplates() { templates.value = [] }
  async function sendNotification(payload) { void payload; sending.value = true; try { /* TODO */ } finally { sending.value = false } }

  return { templates, sending, fetchTemplates, sendNotification }
}
