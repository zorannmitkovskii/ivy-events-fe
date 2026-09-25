<template>
  <article class="agency-site" :class="`am-${modelKey}`" :data-model="modelKey">
    <component :is="layout" :site="view" :preview="preview" />

    <nav v-if="view.tags.length" class="am-tags" :aria-label="t('agencySite.tags')">
      <span>{{ t('agencySite.tags') }}</span>
      <RouterLink v-for="tag in view.tags" :key="tag.slug" :to="`/${lang}/tags/${encodeURIComponent(tag.slug)}`">
        {{ tag.name }}
      </RouterLink>
    </nav>

    <footer>
      <span>{{ view.name }} · {{ t('agencySite.footer') }}</span>
      <a href="#am-top" @click.prevent="jumpTo('am-top')">{{ t('agencySite.toTop') }} ↑</a>
    </footer>
  </article>
</template>

<script setup>
/**
 * An agency's public site in the layout it chose (the 2026 agency microsite
 * designs).
 *
 * <p>The same component renders the public page and the editor's preview —
 * the preview only switches the form off — so what the owner sees is what a
 * visitor gets. The layouts read one content document; a section a layout has
 * no room for is simply not drawn.
 */
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import ClassicModel from './ClassicModel.vue'
import PortfolioModel from './PortfolioModel.vue'
import EditorialModel from './EditorialModel.vue'
import CorporateModel from './CorporateModel.vue'
import { jumpTo } from './siteView'
import './agency-microsite.css'

const props = defineProps({
  site: { type: Object, required: true },
  preview: { type: Boolean, default: false },
  lang: { type: String, default: 'mk' },
})

const LAYOUTS = {
  classic: ClassicModel,
  portfolio: PortfolioModel,
  editorial: EditorialModel,
  corporate: CorporateModel,
}

/** The designs' faces. Loaded here, so no other page pays for them. */
const FONTS_ID = 'agency-site-fonts'
const FONTS_URL = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700'
  + '&family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap'

const { t } = useI18n()

const modelKey = computed(() => {
  const key = String(props.site.model || 'CLASSIC').toLowerCase()
  return LAYOUTS[key] ? key : 'classic'
})
const layout = computed(() => LAYOUTS[modelKey.value])

const view = computed(() => ({
  ...props.site,
  content: props.site.content || {},
  projects: props.site.projects || [],
  imageUrls: props.site.imageUrls || {},
  tags: props.site.tags || [],
}))

onMounted(() => {
  if (document.getElementById(FONTS_ID)) return
  const link = document.createElement('link')
  link.id = FONTS_ID
  link.rel = 'stylesheet'
  link.href = FONTS_URL
  document.head.appendChild(link)
})
</script>
