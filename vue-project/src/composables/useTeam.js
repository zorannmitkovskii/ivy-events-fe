import { ref } from 'vue'

export default function useTeam() {
  const members = ref([])
  const inviting = ref(false)

  async function fetchTeam() { members.value = [] }
  async function invite(email) { void email; inviting.value = true; try { /* TODO */ } finally { inviting.value = false } }

  return { members, inviting, fetchTeam, invite }
}
