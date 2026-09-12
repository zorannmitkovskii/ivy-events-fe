<template>
  <SitePage>
    <section class="page-hero">
      <div class="wrap">
        <Breadcrumb :current="t('blog.title')" />
        <h1>{{ t('blog.title') }}</h1>
        <p class="lead">{{ t('blog.subtitle') }}</p>
      </div>
    </section>

    <section class="section" style="padding-top: 0">
      <div class="wrap">
        <div class="filters" role="group" :aria-label="t('blog.filterLabel')">
          <button
            v-for="option in CATEGORIES"
            :key="option || 'all'"
            type="button"
            :aria-pressed="category === option"
            @click="category = option"
          >{{ option ? t(`blog.category${option}`) : t('blog.all') }}</button>
        </div>

        <p v-if="error" class="empty" role="alert">{{ error }}</p>

        <p v-else-if="loading" class="empty">{{ t('blog.loading') }}</p>

        <template v-else-if="posts.length">
          <!-- The design's shape: one lead article beside a column of four,
               then a plain three-up grid for everything after that. -->
          <div class="blog-grid">
            <PostCard v-if="lead" :post="lead" :index="0" featured />
            <div class="post-list">
              <PostCard v-for="(post, i) in beside" :key="post.slug" :post="post" :index="i + 1" row />
            </div>
          </div>

          <div v-if="rest.length" class="blog-grid-3">
            <PostCard
              v-for="(post, i) in rest"
              :key="post.slug"
              :post="post"
              :index="i + BESIDE_COUNT + 1"
            />
          </div>
        </template>

        <!-- Nothing published in this language is a normal state for a young
             blog, and saying so beats an empty page that looks broken. -->
        <p v-else class="empty">{{ t('blog.empty') }}</p>

        <NewsletterSignup />
      </div>
    </section>
  </SitePage>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SitePage from '@/layouts/SitePage.vue'
import Breadcrumb from '@/components/ui/Breadcrumb.vue'
import PostCard from '@/components/landingPage/PostCard.vue'
import NewsletterSignup from '@/components/landingPage/NewsletterSignup.vue'
import { contentService } from '@/services/content.service'
import { getErrorMessage } from '@/services/apiError'

const CATEGORIES = [null, 'WEDDING', 'BIRTHDAY', 'CORPORATE', 'VENUE', 'VENDOR', 'PLANNING']
const BESIDE_COUNT = 4

const { t, locale } = useI18n()

const posts = ref([])
const category = ref(null)
const loading = ref(true)
const error = ref('')

const lead = computed(() => posts.value[0] || null)
const beside = computed(() => posts.value.slice(1, 1 + BESIDE_COUNT))
const rest = computed(() => posts.value.slice(1 + BESIDE_COUNT))

onMounted(load)
watch([category, locale], load)

async function load() {
  loading.value = true
  try {
    const response = await contentService.published({
      category: category.value || undefined,
      locale: locale.value,
    })
    posts.value = response?.data ?? response ?? []
    error.value = ''
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    loading.value = false
  }
}
</script>
