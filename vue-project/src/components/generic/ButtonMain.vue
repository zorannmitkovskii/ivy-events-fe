<template>
  <RouterLink
      :to="to"
      class="btn"
      :class="variantClass"
  >
    <slot>{{ label }}</slot>
  </RouterLink>
</template>

<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";

const props = defineProps({
  label: {
    type: String,
    default: ""
  },
  to: {
    type: [String, Object],
    required: true
  },
  variant: {
    type: String,
    default: "main",
    validator: (v) => ["main", "outline", "gold", "secondary"].includes(v)
  }
});

const variantClass = computed(() => `btn--${props.variant}`);
</script>

<style scoped>
/* ===== Base ===== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  height: 44px;
  padding: 0 18px;

  border-radius: 12px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  user-select: none;

  transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      background 0.18s ease,
      border-color 0.18s ease,
      color 0.18s ease;
}

/* 1px up on hover */
.btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* focus */
.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(200, 162, 77, 0.25);
}

/* ===== Variants ===== */

/* Solid brand main */
.btn--main {
  background: var(--brand-main);
  color: var(--bg-white);
  border: 1px solid var(--brand-main);
}

.btn--main:hover {
  background: var(--brand-dark);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(147, 162, 154, 0.3);

}

/* Outline brand main */
.btn--outline {
  background: var(--bg-white);
  color: var(--brand-main);
  border: 1px solid var(--brand-main);
}

.btn--outline:hover {
  background: var(--brand-main);
  color: white;
  transform: translateY(-2px);
}

/* Solid gold */
.btn--gold {
  background: var(--brand-gold);
  color: var(--bg-white);
  border: 1px solid var(--brand-gold);
}

.btn--gold:hover {
  background: var(--secondary-gold);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(200, 162, 77, 0.3);
}

/* Solid gold */
.btn--secondary {
  background: var(--brand-dark);
  color: var(--bg-white);
  border: 1px solid var(--brand-main);
}

.btn--secondary:hover {
  background: var(--brand-main);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(147, 162, 154, 0.3);
}
</style>
