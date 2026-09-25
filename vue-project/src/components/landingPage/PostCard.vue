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
      <!-- Text, not links: the whole card is already a link, and a link inside
           a link is invalid. The article page links each tag. -->
      <p v-if="shownTags.length" class="card-tags">
        <span v-for="tag in shownTags" :key="tag.slug">#{{ tag.name }}</span>
      </p>
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
/** A card is a teaser; the article lists every tag. */
const MAX_CARD_TAGS = 3

const { t, locale } = useI18n()
const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

const tint = computed(() => COVER_TINTS[props.index % COVER_TINTS.length])
const to = computed(() => ({ name: 'BlogPost', params: { lang: lang.value, slug: props.post.slug } }))
const day = computed(() => new Date(props.post.publishedAt).toLocaleDateString(locale.value))
const shownTags = computed(() => (props.post.tags || []).slice(0, MAX_CARD_TAGS))

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
   cover image and the tag line are what the mockup has no version of — its
   covers are all drawings and its posts carry no tags. */
.post .cover img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0 0;
  font-size: 13.5px;
  color: var(--ink-3);
}
</style>
