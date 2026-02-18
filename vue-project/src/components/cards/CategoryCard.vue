<template>
  <article
    class="category-card"
    :class="{ 'is-selected': selected, 'is-disabled': disabled }"
    role="button"
    :tabindex="disabled ? -1 : 0"
    @click="!disabled && $emit('select')"
    @keydown.enter.prevent="!disabled && $emit('select')"
    @keydown.space.prevent="!disabled && $emit('select')"
  >
    <span v-if="disabled" class="coming-soon-badge">{{ $t('eventCategories.comingSoon') }}</span>
    <div class="icon-chip" :class="chipClass">
      <span class="icon-emoji" aria-hidden="true">{{ icon }}</span>
    </div>

    <h3 class="title">{{ titleKey ? $t(titleKey) : title }}</h3>
    <p class="desc">{{ descriptionKey ? $t(descriptionKey) : description }}</p>
  </article>
</template>

<script setup>
defineEmits(["select"]);

defineProps({
  title: { type: String, default: "" },
  titleKey: { type: String, default: "" },
  description: { type: String, default: "" },
  descriptionKey: { type: String, default: "" },
  icon: { type: String, required: true },
  chipClass: { type: String, default: "" },

  selected: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
});
</script>

<style scoped>
.category-card {
  position: relative;
  background: var(--bg-white);
  border-radius: 14px;
  padding: 28px 24px;
  text-align: center;
  cursor: pointer;

  border: 1.5px solid transparent;
  box-shadow:
    0 22px 50px rgba(0, 0, 0, 0),
    inset 0 0 0 0 rgba(201, 162, 77, 0.4);

  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
}

.category-card:hover {
  transform: translateY(-2px);
  border-color: var(--secondary-gold);
  box-shadow:
    0 22px 50px rgba(0, 0, 0, 0),
    0 0 0 1px rgba(201, 162, 77, 0.15);
}

/* ✅ Selected state */
.category-card.is-selected {
  border-color: var(--brand-gold);
  box-shadow:
    0 22px 50px rgba(0, 0, 0, 0),
    0 0 0 2px rgba(200, 162, 77, 0.25),
    inset 0 0 0 1px rgba(200, 162, 77, 0.55);
  transform: translateY(-1px);
}

.category-card:focus-visible {
  outline: none;
  border-color: var(--brand-main);
  box-shadow: 0 0 0 4px rgba(47, 62, 54, 0.15);
}

/* Icon chip */
.icon-chip {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  transition: transform 0.28s ease;
}

.category-card:hover .icon-chip {
  transform: translateY(-2px);
}

.icon-emoji { font-size: 22px; }

.title {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 600;
  color: var(--neutral-900);
}

.desc {
  margin: 0;
  color: var(--neutral-700);
  font-size: 14px;
  line-height: 1.5;
}

/* Disabled / Coming Soon */
.category-card.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.coming-soon-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--neutral-200, #e5e7eb);
  color: var(--neutral-600, #4b5563);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 10px;
  border-radius: 20px;
}

/* chips */
.chip-pink   { background: #f7d3e6; }
.chip-peach  { background: #f7d1b9; }
.chip-gold   { background: #f8e0b3; }
.chip-green  { background: #cfead7; }
.chip-blue   { background: #cfe1f5; }
.chip-purple { background: #dfd1f7; }
.chip-yellow { background: #f8efb7; }
</style>
