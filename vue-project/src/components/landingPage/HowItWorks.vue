<template>
  <!--
    The redesign's `intro` + `features` pair: a centred statement on paper,
    then the numbered cards directly under it on the same ground. They are one
    component because they are one visual block — the cards have no top
    padding of their own and read as the statement's answer.
  -->
  <section class="intro reveal" id="how">
    <p class="tag">{{ $t('home.howItWorks.eyebrow') }}</p>
    <h2>
      {{ $t('home.howItWorks.titleBefore') }}<br>
      <em>{{ $t('home.howItWorks.titleAccent') }}</em>
    </h2>
  </section>

  <section class="features four">
    <article
      v-for="(step, i) in steps"
      :key="step.titleKey"
      class="reveal"
      :style="{ transitionDelay: `${i * 110}ms` }"
    >
      <span>{{ String(i + 1).padStart(2, '0') }}</span>
      <b class="icon" aria-hidden="true">{{ step.glyph }}</b>
      <h3>{{ $t(step.titleKey) }}</h3>
      <p>{{ $t(step.descKey) }}</p>
      <router-link :to="step.to">{{ $t('home.howItWorks.explore') }} ↗</router-link>
    </article>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useReveal } from "@/composables/useReveal";

const route = useRoute();
const lang = computed(() => route.params.lang || "mk");

useReveal();

/*
  The emoji the steps used to carry — 🎨 ✏️ 📨 📊 — are gone. The redesign sets
  its icons in the page's own serif (✦ ✓ ⌘ ◇), which keeps them the ink colour
  and the same weight as the type around them; an emoji is a small colour
  picture and was the only full-colour thing on the section.
*/
const steps = computed(() => [
  {
    glyph: "✦",
    titleKey: "home.howItWorks.steps.chooseTemplate.title",
    descKey: "home.howItWorks.steps.chooseTemplate.description",
    to: { name: "EventInvitationsPage", params: { lang: lang.value } },
  },
  {
    glyph: "◇",
    titleKey: "home.howItWorks.steps.customizeEvent.title",
    descKey: "home.howItWorks.steps.customizeEvent.description",
    to: { name: "EventInvitationsPage", params: { lang: lang.value } },
  },
  {
    glyph: "⌘",
    titleKey: "home.howItWorks.steps.sendInvitations.title",
    descKey: "home.howItWorks.steps.sendInvitations.description",
    to: { name: "packages", params: { lang: lang.value } },
  },
  {
    glyph: "✓",
    titleKey: "home.howItWorks.steps.trackRsvps.title",
    descKey: "home.howItWorks.steps.trackRsvps.description",
    to: { name: "features-rsvp", params: { lang: lang.value } },
  },
]);
</script>
