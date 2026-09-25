<template>
  <!-- A picture of the product, not the product: the names are placeholders
       and nothing here is connected to data, which the footer says aloud. -->
  <div class="bl-mock" role="img" :aria-label="t('blog.mock.label')">
    <div class="bl-mock-bar">
      <span>✳ Ivy Events &nbsp;/&nbsp; {{ t('blog.mock.section') }}</span>
      <span>{{ t('blog.mock.illustration') }}</span>
    </div>
    <div class="bl-mock-body">
      <ul class="bl-mock-side" aria-hidden="true">
        <li>◻ {{ t('blog.mock.overview') }}</li>
        <li>◻ {{ t('blog.mock.guests') }}</li>
        <li>◻ {{ t('blog.mock.invitations') }}</li>
        <li>◻ {{ t('blog.mock.events') }}</li>
      </ul>
      <div class="bl-mock-panel">
        <h3>{{ t('blog.mock.title') }}</h3>
        <div v-for="row in ROWS" :key="row.guest" class="bl-mock-row">
          <span>{{ t('blog.mock.guest', { letter: row.guest }) }}</span>
          <b :class="row.tone">{{ t(`blog.mock.${row.status}`) }}</b>
        </div>
        <p class="bl-mock-foot">{{ t('blog.mock.foot') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

/** The product article's hero (2026 blog design): the RSVP overview, drawn. */
const ROWS = [
  { guest: 'A', status: 'confirmed', tone: '' },
  { guest: 'B', status: 'pending', tone: 'pending' },
  { guest: 'C', status: 'declined', tone: 'declined' },
]

const { t } = useI18n()
</script>
