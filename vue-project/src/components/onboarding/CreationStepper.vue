<template>
  <nav class="cstep" :aria-label="t('creationSteps.label')" data-testid="creation-stepper">
    <ol class="cstep__list" @keydown="onKeydown">
      <li
        v-for="step in steps"
        :key="step.key"
        class="cstep__item"
        :class="[`cstep__item--${step.status}`, { 'cstep__item--current': step.current }]"
      >
        <button
          :ref="(el) => setButton(step.index, el)"
          type="button"
          class="cstep__btn"
          :data-step="step.key"
          :data-status="step.status"
          :aria-current="step.current ? 'step' : undefined"
          :title="hint(step) || undefined"
          @click="emit('go', step.key)"
        >
          <span class="cstep__marker" aria-hidden="true">
            <svg v-if="step.status === 'complete'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <template v-else-if="step.status === 'error'">!</template>
            <template v-else>{{ step.index + 1 }}</template>
          </span>
          <span class="cstep__text">
            <span class="cstep__label">{{ t(`creationSteps.steps.${step.key}`) }}</span>
            <span v-if="hint(step)" class="cstep__hint" aria-hidden="true">{{ hint(step) }}</span>
          </span>
          <span class="cstep__sr">{{ srText(step) }}</span>
        </button>
      </li>
    </ol>
    <p class="cstep__summary" aria-live="polite" data-testid="creation-stepper-summary">
      {{ summary }}
    </p>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

/**
 * The steps of making an invitation (INV-102): Event, Design, Details, RSVP,
 * Preview. Purely presentational — the statuses come from
 * `utils/creationSteps` and a click only says which step was asked for; the
 * page decides where that leads (useCreationSteps).
 *
 * Status is never colour alone: a tick, a "!" or the step number, plus the
 * status in words for screen readers and, where something is missing, the
 * fields by name. Tab reaches each step; the arrow keys, Home and End move
 * between them.
 */
const props = defineProps({
  steps: { type: Array, required: true },
});

const emit = defineEmits(["go"]);
const { t } = useI18n();

const buttons = [];
function setButton(index, el) {
  buttons[index] = el;
}

function onKeydown(e) {
  const index = buttons.indexOf(document.activeElement);
  if (index < 0) return;
  const last = props.steps.length - 1;
  const next = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1, Home: 0, End: last }[e.key];
  if (next === undefined) return;
  e.preventDefault();
  buttons[Math.min(last, Math.max(0, next))]?.focus();
}

function fieldList(step) {
  return step.problems.map((p) => t(p.labelKey)).join(", ");
}

function hint(step) {
  if (step.problems.length) return t("creationSteps.fix", { fields: fieldList(step) });
  if (step.status === "optional" || step.status === "skipped") return t(`creationSteps.status.${step.status}`);
  return "";
}

function srText(step) {
  const parts = [
    t("creationSteps.position", { n: step.index + 1, total: props.steps.length }),
    t(`creationSteps.status.${step.status}`),
  ];
  if (step.current) parts.push(t("creationSteps.current"));
  if (step.problems.length) parts.push(t("creationSteps.fix", { fields: fieldList(step) }));
  return ", " + parts.join(", ");
}

const summary = computed(() => {
  const current = props.steps.find((s) => s.current) || props.steps[0];
  if (!current) return "";
  const line = t("creationSteps.progress", {
    n: current.index + 1,
    total: props.steps.length,
    step: t(`creationSteps.steps.${current.key}`),
  });
  const h = hint(current);
  return h ? `${line} · ${h}` : line;
});
</script>

<style scoped>
.cstep {
  container-type: inline-size;
  width: 100%;
}

.cstep__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 4px;
}

.cstep__item {
  flex: 1 1 0;
  min-width: 0;
  position: relative;
}

/* The line between markers */
.cstep__item + .cstep__item::before {
  content: "";
  position: absolute;
  top: 19px;
  left: calc(-50% + 18px);
  right: calc(50% + 18px);
  height: 2px;
  background: var(--line-2, #d0d5dd);
}

.cstep__item--complete + .cstep__item::before,
.cstep__item--skipped + .cstep__item::before {
  background: var(--brand-main, #334338);
}

.cstep__btn {
  width: 100%;
  min-height: 44px;
  padding: 6px 2px;
  border: none;
  border-radius: 10px;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font: inherit;
  color: var(--neutral-700, var(--ink-2, #344054));
  text-align: center;
}

.cstep__btn:hover {
  background: var(--sunken, #f2f4f7);
}

.cstep__btn:focus-visible {
  outline: 3px solid var(--brand-gold, #c4956a);
  outline-offset: 1px;
}

.cstep__marker {
  position: relative;
  z-index: 1;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid var(--line-2, #d0d5dd);
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.cstep__item--complete .cstep__marker {
  background: var(--brand-main, #334338);
  border-color: var(--brand-main, #334338);
  color: #fff;
}

.cstep__item--error .cstep__marker {
  background: #fef3f2;
  border-color: #b42318;
  color: #b42318;
}

.cstep__item--optional .cstep__marker,
.cstep__item--skipped .cstep__marker {
  border-style: dashed;
}

.cstep__item--current .cstep__marker {
  box-shadow: 0 0 0 3px rgba(196, 149, 106, 0.45);
}

.cstep__text {
  display: grid;
  gap: 1px;
  min-width: 0;
  max-width: 100%;
}

.cstep__label {
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cstep__item--current .cstep__label {
  color: var(--neutral-900, var(--ink, #101828));
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 2px;
}

.cstep__hint {
  font-size: 11px;
  color: var(--neutral-500, var(--ink-3, #667085));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cstep__item--error .cstep__hint {
  color: #b42318;
}

.cstep__summary {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--neutral-700, var(--ink-2, #344054));
  text-align: center;
}

.cstep__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Narrow (a phone, the editor's sidebar): markers only, the current step and
   what it needs are spelled out in the summary line below. */
@container (max-width: 520px) {
  .cstep__hint {
    display: none;
  }

  .cstep__label {
    display: none;
  }

  .cstep__item--current .cstep__label {
    display: block;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .cstep__btn {
    transition: background 0.15s ease;
  }
}
</style>
