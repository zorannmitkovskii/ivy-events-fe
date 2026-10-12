<template>
  <Teleport to="body">
    <div v-if="open" class="tpd-overlay" data-testid="template-preview-overlay" @mousedown.self="close">
      <div
        ref="dialogRef"
        class="tpd"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="legendId"
        data-testid="template-preview"
        :data-device="device"
        @keydown="onKeydown"
      >
        <header class="tpd__header">
          <h2 :id="titleId" class="tpd__title">{{ t('onboarding.invitations.previewDialog.title', { name }) }}</h2>

          <div class="tpd__devices" role="group" :aria-label="t('onboarding.invitations.previewDialog.device')">
            <button
              v-for="d in DEVICES"
              :key="d"
              type="button"
              class="tpd__device"
              :class="{ 'tpd__device--on': device === d }"
              :aria-pressed="device === d ? 'true' : 'false'"
              :data-testid="`template-preview-${d}`"
              @click="emit('update:device', d)"
            >
              <svg v-if="d === 'mobile'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="6" y="2" width="12" height="20" rx="2" /><line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="2" y="4" width="20" height="13" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              {{ t(`onboarding.invitations.previewDialog.${d}`) }}
            </button>
          </div>

          <button
            ref="closeRef"
            type="button"
            class="tpd__close"
            :aria-label="t('onboarding.invitations.previewDialog.close')"
            data-testid="template-preview-close"
            @click="close"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>
        </header>

        <!-- What in the preview is the person's and what is only an example. -->
        <div :id="legendId" class="tpd__legend" data-testid="template-preview-legend">
          <p v-if="forEvent" class="tpd__legend-line">{{ t('onboarding.invitations.previewDialog.eventContent') }}</p>
          <template v-else>
            <p v-if="ownItems.length" class="tpd__legend-line" data-testid="template-preview-own">
              <span class="tpd__tag tpd__tag--own">{{ t('onboarding.invitations.previewDialog.yours') }}</span>
              {{ ownItems.join(', ') }}
            </p>
            <p class="tpd__legend-line" data-testid="template-preview-sample">
              <span class="tpd__tag tpd__tag--sample">{{ t('onboarding.invitations.previewDialog.sample') }}</span>
              {{ sampleItems.join(', ') }}
            </p>
          </template>
        </div>

        <div ref="stageRef" class="tpd__stage">
          <div class="tpd__device-frame" :class="`tpd__device-frame--${device}`" :style="frameBoxStyle">
            <iframe
              ref="frameRef"
              :key="src"
              class="tpd__frame"
              :src="src"
              :title="t(`onboarding.invitations.previewDialog.frame.${device}`, { name })"
              :style="frameStyle"
              data-testid="template-preview-frame"
              @load="onFrameLoad"
            />
          </div>
          <p v-if="!loaded" class="tpd__loading" role="status">
            <span class="tpd__spinner" aria-hidden="true" />
            {{ t('onboarding.invitations.previewDialog.loading') }}
          </p>
        </div>

        <footer class="tpd__footer">
          <button type="button" class="tpd__btn" data-testid="template-preview-back" @click="close">
            {{ t('onboarding.invitations.previewDialog.back') }}
          </button>
          <button
            type="button"
            class="tpd__btn tpd__btn--primary"
            :aria-pressed="selected ? 'true' : 'false'"
            data-testid="template-preview-use"
            @click="emit('use')"
          >
            <svg v-if="selected" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M11.5 3.5L5.5 10L2.5 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {{ selected ? t('onboarding.invitations.selected') : t('onboarding.invitations.card.use') }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';

/**
 * INV-202 — a design looked at before it is chosen, inside the catalogue.
 *
 * The invitation is drawn by the same page guests open (the renderer, in an
 * iframe of this origin with `preview=1&embed=1`), so what is seen here is
 * what the public invitation shows. A frame, rather than the components
 * mounted in place, is what makes the phone view real: the invitation's own
 * media queries answer to the frame's width.
 *
 * The preview only looks: closing it changes nothing — the chosen design,
 * filters and scroll position of the catalogue are as they were, and focus
 * goes back to the button that opened it. "Use this design" is the one
 * explicit way to pick from here.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  name: { type: String, default: '' },
  src: { type: String, default: '' },
  device: { type: String, default: 'desktop' },
  selected: { type: Boolean, default: false },
  // The current event's own content (dashboard) instead of a new invitation.
  forEvent: { type: Boolean, default: false },
  // A new invitation: are the names/date/place and the details theirs yet?
  ownBasics: { type: Boolean, default: false },
  ownDetails: { type: Boolean, default: false },
});
const emit = defineEmits(['close', 'use', 'update:device']);
const { t } = useI18n();

const DEVICES = ['mobile', 'desktop'];
// The widths the frame is drawn at — a common phone and a laptop.
const WIDTH = { mobile: 390, desktop: 1280 };

const uid = useId();
const titleId = `${uid}-title`;
const legendId = `${uid}-legend`;
const dialogRef = ref(null);
const closeRef = ref(null);
const stageRef = ref(null);
const frameRef = ref(null);
const loaded = ref(false);
const stage = ref({ width: 0, height: 0 });
let returnFocusTo = null;
let observer = null;
let frameWindow = null;

const ownItems = computed(() => [
  props.ownBasics && t('onboarding.invitations.previewDialog.items.basics'),
  props.ownDetails && t('onboarding.invitations.previewDialog.items.details'),
].filter(Boolean));
const sampleItems = computed(() => [
  !props.ownBasics && t('onboarding.invitations.previewDialog.items.basics'),
  t('onboarding.invitations.previewDialog.items.photos'),
  !props.ownDetails && t('onboarding.invitations.previewDialog.items.details'),
  t('onboarding.invitations.previewDialog.items.rsvp'),
].filter(Boolean));

/*
 * Phone: drawn at its width, or the screen's when that is narrower (on a
 * phone the preview is the phone). Desktop: drawn at full width and scaled
 * down to fit, so a narrow screen still sees the desktop layout whole.
 */
const scale = computed(() => {
  if (props.device !== 'desktop' || !stage.value.width) return 1;
  return Math.min(1, stage.value.width / WIDTH.desktop);
});
const frameWidth = computed(() => {
  if (props.device === 'mobile') {
    return stage.value.width ? Math.min(WIDTH.mobile, stage.value.width) : WIDTH.mobile;
  }
  return WIDTH.desktop;
});
const frameStyle = computed(() => {
  const s = scale.value;
  const height = stage.value.height ? Math.floor(stage.value.height / s) : null;
  return {
    width: `${frameWidth.value}px`,
    height: height ? `${height}px` : '100%',
    transform: s < 1 ? `scale(${s})` : undefined,
  };
});
// The box around the scaled frame takes its visible size, not its layout one.
const frameBoxStyle = computed(() => ({
  width: `${Math.floor(frameWidth.value * scale.value)}px`,
}));

function measure() {
  const el = stageRef.value;
  if (!el) return;
  stage.value = { width: el.clientWidth, height: el.clientHeight };
}

function focusables() {
  if (!dialogRef.value) return [];
  return [...dialogRef.value.querySelectorAll('button:not([disabled]), iframe')];
}

function close() {
  emit('close');
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    close();
    return;
  }
  if (e.key !== 'Tab') return;
  // Focus stays in the dialog while it is open.
  const items = focusables();
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

// Escape inside the invitation closes too: key presses there do not reach
// this document. Same origin, so the frame's window can be listened to.
function onFrameKeydown(e) {
  if (e.key === 'Escape') close();
}
function detachFrame() {
  try { frameWindow?.removeEventListener('keydown', onFrameKeydown); } catch { /* frame gone */ }
  frameWindow = null;
}
function onFrameLoad() {
  loaded.value = true;
  detachFrame();
  try {
    frameWindow = frameRef.value?.contentWindow || null;
    frameWindow?.addEventListener('keydown', onFrameKeydown);
  } catch {
    frameWindow = null;
  }
}

function lockScroll(lock) {
  // The catalogue keeps its place underneath; it just does not scroll.
  document.body.style.overflow = lock ? 'hidden' : '';
}

watch(() => props.src, () => { loaded.value = false; });

watch(
  () => props.open,
  async (open) => {
    if (open) {
      returnFocusTo = document.activeElement;
      loaded.value = false;
      lockScroll(true);
      await nextTick();
      measure();
      if (typeof ResizeObserver !== 'undefined' && stageRef.value) {
        observer = new ResizeObserver(measure);
        observer.observe(stageRef.value);
      }
      closeRef.value?.focus();
    } else {
      observer?.disconnect();
      observer = null;
      detachFrame();
      lockScroll(false);
      if (returnFocusTo && typeof returnFocusTo.focus === 'function' && returnFocusTo.isConnected) {
        returnFocusTo.focus();
      }
      returnFocusTo = null;
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  observer?.disconnect();
  detachFrame();
  if (props.open) lockScroll(false);
  returnFocusTo = null;
});
</script>

<style scoped>
.tpd-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 16px;
  background: rgba(16, 24, 40, 0.55);
}

.tpd {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1320px;
  min-height: 0;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(16, 24, 40, 0.25);
  color: var(--ink, #101828);
  overflow: hidden;
}

.tpd__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line, rgba(16, 24, 40, 0.08));
}

