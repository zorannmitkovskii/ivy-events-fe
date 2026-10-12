<template>
  <Teleport to="body">
    <div v-if="open" class="ddd-overlay" @mousedown.self="emit('cancel')">
      <div
        ref="dialogRef"
        class="ddd"
        role="alertdialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="bodyId"
        data-testid="discard-draft-dialog"
        @keydown="onKeydown"
      >
        <h2 :id="titleId" class="ddd__title">{{ t('onboarding.category.draft.discard.title') }}</h2>
        <div :id="bodyId">
          <DraftDiscardScope :draft="draft" :logged-in="loggedIn" />
        </div>
        <div class="ddd__actions">
          <button ref="cancelRef" type="button" class="ddd__btn" data-testid="discard-cancel" @click="emit('cancel')">
            {{ t('onboarding.category.draft.discard.cancel') }}
          </button>
          <button type="button" class="ddd__btn ddd__btn--danger" data-testid="discard-confirm" @click="emit('confirm')">
            {{ startNew ? t('onboarding.category.draft.discard.confirmStartNew') : t('onboarding.category.draft.discard.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, useId, watch } from "vue";
import { useI18n } from "vue-i18n";
import DraftDiscardScope from "@/components/onboarding/DraftDiscardScope.vue";

/**
 * "Delete the draft?" (INV-302). Says exactly what goes and what stays, and
 * deletes nothing itself: the page does that on `confirm`. Focus starts on
 * Cancel (the safe answer), stays inside, Escape cancels, and focus returns to
 * whatever opened it.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  draft: { type: Object, default: null },
  loggedIn: { type: Boolean, default: false },
  // Opened from "Start a new invitation": the confirm button says both.
  startNew: { type: Boolean, default: false },
});
const emit = defineEmits(["confirm", "cancel"]);
const { t } = useI18n();

const uid = useId();
const titleId = `${uid}-title`;
const bodyId = `${uid}-body`;
const dialogRef = ref(null);
const cancelRef = ref(null);
let returnFocusTo = null;

function onKeydown(e) {
  if (e.key === "Escape") {
    e.preventDefault();
    emit("cancel");
    return;
  }
  if (e.key !== "Tab") return;
  const items = dialogRef.value ? [...dialogRef.value.querySelectorAll("button:not([disabled])")] : [];
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

watch(
  () => props.open,
  async (open) => {
    if (open) {
      returnFocusTo = document.activeElement;
      await nextTick();
      cancelRef.value?.focus();
    } else if (returnFocusTo && typeof returnFocusTo.focus === "function" && returnFocusTo.isConnected) {
      returnFocusTo.focus();
      returnFocusTo = null;
    } else {
      returnFocusTo = null;
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  returnFocusTo = null;
});
</script>

<style scoped>
.ddd-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(16, 24, 40, 0.45);
}

.ddd {
  width: 100%;
  max-width: 460px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 50px rgba(16, 24, 40, 0.25);
  color: var(--ink, #101828);
  font-family: inherit;
}

.ddd__title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 700;
}

.ddd__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

.ddd__btn {
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

.ddd__btn--danger {
  background: #b42318;
  border-color: #b42318;
  color: #fff;
}

.ddd__btn:focus-visible {
  outline: 3px solid var(--brand-gold, #c4956a);
  outline-offset: 2px;
}

@media (max-width: 480px) {
  .ddd__actions {
    flex-direction: column-reverse;
  }
  .ddd__btn {
    width: 100%;
  }
}
</style>
