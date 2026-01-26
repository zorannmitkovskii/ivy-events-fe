<template>
  <div class="template-card">
    <img
      class="template-img"
      :src="image"
      :alt="title"
      loading="lazy"
    />

    <div class="template-overlay">
      <component
        :is="useTo ? 'router-link' : 'button'"
        class="template-btn"
        :to="useTo || undefined"
        type="button"
      >
        {{ overlayLabel }}
      </component>
    </div>

    <div class="template-meta">
      <h6 class="template-title">{{ title }}</h6>
      <p class="template-subtitle">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  image: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },

  overlayLabel: { type: String, default: "Use This Template" },
  useTo: { type: [String, Object], default: null },

  featured: { type: Boolean, default: false }
});
</script>

<style scoped>
.template-card {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  background: var(--white);
  box-shadow: 0 16px 34px rgba(0,0,0,0.10);
}

/* image */
.template-img {
  width: 100%;
  height: 280px;
  object-fit: cover;
  display: block;
}

/* meta (like p-3 area in bootstrap) */
.template-meta {
  padding: 14px 14px 16px;
  background: var(--white);
  position: relative;
  z-index: 0;
}

.template-title {
  margin: 0 0 4px;
  font-family: "Cormorant Garamond", serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--neutral-900);
}

.template-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--neutral-700);
}

/* dark overlay covers IMAGE + TEXT */
.template-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(21, 41, 30, 0.65);
  opacity: 0;
  transition: opacity 0.25s ease;
  z-index: 1;
}

/* overlay content */
.template-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 2;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.25s ease, transform 0.25s ease;
}

/* hover */
.template-card:hover::after {
  opacity: 1;
}

.template-card:hover .template-overlay {
  opacity: 1;
  transform: translateY(0);
}

/* featured = always overlay visible (like your first card) */
.template-card.featured::after {
  opacity: 1;
}

.template-card.featured .template-overlay {
  opacity: 1;
  transform: none;
}

/* gold button */
.template-btn {
  appearance: none;
  border: none;
  cursor: pointer;
  text-decoration: none;

  background: var(--secondary-gold);
  color: var(--white);
  font-weight: 700;
  font-size: 14px;

  padding: 12px 22px;
  border-radius: 10px;

  box-shadow:
    0 10px 20px rgba(0,0,0,0.18),
    inset 0 -1px 0 rgba(255,255,255,0.25);

  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;
}

.template-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
  color: var(--brand-main );
  box-shadow:
    0 18px 36px rgba(0,0,0,0.28),
    inset 0 -1px 0 rgba(255,255,255,0.35);
}
</style>
