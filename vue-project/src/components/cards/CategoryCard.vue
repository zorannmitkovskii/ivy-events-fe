<template>
  <article class="category-card">
    <div class="icon-chip" :class="chipClass">
      <span class="icon-emoji" aria-hidden="true">{{ icon }}</span>
    </div>

    <h3 class="title">{{ title }}</h3>
    <p class="desc">{{ description }}</p>
  </article>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true }, // emoji or small char icon
  chipClass: { type: String, default: "" } // e.g. "chip-pink"
});
</script>

<style scoped>
.category-card {
  position: relative;
  background: var(--white);
  border-radius: 14px;
  padding: 28px 24px;
  text-align: center;

  border: 1.5px solid transparent;
  box-shadow:
    0 22px 50px rgba(0, 0, 0, 0.10),
    inset 0 0 0 1px rgba(201, 162, 77, 0.4);
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease,
    border-color 0.28s ease;
}

/* Hover state */
.category-card:hover {
  transform: translateY(-2px);
  border-color: var(--secondary-gold);
  box-shadow:
    0 22px 50px rgba(0, 0, 0, 0.10),
    0 0 0 1px rgba(201, 162, 77, 0.15);
}


/* Icon chip subtle lift */
.category-card .icon-chip {
  transition: transform 0.28s ease;
}

.category-card:hover .icon-chip {
  transform: translateY(-2px);
}


.icon-chip {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.icon-emoji {
  font-size: 22px;
}

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

/* Pastel chip variants (match screenshot vibes) */
.chip-pink   { background: #f7d3e6; }
.chip-peach  { background: #f7d1b9; }
.chip-gold   { background: #f8e0b3; }
.chip-green  { background: #cfead7; }
.chip-blue   { background: #cfe1f5; }
.chip-purple { background: #dfd1f7; }
.chip-yellow { background: #f8efb7; }
</style>
