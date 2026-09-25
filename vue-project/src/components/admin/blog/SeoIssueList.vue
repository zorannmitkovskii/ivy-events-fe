<template>
  <ul v-if="issues.length" class="seo-issues" :class="{ compact }">
    <li v-for="(issue, index) in ordered" :key="`${issue.code}-${index}`" :class="severityClass(issue)">
      <span v-if="!compact" class="severity">{{ t(`adminBlog.seo.severity.${issue.severity}`) }}</span>
      <span>{{ textOf(issue) }}</span>
    </li>
  </ul>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * SEO findings for one language of a post (IVY-907), errors first.
 *
 * Its own component rather than part of the text editor, so it stays when
 * blocks replace the editor. The server writes each finding in Macedonian and
 * sends the numbers alongside; this says it in the editor's language when a
 * translation exists and falls back to the server's sentence when not.
 *
 * `compact` is the one-line form shown under a field.
 */
const props = defineProps({
  issues: { type: Array, required: true },
  compact: { type: Boolean, default: false },
})

const SEVERITY_ORDER = { ERROR: 0, WARNING: 1 }

const { t, te } = useI18n()

const ordered = computed(() =>
  [...props.issues].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]))

function textOf(issue) {
  const key = `adminBlog.issues.${issue.code}`
  return te(key) ? t(key, issue.params || {}) : issue.message
}

function severityClass(issue) {
  return issue.severity === 'ERROR' ? 'error' : 'warning'
}
</script>

<style scoped>
.seo-issues {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
}

.seo-issues li {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  border-left: 3px solid var(--gold);
  background: var(--mist-2);
  color: var(--ink-2);
}

.seo-issues li.error {
  border-left-color: var(--danger, #b3261e);
  color: var(--ink);
}

.seo-issues.compact {
  margin-top: 4px;
  font-size: 13px;
}

.seo-issues.compact li {
  padding: 2px 8px;
}

.severity {
  flex: none;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.error .severity {
  color: var(--danger, #b3261e);
}

.warning .severity {
  color: var(--gold-deep);
}
</style>
