<template>
  <div class="empty">
    <div class="glyph" v-if="hasGlyph">
      <slot name="glyph">
        <span v-if="glyphChar" aria-hidden="true">{{ glyphChar }}</span>
        <span v-else v-html="glyphSvg" aria-hidden="true" class="glyph-svg" />
      </slot>
    </div>

    <b class="title">{{ title }}</b>
    <p v-if="description" class="desc">{{ description }}</p>

    <div v-if="hasCta" class="cta-row">
      <slot name="cta">
        <ButtonMain v-if="ctaLabel" :variant="ctaVariant" @click="$emit('cta')">
          {{ ctaLabel }}
        </ButtonMain>
      </slot>
    </div>

    <slot />
  </div>
</template>

<script setup>
import { computed, useSlots } from 'vue';
import ButtonMain from '@/components/generic/ButtonMain.vue';

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  /** Emoji or single character for the glyph slot */
  glyphChar: { type: String, default: '' },
  /** Raw SVG markup for the glyph */
  glyphSvg: { type: String, default: '' },
  ctaLabel: { type: String, default: '' },
  ctaVariant: { type: String, default: 'main' },
});

defineEmits(['cta']);

const slots = useSlots();
const hasGlyph = computed(() =>
  Boolean(slots.glyph) || Boolean(props.glyphChar) || Boolean(props.glyphSvg)
);
const hasCta = computed(() =>
  Boolean(slots.cta) || Boolean(props.ctaLabel)
);
</script>

<style scoped>
.empty {
  text-align: center;
  padding: 44px 24px;
  max-width: 380px;
  margin: 0 auto;
}

.glyph {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--dash-sage-ghost, #f1f6ee);
  color: var(--brand-main);
  display: grid;
  place-items: center;
  font-size: 26px;
  margin: 0 auto 16px;
}

.glyph-svg :deep(svg) {
  width: 26px;
  height: 26px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.title {
  font-size: 15px;
  font-weight: 600;
  color: var(--brand-main);
  display: block;
  margin-bottom: 6px;
}

.desc {
  font-size: 13px;
  color: var(--neutral-700, #6b7280);
  margin: 0 0 18px;
  line-height: 1.5;
}

.cta-row {
  display: flex;
  gap: 10px;
  justify-content: center;
}
</style>
