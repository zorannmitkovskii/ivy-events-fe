<template>
  <router-link class="bl-card" :to="to" data-track="blog-card">
    <div class="bl-media" :class="tint">
      <img v-if="post.coverImage" :src="post.coverImage" :alt="post.title" loading="lazy" />
      <PostGlyph v-else :seed="seed" />
    </div>
    <div class="bl-card-body">
      <span class="bl-eyebrow">{{ eyebrow }}</span>
      <h3>{{ post.title }}</h3>
      <p v-if="post.excerpt">{{ post.excerpt }}</p>
      <span class="bl-read">{{ t('blog.read') }} ↗</span>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import PostGlyph from '@/components/landingPage/PostGlyph.vue'
import { blogCategoryLabel, blogTint, slugSeed } from '@/components/blog/blogLabels'

/**
 * One article in the blog's grid (2026 design): photo, category and reading
 * time, title, a line of excerpt and a read link. The whole card is the link.
 *
 * The tint and drawing behind a post without a photo come from its slug, so
 * the same post looks the same on the listing and on its own page.
 */
const props = defineProps({
  post: { type: Object, required: true },
})

const { t, te } = useI18n()
const route = useRoute()

const seed = computed(() => slugSeed(props.post.slug))
const tint = computed(() => blogTint(seed.value))
const to = computed(() => ({ name: 'BlogPost', params: { lang: route.params.lang || 'mk', slug: props.post.slug } }))

const eyebrow = computed(() => {
  const parts = [blogCategoryLabel(props.post.category, t, te)]
  if (props.post.readingMinutes) parts.push(t('blog.minutes', { n: props.post.readingMinutes }))
  return parts.filter(Boolean).join(' · ')
})
</script>
