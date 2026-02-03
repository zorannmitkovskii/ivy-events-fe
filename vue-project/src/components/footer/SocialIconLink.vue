<template>
  <a
    class="social-btn"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    :aria-label="labelKey ? $t(labelKey) : label"
  >
    <i :class="icon"></i>
  </a>
</template>

<script setup>
defineProps({
  href: { type: String, required: true },
  icon: { type: String, required: true }, // e.g. "fab fa-facebook-f"
  label: { type: String, default: "" },
  labelKey: { type: String, default: "" }
});
</script>

<style scoped>
.social-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;

  display: grid;
  place-items: center;

  background: rgba(255, 255, 255, 0.10);
  color: var(--bg-white);
  text-decoration: none;

  transition: transform 0.18s ease, background 0.18s ease;
}

.social-btn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.16);
}
</style>
