<template>
  <SitePage>
    <article class="legal">
      <p class="tag">{{ $t('terms.heroEyebrow') }}</p>
      <h1>{{ $t('terms.title') }}</h1>
      <p class="legal-lead">{{ $t('terms.intro') }}</p>
      <p class="legal-updated">{{ $t('terms.lastUpdated') }}</p>

      <!--
        The floating table of contents and its scroll-spy are gone. The
        redesign sets a legal document as one narrow column of running text —
        eight sections of a paragraph each do not need navigation, and the
        sidebar was tracking a reading position nobody was lost in.
      -->
      <template v-for="key in sectionKeys" :key="key">
        <h2>{{ $t(`terms.sections.${key}.title`) }}</h2>
        <p>{{ $t(`terms.sections.${key}.text`) }}</p>
      </template>
    </article>
  </SitePage>
</template>

<script setup>
import SitePage from "@/layouts/SitePage.vue";

const sectionKeys = [
  "acceptance",
  "services",
  "accounts",
  "payment",
  "content",
  "liability",
  "changes",
  "contact",
];
</script>

<style scoped>
.legal-updated {
  margin-top: 18px;
  font-family: var(--font-ui);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-4);
}
</style>
