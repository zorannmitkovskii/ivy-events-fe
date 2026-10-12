<template>
  <BaseModal :open="open" :title="t('editAgenda.title')" @close="emit('close')">
    <!-- INV-401: optional, what guests see, an example (static text). -->
    <FieldGuide
      :id="guideId"
      class="section-guide"
      section
      :guests="t('editSection.guide.programme.guests')"
      :example="t('editSection.guide.programme.example')"
    />
    <!-- INV-402: not read yet / could not be read — nothing to edit, no save. -->
    <SectionStateNotice
      v-if="!loaded"
      kind="agenda"
      :state="loadState === 'failed' ? 'failed' : 'loading'"
      :busy="busy"
      @retry="emit('retry-load')"
    />
    <template v-else>
    <SectionStateNotice v-if="hidden" ref="hiddenNotice" kind="agenda" state="hidden" @show="onShow" />
    <SectionStateNotice v-if="!hasOwnItems" ref="emptyNotice" kind="agenda" state="empty" :can-skip="!hidden" @add="emit('add')" @skip="onSkip" />
    <p v-if="hasExamples" class="examples-note" data-testid="examples-note">{{ t('editSection.guide.examples.note') }}</p>
    <div class="items-list" v-if="items.length">
      <div
        v-for="(item, idx) in items"
        :key="item.id || 'example-' + idx"
        class="item-card"
        :class="{ 'item-card--example': isUnsavedExample(item, 'agenda') }"
        :data-example="isUnsavedExample(item, 'agenda') ? 'true' : undefined"
      >
        <!-- Header row -->
        <div class="item-card-header" @click="toggleExpand(item.id || 'example-' + idx)">
          <button
            type="button"
            class="item-info item-toggle"
            :aria-expanded="isExpanded(item.id || 'example-' + idx) ? 'true' : 'false'"
            :aria-controls="itemBodyId(idx)"
            @click.stop="toggleExpand(item.id || 'example-' + idx)"
          >
            <span class="item-type">
              {{ t(`agenda.types.${item.type}`) }}
              <span v-if="isUnsavedExample(item, 'agenda')" class="example-badge" data-testid="example-badge">{{ t('editSection.guide.examples.badge') }}</span>
            </span>
            <span class="item-time" v-if="!isExpanded(item.id || 'example-' + idx)">{{ item.time || '' }}</span>
          </button>
          <div class="item-actions">
            <button v-if="!noAdd" class="icon-btn icon-btn--danger" type="button" :aria-label="t('editSection.a11y.deleteItem', { item: t(`agenda.types.${item.type}`) })" @click.stop="emit('delete', item.id, item)">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
            <svg
              class="expand-chevron"
              aria-hidden="true"
              :class="{ 'expand-chevron--open': isExpanded(item.id || 'example-' + idx) }"
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>

        <!-- Expandable inline form -->
        <div v-if="isExpanded(item.id || 'example-' + idx)" :id="itemBodyId(idx)" class="item-card-body">
          <div class="field">
            <label :for="fieldId(idx, 'type')">{{ t('agenda.form.type') }}</label>
            <select :id="fieldId(idx, 'type')" class="input" :value="item.type" @change="onFieldChange(item, 'type', $event.target.value)">
              <option v-for="val in availableTypes" :key="val" :value="val">
                {{ t(`agenda.types.${val}`) }}
              </option>
            </select>
          </div>
          <div class="field">
            <label :id="fieldId(idx, 'time')">{{ t('agenda.form.startTime') }}</label>
            <div class="time-selects" role="group" :aria-labelledby="fieldId(idx, 'time')">
              <select class="input" :aria-label="t('editSection.a11y.hours')" :value="getHour(item.time)" @change="onTimeChange(item, $event.target.value, getMinute(item.time))">
                <option v-for="h in 24" :key="h-1" :value="String(h-1).padStart(2,'0')">
                  {{ String(h-1).padStart(2,'0') }}
                </option>
              </select>
              <span class="time-sep">:</span>
              <select class="input" :aria-label="t('editSection.a11y.minutes')" :value="getMinute(item.time)" @change="onTimeChange(item, getHour(item.time), $event.target.value)">
                <option v-for="m in [0,5,10,15,20,25,30,35,40,45,50,55]" :key="m" :value="String(m).padStart(2,'0')">
                  {{ String(m).padStart(2,'0') }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
    </template>

    <template #footer>
      <ButtonMain variant="outline" type="button" @click="emit('close')">
        {{ t('common.close') }}
      </ButtonMain>
      <ButtonMain v-if="loaded && hasOwnItems && !props.noAdd && (!props.maxItems || items.length < props.maxItems)" variant="main" type="button" @click="emit('add')">
        {{ t('editAgenda.addItem') }}
      </ButtonMain>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, useId, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import BaseModal from "@/components/ui/BaseModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import { AgendaType } from "@/enums/AgendaType";
import FieldGuide from "@/components/invitations/shared/FieldGuide.vue";
import SectionStateNotice from "@/components/invitations/shared/SectionStateNotice.vue";
import { isUnsavedExample } from "@/utils/creationSteps";

const { t } = useI18n();

const props = defineProps({
  open: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  maxItems: { type: Number, default: 0 },
  noAdd: { type: Boolean, default: false },
  // INV-402: the section is hidden from the invitation (its entries are kept).
  hidden: { type: Boolean, default: false },
  // INV-402: 'idle' | 'loading' | 'loaded' | 'failed' — whether the list was read.
  loadState: { type: String, default: "loaded" },
  busy: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "add", "delete", "update", "skip", "show", "retry-load"]);

const loaded = computed(() => props.loadState === "loaded");
// Examples shown only on screen are not entries: with nothing else the
// section is empty (INV-402).
const hasOwnItems = computed(() => props.items.some((i) => !isUnsavedExample(i, "agenda")));

const hiddenNotice = ref(null);
const emptyNotice = ref(null);
// After "Skip" / "Show it again" the button pressed is gone: the keyboard
// goes to the action that undoes it (or adds the first entry).
let focusAfter = null;
function onSkip() {
  focusAfter = "hidden";
  emit("skip");
}
function onShow() {
  focusAfter = "empty";
  emit("show");
}
watch(() => props.hidden, () => {
  const target = focusAfter;
  focusAfter = null;
  if (target) nextTick(() => (target === "hidden" ? hiddenNotice : emptyNotice).value?.focusAction());
});

const guideId = `${useId()}-programme-guide`;
// INV-503: ids that tie each item's toggle, labels and fields together.
const itemUid = useId();
const itemBodyId = (idx) => `${itemUid}-item-${idx}`;
const fieldId = (idx, name) => `${itemUid}-${idx}-${name}`;
const hasExamples = computed(() => props.items.some((i) => isUnsavedExample(i, 'agenda')));

const expandedId = ref(null);

const availableTypes = computed(() => Object.values(AgendaType));

function isExpanded(id) { return expandedId.value === id; }

// An example being edited becomes an entry with an id (INV-402): it stays open.
watch(() => props.items, (items) => {
  const m = /^example-(\d+)$/.exec(expandedId.value || "");
  const now = m && items[Number(m[1])];
  if (now?.id) expandedId.value = now.id;
}, { deep: true });
function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id; }

