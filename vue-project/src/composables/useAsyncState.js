import { ref } from 'vue'

export default function useAsyncState(loader) {
  const loading = ref(false)
  const error = ref(null)
  const data = ref(null)

  async function run(...args) {
    try {
      loading.value = true
      error.value = null
      const res = await loader(...args)
      data.value = res
      return res
    } catch (e) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  return { loading, error, data, run }
}
