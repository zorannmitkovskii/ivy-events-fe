<template>
  <section class="workload">
    <header class="head">
      <h2>{{ t('teamWorkload.title') }}</h2>
      <RouterLink :to="teamLink" class="manage">{{ t('teamWorkload.manage') }}</RouterLink>
    </header>

    <p v-if="loading" class="state">{{ t('teamWorkload.loading') }}</p>

    <!--
      A failed load says so. An empty list under a failed request reads as "you
      have no team", which is a different and far more alarming fact.
    -->
    <p v-else-if="error" class="state error" role="alert">{{ error }}</p>

    <p v-else-if="rows.length === 0" class="state">
      {{ t('teamWorkload.empty') }}
      <RouterLink :to="teamLink">{{ t('teamWorkload.addFirst') }}</RouterLink>
    </p>

    <template v-else>
      <p class="lede">{{ t('teamWorkload.lede') }}</p>
      <ul class="rows">
        <li v-for="row in rows" :key="row.id">
          <span class="name">{{ row.firstName }} {{ row.lastName }}</span>
          <span class="counts">
            {{ t('teamWorkload.events', { n: row.activeEvents }) }}
          </span>
          <span class="counts" :class="{ late: row.overdueTasks > 0 }">
            {{ t('teamWorkload.overdue', { n: row.overdueTasks }) }}
          </span>
        </li>
      </ul>
      <p v-if="total > rows.length" class="more">
        {{ t('teamWorkload.more', { shown: rows.length, total }) }}
      </p>
    </template>
  </section>
</template>

<script setup>
/**
 * Who on the agency is carrying what (IVY-1202, item 5).
 *
 * <p>Held back when the rest of that ticket shipped, because the honest version
 * needed an organizer directory: grouping by {@code created_by} would have
 * looked like the feature and answered the wrong question — who opened an event
 * is not who is running it. The directory arrived with IVY-1102, and this reads
 * the agency-scoped view of it, which takes no organization id at all.
 *
 * <p>Ordered by late work, not alphabetically. The dashboard is read to find
 * what needs attention, and a name at the top of an alphabet is not that.
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import { agencyTeamService } from '@/services/agencyTeam.service'
import { getErrorMessage } from '@/services/apiError'

/** Enough to see who is loaded; the full roster is one click away. */
const SHOWN = 5

const { t } = useI18n()
const route = useRoute()

const rows = ref([])
const total = ref(0)
const loading = ref(true)
const error = ref('')

const teamLink = computed(() => `/${route.params.lang || 'mk'}/org/users`)

onMounted(async () => {
  try {
    const response = await agencyTeamService.workload({ max: SHOWN })
    const data = response?.data ?? response
    rows.value = data.rows || []
    total.value = data.total || 0
  } catch (e) {
    error.value = `${t('teamWorkload.failed')} ${getErrorMessage(e)}`
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.workload {
  background: var(--cards-color, #fff);
  border: 1px solid var(--border-color, #e6e5e1);
  border-radius: 12px;
  padding: 16px;
}

.head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.head h2 {
  font-size: 1rem;
  margin: 0;
}

.manage {
  margin-left: auto;
  font-size: 0.8125rem;
  color: var(--brand-main, #0b0b0b);
}

.lede {
  font-family: var(--font-ui);
  margin: 4px 0 10px;
  font-size: 0.8125rem;
  color: var(--text-muted, #52514e);
}

.state {
  margin: 10px 0 0;
  font-size: 0.875rem;
  color: var(--text-muted, #52514e);
}

.state.error {
  color: #b3261e;
  font-weight: 600;
}

.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rows li {
  font-family: var(--font-ui);
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  align-items: baseline;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color, var(--sunken));
}

.rows li:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.name {
  font-weight: 600;
  font-size: 0.9375rem;
}

.counts {
  font-size: 0.8125rem;
  color: var(--text-muted, #52514e);
  font-variant-numeric: tabular-nums;
}

.late {
  color: #b3261e;
  font-weight: 600;
}

.more {
  margin: 10px 0 0;
  font-size: 0.75rem;
  color: var(--text-muted, #52514e);
}

@media (max-width: 720px) {
  .rows li {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}
</style>