function getHour(time) {
  if (!time) return '00';
  return (time.split(':')[0] || '00').padStart(2, '0');
}

function getMinute(time) {
  if (!time) return '00';
  return (time.split(':')[1] || '00').padStart(2, '0');
}

function onFieldChange(item, field, value) {
  emit('update', { id: item.id, type: item.type, time: item.time || '00:00', [field]: value }, item);
}

function onTimeChange(item, hour, minute) {
  emit('update', { id: item.id, type: item.type, time: `${hour}:${minute}` }, item);
}
</script>

<style scoped>
.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-card {
  background: var(--neutral-50, var(--sunken));
  border: 1px solid var(--neutral-200, var(--line));
  border-radius: 10px;
  overflow: hidden;
}

.item-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.item-card-header:hover {
  background: var(--neutral-100, var(--sunken));
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-type {
  font-size: 14px;
  font-weight: 600;
  color: var(--brand-main, var(--ink));
}

.item-time {
  font-size: 12px;
  color: var(--neutral-500, var(--ink-3));
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.expand-chevron {
  transition: transform 0.2s ease;
  color: var(--neutral-400, var(--ink-4));
}

.expand-chevron--open {
  transform: rotate(90deg);
}

.item-card-body {
  padding: 0 12px 12px;
  display: grid;
  gap: 12px;
}

.field label {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-500);
  display: block;
  margin-bottom: 6px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.input {
  width: 100%;
  border: 2px solid var(--neutral-300);
  background: var(--bg-main, #fff);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--brand-main);
  outline: none;
  transition: border-color 0.2s ease;
}

.input:focus {
  border-color: var(--brand-gold);
}

.time-selects {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-selects .input {
  flex: 1;
  text-align: center;
}

.time-sep {
  font-weight: 700;
  font-size: 16px;
  color: var(--neutral-500);
}

.icon-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid var(--neutral-200, var(--line));
  border-radius: 6px;
  cursor: pointer;
  color: var(--neutral-600, var(--ink-2));
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: var(--neutral-100, var(--sunken));
  border-color: var(--neutral-300, var(--line-2));
}

.icon-btn--danger:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.section-guide {
  margin: 0 0 10px;
}

.examples-note {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--neutral-600, var(--ink-3));
}

/* An example entry: dashed edge and a worded badge, not only a colour. */
.item-card--example {
  border-style: dashed;
}

.example-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 0 6px;
  border: 1px dashed currentColor;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  font-style: italic;
  color: var(--neutral-600, var(--ink-3));
  vertical-align: middle;
}


/* INV-503: the row's toggle is a real button; focus is always visible */
.item-toggle {
  flex: 1;
  min-width: 0;
  align-items: flex-start;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.item-toggle:focus-visible,
.icon-btn:focus-visible,
.input:focus-visible,
.toggle-row:focus-visible,
.image-upload-area:focus-visible,
.image-action-btn:focus-visible {
  outline: 3px solid var(--moss, #5e7f58);
  outline-offset: 2px;
}
</style>
