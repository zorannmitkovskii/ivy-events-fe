<template>
  <router-link class="post" :class="{ featured, row }" :to="to">
    <div class="cover" :class="tint">
      <img v-if="post.coverImage" :src="post.coverImage" :alt="post.title" />
      <div v-else class="art"><PostGlyph :seed="index" /></div>
    </div>

    <div class="body">
      <div class="meta">
        <span v-if="featured" class="tag tag-gold">{{ $t('home.blog.featured') }}</span>
        <span v-if="categoryLabel" class="tag">{{ categoryLabel }}</span>
        <span v-if="post.readingMinutes">{{ $t('home.blog.minutes', { n: post.readingMinutes }) }}</span>
        <span v-if="post.publishedAt">{{ day }}</span>
      </div>
      <h3>{{ post.title }}</h3>
      <p v-if="post.excerpt">{{ post.excerpt }}</p>
      <span class="read">{{ $t('home.blog.readArticle') }}</span>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PostGlyph from '@/components/landingPage/PostGlyph.vue'

/**
 * One article, in the three shapes the design gives it: the lead card, a row
 * in the column beside it, and a plain card in the grid underneath.
 *
 * `index` picks the cover tint and the drawing, so a post keeps the same
 * artwork wherever it appears and between visits — which a random pick would
 * not.
 */
const props = defineProps({
  post: { type: Object, required: true },
  index: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  row: { type: Boolean, default: false },
})

const COVER_TINTS = ['c-sage', 'c-sand', 'c-rose', 'c-sky', 'c-night']

const { t, locale } = useI18n()
const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

const tint = computed(() => COVER_TINTS[props.index % COVER_TINTS.length])
const to = computed(() => ({ name: 'BlogPost', params: { lang: lang.value, slug: props.post.slug } }))
const day = computed(() => new Date(props.post.publishedAt).toLocaleDateString(locale.value))

/** An unknown category prints nothing rather than `blog.categoryFOO`. */
const categoryLabel = computed(() => {
  if (!props.post.category) return ''
  const key = `blog.category${props.post.category}`
  const label = t(key)
  return label === key ? '' : label
})
</script>

<style scoped>
/* `.post` and its three variants are the design's, in `ivy/site.css`. The
   cover image is what the mockup has no version of — its covers are all
   drawings, and a real post can carry a photograph. */
.post .cover img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
