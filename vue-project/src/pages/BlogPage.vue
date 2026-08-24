<template>
  <div class="blog-page">
    <PageHeader :title="t('blog.title')">
      <template #actions>
        <p class="sub">{{ t('blog.subtitle') }}</p>
      </template>
    </PageHeader>

    <nav class="filters">
      <button
        v-for="option in CATEGORIES"
        :key="option || 'all'"
        class="chip"
        :class="{ active: category === option }"
        @click="select(option)"
      >
        {{ option ? t(`blog.category${option}`) : t('blog.all') }}
      </button>
    </nav>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <ul v-if="posts.length" class="posts">
      <li v-for="post in posts" :key="post.slug + post.locale">
        <router-link class="post" :to="`/blog/${post.slug}`">
          <span class="cat">{{ t(`blog.category${post.category}`) }}</span>
          <h2>{{ post.title }}</h2>
          <p v-if="post.excerpt" class="excerpt">{{ post.excerpt }}</p>
          <time v-if="post.publishedAt" class="date">{{ day(post.publishedAt) }}</time>
        </router-link>
      </li>
    </ul>

    <!-- Nothing published in this language is a normal state for a young blog,
         and saying so beats an empty page that looks broken. -->
    <EmptyState v-else-if="!loading" tone="no-results" :title="t('blog.empty')" />
  </div>
</template>

<script setup>
import EmptyState from '@/components/ui/EmptyState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { contentService } from '@/services/content.service'
import { getErrorMessage } from '@/services/apiError'

const CATEGORIES = [null, 'WEDDING', 'BIRTHDAY', 'CORPORATE', 'VENUE', 'VENDOR', 'PLANNING']

const { t, locale } = useI18n()

const posts = ref([])
const category = ref(null)
const loading = ref(false)
const error = ref('')

function unwrap(response) {
  return response?.data ?? response ?? null
}

const day = (iso) => new Date(iso).toLocaleDateString()

onMounted(load)
watch([category, locale], load)

async function load() {
  loading.value = true
  try {
    posts.value = unwrap(await contentService.published({
      category: category.value || undefined,
      locale: locale.value,
    })) || []
    error.value = ''
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    loading.value = false
  }
}

function select(option) {
  category.value = option
}
</script>

<style scoped>
.blog-page { padding: 2rem 1.5rem; max-width: 800px; margin: 0 auto; }
.page-head h1 { margin: 0; font-size: 1.8rem; }
.sub { color: #666; margin: 0.25rem 0 1.25rem; }
.filters { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
.chip { border: 1px solid #ddd; background: #fff; border-radius: 999px; padding: 0.3rem 0.75rem; cursor: pointer; font-size: 0.85rem; }
.chip.active { background: var(--brand); color: #fff; border-color: var(--brand); }
.error { color: #b3261e; }
.posts { list-style: none; padding: 0; }
.post { display: block; padding: 0.9rem 0; border-bottom: 1px solid #eee; color: inherit; text-decoration: none; }
.cat { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--brand); }
.post h2 { margin: 0.2rem 0; font-size: 1.15rem; }
.excerpt { margin: 0.2rem 0; color: #555; font-size: 0.92rem; }
.date { font-size: 0.8rem; color: #999; }
</style>
