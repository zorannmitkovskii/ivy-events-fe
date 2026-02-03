<template>
  <article class="feature-card">
    <div class="icon-chip" :class="chipClass">
      <span class="icon" aria-hidden="true">{{ icon }}</span>
    </div>

    <h3 class="feature-title">{{ title }}</h3>
    <p class="feature-desc">{{ description }}</p>
  </article>
</template>

<script setup>
defineProps({
  icon: { type: String, required: true },           // emoji or text icon
  title: { type: String, required: true },
  description: { type: String, required: true },
  chipClass: { type: String, default: "" }          // e.g. "chip-pink"
});
</script>

<style scoped>
.feature-card {
  background: var(--bg-white);
  border-radius: 14px;
  padding: 26px 26px 24px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.06);
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
}

.feature-card:hover {
  transform: translateY(-2px);
  border-color: var(--neutral-300);
  box-shadow: 0 24px 54px rgba(0, 0, 0, 0.10);
}

.icon-chip {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  transition: transform 0.28s ease;
}

.feature-card:hover .icon-chip {
  transform: translateY(-2px);
}

.icon {
  font-size: 18px;
}

.feature-title {
  margin: 0 0 10px;
  font-family: var(--font-family), serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--neutral-900);
}

.feature-desc {
  margin: 0;
  color: var(--neutral-700);
  font-size: 14px;
  line-height: 1.6;
}

/* Chip variants */
.chip-pink   { background: #f7d3e6; }
.chip-green  { background: #cfead7; }
.chip-blue   { background: #cfe1f5; }
.chip-purple { background: #dfd1f7; }
.chip-gold   { background: #f8e0b3; }
.chip-peach  { background: #f7d1b9; }
</style>
