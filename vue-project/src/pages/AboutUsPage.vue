<template>
  <SitePage>
    <section class="pagehero">
      <p class="tag">{{ $t('about.heroEyebrow') }}</p>
      <h1>
        {{ $t('about.heroTitle') }}<br>
        <em>{{ $t('about.heroAccent') }}</em>
      </h1>
      <p>{{ $t('about.heroSubtitle') }}</p>
    </section>

    <section class="story reveal">
      <div>
        <p class="tag">{{ $t('about.storyEyebrow') }}</p>
        <h2>{{ $t('about.storyTitle') }}</h2>
      </div>
      <p>{{ $t('about.missionText') }}</p>
    </section>

    <section class="values">
      <article
        v-for="(value, i) in values"
        :key="value.titleKey"
        class="reveal"
        :style="{ transitionDelay: `${i * 110}ms` }"
      >
        <b>{{ String(i + 1).padStart(2, '0') }}</b>
        <h3>{{ $t(value.titleKey) }}</h3>
        <p>{{ $t(value.textKey) }}</p>
      </article>
    </section>
  </SitePage>
</template>

<script setup>
import SitePage from "@/layouts/SitePage.vue";

const values = [
  { titleKey: "about.valueSimplicity", textKey: "about.valueSimplicityDesc" },
  { titleKey: "about.valueElegance", textKey: "about.valueEleganceDesc" },
  { titleKey: "about.valueInclusion", textKey: "about.valueInclusionDesc" },
];
</script>
