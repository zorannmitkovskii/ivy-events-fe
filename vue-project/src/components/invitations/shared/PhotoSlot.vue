<template>
  <!--
    INV-403: one photo slot of the invitation editor (hero, story, collage).
    The slot says what its photo is in — saved, only on this device, waiting,
    uploading (how far), not saved (why, and "Try again"), refused (why) —
    and offers choosing, replacing and removing, all with the keyboard.
    A photo the browser cannot draw, or one refused, is never drawn.
  -->
  <div
    class="photo-slot"
    :class="[`photo-slot--${photo.status}`, { 'photo-slot--wide': wide }]"
    role="group"
    :aria-labelledby="ids.label"
    :data-status="photo.status"
    data-testid="photo-slot"
  >
    <span :id="ids.label" class="photo-slot__name">{{ label }}</span>

    <button
      type="button"
      class="photo-slot__pick story-img-thumb"
      :class="{ 'story-img-thumb--empty': !shownUrl }"
      :aria-label="pickLabel"
      :aria-describedby="ids.status"
      :disabled="photo.status === 'uploading' || disabled"
      data-testid="photo-slot-pick"
      @click="choose"
    >
      <img v-if="shownUrl" :src="shownUrl" alt="" @error="onImageError" />
      <span v-else class="photo-slot__placeholder" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
        <span class="placeholder-label">{{ placeholder }}</span>
      </span>
      <span
        v-if="photo.own"
        class="story-img-badge"
        :class="`story-img-badge--${photo.status}`"
        aria-hidden="true"
      >
        <svg v-if="photo.status === 'saved'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <svg v-else-if="photo.status === 'failed'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="6" x2="12" y2="13"/><line x1="12" y1="18" x2="12" y2="18.5"/></svg>
        <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="12" cy="12" r="3"/></svg>
      </span>
    </button>

    <p
      :id="ids.status"
      class="photo-slot__status"
      aria-live="polite"
      data-testid="photo-slot-status"
    >{{ statusText }}</p>

    <progress
      v-if="photo.status === 'uploading'"
      class="photo-slot__progress"
      max="100"
      :value="photo.progress || 0"
      :aria-label="t('editSection.photos.progressLabel', { slot: label })"
    />

    <div v-if="canRetry || canRemove || photo.status === 'removed'" class="photo-slot__actions">
      <button
        v-if="canRetry"
        type="button"
        class="photo-slot__action photo-slot__action--primary"
        :aria-label="t('editSection.photos.retryFor', { slot: label })"
        :disabled="disabled"
        data-testid="photo-slot-retry"
        @click="emit('retry')"
      >{{ t('editSection.photos.retry') }}</button>
      <button
        v-if="canRemove"
        type="button"
        class="photo-slot__action"
        :aria-label="t('editSection.photos.removeFor', { slot: label })"
        data-testid="photo-slot-remove"
        @click="emit('remove')"
      >{{ t('editSection.photos.remove') }}</button>
      <button
        v-if="photo.status === 'removed'"
        type="button"
        class="photo-slot__action"
        :aria-label="t('editSection.photos.restoreFor', { slot: label })"
        data-testid="photo-slot-restore"
        @click="emit('restore')"
      >{{ t('editSection.photos.restore') }}</button>
    </div>

    <input
      ref="input"
      type="file"
      :accept="PHOTO_ACCEPT"
      tabindex="-1"
      aria-hidden="true"
      style="display:none"
      data-testid="photo-slot-input"
      @change="onFile"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { PHOTO_ACCEPT } from '@/composables/useInvitationPhotos';

const { t } = useI18n();

