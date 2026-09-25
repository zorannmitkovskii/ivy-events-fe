<template>
  <div
    class="am-photo"
    :class="url ? null : `am-tint-${tint % TINTS}`"
    :style="url ? { backgroundImage: `url(&quot;${url}&quot;)` } : null"
    role="img"
    :aria-label="label || null"
  >
    <slot />
  </div>
</template>

<script setup>
/**
 * A photo in an agency layout, or a tinted space where one will go.
 *
 * <p>A background rather than an `<img>`, as in the design: every photo is
 * cropped to its box and carries the design's overlay.
 */
import { TINTS } from './siteView'

defineProps({
  url: { type: String, default: null },
  tint: { type: Number, default: 0 },
  label: { type: String, default: '' },
})
</script>
