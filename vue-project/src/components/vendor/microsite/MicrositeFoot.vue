<template>
  <footer class="site-foot">
    <span>{{ text }}</span>
    <span class="foot-links">
      <a v-if="vendor.website" :href="vendor.website" target="_blank" rel="noopener">{{ t('microsite.site.website') }}</a>
      <a v-if="instagramHandle" :href="vendor.instagramUrl" target="_blank" rel="noopener">{{ instagramHandle }}</a>
      <a :href="topHref">{{ t('vendorMicrosite.common.backToTop') }}</a>
    </span>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  vendor: { type: Object, required: true },
  /** The vendor's own footer line; the site's default when they wrote none. */
  text: { type: String, default: '' },
  topHref: { type: String, required: true },
})

const { t } = useI18n()

const instagramHandle = computed(() => {
  const raw = props.vendor?.instagramUrl
  if (!raw) return ''
  const path = String(raw)
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/[/?#].*$/, '')
    .replace(/^@/, '')
  return path ? `@${path}` : ''
})
</script>
