<template>
  <button class="social-btn" type="button" @click="$emit('click')">
    <img v-if="iconSrc" :src="iconSrc" class="social-btn__icon" alt="" />
    <span class="social-btn__text">{{ label }}</span>
  </button>
</template>

<script setup>
defineEmits(["click"]);

defineProps({
  label: { type: String, required: true },
  iconSrc: { type: String, default: "" }
});
</script>

<style scoped>
.social-btn {
  width: 100%;
  height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.10);
  background: var(--bg-white);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.social-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.social-btn__icon {
  width: 16px;
  height: 16px;
}

.social-btn__text {
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-900);
}
</style>
