<template>
  <!--
    The redesign's `planner` band: the pitch on the left, a scaled-down
    dashboard on the right, both on the dark ink ground. It replaces the pale
    two-column block that used to be here — same content, one of the few
    places on the page where the palette inverts.
  -->
  <section class="planner" :id="id">
    <div class="plannertext reveal">
      <p class="tag">{{ $t('home.features.eyebrow') }}</p>
      <h2>
        {{ $t('home.features.titleBefore') }}<br>
        <em>{{ $t('home.features.titleAccent') }}</em>
      </h2>
      <p>{{ $t('home.features.subtitle') }}</p>

      <ul>
        <li v-for="key in featureKeys" :key="key">{{ $t(key) }}</li>
      </ul>

      <!--
        Packages, not /features. That route resolves to an empty component —
        `pages/marketing/FeaturesPage.vue` is a stub with no template — so the
        link opened a blank page. The planner's tiers are what this button is
        really promising, and those live on the packages page.
      -->
      <router-link class="btn light" :to="{ name: 'packages', params: { lang } }">
        {{ $t('home.features.cta') }} ↗
      </router-link>
    </div>

    <!-- Decoration: a picture of the product, not a live one. -->
    <div class="dash reveal" aria-hidden="true">
      <div class="dashtop">
        ✣ Ivy Planner
        <small>{{ $t('home.hero.cardNames') }} ⌄</small>
      </div>
      <div class="dashbody">
        <small>{{ $t('home.features.dashGreeting') }}</small>
        <h3>{{ $t('home.features.dashHeadline') }}</h3>

        <div class="stats">
          <b v-for="stat in dashStats" :key="stat.labelKey">
            {{ stat.value }}<small>{{ $t(stat.labelKey) }}</small>
          </b>
        </div>

        <p v-for="item in dashAgenda" :key="item.labelKey">
          ●&nbsp;&nbsp;{{ $t(item.labelKey) }}
          <small>{{ $t(item.whenKey) }}</small>
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useReveal } from "@/composables/useReveal";

const route = useRoute();
const lang = computed(() => route.params.lang || "mk");

defineProps({
  id: { type: String, default: "features" }
});

useReveal();

/*
  Four capabilities as a tick list, not four cards with an emoji each. The
  redesign puts the illustration in the dashboard on the right and keeps the
  left column purely typographic, so the icons the old block carried — 🎨 🔔
  📱 📍 — have nothing to sit in.
*/
const featureKeys = [
  "home.features.items.beautifulDesigns.title",
  "home.features.items.rsvpManagement.title",
  "home.features.items.eventDetails.title",
  "home.features.items.analytics.title",
];

const dashStats = [
  { value: "72", labelKey: "home.features.dashConfirmed" },
  { value: "12", labelKey: "home.features.dashTasks" },
  { value: "68%", labelKey: "home.features.dashBudget" },
];

const dashAgenda = [
  { labelKey: "home.features.dashItem1", whenKey: "home.features.dashItem1When" },
  { labelKey: "home.features.dashItem2", whenKey: "home.features.dashItem2When" },
];
</script>