const props = defineProps({
  // { status, url, error, progress, own } — from the editor's photo slots.
  photo: { type: Object, required: true },
  // The slot's accessible name, e.g. "Story photo 2".
  label: { type: String, required: true },
  // Short text inside an empty slot.
  placeholder: { type: String, default: '' },
  wide: { type: Boolean, default: false },
  // A saved photo can be removed here (not the hero: the design needs one).
  removableSaved: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['pick', 'remove', 'restore', 'retry', 'broken']);

const uid = `photo-slot-${Math.random().toString(36).slice(2, 10)}`;
const ids = { label: `${uid}-name`, status: `${uid}-status` };

const input = ref(null);
// A saved photo whose image does not load (e.g. a link that expired): it is
// still the event's — only this view says it cannot be shown.
const savedUnavailable = ref(false);
watch(() => props.photo.url, () => { savedUnavailable.value = false; });

const PICKED = ['checking', 'local', 'pending', 'uploading', 'failed'];

const shownUrl = computed(() => (savedUnavailable.value ? '' : props.photo.url || ''));

const hasOwn = computed(() => props.photo.own || props.photo.status === 'invalid');
const pickLabel = computed(() =>
  t(hasOwn.value ? 'editSection.photos.replaceFor' : 'editSection.photos.chooseFor', { slot: props.label })
);

const canRetry = computed(() => props.photo.status === 'failed');
const canRemove = computed(() => {
  const s = props.photo.status;
  if (s === 'uploading') return false;
  if (PICKED.includes(s) || s === 'invalid') return true;
  return s === 'saved' && props.removableSaved;
});

const statusText = computed(() => {
  const p = props.photo;
  if (savedUnavailable.value) return t('editSection.photos.status.unavailable');
  switch (p.status) {
    case 'uploading':
      return t('editSection.photos.status.uploading', { percent: p.progress || 0 });
    case 'failed':
      return `${t('editSection.photos.status.failed')} ${t(`editSection.photos.errors.${p.error || 'failed'}`)}`;
    case 'invalid':
      return t(`editSection.photos.errors.${p.error || 'type'}`);
    default:
      return t(`editSection.photos.status.${p.status}`);
  }
});

function choose() {
  if (!input.value) return;
  input.value.value = '';
  input.value.click();
}

function onFile(e) {
  const file = e.target.files?.[0];
  if (file) emit('pick', file);
  if (e.target) e.target.value = '';
}

function onImageError() {
  if (PICKED.includes(props.photo.status)) emit('broken');
  else if (props.photo.status === 'saved') savedUnavailable.value = true;
}

defineExpose({ choose });
</script>

<style scoped>
.photo-slot {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.photo-slot__name {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-3, #6b7280);
}

.photo-slot__pick {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--line, #e5e7eb);
  background: var(--sunken, #f6f6f6);
  cursor: pointer;
  font: inherit;
  color: var(--ink-4, #9ca3af);
}

.photo-slot--wide .photo-slot__pick {
  aspect-ratio: 16 / 9;
}

.photo-slot__pick:focus-visible,
.photo-slot__action:focus-visible {
  outline: 2px solid var(--brand-gold, #b8860b);
  outline-offset: 2px;
}

.photo-slot__pick:disabled {
  cursor: progress;
}

.photo-slot__pick img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

/* Not saved yet: the photo is drawn, but plainly not as a saved one. */
.photo-slot--local .photo-slot__pick img,
.photo-slot--pending .photo-slot__pick img,
.photo-slot--checking .photo-slot__pick img,
.photo-slot--uploading .photo-slot__pick img {
  opacity: 0.75;
}

.photo-slot--failed .photo-slot__pick,
.photo-slot--invalid .photo-slot__pick {
  border: 2px solid #b91c1c;
}

.photo-slot--failed .photo-slot__pick img {
  opacity: 0.45;
  filter: grayscale(0.6);
}

.photo-slot--example .photo-slot__pick img {
  opacity: 0.6;
}

.photo-slot--removed .photo-slot__pick,
.photo-slot--empty .photo-slot__pick,
.photo-slot--invalid .photo-slot__pick {
  border-style: dashed;
}

.photo-slot__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 4px;
}

.placeholder-label {
  font-size: 10px;
  font-weight: 600;
  text-align: center;
}

.story-img-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #6b7280;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-img-badge--saved { background: #047857; }
.story-img-badge--failed { background: #b91c1c; }
.story-img-badge--uploading { background: #1d4ed8; }

.photo-slot__status {
  margin: 0;
  font-size: 11px;
  line-height: 1.35;
  color: var(--ink-3, #4b5563);
  overflow-wrap: anywhere;
}

.photo-slot--failed .photo-slot__status,
.photo-slot--invalid .photo-slot__status {
  color: #b91c1c;
}

.photo-slot--saved .photo-slot__status {
  color: #047857;
}

.photo-slot__progress {
  width: 100%;
  height: 6px;
}

.photo-slot__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.photo-slot__action {
  min-height: 28px;
  padding: 3px 8px;
  border: 1px solid var(--line, #d1d5db);
  border-radius: 6px;
  background: #fff;
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-2, #374151);
  cursor: pointer;
}

.photo-slot__action--primary {
  border-color: #b91c1c;
  color: #b91c1c;
}

.photo-slot__action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
