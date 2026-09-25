<template>
  <!--
    What connects the vendor to the rest of Ivy: the topics they are tagged
    with, the articles that share those topics, and their recordings — a band's
    showreel has no place in a photo grid, but it has to be somewhere.
  -->
  <section v-if="tags.length || posts.length || links.length" class="ms-extras">
    <div class="section-inner extras-grid">
      <div v-if="tags.length">
        <h2>{{ t('vendorMicrosite.common.topics') }}</h2>
        <ul class="ms-chips">
          <li v-for="tag in tags" :key="tag.slug">
            <a :href="`/${lang}/tags/${encodeURIComponent(tag.slug)}`">{{ tag.name || tag.slug }}</a>
          </li>
        </ul>
      </div>
      <div v-if="posts.length">
        <h2>{{ t('vendorMicrosite.common.related') }}</h2>
        <ul class="ms-list">
          <li v-for="post in posts" :key="post.slug">
            <a :href="`/${lang}/blog/${encodeURIComponent(post.slug)}`">{{ post.title }}</a>
          </li>
        </ul>
      </div>
      <div v-if="links.length">
        <h2>{{ t('microsite.site.listen') }}</h2>
        <ul class="ms-list">
          <li v-for="item in links" :key="item.id">
            <a :href="item.url" target="_blank" rel="noopener">
              <small>{{ t(`vendorPortal.mediaKind.${item.kind}`) }}</small>{{ item.title || item.url }}
            </a>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps({
  tags: { type: Array, default: () => [] },
  posts: { type: Array, default: () => [] },
  links: { type: Array, default: () => [] },
})

const { t, locale } = useI18n()
const lang = computed(() => locale.value || 'mk')
</script>
