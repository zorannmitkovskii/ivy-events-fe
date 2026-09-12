<template>
  <section v-if="featured" class="blog section" id="blog" aria-labelledby="blog-title" style="padding-top: 0">
    <div class="wrap">
      <div class="cats-head">
        <div class="section-head" style="margin: 0">
          <h2 id="blog-title">{{ $t('home.blog.title') }}</h2>
          <p>{{ $t('home.blog.subtitle') }}</p>
        </div>
        <router-link class="btn btn-ghost btn-sm" :to="{ name: 'Blog', params: { lang } }">
          {{ $t('home.blog.all') }}
        </router-link>
      </div>

      <div class="blog-grid">
        <PostCard :post="featured" :index="0" featured />
        <div class="post-list">
          <PostCard v-for="(post, i) in rest" :key="post.slug" :post="post" :index="i + 1" row />
        </div>
      </div>

      <NewsletterSignup />
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { contentService } from '@/services/content.service'
import NewsletterSignup from '@/components/landingPage/NewsletterSignup.vue'
import PostCard from '@/components/landingPage/PostCard.vue'

/*
  The design's blog block: one featured article beside four in a column.

  Whether it renders at all depends on the API. The section is hidden when
  nothing is published rather than shown with placeholders — a young blog with
  no posts is a normal state, and four grey rectangles labelled "coming soon"
  on the landing page is not the way to say so.
*/

const TEASER_TOTAL = 5

const { locale } = useI18n()
const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

const posts = ref([])

const featured = computed(() => posts.value[0] || null)
const rest = computed(() => posts.value.slice(1, TEASER_TOTAL))

onMounted(load)
watch(locale, load)

async function load() {
  try {
    const response = await contentService.published({ locale: locale.value })
    posts.value = (response?.data ?? response ?? []).slice(0, TEASER_TOTAL)
  } catch {
    // The landing page is not the place to report that the blog is down.
    posts.value = []
  }
}
</script>
