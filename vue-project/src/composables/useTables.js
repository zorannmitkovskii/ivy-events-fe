import { ref } from 'vue'

export default function useTables() {
  const tables = ref([])
  const loading = ref(false)

  async function fetchTables() {
    loading.value = true
    try {
      tables.value = [] // TODO: replace with API
    } finally {
      loading.value = false
    }
  }

  return { tables, loading, fetchTables }
}
