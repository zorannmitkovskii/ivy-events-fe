<template>
  <section class="card" aria-labelledby="agency-awaiting">
    <div class="card-head">
      <div>
        <h2 id="agency-awaiting">{{ t('agencyWork.awaiting.title') }}</h2>
        <p class="lede">{{ t('agencyWork.awaiting.subtitle') }}</p>
      </div>
    </div>

    <ul v-if="waiting.length" class="lines">
      <li v-for="row in waiting" :key="row.eventId" class="line">
        <div>
          <b>{{ row.name }}</b>
          <small>{{ row.responseRate == null ? '—' : t('agencyWork.table.answered', { n: row.responseRate }) }}</small>
        </div>
        <span class="pill amber">{{ t('agencyWork.table.awaiting', { n: row.awaitingCount }) }}</span>
      </li>
    </ul>
    <p v-else class="empty">{{ t('agencyWork.awaiting.empty') }}</p>
  </section>
</template>

<script setup>
/** Guests who were invited and have not answered, per event. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  rows: { type: Array, required: true },
})

const { t } = useI18n()

const waiting = computed(() => props.rows.filter((row) => row.awaitingCount > 0))
</script>

<style scoped src="./agency-panels.css"></style>
