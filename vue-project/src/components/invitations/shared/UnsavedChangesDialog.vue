<template>
  <Teleport to="body">
    <div v-if="open" class="ucd-overlay" @mousedown.self="emit('stay')">
      <div
        ref="dialogRef"
        class="ucd"
        role="alertdialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="bodyId"
        :aria-busy="busy ? 'true' : 'false'"
        data-testid="unsaved-dialog"
        :data-kind="kind"
        @keydown="onKeydown"
      >
        <h2 :id="titleId" class="ucd__title">{{ t('editSection.leaveGuard.title') }}</h2>
        <div :id="bodyId">
          <p class="ucd__text">{{ kind === 'draft' ? t('editSection.leaveGuard.bodyDraft') : t('editSection.leaveGuard.bodyEvent') }}</p>
          <p :id="discardHintId" class="ucd__text ucd__text--muted" data-testid="unsaved-discard-hint">
            {{ kind === 'draft' ? t('editSection.leaveGuard.discardHintDraft') : t('editSection.leaveGuard.discardHintEvent') }}
          </p>
        </div>
        <p v-if="failed" class="ucd__error" role="alert" data-testid="unsaved-save-failed">
          {{ t('editSection.leaveGuard.saveFailed') }}
        </p>
        <p v-else-if="busy" class="ucd__text" role="status">{{ t('editSection.leaveGuard.saving') }}</p>
        <div class="ucd__actions">
          <button
            ref="stayRef"
            type="button"
            class="ucd__btn"
            data-testid="unsaved-stay"
            :disabled="busy"
            @click="emit('stay')"
          >
            {{ t('editSection.leaveGuard.stay') }}
          </button>
          <button
            type="button"
            class="ucd__btn ucd__btn--danger"
            data-testid="unsaved-discard"
            :aria-describedby="discardHintId"
            :disabled="busy"
            @click="emit('discard')"
          >
            {{ t('editSection.leaveGuard.discard') }}
          </button>
          <button
            type="button"
            class="ucd__btn ucd__btn--primary"
            data-testid="unsaved-save"
            :disabled="busy"
            @click="emit('save')"
          >
            {{ busy ? t('editSection.leaveGuard.saving') : t('editSection.leaveGuard.save') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, useId, watch } from "vue";
import { useI18n } from "vue-i18n";
import { trapTab, focusIfConnected } from "@/utils/focusTrap";

/**
 * Leaving the editor with changes that are not saved (INV-502). The editor's
 * one and only "unsaved changes" question: Save and exit / Discard changes /
 * Keep editing. Discarding says what is lost before it is pressed. It decides
 * nothing itself — the editor does that on each event.
 *
 * Focus starts on "Keep editing" (the safe answer), Tab stays inside, Escape
 * keeps editing, and focus returns to whatever had it.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  // 'event': not confirmed by the server; 'draft': not written to this device.
  kind: { type: String, default: "event" },
  busy: { type: Boolean, default: false },
  failed: { type: Boolean, default: false },
});
const emit = defineEmits(["save", "discard", "stay"]);
const { t } = useI18n();

const uid = useId();
const titleId = `${uid}-title`;
const bodyId = `${uid}-body`;
const discardHintId = `${uid}-discard`;
const dialogRef = ref(null);
const stayRef = ref(null);
let returnFocusTo = null;

function onKeydown(e) {
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    if (!props.busy) emit("stay");
    return;
  }
  trapTab(e, dialogRef.value);
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      returnFocusTo = document.activeElement;
      await nextTick();
      stayRef.value?.focus();
    } else {
      focusIfConnected(returnFocusTo);
      returnFocusTo = null;
    }
  },
  { immediate: true }
);

// After a failed save the buttons are enabled again: focus back inside.
watch(
  () => props.busy,
  async (busy) => {
    if (busy || !props.open) return;
    await nextTick();
    if (dialogRef.value && !dialogRef.value.contains(document.activeElement)) stayRef.value?.focus();
  }
);

onBeforeUnmount(() => {
  returnFocusTo = null;
});
</script>

<style scoped>
.ucd-overlay {
  position: fixed;
  inset: 0;
  /* Above the editor's floating bars and sheet (≤ 9500), below the route loader. */
  z-index: 9600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(16, 24, 40, 0.45);
}

.ucd {
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 50px rgba(16, 24, 40, 0.25);
  color: var(--ink, #101828);
  font-family: inherit;
}

.ucd__title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 700;
}

.ucd__text {
  margin: 0 0 10px;
  font-size: 15px;
  line-height: 1.5;
}

.ucd__text--muted {
  color: var(--ink-3, #475467);
  font-size: 14px;
}

.ucd__error {
  margin: 0 0 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fef3f2;
  color: #b42318;
  font-size: 14px;
  line-height: 1.4;
}

.ucd__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

.ucd__btn {
  min-height: 44px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(16, 24, 40, 0.15);
  background: #fff;
  color: var(--ink, #101828);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.ucd__btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.ucd__btn--danger {
  border-color: #b42318;
  color: #b42318;
}

.ucd__btn--primary {
  background: #101828;
  border-color: #101828;
  color: #fff;
}

.ucd__btn:focus-visible {
  outline: 3px solid var(--brand-gold, #c4956a);
  outline-offset: 2px;
}

@media (max-width: 480px) {
  .ucd__actions {
    flex-direction: column-reverse;
  }
  .ucd__btn {
    width: 100%;
  }
}
</style>