.tpd__title {
  flex: 1 1 200px;
  min-width: 0;
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.tpd__devices {
  display: inline-flex;
  padding: 3px;
  border-radius: 10px;
  background: var(--sunken, #f2f4f7);
}

.tpd__device {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 6px 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--ink-2, #344054);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.tpd__device--on {
  background: #fff;
  color: var(--ink, #101828);
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.15);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.tpd__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--line-2, rgba(16, 24, 40, 0.15));
  background: #fff;
  color: var(--ink, #101828);
  cursor: pointer;
}

.tpd__legend {
  padding: 8px 16px;
  font-size: 13px;
  color: var(--ink-2, #344054);
  background: #fffbeb;
  border-bottom: 1px solid rgba(181, 71, 8, 0.15);
}

.tpd__legend-line {
  margin: 2px 0;
}

.tpd__tag {
  display: inline-block;
  margin-right: 6px;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.tpd__tag--own {
  background: #ecfdf3;
  color: #05603a;
}

.tpd__tag--sample {
  background: #fef0c7;
  color: #93370d;
}

.tpd__stage {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  justify-content: center;
  overflow: hidden;
  background: var(--sunken, #f2f4f7);
}

.tpd__device-frame {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: #fff;
}

.tpd__device-frame--mobile {
  box-shadow: 0 0 0 1px rgba(16, 24, 40, 0.12), 0 8px 24px rgba(16, 24, 40, 0.12);
}

.tpd__frame {
  display: block;
  border: 0;
  background: #fff;
  transform-origin: 0 0;
}

.tpd__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 0;
  font-size: 14px;
  color: var(--ink-3, #475467);
  background: rgba(255, 255, 255, 0.85);
}

.tpd__spinner {
  width: 22px;
  height: 22px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--brand-gold, #c4956a);
  border-radius: 50%;
  animation: tpd-spin 0.7s linear infinite;
}

@keyframes tpd-spin {
  to { transform: rotate(360deg); }
}

.tpd__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid var(--line, rgba(16, 24, 40, 0.08));
}

.tpd__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid var(--line-2, rgba(16, 24, 40, 0.15));
  background: #fff;
  color: var(--ink, #101828);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.tpd__btn--primary {
  background: var(--brand-main, #334338);
  border-color: var(--brand-main, #334338);
  color: #fff;
}

.tpd__device:focus-visible,
.tpd__close:focus-visible,
.tpd__btn:focus-visible,
.tpd__frame:focus-visible {
  outline: 3px solid var(--brand-gold, #c4956a);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .tpd__spinner { animation: none; }
}

/* A phone: the preview takes the whole screen. */
@media (max-width: 640px) {
  .tpd-overlay {
    padding: 0;
  }

  .tpd {
    border-radius: 0;
  }

  .tpd__header {
    padding: 8px 12px;
  }

  .tpd__title {
    font-size: 15px;
    flex-basis: calc(100% - 52px);
  }

  .tpd__devices {
    order: 3;
    width: 100%;
  }

  .tpd__device {
    flex: 1;
    justify-content: center;
  }

  .tpd__legend {
    padding: 6px 12px;
    font-size: 12px;
  }

  .tpd__footer {
    padding: 8px 12px;
  }

  .tpd__btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
