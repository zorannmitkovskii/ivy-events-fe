<template>
  <div class="event-mini">
    <div class="event-mini__content">
      <h4 class="event-mini__title" :title="title">{{ title }}</h4>

      <div class="event-mini__meta">
        <div class="event-mini__row">
          <span class="event-mini__icon" aria-hidden="true">📅</span>
          <span class="event-mini__text">{{ dateRange }} 14.10.2026</span>
        </div>

        <div class="event-mini__row text-center">
          <span class="event-mini__dot" aria-hidden="true"></span>
          <span class="event-mini__text">{{ status }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  image: { type: String, default: "" },
  title: { type: String, required: true },
  dateRange: { type: String, required: true },
  status: { type: String, required: true }
});
</script>

<style scoped>
.event-mini {
  //display: grid;
  grid-template-columns: 56px 1fr;
  gap: 14px;
  align-items: center;

  background: rgba(231, 231, 231, 0.35);
  border-radius: 14px;
  padding: 12px 14px;

  /* IMPORTANT: allow text column to shrink correctly */
  min-width: 0;
}

.event-mini__img {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  object-fit: cover;
  display: block;
  background: var(--neutral-300);
}

.event-mini__content {
  min-width: 0; /* ✅ key fix */
}

.event-mini__title {
  margin: 0 0 6px;
  font-weight: 700;
  color: var(--neutral-900);
  line-height: 1.25;

  /* ✅ prevent “Annu...” + crazy wrapping */
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Meta block */
.event-mini__meta {
  display: grid;
  gap: 6px;
  color: var(--neutral-700);
  font-size: 13px;
}

.event-mini__row {
  display: flex;
  align-items: center;
  gap: 8px;

  /* keep each meta row on one line */
  min-width: 0;
}

.event-mini__icon {
  flex: 0 0 auto;
  opacity: 0.8;
}

.event-mini__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--brand-light);
  flex: 0 0 auto;
}

.event-mini__text {
  min-width: 0;
  white-space: nowrap;      /* ✅ prevents vertical stacking */
  overflow: hidden;
  text-overflow: ellipsis;

  /* avoid breaking letters like O c t */
  word-break: normal;
  overflow-wrap: anywhere;
}

@media (max-width: 520px) {
  .event-mini {
    grid-template-columns: 48px 1fr;
  }
  .event-mini__row {
    justify-content: center;
  }
}

</style>
