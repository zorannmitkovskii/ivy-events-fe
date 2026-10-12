<template>
  <Teleport to="body" :disabled="editPanelMode">
    <Transition name="modal">
      <div v-if="open"
        :class="editPanelMode ? 'ivy-panel' : 'ivy-overlay'"
        @mousedown.self="!editPanelMode && $emit('close')"
      >
        <!-- INV-503: a dialog only when it covers the page; inside the editor's
             sidebar it is the open section's panel, not a modal. -->
        <div
          ref="dialogRef"
          class="ivy-modal"
          :class="{ 'ivy-modal--panel': editPanelMode }"
          v-bind="dialogAttrs"
          @keydown="onDialogKeydown"
        >
          <!-- Hide header in panel mode — accordion header serves this purpose -->
          <header v-if="!editPanelMode || subModal" class="ivy-modal__header" :class="{ 'ivy-modal__header--panel': editPanelMode }">
            <button v-if="editPanelMode && subModal" :id="titleId" ref="backRef" class="ivy-modal__back" type="button" @click="$emit('close')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
              {{ title }}
            </button>
            <template v-else>
              <h3 :id="titleId" class="ivy-modal__title">{{ title }}</h3>
              <button ref="closeRef" class="ivy-modal__close" type="button" :aria-label="closeLabel" @click="$emit('close')">&times;</button>
            </template>
          </header>

          <section class="ivy-modal__body">
            <slot />
          </section>

          <footer v-if="$slots.footer" class="ivy-modal__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
// The overlays open right now, newest last: only the top one answers Escape.
const openOverlays = [];
</script>

<script setup>
import { watch, inject, ref, computed, nextTick, onMounted, onBeforeUnmount, getCurrentInstance, useId } from "vue";
import { focusableIn, trapTab, focusIfConnected, focusIsLost } from "@/utils/focusTrap";

const editPanelMode = inject("editPanelMode", ref(false));

const props = defineProps({
  open: Boolean,
  title: String,
  subModal: { type: Boolean, default: false },
});

const emit = defineEmits(["close"]);

const titleId = `${useId()}-title`;
const dialogRef = ref(null);
const closeRef = ref(null);
const backRef = ref(null);

// BaseModal is also used on pages whose tests do not install vue-i18n.
const globalT = getCurrentInstance()?.appContext.config.globalProperties.$t;
const closeLabel = computed(() => (globalT ? globalT("common.close") : "Close"));

const dialogAttrs = computed(() => {
  if (editPanelMode.value) {
    return props.subModal ? { role: "group", "aria-labelledby": titleId } : {};
  }
  const attrs = { role: "dialog", "aria-modal": "true", tabindex: "-1" };
  if (props.title) attrs["aria-labelledby"] = titleId;
  return attrs;
});

const token = {};
let returnFocusTo = null;
let overlayOpen = false;
// A sub-form in the sidebar replaces the list that opened it: where focus
// goes back to when it closes.
let panelHost = null;
let openerTestId = null;

function onDocumentKeydown(e) {
  if (e.key !== "Escape" || e.defaultPrevented) return;
  if (openOverlays[openOverlays.length - 1] !== token) return;
  e.preventDefault();
  emit("close");
}

function onDialogKeydown(e) {
  if (!editPanelMode.value) {
    trapTab(e, dialogRef.value);
    return;
  }
  // Escape in a sub-form goes back to its list only (the sidebar would
  // otherwise close the whole section).
  if (props.subModal && e.key === "Escape" && !e.defaultPrevented) {
    e.preventDefault();
    e.stopPropagation();
    emit("close");
  }
}

async function onOpen() {
  if (editPanelMode.value) {
    if (!props.subModal) return;
    openerTestId = document.activeElement?.getAttribute?.("data-testid") || null;
    await nextTick();
    panelHost = dialogRef.value?.closest(".ivy-panel")?.parentElement || null;
    backRef.value?.focus();
    return;
  }
  if (overlayOpen) return;
  overlayOpen = true;
  returnFocusTo = document.activeElement;
  openOverlays.push(token);
  document.addEventListener("keydown", onDocumentKeydown);
  document.body.style.overflow = "hidden";
  await nextTick();
  const body = dialogRef.value?.querySelector(".ivy-modal__body");
  (focusableIn(body)[0] || closeRef.value || dialogRef.value)?.focus();
}

function onClose() {
  if (editPanelMode.value) {
    const host = panelHost;
    const testId = openerTestId;
    panelHost = null;
    openerTestId = null;
    if (!props.subModal || !host) return;
    nextTick(() => {
      if (!focusIsLost() || !host.isConnected) return;
      const opener = testId && host.querySelector(`[data-testid="${testId}"]`);
      (opener || focusableIn(host)[0])?.focus();
    });
    return;
  }
  if (!overlayOpen) return;
  overlayOpen = false;
  const i = openOverlays.indexOf(token);
  if (i !== -1) openOverlays.splice(i, 1);
  document.removeEventListener("keydown", onDocumentKeydown);
  if (!openOverlays.length) document.body.style.overflow = "";
  const back = returnFocusTo;
  returnFocusTo = null;
  focusIfConnected(back);
}

// INV-503: a modal mounted already open (the editor's) answers Escape too.
onMounted(() => {
  if (props.open) onOpen();
});

watch(
  () => props.open,
  (v) => (v ? onOpen() : onClose())
);

onBeforeUnmount(() => {
  if (props.open) onClose();
});
</script>

<style>
/* --- global (unscoped) so Teleport children are styled reliably --- */

.ivy-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.45);
}

.ivy-modal {
  position: relative;
  background: #ffffff;
  border-radius: 16px;
  width: calc(100% - 32px);
  max-width: 520px;
  max-height: 90vh;
  overflow: auto;
  border: 1px solid var(--brand-dark);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

.ivy-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--brand-dark);
}

.ivy-modal__title {
  font-size: 18px;
  font-weight: 800;
  margin: 0;
  color: var(--brand-main);
}

.ivy-modal__close {
  border: 1px solid var(--brand-dark);
  background: #ffffff;
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 16px;
  color: var(--brand-main);
  line-height: 1;
}

.ivy-modal__body {
  padding: 20px;
}

.ivy-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--brand-dark);
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .ivy-modal,
.modal-leave-active .ivy-modal {
  transition: transform 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .ivy-modal,
.modal-leave-to .ivy-modal {
  transform: translateY(16px);
}

/* ---- Panel mode (inside sidebar) ---- */
.ivy-panel {
  display: block;
}

.ivy-modal--panel {
  border-radius: 0;
  border: none;
  box-shadow: none;
  width: 100%;
  max-width: none;
  max-height: none;
}

.ivy-modal__header--panel {
  border-bottom: 1px solid var(--line);
}

.ivy-modal__back {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  font-size: 15px;
  font-weight: 700;
  color: var(--brand-main);
  cursor: pointer;
  padding: 0;
}

.ivy-modal__back:hover {
  opacity: 0.8;
}

/* Google Places autocomplete dropdown renders in body —
   must sit above the modal overlay (z-index 9999). */
.pac-container {
  z-index: 10001 !important;
}
</style>
