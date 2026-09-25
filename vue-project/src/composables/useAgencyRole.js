import { computed } from 'vue'
import { hasRole } from '@/services/auth.service'

/**
 * Which of the two people the agency workspace is drawn for.
 *
 * <p>The owner runs the agency; a member works on some of its events. The
 * backend makes the same split from the same token and answers accordingly —
 * this only decides which layout to draw around the answer.
 */
export function useAgencyRole() {
  const isOwner = computed(() => hasRole('AGENCY'))
  return { isOwner }
}
