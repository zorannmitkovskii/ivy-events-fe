<template>
  <div class="access-model">
    <div class="two-col">
      <section class="card">
        <h3>{{ t('agencyScreens.permissions.modelTitle') }}</h3>
        <p class="lede">{{ t('agencyScreens.permissions.modelHint') }}</p>
        <ul class="lines">
          <li class="line">
            <div><b>{{ t('agencyScreens.permissions.owner') }}</b><small>{{ t('agencyScreens.permissions.ownerScope') }}</small></div>
            <span class="pill green">{{ t('agencyScreens.permissions.ownerTag') }}</span>
          </li>
          <li class="line">
            <div><b>{{ t('agencyScreens.permissions.member') }}</b><small>{{ t('agencyScreens.permissions.memberScope') }}</small></div>
            <span class="pill slate">{{ t('agencyScreens.permissions.memberTag') }}</span>
          </li>
        </ul>
      </section>

      <section class="card">
        <h3>{{ t('agencyScreens.permissions.checksTitle') }}</h3>
        <p class="lede">{{ t('agencyScreens.permissions.checksHint') }}</p>
        <ul class="lines">
          <li v-for="check in CHECKS" :key="check" class="line">
            <b>{{ t(`agencyScreens.permissions.check.${check}`) }}</b>
            <span class="ok" aria-hidden="true">✓</span>
          </li>
        </ul>
      </section>
    </div>

    <div class="section-line">
      <div>
        <h2>{{ t('agencyScreens.permissions.matrixTitle') }}</h2>
        <p>{{ t('agencyScreens.permissions.matrixHint') }}</p>
      </div>
    </div>

    <section class="card matrix-card">
      <table class="matrix">
        <thead>
          <tr>
            <th>{{ t('agencyScreens.permissions.action') }}</th>
            <th>{{ t('agencyScreens.permissions.owner') }}</th>
            <th>{{ t('agencyScreens.permissions.member') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in MATRIX" :key="row.key">
            <td>{{ t(`agencyScreens.permissions.row.${row.key}`) }}</td>
            <td class="yes">✓</td>
            <td :class="row.member">{{ memberCell(row.member) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
/**
 * How access works in an agency (2026 agency design, "Дозволи на тимот").
 *
 * <p>A statement of the rules, not an editor — the editor is the per-member
 * list below it. The matrix says what the server actually enforces today:
 * a member sees the events they were put on, their own tasks and the vendor
 * directory; the pipeline is theirs only if the owner grants it; the rest is
 * the owner's whatever a privilege row says.
 */
import { useI18n } from 'vue-i18n'

const CHECKS = ['agency', 'assignment', 'finance']

/** member: yes · granted (by privilege) · no */
const MATRIX = [
  { key: 'allEvents', member: 'no' },
  { key: 'assignedEvents', member: 'yes' },
  { key: 'ownTasks', member: 'yes' },
  { key: 'pipeline', member: 'granted' },
  { key: 'reports', member: 'no' },
  { key: 'vendors', member: 'yes' },
  { key: 'members', member: 'no' },
  { key: 'settings', member: 'no' },
]

const { t } = useI18n()

function memberCell(value) {
  if (value === 'yes') return '✓'
  if (value === 'granted') return t('agencyScreens.permissions.byGrant')
  return '—'
}
</script>

<style scoped src="./agency-panels.css"></style>

<style scoped>
.access-model {
  margin-bottom: 28px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.card h3 {
  margin: 0 0 4px;
  font-size: 19px;
}

.ok {
  color: var(--moss);
  font-weight: 700;
}

.section-line {
  margin: 24px 0 12px;
}

.section-line h2 {
  margin: 0;
  font-size: 22px;
}

.section-line p {
  margin: 3px 0 0;
  color: var(--ink-3);
  font-size: 13px;
}

.matrix-card {
  padding: 0;
  overflow-x: auto;
}

.matrix {
  width: 100%;
  min-width: 480px;
  border-collapse: collapse;
  font-size: 14px;
}

.matrix th {
  padding: 12px 16px;
  background: var(--mist-2);
  color: var(--ink-3);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
}

.matrix td {
  padding: 12px 16px;
  border-top: 1px solid var(--line);
}

.matrix td.yes {
  color: var(--moss);
  font-weight: 700;
}

.matrix td.granted {
  color: var(--gold-deep);
  font-weight: 600;
}

.matrix td.no {
  color: var(--ink-3);
}

@media (max-width: 900px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
