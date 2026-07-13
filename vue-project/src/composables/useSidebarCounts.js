import { ref, watch, computed } from 'vue';
import { onboardingStore } from '@/store/onboarding.store';
import { guestsService } from '@/services/guests.service';
import { tasksService } from '@/services/tasks.service';
import { tablesService } from '@/services/tables.service';

/**
 * Sidebar counter badges. Fires three parallel requests (guests, tasks, tables)
 * on the current eventId, exposes them as reactive refs.
 *
 * Silently swallows errors — a missing count just hides the badge, it never
 * blocks navigation.
 *
 * TODO: replace the three calls with a single {@code GET /dashboard/summary}
 * endpoint once the backend adds it — see redesign proposal item 10.
 */
export function useSidebarCounts() {
  const guests = ref(null);
  const tasks = ref(null);
  const tablesAssigned = ref(null);
  const tablesTotal = ref(null);

  const eventId = computed(() => onboardingStore.eventId);

  function extractLength(res) {
    if (Array.isArray(res)) return res.length;
    if (Array.isArray(res?.data)) return res.data.length;
    if (Array.isArray(res?.content)) return res.content.length;
    return null;
  }

  async function fetchAll() {
    const id = eventId.value;
    if (!id || id === 'demo') {
      guests.value = null;
      tasks.value = null;
      tablesAssigned.value = null;
      tablesTotal.value = null;
      return;
    }

    // Parallelise — none of the three blocks the others.
    const [gRes, tRes, tblRes] = await Promise.allSettled([
      guestsService.list(id),
      tasksService.list?.(id) ?? tasksService.getAll?.(id) ?? Promise.reject(new Error('no tasks list')),
      tablesService.list?.(id) ?? tablesService.getAll?.(id) ?? Promise.reject(new Error('no tables list')),
    ]);

    guests.value = gRes.status === 'fulfilled' ? extractLength(gRes.value) : null;
    tasks.value = tRes.status === 'fulfilled' ? extractLength(tRes.value) : null;

    if (tblRes.status === 'fulfilled') {
      const tables = Array.isArray(tblRes.value) ? tblRes.value : (tblRes.value?.data || []);
      tablesTotal.value = tables.length || null;
      // "assigned" = tables with at least one seat filled — matches the proposal semantics.
      tablesAssigned.value = tables.filter(t => (t.guestCount || t.seatedCount || 0) > 0).length || null;
    }
  }

  // Refetch whenever the eventId changes.
  watch(eventId, fetchAll, { immediate: true });

  return {
    guests,
    tasks,
    tablesAssigned,
    tablesTotal,
    refresh: fetchAll,
  };
}
