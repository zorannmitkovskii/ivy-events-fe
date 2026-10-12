<template>
  <!--
    INV-402: what an optional section of the editor is in — and the one thing
    to do about it.
      loading: its entries are being read.
      failed:  they could not be read; saving waits for "Try again" (an
               existing event's save would otherwise erase them).
      hidden:  guests do not see it; the entries are kept, "Show it again".
      empty:   nothing yet; "Add the first …", or skip the section.
  -->
  <p
    v-if="state === 'loading'"
    class="section-state section-state--loading"
    role="status"
    data-testid="section-state"
    data-state="loading"
  >{{ t('editSection.sectionStates.loadFailed.loading') }}</p>

  <div
    v-else-if="state === 'failed'"
    class="section-state section-state--failed"
    role="alert"
    data-testid="section-state"
    data-state="failed"
  >
    <p class="section-state__title">{{ t('editSection.sectionStates.loadFailed.title', { section: sectionName }) }}</p>
    <p class="section-state__body">{{ t('editSection.sectionStates.loadFailed.body') }}</p>
    <button type="button" class="section-state__action" data-testid="section-retry" :disabled="busy" @click="emit('retry')">
      {{ t('editSection.sectionStates.loadFailed.retry') }}
    </button>
  </div>

  <div
    v-else-if="state === 'hidden'"
    class="section-state section-state--hidden"
    data-testid="section-state"
    data-state="hidden"
  >
    <p class="section-state__title">
      <span class="section-state__badge">{{ t('editSection.sectionStates.hiddenBadge') }}</span>
      {{ t('editSection.sectionStates.hidden.title') }}
    </p>
    <p class="section-state__body">{{ t('editSection.sectionStates.hidden.body') }}</p>
    <button ref="showBtn" type="button" class="section-state__action" data-testid="section-show" @click="emit('show')">
      {{ t('editSection.sectionStates.hidden.show') }}
    </button>
  </div>

  <div
    v-else-if="state === 'empty'"
    class="section-state section-state--empty"
    data-testid="section-state"
    data-state="empty"
  >
    <p class="section-state__title">{{ t(`editSection.sectionStates.empty.${kind}.title`) }}</p>
    <p class="section-state__body">{{ t(`editSection.sectionStates.empty.${kind}.body`) }}</p>
    <p class="section-state__note">{{ t('editSection.sectionStates.empty.guestsNote') }}</p>
    <div class="section-state__actions">
      <button ref="addBtn" type="button" class="section-state__action" data-testid="section-empty-add" @click="emit('add')">
        {{ t(`editSection.sectionStates.empty.${kind}.add`) }}
      </button>
      <button v-if="canSkip" type="button" class="section-state__skip" data-testid="section-skip" @click="emit('skip')">
        {{ t('editSection.sectionStates.empty.skip') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// The editor's section → the name of its list (the load state is per list).
// INV-403: 'event' — the event itself (names, date, place, photos).
const LIST_OF = { details: 'eventDetails', agenda: 'agenda', story: 'ourStory', event: 'event' };

const props = defineProps({
  // 'details' | 'agenda' | 'story' | 'event' | 'rsvp' (INV-602: hidden only)
  kind: { type: String, required: true },
  // 'loading' | 'failed' | 'hidden' | 'empty'
  state: { type: String, required: true },
  // Skipping is offered while the section is shown.
  canSkip: { type: Boolean, default: true },
  busy: { type: Boolean, default: false },
});

const emit = defineEmits(['add', 'skip', 'show', 'retry']);

const sectionName = computed(() => t(`editSection.sectionStates.names.${LIST_OF[props.kind]}`));

const showBtn = ref(null);
const addBtn = ref(null);

/** Keeps the keyboard where the person is after skip / show. */
function focusAction() {
  (showBtn.value || addBtn.value)?.focus();
}

defineExpose({ focusAction });
</script>

<style scoped>
.section-state {
  display: grid;
  gap: 6px;
  margin: 0 0 12px;
  padding: 12px;
  border: 1px solid var(--neutral-200, var(--line));
  border-radius: 10px;
  background: var(--neutral-50, var(--sunken));
  font-size: 13px;
  line-height: 1.45;
  color: var(--neutral-700, var(--ink-2));
}

.section-state p {
  margin: 0;
}

.section-state--loading {
  display: block;
  color: var(--neutral-600, var(--ink-3));
}

.section-state--failed {
  border-color: #b42318;
  border-left-width: 4px;
  background: #fef3f2;
  color: #7a271a;
}

.section-state--hidden {
  border-style: dashed;
}

.section-state__title {
  font-weight: 700;
  color: var(--brand-main, var(--ink));
}

.section-state--failed .section-state__title {
  color: #7a271a;
}

.section-state__note {
  font-size: 12px;
  color: var(--neutral-600, var(--ink-3));
}

.section-state__badge {
  display: inline-block;
  margin-right: 6px;
  padding: 0 6px;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.section-state__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin-top: 4px;
}

.section-state__action {
  justify-self: start;
  min-height: 36px;
  padding: 6px 14px;
  border: 0;
  border-radius: 8px;
  background: var(--brand-main, #1f2937);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.section-state__action:disabled {
  opacity: 0.6;
  cursor: default;
}

.section-state__skip {
  min-height: 36px;
  padding: 6px 0;
  border: 0;
  background: none;
  color: var(--neutral-700, var(--ink-2));
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
}

.section-state__action:focus-visible,
.section-state__skip:focus-visible {
  outline: 2px solid var(--brand-gold, #b8860b);
  outline-offset: 2px;
}
</style>
