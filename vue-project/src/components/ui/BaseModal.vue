<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="ivy-overlay" @mousedown.self="$emit('close')">
        <div class="ivy-modal" role="dialog" aria-modal="true">
          <header class="ivy-modal__header">
            <h3 class="ivy-modal__title">{{ title }}</h3>
            <button class="ivy-modal__close" type="button" @click="$emit('close')">&times;</button>
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

<script setup>
import { watch, onBeforeUnmount } from "vue";

const props = defineProps({
  open: Boolean,
  title: String
});

const emit = defineEmits(["close"]);

function onEsc(e) {
  if (e.key === "Escape") emit("close");
}

watch(
  () => props.open,
  (v) => {
    if (v) {
      document.addEventListener("keydown", onEsc);
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    }
  }
);

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onEsc);
  document.body.style.overflow = "";
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

/* Google Places autocomplete dropdown renders in body —
   must sit above the modal overlay (z-index 9999). */
.pac-container {
  z-index: 10001 !important;
}
</style>