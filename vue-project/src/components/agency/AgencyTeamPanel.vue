<template>
  <section class="card" aria-labelledby="agency-team">
    <div class="card-head">
      <div>
        <h2 id="agency-team">{{ t('agencyWork.team.title') }}</h2>
        <p class="lede">{{ t('agencyWork.team.subtitle') }}</p>
      </div>
      <span class="pill slate">{{ t('agencyWork.team.members', { n: team.members.length }) }}</span>
    </div>

    <ul class="lines">
      <li v-for="member in team.members" :key="member.id" class="line">
        <div class="person">
          <span class="av">{{ initials(member.name) || '?' }}</span>
          <div>
            <b>{{ member.name || t('agencyWork.team.unknown') }}</b>
            <small>{{ t('agencyWork.team.load', { events: member.activeEvents, tasks: member.tasksThisWeek }) }}</small>
          </div>
        </div>
        <span :class="['pill', member.overdueTasks ? 'red' : 'green']">
          {{ member.overdueTasks ? t('agencyWork.overdue', { n: member.overdueTasks }) : t('agencyWork.noOverdue') }}
        </span>
      </li>
      <li class="line">
        <div>
          <b>{{ t('agencyWork.team.unassigned') }}</b>
          <small>{{ t('agencyWork.team.unassignedHint') }}</small>
        </div>
        <b :class="{ warn: team.unassignedOverdue }">{{ team.unassignedOverdue }}</b>
      </li>
    </ul>
  </section>
</template>

<script setup>
/** Who carries the active events, and whose late work is piling up. Owner only. */
import { useI18n } from 'vue-i18n'
import { initials } from '@/utils/agencyFormat.js'

defineProps({
  team: { type: Object, required: true },
})

const { t } = useI18n()
</script>

<style scoped src="./agency-panels.css"></style>
