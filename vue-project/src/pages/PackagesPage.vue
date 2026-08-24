<template>
  <SitePage>
    <section class="packagesHero">
      <p class="tag">{{ $t('packages.heroEyebrow') }}</p>
      <h1>
        {{ $t('packages.heroTitle') }}<br>
        <em>{{ $t('packages.heroAccent') }}</em>
      </h1>
      <p>{{ $t('packages.heroLead') }}</p>
    </section>

    <!--
      The same component the home page uses, rather than a second copy of it.
      This page and the pricing block on the landing page had drifted into two
      implementations of one thing — same API call, same card, different
      markup — and only one of them ever got fixed.
    -->
    <PackagesSection id="invitation-plans" />

    <section class="galleryPackageSection" id="gallery-plans">
      <div>
        <p class="tag">{{ $t('packages.gallery.eyebrow') }}</p>
        <h2>{{ $t('packages.gallery.title') }}</h2>
        <p>{{ $t('packages.gallery.text') }}</p>
        <router-link class="btn light" :to="{ name: 'signup', params: { lang } }">
          {{ $t('packages.gallery.cta') }} ↗
        </router-link>
      </div>
      <div class="galleryTierCards">
        <article
          v-for="tier in galleryTiers"
          :key="tier.size"
          :class="{ featured: tier.featured }"
        >
          <b>{{ tier.size }}</b>
          <span>{{ tier.name }}</span>
          <small>{{ $t(tier.noteKey) }}</small>
        </article>
      </div>
    </section>

    <section class="compare">
      <p class="tag">{{ $t('packages.compare.eyebrow') }}</p>
      <h2>{{ $t('packages.compare.title') }}</h2>
      <div>
        <span>{{ $t('packages.compare.feature') }}</span>
        <b>Basic</b>
        <b>Pro</b>
        <b>Premium</b>
        <template v-for="row in compareRows" :key="row.labelKey">
          <span>{{ $t(row.labelKey) }}</span>
          <b v-for="(has, i) in row.plans" :key="i">{{ has ? '✓' : '—' }}</b>
        </template>
      </div>
    </section>
  </SitePage>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import SitePage from "@/layouts/SitePage.vue";
import PackagesSection from "@/components/landingPage/PackagesSection.vue";

const route = useRoute();
const lang = computed(() => route.params.lang || "mk");

/*
  Sizes and names are the product's, not a translator's — "3 GB" and "Gallery
  Plus" read the same in every locale, and only the one-line note under each
  changes.
*/
const galleryTiers = [
  { size: "1 GB", name: "Gallery Basic", noteKey: "packages.gallery.tierSmall" },
  { size: "3 GB", name: "Gallery Plus", noteKey: "packages.gallery.tierMedium", featured: true },
  { size: "10 GB", name: "Gallery Premium", noteKey: "packages.gallery.tierLarge" },
];

const compareRows = [
  { labelKey: "packages.compare.invitation", plans: [true, true, true] },
  { labelKey: "packages.compare.allDesigns", plans: [false, true, true] },
  { labelKey: "packages.compare.seating", plans: [false, true, true] },
  { labelKey: "packages.compare.advancedTasks", plans: [false, false, true] },
  { labelKey: "packages.compare.notifications", plans: [false, false, true] },
];
</script>
