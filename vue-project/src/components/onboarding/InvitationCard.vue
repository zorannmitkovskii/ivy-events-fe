<template>
  <div
    class="invitation-card"
    :class="{ 'invitation-card--selected': selected }"
    @click="$emit('select')"
  >
    <div class="thumbnail-wrap">
      <div
        v-if="thumbnailUrl"
        class="thumbnail"
        :style="{ backgroundImage: `url(${thumbnailUrl})` }"
      />
      <div v-else class="thumbnail thumbnail--placeholder" />

      <span v-if="selected" class="selected-badge">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M11.5 3.5L5.5 10L2.5 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ $t('onboarding.invitations.selected') }}
      </span>

      <div class="hover-overlay" @click.stop>
        <button class="preview-btn" @click="$emit('preview')">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M1.333 8s2.334-4.667 6.667-4.667S14.667 8 14.667 8s-2.334 4.667-6.667 4.667S1.333 8 1.333 8Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.33"/>
          </svg>
          {{ $t('onboarding.invitations.preview') }}
        </button>
      </div>
    </div>

    <div class="card-info">
      <p class="card-name">{{ name }}</p>
      <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script setup>

defineProps({
  name: { type: String, required: true },
  subtitle: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  selected: { type: Boolean, default: false },
  colorIndex: { type: Number, default: 0 }
});

defineEmits(['select', 'preview']);
</script>

<style scoped>
.invitation-card {
  cursor: pointer;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  background: #fff;
}

.invitation-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.invitation-card--selected {
  border-color: var(--brand-gold, #c4956a);
  box-shadow: 0 0 0 1px var(--brand-gold, #c4956a);
}

.thumbnail-wrap {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border-radius: 10px 10px 0 0;
}

.thumbnail {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}

.thumbnail--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--neutral-100, #f3f4f6);
}

.selected-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  background: var(--brand-gold, #c4956a);
  color: #fff;
  z-index: 2;
}

.hover-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 1;
}

.thumbnail-wrap:hover .hover-overlay {
  opacity: 1;
}

.preview-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 100px;
  border: none;
  background: #fff;
  color: var(--neutral-900, #111827);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.preview-btn:hover {
  transform: scale(1.05);
}

.card-info {
  padding: 10px 12px;
}

.card-name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-900, #111827);
}

.card-subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--neutral-500, #6b7280);
}
</style>
