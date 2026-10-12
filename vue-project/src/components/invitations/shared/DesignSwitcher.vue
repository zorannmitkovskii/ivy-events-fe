<template>
  <section class="design-switch" data-testid="design-switch" :aria-labelledby="ids.title">
    <div class="design-switch__head">
      <div class="design-switch__heading">
        <h3 :id="ids.title" class="design-switch__title">{{ t('editSection.designSwitch.title') }}</h3>
        <p class="design-switch__current" data-testid="design-switch-current">{{ currentName }}</p>
      </div>
      <button
        type="button"
        class="design-switch__toggle"
        data-testid="design-switch-toggle"
        data-info-field="design"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-controls="ids.panel"
        @click="toggle"
      >
        {{ open ? t('editSection.designSwitch.close') : t('editSection.designSwitch.change') }}
      </button>
    </div>

    <div v-if="open" :id="ids.panel" class="design-switch__panel">
      <p class="design-switch__hint" :id="ids.hint">{{ t('editSection.designSwitch.keepsContent') }}</p>
      <p class="design-switch__hint">{{ t('editSection.designSwitch.styleNote') }}</p>
      <p v-if="existingEvent" class="design-switch__hint" data-testid="design-switch-link-note">
        {{ t('editSection.designSwitch.linkNote') }}
      </p>

      <p v-if="loading" class="design-switch__state">{{ t('editSection.designSwitch.loading') }}</p>
      <div v-else-if="error" class="design-switch__state design-switch__state--error" role="alert">
        <span>{{ t('editSection.designSwitch.loadError') }}</span>
        <button type="button" class="design-switch__link" @click="emit('retry')">{{ t('editSection.designSwitch.retry') }}</button>
      </div>
      <p v-else-if="!designs.length" class="design-switch__state">{{ t('editSection.designSwitch.empty') }}</p>

      <ul v-else class="design-switch__list" role="list" :aria-label="t('editSection.designSwitch.listLabel')">
        <li v-for="d in designs" :key="d.presetId">
          <button
            :ref="(el) => setItemRef(d.presetId, el)"
            type="button"
            class="design-switch__item"
            :class="{ 'design-switch__item--current': d.presetId === currentId }"
            :aria-pressed="d.presetId === currentId ? 'true' : 'false'"
            :aria-describedby="ids.hint"
            :data-design="d.presetId"
            :disabled="busy"
            @click="choose(d)"
          >
            <span class="design-switch__thumb" aria-hidden="true">
              <img v-if="d.thumbnailUrl && !brokenThumbs[d.presetId]" :src="d.thumbnailUrl" alt="" @error="brokenThumbs[d.presetId] = true" />
            </span>
            <span class="design-switch__text">
              <span class="design-switch__name">{{ d.name }}</span>
              <span v-if="d.descriptionKey" class="design-switch__desc">{{ t(d.descriptionKey) }}</span>
            </span>
            <span v-if="d.presetId === currentId" class="design-switch__badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              {{ t('editSection.designSwitch.currentBadge') }}
            </span>
          </button>
        </li>
      </ul>

      <!-- Leaving one's own design (builder) is the one change that cannot be undone. -->
      <div
        v-if="pending"
        class="design-switch__confirm"
        role="group"
        :aria-labelledby="ids.confirmTitle"
        :aria-describedby="ids.confirmBody"
        data-testid="design-switch-confirm"
      >
        <p :id="ids.confirmTitle" class="design-switch__confirm-title">{{ t('editSection.designSwitch.confirmTitle') }}</p>
        <p :id="ids.confirmBody" class="design-switch__confirm-body">{{ t('editSection.designSwitch.confirmBody', { name: pending.name }) }}</p>
        <div class="design-switch__confirm-actions">
          <button ref="confirmBtn" type="button" class="design-switch__primary" data-testid="design-switch-confirm-yes" @click="confirm">
            {{ t('editSection.designSwitch.confirmYes', { name: pending.name }) }}
          </button>
          <button type="button" class="design-switch__secondary" data-testid="design-switch-confirm-no" @click="cancel">
            {{ t('editSection.designSwitch.confirmNo') }}
          </button>
        </div>
      </div>
    </div>

    <!-- What the person added that this design has no place for: kept, and said so. -->
    <div v-if="hidden.length" class="design-switch__hidden" data-testid="design-switch-hidden">
      <p class="design-switch__hidden-title">{{ t('editSection.designSwitch.hiddenTitle') }}</p>
      <ul class="design-switch__hidden-list">
        <li v-for="h in hidden" :key="h.kind" :data-hidden="h.kind">{{ hiddenText(h) }}</li>
      </ul>
      <p class="design-switch__hidden-note">{{ t('editSection.designSwitch.hiddenNote') }}</p>
    </div>

    <p class="design-switch__sr" role="status" aria-live="polite">{{ announcement }}</p>
  </section>
</template>

