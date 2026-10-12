<template>
  <!-- INV-801: undo / redo of this visit's changes — not saved versions -->
  <div
    class="history-controls"
    :class="{ 'history-controls--compact': compact }"
    role="group"
    :aria-label="t('editSection.history.label')"
    :aria-describedby="noteId"
    data-testid="history-controls"
  >
    <button
      type="button"
      class="history-controls__btn"
      data-testid="history-undo"
      :disabled="!state.canUndo"
      :aria-label="undoLabel"
      :title="undoLabel + ' (' + UNDO_KEYS + ')'"
      aria-keyshortcuts="Control+Z Meta+Z"
      ref="undoRef"
      @click="onUndo"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="9 14 4 9 9 4" />
        <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
      </svg>
      <span v-if="!compact" class="history-controls__text" aria-hidden="true">{{ t('editSection.history.undo') }}</span>
    </button>
    <button
      type="button"
      class="history-controls__btn"
      data-testid="history-redo"
      :disabled="!state.canRedo"
      :aria-label="redoLabel"
      :title="redoLabel + ' (' + REDO_KEYS + ')'"
      aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y"
      ref="redoRef"
      @click="onRedo"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="15 14 20 9 15 4" />
        <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
      </svg>
      <span v-if="!compact" class="history-controls__text" aria-hidden="true">{{ t('editSection.history.redo') }}</span>
    </button>
    <span :id="noteId" class="history-controls__sr-only">{{ t('editSection.history.sessionNote') }}</span>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, useId } from "vue";
import { useI18n } from "vue-i18n";

/**
 * The editor's Undo and Redo buttons (INV-801). Disabled when there is
 * nothing to undo / redo; the name says what would be undone ("Undo:
 * Programme"). Only this visit's changes — undo is never a saved version
 * (the group's description says so; the save status shows the save).
 */
const props = defineProps({
  // { canUndo, canRedo, undoWhat, redoWhat }
  state: { type: Object, required: true },
  // Icons only (the phone's floating bar); the name is still read out.
  compact: { type: Boolean, default: false },
});

const emit = defineEmits(["undo", "redo"]);
const { t } = useI18n();
const noteId = `${useId()}-history-note`;

// Key names, the same in every language.
const UNDO_KEYS = "Ctrl+Z / ⌘Z";
const REDO_KEYS = "Ctrl+Shift+Z / ⌘⇧Z";

// The button just used went disabled (nothing more to undo): the keyboard
// stays in the group, on the other one, rather than falling to the page.
const undoRef = ref(null);
const redoRef = ref(null);
function keepFocus() {
  nextTick(() => {
    const active = document.activeElement;
    if (active && active !== document.body && !active.disabled) return;
    if (props.state.canRedo) redoRef.value?.focus();
    else if (props.state.canUndo) undoRef.value?.focus();
  });
}
function onUndo() {
  emit("undo");
  keepFocus();
}
function onRedo() {
  emit("redo");
  keepFocus();
}

const undoLabel = computed(() =>
  props.state.canUndo && props.state.undoWhat
    ? t("editSection.history.undoWhat", { what: props.state.undoWhat })
    : props.state.canUndo ? t("editSection.history.undo") : t("editSection.history.nothingToUndo")
);
const redoLabel = computed(() =>
  props.state.canRedo && props.state.redoWhat
    ? t("editSection.history.redoWhat", { what: props.state.redoWhat })
    : props.state.canRedo ? t("editSection.history.redo") : t("editSection.history.nothingToRedo")
);
</script>

<style scoped>
.history-controls {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.history-controls__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  min-width: 36px;
  padding: 6px 10px;
  border: 1px solid var(--neutral-200, var(--line, #e4e7ec));
  border-radius: 8px;
  background: #fff;
  color: var(--ink, #101828);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.history-controls__btn:hover:not(:disabled) {
  background: var(--neutral-50, var(--sunken, #f9fafb));
}

.history-controls__btn:focus-visible {
  outline: 2px solid var(--moss, #3f6b4f);
  outline-offset: 2px;
}

/* Disabled: dimmed and not clickable — and `disabled`, so it is said too. */
.history-controls__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.history-controls--compact .history-controls__btn {
  min-height: 44px;
  min-width: 44px;
  padding: 0;
}

.history-controls__sr-only {
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
</style>
