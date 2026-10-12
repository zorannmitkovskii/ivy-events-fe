<template>
  <!--
    INV-201: one card per design, with two separate actions — "Preview" only
    looks, "Use this design" picks it. The card itself is not a button: two
    buttons inside a button cannot be reached or announced properly.
  -->
  <article
    class="invitation-card"
    :class="{ 'invitation-card--selected': selected }"
    :aria-labelledby="nameId"
    :data-selected="selected ? 'true' : 'false'"
    data-testid="invitation-card"
  >
    <!-- A click on the picture picks it too (mouse/touch shortcut; the
         keyboard uses the button below). -->
    <div class="thumbnail-wrap" @click="$emit('select')">
      <img
        v-if="thumbnailUrl && !thumbnailFailed"
        class="thumbnail"
        :src="thumbnailUrl"
        alt=""
        loading="lazy"
        @error="thumbnailFailed = true"
      />
      <div v-else class="thumbnail thumbnail--placeholder" aria-hidden="true">
        <span>{{ name.charAt(0) }}</span>
      </div>

      <!-- INV-104: the design shown with the user's own names, date and place -->
      <div v-if="personalization?.names" class="personal-strip" data-testid="invitation-card-personal">
        <span class="personal-names">{{ personalization.names }}</span>
        <span v-if="personalization.date || personalization.place" class="personal-meta">
          {{ [personalization.date, personalization.place].filter(Boolean).join(' · ') }}
        </span>
      </div>

      <!-- Selected: a check and a word, not only the gold border. -->
      <span v-if="selected" class="selected-badge" data-testid="invitation-card-selected">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M11.5 3.5L5.5 10L2.5 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ $t('onboarding.invitations.selected') }}
      </span>
    </div>

    <div class="card-info">
      <h3 :id="nameId" class="card-name">{{ name }}</h3>
      <p v-if="subtitle" :id="descId" class="card-subtitle" data-testid="invitation-card-description">{{ subtitle }}</p>

      <dl
        v-if="traits.length"
        class="card-traits"
        :aria-label="$t('onboarding.invitations.card.traitsLabel')"
        data-testid="invitation-card-traits"
      >
        <div v-for="trait in traits" :key="trait.kind" class="card-trait" :data-trait="trait.kind">
          <dt>{{ $t(`onboarding.invitations.card.traits.${trait.kind}.label`) }}</dt>
          <dd>{{ $t(`onboarding.invitations.card.traits.${trait.kind}.${trait.value}`) }}</dd>
        </div>
      </dl>

      <div class="card-actions">
        <button
          type="button"
          class="card-btn card-btn--preview"
          :aria-describedby="nameId"
          aria-haspopup="dialog"
          data-testid="invitation-card-preview"
          @click="$emit('preview')"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M1.333 8s2.334-4.667 6.667-4.667S14.667 8 14.667 8s-2.334 4.667-6.667 4.667S1.333 8 1.333 8Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.33"/>
          </svg>
          {{ $t('onboarding.invitations.card.preview') }}
        </button>
        <button
          type="button"
          class="card-btn card-btn--use"
          :aria-pressed="selected ? 'true' : 'false'"
          :aria-describedby="nameId"
          data-testid="invitation-card-use"
          @click="$emit('select')"
        >
          <svg v-if="selected" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M11.5 3.5L5.5 10L2.5 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ $t('onboarding.invitations.card.use') }}
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  id: { type: String, default: '' },
  name: { type: String, required: true },
  // A localized description, or the server's one as typed.
  subtitle: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  selected: { type: Boolean, default: false },
  colorIndex: { type: Number, default: 0 },
  // { names, date, place } — the basics entered before the design (INV-104).
  personalization: { type: Object, default: null },
  // [{ kind, value }] from utils/templateCatalog — only what the design has.
  traits: { type: Array, default: () => [] },
});

defineEmits(['select', 'preview']);

const uid = computed(() => String(props.id || props.colorIndex).replace(/[^a-zA-Z0-9_-]/g, '-'));
const nameId = computed(() => `invitation-card-name-${uid.value}`);
const descId = computed(() => `invitation-card-desc-${uid.value}`);

// A missing thumbnail shows the placeholder rather than a broken picture.
const thumbnailFailed = ref(false);
watch(() => props.thumbnailUrl, () => { thumbnailFailed.value = false; });
</script>

<style scoped>
.invitation-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 12px;
  border: 2px solid var(--line, rgba(16, 24, 40, 0.08));
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  background: #fff;
}

.invitation-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.invitation-card--selected {
  border-color: var(--brand-gold, #c4956a);
  box-shadow: 0 0 0 2px var(--brand-gold, #c4956a);
}

.thumbnail-wrap {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  cursor: pointer;
  background: var(--neutral-100, var(--sunken));
}

.thumbnail {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 48px;
  color: var(--neutral-500, var(--ink-3));
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
  font-size: 12px;
  font-weight: 600;
  background: var(--neutral-900, #1f2937);
  color: #fff;
  z-index: 2;
}

.personal-strip {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 8px;
  display: grid;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  text-align: center;
  z-index: 1;
}

.personal-names {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--neutral-900, var(--ink));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.personal-meta {
  font-size: 11px;
  color: var(--neutral-600, var(--ink-3));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 8px;
  padding: 12px;
}

.card-name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--neutral-900, var(--ink));
}

.card-subtitle {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: var(--neutral-600, var(--ink-2));
}

.card-traits {
  display: grid;
  gap: 4px;
  margin: 0;
  font-size: 12px;
  line-height: 1.35;
}

.card-trait {
  display: flex;
  gap: 6px;
  min-width: 0;
}

.card-trait dt {
  flex-shrink: 0;
  font-weight: 600;
  color: var(--neutral-700, var(--ink-2));
}

.card-trait dt::after {
  content: ':';
}

.card-trait dd {
  margin: 0;
  color: var(--neutral-600, var(--ink-3));
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
  padding-top: 4px;
}

.card-btn {
  flex: 1 1 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 8px 12px;
  border-radius: 10px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.card-btn--preview {
  border: 1px solid var(--line-2, rgba(16, 24, 40, 0.18));
  background: #fff;
  color: var(--neutral-900, var(--ink));
}

.card-btn--preview:hover {
  background: var(--bg-main, var(--sunken));
}

.card-btn--use {
  border: 1px solid var(--neutral-900, #1f2937);
  background: #fff;
  color: var(--neutral-900, #1f2937);
}

.card-btn--use:hover {
  background: var(--bg-main, var(--sunken));
}

.card-btn--use[aria-pressed='true'] {
  background: var(--neutral-900, #1f2937);
  color: #fff;
}

.card-btn:focus-visible {
  outline: 3px solid var(--brand-gold, #c4956a);
  outline-offset: 2px;
}
</style>