<script setup>
import { ref, reactive, nextTick, useId } from "vue";
import { useI18n } from "vue-i18n";

/*
 * INV-203: change the design of an invitation being edited. Only the look
 * changes — the parent keeps every piece of content and says which of it the
 * new design does not show. Same component in the desktop sidebar and the
 * phone sheet (Info tab).
 */
const props = defineProps({
  currentId: { type: String, default: "" },
  currentName: { type: String, default: "" },
  // [{ presetId, templateId, name, descriptionKey, thumbnailUrl }]
  designs: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  // [{ kind, count, shown? }] — content kept but not drawn by this design.
  hidden: { type: Array, default: () => [] },
  // The current design is the person's own (builder): leaving it needs a yes.
  confirmLeaving: { type: Boolean, default: false },
  // An event exists: its invitation link names the design.
  existingEvent: { type: Boolean, default: false },
  announcement: { type: String, default: "" },
});
const emit = defineEmits(["open", "switch", "retry"]);
const { t } = useI18n();

const uid = useId();
const ids = {
  title: `design-switch-title-${uid}`,
  panel: `design-switch-panel-${uid}`,
  hint: `design-switch-hint-${uid}`,
  confirmTitle: `design-switch-confirm-title-${uid}`,
  confirmBody: `design-switch-confirm-body-${uid}`,
};

const open = ref(false);
const pending = ref(null);
const confirmBtn = ref(null);
const brokenThumbs = reactive({});
const itemRefs = {};

function setItemRef(id, el) {
  if (el) itemRefs[id] = el;
  else delete itemRefs[id];
}

function toggle() {
  open.value = !open.value;
  pending.value = null;
  if (open.value) emit("open");
}

async function choose(d) {
  if (d.presetId === props.currentId) return;
  if (props.confirmLeaving) {
    pending.value = d;
    await nextTick();
    confirmBtn.value?.focus();
    return;
  }
  emit("switch", d);
}

function confirm() {
  const d = pending.value;
  pending.value = null;
  if (d) emit("switch", d);
}

async function cancel() {
  const id = pending.value?.presetId;
  pending.value = null;
  await nextTick();
  if (id) itemRefs[id]?.focus();
}

function hiddenText(h) {
  if (h.kind === "storyPhotos" && h.shown > 0) {
    return t("editSection.designSwitch.hidden.storyPhotosSome", { count: h.count, shown: h.shown });
  }
  return t(`editSection.designSwitch.hidden.${h.kind}`, { count: h.count });
}
</script>

<style scoped>
.design-switch {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

.design-switch__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.design-switch__heading {
  min-width: 0;
}

.design-switch__title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-3);
}

.design-switch__current {
  margin: 2px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  overflow-wrap: anywhere;
}

.design-switch__toggle,
.design-switch__secondary {
  flex-shrink: 0;
  min-height: 32px;
  padding: 4px 12px;
  border: 1px solid var(--line-2, #d1d5db);
  border-radius: 6px;
  background: #fff;
  color: var(--ink);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.design-switch__primary {
  min-height: 32px;
  padding: 4px 12px;
  border: 1px solid var(--ink);
  border-radius: 6px;
  background: var(--ink);
  color: #fff;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.design-switch__toggle:focus-visible,
.design-switch__primary:focus-visible,
.design-switch__secondary:focus-visible,
.design-switch__item:focus-visible,
.design-switch__link:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}

.design-switch__panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.design-switch__hint,
.design-switch__state {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--ink-3);
}

.design-switch__state--error {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: #b42318;
}

.design-switch__link {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

.design-switch__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.design-switch__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 44px;
  padding: 6px 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.design-switch__item:disabled {
  cursor: progress;
  opacity: 0.7;
}

.design-switch__item--current {
  border: 2px solid var(--ink);
  padding: 5px 7px;
}

.design-switch__thumb {
  flex-shrink: 0;
  width: 40px;
  height: 52px;
  border-radius: 4px;
  background: var(--sunken, #f3f4f6);
  overflow: hidden;
}

.design-switch__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.design-switch__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.design-switch__name {
  font-size: 13px;
  font-weight: 600;
}

.design-switch__desc {
  font-size: 11px;
  line-height: 1.35;
  color: var(--ink-3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.design-switch__badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--ink);
}

.design-switch__confirm {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border: 1px solid #f0b429;
  border-radius: 8px;
  background: #fffbeb;
}

.design-switch__confirm-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}

.design-switch__confirm-body {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--ink);
}

.design-switch__confirm-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.design-switch__hidden {
  padding: 10px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--ink-3);
  border-radius: 6px;
  background: var(--bg-2, #f9fafb);
}

.design-switch__hidden-title {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 700;
  color: var(--ink);
}

.design-switch__hidden-list {
  margin: 0 0 4px;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--ink);
}

.design-switch__hidden-note {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--ink-3);
}

.design-switch__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
</style>
