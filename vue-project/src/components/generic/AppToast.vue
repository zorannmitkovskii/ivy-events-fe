<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-item"
          :class="[`toast--${toast.type}`]"
          role="alert"
        >
          <div class="toast-icon">
            <span v-if="toast.type === 'success'">&#10003;</span>
            <span v-else-if="toast.type === 'error'">&#10007;</span>
            <span v-else-if="toast.type === 'warning'">&#9888;</span>
            <span v-else>&#8505;</span>
          </div>
          <div class="toast-body">
            <p class="toast-message">{{ toast.message }}</p>
            <p v-if="toast.detail" class="toast-detail">{{ toast.detail }}</p>
          </div>
          <button class="toast-close" @click="dismiss(toast.id)" aria-label="Close">&times;</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from "@/composables/useToast";

const { toasts, dismiss } = useToast();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 420px;
  width: 100%;
  pointer-events: none;
}

.toast-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  border-left: 4px solid;
  pointer-events: auto;
  min-width: 300px;
}

/* ── Types ─────────────────────────────── */
.toast--error {
  border-left-color: #dc3545;
  background: #fef2f2;
}
.toast--error .toast-icon {
  color: #dc3545;
  background: rgba(220, 53, 69, 0.1);
}

.toast--success {
  border-left-color: #027a48;
  background: #f0fdf4;
}
.toast--success .toast-icon {
  color: #027a48;
  background: rgba(2, 122, 72, 0.1);
}

.toast--warning {
  border-left-color: #dc6803;
  background: #fffbeb;
}
.toast--warning .toast-icon {
  color: #dc6803;
  background: rgba(220, 104, 3, 0.1);
}

.toast--info {
  border-left-color: #2563eb;
  background: #eff6ff;
}
.toast--info .toast-icon {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.1);
}

/* ── Elements ──────────────────────────── */
.toast-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  margin-top: 1px;
}

.toast-body {
  flex: 1;
  min-width: 0;
}

.toast-message {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
  word-break: break-word;
}

.toast-detail {
  margin: 4px 0 0;
  font-size: 13px;
  color: #555;
  line-height: 1.4;
  word-break: break-word;
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: 20px;
  line-height: 1;
  color: #999;
  cursor: pointer;
  padding: 0 2px;
  margin-top: -2px;
}
.toast-close:hover {
  color: #333;
}

/* ── Transitions ───────────────────────── */
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.25s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(60px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(60px);
}
.toast-move {
  transition: transform 0.3s ease;
}

/* ── Mobile ────────────────────────────── */
@media (max-width: 480px) {
  .toast-container {
    top: 12px;
    right: 12px;
    left: 12px;
    max-width: none;
  }
  .toast-item {
    min-width: 0;
  }
}
</style>
